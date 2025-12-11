import React, { useState } from 'react';
import { Button } from '../components/Button';
import { InterviewSettings, MOCK_QUESTIONS } from '../types';
import { Play, FileText, Settings, Upload } from 'lucide-react';
import { generateResumeQuestions } from '../services/geminiService';

interface ConfigureSessionProps {
  initialTab?: 'quick' | 'full' | 'resume';
  onStart: (settings: InterviewSettings) => void;
  onBack: () => void;
}

export const ConfigureSession: React.FC<ConfigureSessionProps> = ({ initialTab = 'quick', onStart, onBack }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'full' | 'resume'>(initialTab);
  const [customQuestion, setCustomQuestion] = useState('');
  const [selectedQuickQuestion, setSelectedQuickQuestion] = useState(MOCK_QUESTIONS.general[0]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isProcessingResume, setIsProcessingResume] = useState(false);

  const handleStartQuick = () => {
    onStart({
      type: 'quick',
      questions: customQuestion ? [customQuestion] : [selectedQuickQuestion],
      category: 'general'
    });
  };

  const handleStartFull = (category: 'general' | 'behavioral' | 'technical') => {
    onStart({
      type: 'full',
      questions: MOCK_QUESTIONS[category],
      category
    });
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleStartResume = async () => {
    if (!resumeFile) return;
    
    setIsProcessingResume(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const questions = await generateResumeQuestions(base64String);
        
        setIsProcessingResume(false);
        onStart({
          type: 'resume',
          questions: questions,
          resumeText: "Resume Analyzed" 
        });
      };
      reader.readAsDataURL(resumeFile);
    } catch (error) {
      console.error(error);
      setIsProcessingResume(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
          &larr; Back
        </button>
        <h2 className="text-3xl font-bold text-white">Configure Session</h2>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-2 p-1 bg-navy-800 rounded-xl mb-8">
        {[
          { id: 'quick', label: 'Quick Practice', icon: Play },
          { id: 'full', label: 'Full AI Interview', icon: Settings },
          { id: 'resume', label: 'Resume Based', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-neon-blue text-white shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-navy-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-navy-800/50 border border-navy-700 rounded-2xl p-8 min-h-[400px]">
        
        {activeTab === 'quick' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-4">Select a Question</h3>
            <div className="grid gap-3">
              {MOCK_QUESTIONS.general.map((q, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedQuickQuestion(q);
                    setCustomQuestion('');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedQuickQuestion === q && !customQuestion
                      ? 'bg-navy-700 border-neon-blue ring-1 ring-neon-blue'
                      : 'bg-navy-900 border-navy-700 hover:border-gray-500'
                  }`}
                >
                  {q}
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-navy-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-navy-800 text-gray-400">Or type your own</span>
              </div>
            </div>

            <input 
              type="text" 
              placeholder="Type a custom question here..."
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              className="w-full bg-navy-900 border border-navy-600 rounded-xl p-4 text-white placeholder-gray-500 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none"
            />

            <div className="flex justify-end pt-4">
              <Button onClick={handleStartQuick} size="lg">Start Session</Button>
            </div>
          </div>
        )}

        {activeTab === 'full' && (
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { id: 'general', title: 'General', desc: 'Standard HR questions suitable for any role.' },
              { id: 'behavioral', title: 'Behavioral', desc: 'STAR method questions about past experiences.' },
              { id: 'technical', title: 'Technical', desc: 'Problem solving and logic based questions.' },
            ].map((type) => (
              <div key={type.id} className="bg-navy-900 p-6 rounded-2xl border border-navy-700 flex flex-col justify-between hover:border-neon-blue/50 transition-colors">
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">{type.title}</h4>
                  <p className="text-gray-400 text-sm mb-6">{type.desc}</p>
                </div>
                <Button onClick={() => handleStartFull(type.id as any)} variant="secondary" className="w-full">
                  Start {type.title}
                </Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'resume' && (
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
            <div className={`p-10 border-2 border-dashed rounded-2xl w-full max-w-lg transition-colors ${resumeFile ? 'border-neon-green bg-neon-green/5' : 'border-navy-600 hover:border-gray-400 bg-navy-900'}`}>
              <input 
                type="file" 
                id="resume-upload" 
                className="hidden" 
                accept=".pdf"
                onChange={handleResumeUpload}
              />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                {resumeFile ? (
                  <>
                    <FileText size={48} className="text-neon-green mb-4" />
                    <span className="text-white font-medium text-lg">{resumeFile.name}</span>
                    <span className="text-gray-400 text-sm mt-2">Click to change file</span>
                  </>
                ) : (
                  <>
                    <Upload size={48} className="text-neon-blue mb-4" />
                    <span className="text-white font-medium text-lg">Upload PDF Resume</span>
                    <span className="text-gray-400 text-sm mt-2">Drag & drop or click to browse</span>
                  </>
                )}
              </label>
            </div>
            
            {resumeFile && (
              <Button onClick={handleStartResume} size="lg" isLoading={isProcessingResume}>
                {isProcessingResume ? 'Analyzing Resume...' : 'Generate Interview'}
              </Button>
            )}
            
            {!resumeFile && (
              <p className="text-sm text-gray-500">
                Gemini Vision will extract key skills and generate tailored questions.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};