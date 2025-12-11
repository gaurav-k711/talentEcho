
import React, { useState, useRef, useEffect } from 'react';
import { InterviewSettings, QuestionResult, FullReport } from '../types';
import { Button } from '../components/Button';
import { analyzeInterviewAnswer, generateSpeech } from '../services/geminiService';
import { saveReport } from '../services/storageService';
import { Mic, Square, CheckCircle, RefreshCw, FileText, ScanFace, Volume2, MicOff, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InterviewSessionProps {
  settings: InterviewSettings;
  userId?: string;
  onFinish: (report: FullReport) => void;
  onAbort: () => void;
}

type InterviewPhase = 'init' | 'speaking_question' | 'listening' | 'processing' | 'speaking_feedback' | 'completed';

export const InterviewSession: React.FC<InterviewSessionProps> = ({ settings, userId, onFinish, onAbort }) => {
  // State
  const [phase, setPhase] = useState<InterviewPhase>('init');
  const [questionsQueue, setQuestionsQueue] = useState<string[]>(() => [...settings.questions]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [micVolume, setMicVolume] = useState(0); // For visualization
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioOutputContextRef = useRef<AudioContext | null>(null);
  const audioCache = useRef<Map<string, AudioBuffer>>(new Map()); // Cache for TTS audio

  const currentQuestion = questionsQueue[currentQuestionIndex];

  // --- 1. Initialization & Cleanup ---
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Camera permission is required.");
        onAbort();
      }
    };
    startCamera();

    // Initialize AudioContexts
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioOutputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (audioOutputContextRef.current) {
        audioOutputContextRef.current.close();
      }
    };
  }, []);

  // --- 2. Phase Management & Automation ---
  useEffect(() => {
    const runPhase = async () => {
      if (phase === 'speaking_question') {
        const introText = currentQuestionIndex === 0 ? "Let's begin. " : "";
        await playAiVoice(`${introText}Question ${currentQuestionIndex + 1}. ${currentQuestion}`);
        setPhase('listening');
      } else if (phase === 'listening') {
        startRecordingAndVAD();
      } else if (phase === 'speaking_feedback') {
        const lastResult = results[results.length - 1];
        if (lastResult && lastResult.feedback) {
          // Prefetch next question audio while speaking feedback
          prefetchNextQuestionAudio();

          const textToSpeak = `${lastResult.feedback.summary}. You scored ${lastResult.feedback.scores.voice} on voice, and ${lastResult.feedback.scores.content} on content.`;
          await playAiVoice(textToSpeak);
          
          // Wait 2 seconds before next question
          setTimeout(() => {
            handleNextQuestion();
          }, 2000);
        }
      }
    };
    runPhase();
  }, [phase, currentQuestionIndex]); 

  // --- 3. Advanced AI Voice (Gemini TTS) ---
  const prefetchNextQuestionAudio = async () => {
      const nextQ = questionsQueue[currentQuestionIndex + 1];
      if (nextQ && !audioCache.current.has(nextQ)) {
          try {
             const text = `Question ${currentQuestionIndex + 2}. ${nextQ}`;
             const base64 = await generateSpeech(text);
             if (base64 && audioOutputContextRef.current) {
                 const buffer = await decodeAudioData(base64, audioOutputContextRef.current);
                 audioCache.current.set(text, buffer);
             }
          } catch(e) {
              console.warn("Prefetch failed", e);
          }
      }
  };

  const playAiVoice = async (text: string) => {
    setIsAiSpeaking(true);
    
    try {
      if (!audioOutputContextRef.current) return;
      const ctx = audioOutputContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      let audioBuffer: AudioBuffer;

      // Check Cache
      if (audioCache.current.has(text)) {
          audioBuffer = audioCache.current.get(text)!;
      } else {
          // Fetch from API
          const base64Audio = await generateSpeech(text);
          if (!base64Audio) throw new Error("Empty audio response");
          audioBuffer = await decodeAudioData(base64Audio, ctx);
          // Cache it for repeats
          audioCache.current.set(text, audioBuffer);
      }

      // Play Audio
      await new Promise<void>((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => resolve();
        source.start(0);
      });

    } catch (err) {
      console.warn("AI Voice failed, falling back to browser TTS", err);
      // Fallback to browser TTS
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.onend = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    } finally {
      setIsAiSpeaking(false);
    }
  };

  // Helper: Decode Base64
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper: Convert PCM to AudioBuffer
  const decodeAudioData = async (
    base64: string,
    ctx: AudioContext
  ): Promise<AudioBuffer> => {
    const bytes = decodeBase64(base64);
    // 24000Hz is standard for Gemini TTS preview
    const sampleRate = 24000; 
    const numChannels = 1;
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        // Convert Int16 to Float32 [-1.0, 1.0]
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };


  // --- 4. Recording & Voice Activity Detection (VAD) ---
  const startRecordingAndVAD = () => {
    if (!streamRef.current) return;

    // A. Start MediaRecorder
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      // If we are still in listening phase (natural stop), analyze. 
      if (phase === 'listening') {
         const blob = new Blob(chunksRef.current, { type: 'video/webm' });
         handleAnalysis(blob);
      }
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;

    // B. Start Audio Analysis (VAD)
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(streamRef.current);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let silenceStart = Date.now();
    const SILENCE_THRESHOLD = 15; 
    const SILENCE_DURATION = 4000; // 4 seconds silence to stop (User Requested)

    const checkAudioLevel = () => {
      if (mediaRecorder.state === 'inactive') return; 

      analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setMicVolume(average); 

      if (average > SILENCE_THRESHOLD) {
        silenceStart = Date.now();
      } else {
        if (Date.now() - silenceStart > SILENCE_DURATION) {
          stopRecording();
          return;
        }
      }

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      // Phase change triggers logic in onstop or explicit call
      setPhase('processing');
    }
  };

  // --- 5. Analysis & Logic ---
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result) {
            const base64String = result.split(',')[1];
            resolve(base64String);
        } else {
            reject(new Error("FileReader result is null"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAnalysis = async (videoBlob: Blob) => {
    try {
      const base64 = await blobToBase64(videoBlob);
      const nextPlanned = questionsQueue[currentQuestionIndex + 1];
      const feedback = await analyzeInterviewAnswer(
        currentQuestion, 
        base64, 
        'video/webm', 
        nextPlanned,
        settings.personality,
        settings.difficulty
      );
      
      // *** REPEAT QUESTION LOGIC ***
      if (feedback.repeatRequested) {
        await playAiVoice("No problem, repeating the question.");
        setPhase('speaking_question'); // Restart the question cycle
        return; // Early exit, do not save result
      }

      const result: QuestionResult = {
        question: currentQuestion,
        feedback: feedback,
        videoUrl: URL.createObjectURL(videoBlob)
      };

      setResults(prev => [...prev, result]);

      // --- Interactive Queue Update ---
      if (feedback.suggestedNextQuestion) {
        setQuestionsQueue(prev => {
          const newQueue = [...prev];
          if (feedback.isFollowUp) {
            // Insert follow-up immediately after current
            newQueue.splice(currentQuestionIndex + 1, 0, feedback.suggestedNextQuestion!);
          } else {
            if (currentQuestionIndex >= newQueue.length - 1) {
               newQueue.push(feedback.suggestedNextQuestion!);
            }
          }
          return newQueue;
        });
      }

      setPhase('speaking_feedback');

    } catch (error) {
      console.error(error);
      alert("Analysis failed. Proceeding...");
      setPhase('completed'); 
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionsQueue.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setPhase('speaking_question');
    } else {
      setPhase('completed');
      handleEndSession();
    }
  };

  const handleManualEnd = () => {
    if (audioOutputContextRef.current) {
        audioOutputContextRef.current.suspend();
    }

    // Stop Recording (and prevent auto-analysis)
    if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
    }

    if (results.length > 0) {
        handleEndSession();
    } else {
        onAbort();
    }
  };

  const handleEndSession = () => {
    // Generate Report immediately
    setTimeout(() => {
        setResults(currentResults => {
            let totalScore = 0;
            currentResults.forEach(r => {
                if(r.feedback) {
                    totalScore += (r.feedback.scores.voice + r.feedback.scores.content + r.feedback.scores.bodyLanguage) / 3;
                }
            });
            const avgScore = currentResults.length > 0 ? Math.round(totalScore / currentResults.length) : 0;
            
            const report: FullReport = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                type: settings.type,
                overallScore: avgScore,
                results: currentResults
            };
            
            saveReport(report, userId); // Pass userId to save in correct DB
            onFinish(report);
            return currentResults;
        });
    }, 100);
  };

  const startSession = () => {
    setPhase('speaking_question');
  };

  const lastResult = results[results.length - 1];
  const isQuestionFinished = results.some(r => r.question === currentQuestion);

  return (
    <div className="flex h-full gap-4 p-4 max-w-[1600px] mx-auto relative">
      
      {/* INITIAL OVERLAY */}
      {phase === 'init' && (
        <div className="absolute inset-0 z-50 bg-navy-900/90 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl border border-navy-700">
           <div className="w-20 h-20 bg-neon-blue rounded-full flex items-center justify-center mb-6 animate-pulse shadow-[0_0_30px_rgba(47,123,255,0.4)]">
             <Mic size={40} className="text-white" />
           </div>
           <h2 className="text-3xl font-bold text-white mb-4">Ready for your AI Interview?</h2>
           <p className="text-gray-400 max-w-md text-center mb-8">
             The AI will speak questions aloud and automatically listen. 
             Wait 4 seconds after speaking to submit your answer.
           </p>
           <Button onClick={startSession} size="lg" className="px-12 py-4 text-xl">
             <Play fill="currentColor" className="mr-2" /> Start Session
           </Button>
        </div>
      )}

      {/* Left Column: Camera & Controls */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* Question Card */}
        <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700 shadow-lg relative overflow-hidden transition-all duration-300">
          <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${phase === 'speaking_question' ? 'bg-neon-green' : 'bg-neon-blue'}`}></div>
          
          <div className="flex justify-between items-start mb-2">
            <span className="text-neon-blue font-bold text-sm tracking-wider uppercase block">
                Question {currentQuestionIndex + 1}
            </span>
            {(phase === 'speaking_question' || isAiSpeaking) && (
                <span className="flex items-center gap-2 text-neon-green text-xs font-bold uppercase animate-pulse">
                    <Volume2 size={14} /> AI Speaking...
                </span>
            )}
          </div>

          <h2 className="text-2xl font-semibold text-white leading-tight">
            {currentQuestion}
          </h2>
        </div>

        {/* Camera View */}
        <div className="flex-1 bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-navy-700 group">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${phase === 'init' ? 'opacity-50' : 'opacity-100'}`} 
          />
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${
                phase === 'listening' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 
                phase === 'processing' ? 'bg-purple-600 text-white animate-pulse' :
                'bg-navy-900/80 text-gray-400 backdrop-blur-md'
            }`}>
               <div className={`w-2 h-2 rounded-full ${phase === 'listening' ? 'bg-white animate-ping' : 'bg-gray-500'}`}></div>
               {phase === 'listening' ? 'Listening...' : 
                phase === 'processing' ? 'Analyzing...' :
                (phase === 'speaking_question' || isAiSpeaking) ? 'AI Coach Speaking...' :
                'Standby'}
            </div>
          </div>

          {/* VAD Visualizer */}
          {phase === 'listening' && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1 items-end h-16 pointer-events-none">
               {[...Array(5)].map((_, i) => (
                 <div 
                   key={i} 
                   className="w-3 bg-neon-blue rounded-full transition-all duration-75"
                   style={{ 
                     height: `${Math.max(8, Math.min(60, micVolume * (1 + i*0.2) * 2))}px`,
                     opacity: 0.8
                   }}
                 ></div>
               ))}
               <p className="absolute -bottom-6 w-full text-center text-xs text-gray-400 font-medium whitespace-nowrap">
                  Listening... (Stops after 4s silence)
               </p>
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute bottom-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {phase === 'listening' && (
               <Button onClick={stopRecording} variant="danger" size="sm">
                 <Square size={14} className="mr-2" fill="currentColor" /> Stop Manually
               </Button>
            )}
             <Button onClick={handleManualEnd} variant="secondary" size="sm">
               <MicOff size={14} className="mr-2" /> End Session
             </Button>
          </div>
          
          {/* Analysis Overlay */}
          {phase === 'processing' && (
             <div className="absolute inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center">
                 <div className="bg-navy-800 p-6 rounded-2xl border border-navy-600 flex flex-col items-center shadow-2xl">
                    <RefreshCw className="animate-spin text-neon-blue mb-4" size={32} />
                    <h3 className="text-xl font-bold text-white mb-1">Analyzing Response</h3>
                    <p className="text-gray-400 text-sm">Checking voice, face & content...</p>
                 </div>
             </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Feedback Panel */}
      <div className="w-[400px] flex flex-col bg-navy-800/50 backdrop-blur-sm rounded-2xl border border-navy-700 overflow-hidden">
        <div className="p-4 border-b border-navy-700 bg-navy-800 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${(phase === 'speaking_feedback' || isAiSpeaking) ? 'bg-neon-green animate-pulse' : 'bg-gray-500'}`}></div>
            Live Coaching
          </h3>
          {(phase === 'speaking_feedback' || isAiSpeaking) && (
            <span className="text-xs text-neon-green font-bold uppercase animate-pulse flex items-center gap-1">
                <Volume2 size={12} /> Speaking
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {/* Welcome Message */}
          <div className="text-center py-4">
             <div className="inline-block px-3 py-1 rounded-full bg-navy-800 text-gray-400 text-xs border border-navy-700">
                Session Started
             </div>
          </div>
          
          {/* History */}
          {results.filter(r => r.question !== currentQuestion).map((prev, idx) => (
             <div key={idx} className="opacity-60 hover:opacity-100 transition-opacity">
               <div className="bg-navy-900 p-3 rounded-lg border border-navy-800">
                 <div className="flex justify-between items-start">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Question {idx + 1}</p>
                    <span className="text-xs font-bold text-neon-blue">{Math.round((prev.feedback?.scores.content || 0 + (prev.feedback?.scores.voice || 0)) / 2)}/10</span>
                 </div>
                 <p className="text-sm text-gray-300 line-clamp-1 italic mb-2">"{prev.question}"</p>
                 <div className="flex gap-2">
                    <ScoreBadge icon={<Mic size={10} />} val={prev.feedback?.scores.voice} />
                    <ScoreBadge icon={<FileText size={10} />} val={prev.feedback?.scores.content} />
                    <ScoreBadge icon={<ScanFace size={10} />} val={prev.feedback?.scores.bodyLanguage} />
                 </div>
               </div>
             </div>
          ))}

          {/* Current Live Feedback */}
          <AnimatePresence mode="wait">
            {isQuestionFinished && lastResult && lastResult.feedback ? (
              <motion.div 
                key={lastResult.question}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-4"
              >
                 {/* Summary Bubble */}
                 <div className="bg-gradient-to-br from-navy-700 to-navy-800 p-5 rounded-2xl rounded-tr-none border border-navy-600 shadow-lg relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-neon-green text-navy-900 rounded-full flex items-center justify-center border-4 border-navy-800 shadow-sm">
                        <CheckCircle size={18} />
                    </div>
                    <p className="text-white text-sm leading-relaxed font-medium">
                        "{lastResult.feedback.summary}"
                    </p>
                 </div>

                 {/* Scores Grid */}
                 <div className="grid grid-cols-3 gap-2">
                    <ScoreBox 
                      label="Voice" 
                      score={lastResult.feedback.scores.voice} 
                      icon={<Mic size={14} />} 
                    />
                    <ScoreBox 
                      label="Content" 
                      score={lastResult.feedback.scores.content} 
                      icon={<FileText size={14} />} 
                    />
                    <ScoreBox 
                      label="Body" 
                      score={lastResult.feedback.scores.bodyLanguage} 
                      icon={<ScanFace size={14} />} 
                    />
                 </div>

                 {/* Detailed Feedback Cards */}
                 <div className="space-y-2">
                    <FeedbackCard 
                        type="Voice" 
                        text={lastResult.feedback.voiceFeedback} 
                        icon={<Mic size={14} />}
                        color="text-purple-400"
                        borderColor="border-purple-500/30"
                        bg="bg-purple-500/5"
                    />
                    <FeedbackCard 
                        type="Content" 
                        text={lastResult.feedback.contentFeedback} 
                        icon={<FileText size={14} />}
                        color="text-neon-blue"
                        borderColor="border-neon-blue/30"
                        bg="bg-neon-blue/5"
                    />
                    <FeedbackCard 
                        type="Body Language" 
                        text={lastResult.feedback.bodyLanguageFeedback} 
                        icon={<ScanFace size={14} />}
                        color="text-neon-green"
                        borderColor="border-neon-green/30"
                        bg="bg-neon-green/5"
                    />
                 </div>

                 {/* Suggestions */}
                 <div className="bg-navy-900 p-4 rounded-xl border border-navy-700">
                   <p className="text-xs font-bold text-gray-400 uppercase mb-3">Suggested Improvements</p>
                   <ul className="space-y-2">
                     {lastResult.feedback.suggestions.map((s, i) => (
                       <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                         <span className="text-neon-blue mt-1">•</span>
                         {s}
                       </li>
                     ))}
                   </ul>
                 </div>
                 
                 {(phase === 'speaking_feedback' || isAiSpeaking) && (
                     <div className="text-center">
                        <p className="text-xs text-neon-blue animate-pulse">Next question in a moment...</p>
                     </div>
                 )}
              </motion.div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                    {(phase === 'speaking_question' || isAiSpeaking) && <Volume2 size={48} className="animate-pulse" />}
                    {phase === 'listening' && <Mic size={48} className="animate-bounce" />}
                    {phase === 'processing' && <RefreshCw size={48} className="animate-spin" />}
                    <p className="text-sm font-medium">
                        {(phase === 'speaking_question' || isAiSpeaking) ? 'Listen to the question...' :
                         phase === 'listening' ? 'Listening to your answer...' : 
                         phase === 'processing' ? 'Generating feedback...' : 'Waiting to start...'}
                    </p>
                </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ScoreBox = ({ label, score, icon }: { label: string, score: number, icon?: React.ReactNode }) => (
  <div className="bg-navy-900 p-3 rounded-xl text-center border border-navy-700 flex flex-col items-center justify-between h-20 shadow-sm">
    <div className="text-gray-400 opacity-80">{icon}</div>
    <div className={`text-2xl font-bold leading-none ${score >= 7 ? 'text-neon-green' : score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
      {score}
    </div>
    <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{label}</div>
  </div>
);

const FeedbackCard = ({ type, text, icon, color, borderColor, bg }: any) => (
    <div className={`p-3 rounded-xl border ${borderColor} ${bg}`}>
        <div className={`flex items-center gap-2 mb-1 ${color} font-bold text-xs uppercase tracking-wide`}>
            {icon} {type}
        </div>
        <p className="text-gray-200 text-sm leading-relaxed">{text}</p>
    </div>
);

const ScoreBadge = ({ icon, val }: { icon: any, val?: number }) => (
    <span className="flex items-center gap-1 text-[10px] bg-navy-800 px-1.5 py-0.5 rounded text-gray-400">
        {icon} {val || '-'}
    </span>
);
