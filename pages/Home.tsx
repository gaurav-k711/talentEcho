
import React, { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { 
  Mic, Video, BrainCircuit, Activity, 
  FileText, CheckCircle2, UserCheck, Smile, 
  Mail, Clock, Zap, Dumbbell, Search, 
  DollarSign, MonitorCheck, Lightbulb, 
  ArrowRight, Sparkles, BookOpen, Quote, X,
  Copy, ChevronDown, ChevronUp, ExternalLink,
  Globe, Linkedin, Code, Briefcase, 
  TrendingUp, Shield, Target, Gift, RefreshCcw, 
  PauseCircle, Calendar, FileSignature, Star,
  Award, TrendingDown, Eye, MessageCircle, AlertTriangle, Upload, BarChart, Download, Loader2, Wrench, Gauge, UserCog,
  Play, Pause, Info, PieChart, LineChart, Volume2, MicOff,
  Flame, AudioWaveform
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateResumeAnalysis, generateSmartAnalysis } from '../services/geminiService';
import { getReports } from '../services/storageService';
import { ResumeAnalysisData, InterviewPersonality, InterviewDifficulty, SmartAnalysisData } from '../types';

interface HomeProps {
  onStart: (tab?: 'quick' | 'full' | 'resume') => void;
  onHistory: () => void;
  selectedPersonality: InterviewPersonality;
  onSelectPersonality: (p: InterviewPersonality) => void;
  selectedDifficulty: InterviewDifficulty;
  onSelectDifficulty: (d: InterviewDifficulty) => void;
}

// --- RICH PERSONALITY DATA ---
const PERSONALITY_DETAILS: Record<InterviewPersonality, {
  title: string;
  tagline: string;
  description: string;
  videoScript: string[];
  focus: string[];
  questions: string[];
  tips: string[];
  redFlags: string[];
  color: string;
}> = {
  "Friendly HR": {
    title: "The Friendly HR Recruiter",
    tagline: "Warm, Supportive & Culture-Focused",
    description: "This interview style simulates an initial screening round. The recruiter wants you to succeed and is looking for culture fit, basic competency, and enthusiasm.",
    color: "text-neon-green",
    videoScript: [
      "Hi there! I'm your Friendly HR Simulator.",
      "My goal is to make you feel comfortable while checking if you fit our culture.",
      "I won't try to trick you. I want to know who you are as a person.",
      "I'll ask about your background, your interests, and why you want this job.",
      "Be authentic, smile, and show me your passion!",
    ],
    focus: ["Culture Fit", "Communication Skills", "Enthusiasm", "Career Goals"],
    questions: ["Tell me about yourself.", "Why do you want to join us?", "What are your hobbies?", "Where do you see yourself in 5 years?"],
    tips: ["Smile and maintain eye contact.", "Keep answers concise but friendly.", "Show genuine interest in the company.", "Ask about the team culture."],
    redFlags: ["Speaking negatively about past employers.", "Lack of enthusiasm.", "One-word answers.", "Not knowing what the company does."]
  },
  "Strict Manager": {
    title: "The Strict Hiring Manager",
    tagline: "Direct, No-Nonsense & Efficiency-First",
    description: "Simulates a busy hiring manager who values time and precision. Expect interruptions if you ramble. They care about results, metrics, and facts.",
    color: "text-red-500",
    videoScript: [
      "I am the Strict Manager mode. I don't have time for fluff.",
      "I want to know if you can do the job. Period.",
      "If you ramble, I will interrupt you.",
      "Don't give me vague theories. Give me numbers and results.",
      "I'm here to test your efficiency and your competence.",
    ],
    focus: ["Competence", "Efficiency", "ROI (Return on Investment)", "Problem Solving"],
    questions: ["Walk me through your resume in 2 minutes.", "What is your biggest failure?", "Why should I hire you over others?", "Explain a time you missed a deadline."],
    tips: ["Be direct. Answer the question immediately.", "Use data and numbers.", "Don't take the strict tone personally.", "Focus on the 'Result' part of STAR."],
    redFlags: ["Rambling or long stories.", "Making excuses.", "Lack of specific metrics.", "Overly casual language."]
  },
  "Google Hiring Manager": {
    title: "Google Hiring Manager",
    tagline: "Analytical, Structured & 'Googliness'",
    description: "Based on Google's actual assessment rubrics. Focuses on General Cognitive Ability, Role-Related Knowledge, Leadership, and 'Googliness'. Expects deep STAR-formatted answers.",
    color: "text-blue-500",
    videoScript: [
      "Hello. I represent the Google Hiring Committee.",
      "I am looking for 'Googliness', leadership, and strong analytical skills.",
      "You MUST use the STAR method: Situation, Task, Action, Result.",
      "I will probe deep into your 'Action'. I want to know what YOU did, not the team.",
      "I will ask: 'What data did you use?' and 'What would you do differently?'",
    ],
    focus: ["General Cognitive Ability", "Role-Related Knowledge", "Leadership", "Structured Thinking"],
    questions: ["Tell me about a time you navigated ambiguity.", "How do you handle a team member who isn't performing?", "Describe a complex analytical problem you solved.", "Tell me about a time you took a risk."],
    tips: ["Structure is everything. Use STAR explicitly.", "Focus heavily on the 'Action' and 'Result'.", "Show how you think, not just what you know.", "Demonstrate humility and learning."],
    redFlags: ["Using 'We' instead of 'I'.", "Vague results without data.", "Unstructured answers.", "Arrogance or inability to admit mistakes."]
  },
  "Amazon Bar Raiser": {
    title: "Amazon Bar Raiser",
    tagline: "Leadership Principles & Deep Probing",
    description: "The toughest setting. Based on Amazon's 16 Leadership Principles (Customer Obsession, Ownership, Dive Deep). Expect 3-4 follow-up questions for every answer to test depth.",
    color: "text-orange-500",
    videoScript: [
      "I am the Bar Raiser. My job is to ensure you are better than 50% of current employees.",
      "I focus entirely on Leadership Principles like 'Customer Obsession' and 'Dive Deep'.",
      "I will ask follow-up questions until you say 'I don't know'.",
      "I want to see if you have truly demonstrated Ownership.",
      "Prepare to defend your decisions with data.",
    ],
    focus: ["Customer Obsession", "Ownership", "Bias for Action", "Dive Deep"],
    questions: ["Tell me about a time you disagreed with your boss.", "Give me an example of a calculated risk.", "When did you go above and beyond for a customer?", "Tell me about a time you failed."],
    tips: ["Memorize the 16 Leadership Principles.", "Expect the 'Why? Why? Why?' drill down.", "Be honest about failures.", "Show high standards."],
    redFlags: ["Blaming others.", "Lack of data.", "Surface-level answers.", "Giving up during probing."]
  },
  "Startup Founder": {
    title: "Startup Founder",
    tagline: "Agile, Hustler & Problem Solver",
    description: "Simulates a Y-Combinator style founder interview. They care about agency, speed, and your ability to wear multiple hats. They hate corporate jargon.",
    color: "text-purple-500",
    videoScript: [
      "Hey! I'm the Founder. We are moving fast and things are breaking.",
      "I don't care about your degree. I care about what you've BUILT.",
      "Can you solve problems without resources?",
      "Are you a hustler? Do you have high agency?",
      "I need someone who can start working on day one.",
    ],
    focus: ["High Agency", "Speed of Execution", "Resourcefulness", "Passion"],
    questions: ["What have you built outside of work?", "If you had $0 budget, how would you solve this?", "Tell me something you taught yourself.", "Why join a risky startup?"],
    tips: ["Show, don't just tell. Talk about projects.", "Demonstrate passion and energy.", "Show you can work without supervision.", "Be ready for hypothetical strategy questions."],
    redFlags: ["Asking for too much structure.", "Corporate jargon.", "Focusing only on salary/perks.", "Slow decision making."]
  }
};

// --- DIFFICULTY DATA ---
const DIFFICULTY_DETAILS: Record<InterviewDifficulty, {
  title: string;
  tagline: string;
  description: string;
  videoScript: string[];
  focus: string[];
  questions: string[];
  tips: string[];
  mistakes: string[];
  color: string;
}> = {
  "Beginner": {
    title: "Beginner Level",
    tagline: "Confidence Building & Basics",
    description: "Perfect for students or first-time interviewees. The AI is forgiving, speaks slower, and gives hints. The goal is to get comfortable with the format.",
    color: "text-green-500",
    videoScript: [
      "Welcome to Beginner Mode.",
      "I know interviews can be scary. I'm here to help.",
      "We will focus on the basics: Who you are and what you like.",
      "I will speak slowly and clearly.",
      "If you get stuck, I'll give you a hint.",
      "Let's build your confidence together!"
    ],
    focus: ["Basic Introductions", "Overcoming Nerves", "Clarity of Speech", "Enthusiasm"],
    questions: ["Tell me about yourself.", "What are your hobbies?", "Why did you choose your major/field?", "What are your strengths?"],
    tips: ["It's okay to take a pause.", "Keep your answers short and sweet.", "Smile! It helps you relax.", "Be honest and authentic."],
    mistakes: ["Rushing through answers.", "Mumbling.", "Saying 'I don't know' without trying.", "Looking at the floor."]
  },
  "Intermediate": {
    title: "Intermediate Level",
    tagline: "Standard Corporate Interview",
    description: "The standard for most entry-to-mid level roles. Expect a mix of behavioral and situational questions. The AI expects professionalism and structure.",
    color: "text-yellow-500",
    videoScript: [
      "Stepping it up to Intermediate Mode.",
      "This represents a standard job interview.",
      "I expect you to know your resume well.",
      "I will ask 'Tell me about a time' questions.",
      "Use the STAR method: Situation, Task, Action, Result.",
      "Let's see if you are a professional fit."
    ],
    focus: ["STAR Method Application", "Professional Tone", "Resume Walkthrough", "Conflict Resolution"],
    questions: ["Describe a challenge you faced at work.", "How do you handle deadlines?", "Where do you see yourself in 3 years?", "Why do you want to leave your current role?"],
    tips: ["Prepare stories for common behavioral questions.", "Research the company beforehand.", "Dress professionally.", "Ask questions at the end."],
    mistakes: ["Badmouthing past employers.", "Vague answers without examples.", "Not having questions for the interviewer.", "Checking your phone."]
  },
  "Hard": {
    title: "Hard Level",
    tagline: "Competitive Corporate Role",
    description: "For senior roles or competitive companies. The AI will probe details, challenge your logic, and expect data-backed answers. Emotional intelligence is key.",
    color: "text-orange-500",
    videoScript: [
      "Welcome to Hard Mode.",
      "The training wheels are off.",
      "I will challenge your assumptions.",
      "If you say you 'led a project', I will ask exactly what YOU did.",
      "I expect data, metrics, and clear logic.",
      "Can you handle the pressure?"
    ],
    focus: ["Data & Metrics", "Leadership & Influence", "Strategic Thinking", "Handling Pressure"],
    questions: ["Tell me about a time you failed and what you learned.", "How do you manage a toxic team member?", "Explain a complex concept to a non-technical person.", "Describe a time you had to pivot strategy."],
    tips: ["Quantify your results (e.g., 'Improved by 20%').", "Own your failures; don't make excuses.", "Demonstrate high emotional intelligence.", "Be concise and structured."],
    mistakes: ["Blaming others for failures.", "Being defensive when challenged.", "Lack of specific details.", "Rambling."]
  },
  "Extreme": {
    title: "Extreme Level",
    tagline: "FAANG / High-Frequency Trading",
    description: "Simulates Google, Amazon, or Hedge Fund interviews. Relentless follow-ups, complex problem-solving, and high-stress scenarios. Only for the brave.",
    color: "text-red-600",
    videoScript: [
      "This is Extreme Mode.",
      "I am looking for reasons to reject you.",
      "I will ask multiple follow-up questions to find your breaking point.",
      "I don't care just about the answer, I care about your thought process.",
      "I expect world-class communication and logic.",
      "Prove to me you belong in the top 1%."
    ],
    focus: ["First Principles Thinking", "System Design / Logic", "Ambiguity Navigation", "Executive Presence"],
    questions: ["Walk me through the hardest decision you've made this year.", "How would you solve [Complex Problem] with no budget?", "Tell me about a time you fundamentally changed someone's mind.", "Estimate the number of windows in NYC."],
    tips: ["Think out loud.", "Clarify constraints before answering.", "Stay calm under relentless questioning.", "Structure is your lifeline."],
    mistakes: ["Giving up.", "Getting angry or frustrated.", "Guessing without logic.", "Ignoring the prompt's constraints."]
  }
};

const VOICE_COACHING_DETAILS = {
  title: "Real-Time Voice Coaching",
  tagline: "Master Your Tone, Pace & Confidence",
  description: "Your voice conveys 38% of your communication impact. Our AI analyzes your audio stream in real-time to detect nervous ticks, filler words, and pacing issues, providing instant visual feedback so you can correct course immediately.",
  videoScript: [
    "Welcome to your Voice Analysis Training.",
    "Did you know 38% of your impact comes just from how you sound?",
    "I track your Speaking Pace. If you speak too fast, you sound nervous.",
    "I count your Filler Words like 'Um' and 'Ah'. These reduce authority.",
    "I analyze your Pitch Variation. Monotone voices are forgettable.",
    "During the interview, watch the Live Panel for my feedback.",
    "Pause. Breathe. Speak with conviction."
  ],
  metrics: [
    {
      title: "Speaking Pace",
      icon: <Clock size={20} className="text-blue-400" />,
      desc: "Ideal range: 120-150 words per minute. Too fast = Nervous. Too slow = Boring.",
      tips: ["Take a breath between sentences.", "Practice reading news articles aloud to find a rhythm."]
    },
    {
      title: "Filler Words",
      icon: <MicOff size={20} className="text-red-400" />,
      desc: "We detect 'Um', 'Uh', 'Like', 'You know'. These signal hesitation and lack of prep.",
      tips: ["Replace fillers with silence.", "Think before you speak, not while you speak.", "Slow down."]
    },
    {
      title: "Confidence & Energy",
      icon: <Zap size={20} className="text-yellow-400" />,
      desc: "Based on volume projection, pitch modulation, and steadiness of voice.",
      tips: ["Sit up straight to project your voice.", "Smile to add warmth to your tone.", "Avoid upspeak."]
    },
    {
      title: "Clarity",
      icon: <Activity size={20} className="text-green-400" />,
      desc: "Measures enunciation and mumbling. Clear speech shows clear thinking.",
      tips: ["Articulate the ends of your words.", "Open your mouth wider when speaking."]
    }
  ]
};

// --- Daily Wisdom Component ---
const QUOTES = [
  { text: "Success occurs when opportunity meets preparation. Your confidence is your best suit.", tip: "Pause for 2 seconds before answering." },
  { text: "The expert in anything was once a beginner. Practice makes progress.", tip: "Use the STAR method for stories." },
  { text: "Your attitude, not your aptitude, will determine your altitude.", tip: "Smile when you speak." },
  { text: "Prepare for the unknown by studying the known.", tip: "Research the company values." },
  { text: "Interviewing is a two-way street. You are interviewing them too.", tip: "Ask about their team culture." }
];

const DailyWisdom = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length);
    }, 60000); 
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 h-full">
      <div className="p-3 bg-navy-900 rounded-full border border-navy-700 text-neon-green shrink-0">
        <Quote size={24} />
      </div>
      <div className="text-center md:text-left flex-1 h-20 flex flex-col justify-center overflow-hidden relative w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute w-full"
          >
            <h3 className="text-lg font-bold text-white mb-1">Daily Wisdom</h3>
            <p className="text-gray-300 italic">"{QUOTES[index].text}"</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-navy-900/50 px-4 py-2 rounded-lg border border-navy-700 text-sm text-gray-400 shrink-0"
        >
          <span className="text-neon-blue font-bold">Tip #{index + 1}:</span> {QUOTES[index].tip}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// --- SIMULATED VIDEO PLAYER COMPONENT ---
const SimulatedVideoPlayer = ({ script, personality, difficulty }: { script: string[], personality?: InterviewPersonality, difficulty?: InterviewDifficulty }) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % script.length);
    }, 3500); // Change line every 3.5 seconds
    return () => clearInterval(interval);
  }, [isPlaying, script]);

  return (
    <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-navy-600 relative aspect-video flex flex-col">
      {/* Video Content Area */}
      <div className="flex-1 relative flex items-center justify-center p-8 bg-gradient-to-br from-navy-900 to-navy-800">
        {/* Animated Waveform Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 gap-1 pointer-events-none">
          {[...Array(20)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: isPlaying ? [20, 60, 20] : 20 }}
               transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
               className="w-2 bg-neon-blue rounded-full"
             />
          ))}
        </div>

        {/* AI Avatar / Icon */}
        <motion.div 
           animate={{ scale: isPlaying ? [1, 1.05, 1] : 1 }}
           transition={{ duration: 2, repeat: Infinity }}
           className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-navy-800 border-2 border-neon-blue flex items-center justify-center z-10"
        >
          {personality ? (
            <BotIcon personality={personality} size={32} />
          ) : difficulty ? (
            <Gauge size={32} className={
                difficulty === 'Beginner' ? 'text-green-500' :
                difficulty === 'Intermediate' ? 'text-yellow-500' :
                difficulty === 'Hard' ? 'text-orange-500' : 'text-red-500'
            } />
          ) : (
            <BrainCircuit size={32} className="text-neon-blue" />
          )}
        </motion.div>

        {/* Caption Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLine}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center relative z-10 mt-12"
          >
             <p className="text-xl md:text-2xl font-bold text-white leading-relaxed drop-shadow-md">
               "{script[currentLine]}"
             </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Player Controls */}
      <div className="h-12 bg-navy-900 border-t border-navy-700 flex items-center px-4 gap-4">
         <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-neon-blue">
           {isPlaying ? <Pause size={20} /> : <Play size={20} />}
         </button>
         
         {/* Progress Bar */}
         <div className="flex-1 h-1.5 bg-navy-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-neon-blue"
              animate={{ width: `${((currentLine + 1) / script.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
         </div>
         
         <span className="text-xs text-gray-400 font-mono">00:{currentLine < 9 ? `0${currentLine+1}` : currentLine+1} / 00:{script.length < 9 ? `0${script.length}` : script.length}</span>
      </div>
    </div>
  );
};

const BotIcon = ({ personality, size }: { personality: InterviewPersonality, size: number }) => {
  switch(personality) {
    case 'Friendly HR': return <Smile size={size} className="text-neon-green" />;
    case 'Strict Manager': return <Briefcase size={size} className="text-red-500" />;
    case 'Google Hiring Manager': return <Search size={size} className="text-blue-500" />;
    case 'Amazon Bar Raiser': return <BarChart size={size} className="text-orange-500" />;
    case 'Startup Founder': return <Zap size={size} className="text-purple-500" />;
    default: return <UserCheck size={size} className="text-white" />;
  }
};

// --- SMART REPORT INSIGHT MODAL ---
const SmartReportInsightModal = ({ onClose }: { onClose: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SmartAnalysisData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Simulate reading reports (in a real app, this might pull from an API)
      const reports = getReports();
      // Add fake delay for "AI crunching" effect
      await new Promise(r => setTimeout(r, 2500));
      const result = await generateSmartAnalysis(reports);
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  const aiAnalysisScript = [
    "Initializing Performance Core...",
    "Analyzing historical session data...",
    "Calculating Hiring Likelihood probability...",
    "Identifying STAR method improvements...",
    "Generating 6-point scorecard...",
    "Analysis complete. Presenting insights."
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700 bg-navy-900 z-20 shrink-0">
          <div className="flex items-center gap-3">
             <BrainCircuit className="text-neon-green animate-pulse" size={24} />
             <div>
               <h2 className="text-xl font-bold text-white leading-none">Smart Interview Report</h2>
               <span className="text-xs text-gray-400">AI-Powered Meta Analysis</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-navy-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-navy-900">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-full max-w-lg">
                   <SimulatedVideoPlayer script={aiAnalysisScript} />
                </div>
                <div className="mt-8 flex items-center gap-3 text-neon-green">
                   <Loader2 className="animate-spin" />
                   <span className="font-mono text-sm">Processing Neural Network...</span>
                </div>
             </div>
           ) : data ? (
             <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                {/* LEFT COL: Stats & Likelihood */}
                <div className="space-y-6">
                   {/* Hiring Likelihood Gauge */}
                   <div className="bg-navy-800 p-8 rounded-2xl border border-navy-700 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-neon-green/5"></div>
                      <h3 className="text-lg font-bold text-gray-300 mb-6 z-10">Hiring Likelihood Prediction</h3>
                      
                      <div className="relative w-48 h-48 flex items-center justify-center z-10">
                         {/* Background Circle */}
                         <svg className="w-full h-full transform -rotate-90">
                           <circle cx="96" cy="96" r="88" stroke="#111C2E" strokeWidth="12" fill="none" />
                           <circle 
                             cx="96" cy="96" r="88" stroke="#1EC28F" strokeWidth="12" fill="none" 
                             strokeDasharray={552} 
                             strokeDashoffset={552 - (552 * data.hiringLikelihood) / 100} 
                             strokeLinecap="round"
                             className="drop-shadow-[0_0_10px_rgba(30,194,143,0.5)] transition-all duration-1000 ease-out"
                           />
                         </svg>
                         <div className="absolute flex flex-col items-center">
                            <span className="text-5xl font-extrabold text-white">{data.hiringLikelihood}%</span>
                            <span className="text-xs text-neon-green uppercase font-bold tracking-widest mt-1">Match</span>
                         </div>
                      </div>
                      
                      <p className="text-center text-sm text-gray-400 mt-6 z-10 px-4">
                        {data.trendAnalysis}
                      </p>
                   </div>

                   {/* 6-Point Scorecard */}
                   <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                         <BarChart size={20} className="text-purple-400" /> 6-Point Scorecard
                      </h3>
                      <div className="space-y-4">
                         <ScoreBar label="Communication" score={data.scores.communication} color="bg-blue-500" />
                         <ScoreBar label="Confidence" score={data.scores.confidence} color="bg-yellow-500" />
                         <ScoreBar label="Voice Clarity" score={data.scores.clarity} color="bg-green-500" />
                         <ScoreBar label="Body Language" score={data.scores.bodyLanguage} color="bg-pink-500" />
                         <ScoreBar label="Answer Structure" score={data.scores.structure} color="bg-purple-500" />
                         <ScoreBar label="Hiring Probability" score={data.scores.hiringProbability} color="bg-neon-green" />
                      </div>
                   </div>
                </div>

                {/* RIGHT COL: Rewrite & Trends */}
                <div className="space-y-6">
                   {/* Trend Chart Mockup (SVG) */}
                   <div className="bg-navy-800 p-6 rounded-2xl border border-navy-700">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                         <TrendingUp size={20} className="text-neon-blue" /> Performance Trend
                      </h3>
                      {/* Simple SVG Line Chart */}
                      <div className="w-full h-40 flex items-end justify-between px-2 gap-2">
                         {[40, 55, 45, 60, 75, 70, 85].map((h, i) => (
                           <div key={i} className="w-full bg-navy-900 rounded-t-sm relative group">
                              <div 
                                className="absolute bottom-0 w-full bg-neon-blue/50 rounded-t-sm group-hover:bg-neon-blue transition-all duration-500"
                                style={{ height: `${h}%` }}
                              ></div>
                           </div>
                         ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                        <span>Session 1</span>
                        <span>Session 7</span>
                      </div>
                   </div>

                   {/* STAR Rewrite */}
                   <div className="bg-gradient-to-br from-purple-900/20 to-navy-800 p-6 rounded-2xl border border-purple-500/30">
                      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                         <Sparkles size={20} className="text-purple-400" /> STAR Method Rewrite
                      </h3>
                      <div className="mb-4">
                        <span className="text-xs font-bold text-gray-400 uppercase">Weakest Topic Identified:</span>
                        <p className="text-white font-medium">"{data.starRewrite.originalTopic}"</p>
                      </div>
                      <div className="bg-navy-900/50 p-4 rounded-xl border border-navy-700 text-sm leading-relaxed text-gray-300 italic">
                         <p>{data.starRewrite.improvedAnswer}</p>
                      </div>
                      <div className="mt-3 flex gap-2 justify-end">
                         <span className="text-xs bg-navy-900 px-2 py-1 rounded text-purple-400 border border-purple-500/20">AI Generated Optimization</span>
                      </div>
                   </div>

                   {/* Strengths & Weaknesses */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-navy-800 p-4 rounded-xl border border-navy-700">
                         <h4 className="text-sm font-bold text-neon-green mb-2 flex items-center gap-1"><CheckCircle2 size={14}/> Strengths</h4>
                         <ul className="text-xs text-gray-400 space-y-1">
                           {data.strengths.slice(0,3).map((s,i) => <li key={i}>• {s}</li>)}
                         </ul>
                      </div>
                      <div className="bg-navy-800 p-4 rounded-xl border border-navy-700">
                         <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-1"><AlertTriangle size={14}/> Weaknesses</h4>
                         <ul className="text-xs text-gray-400 space-y-1">
                           {data.weaknesses.slice(0,3).map((w,i) => <li key={i}>• {w}</li>)}
                         </ul>
                      </div>
                   </div>
                </div>
             </div>
           ) : (
             <div className="text-center py-20">
               <p className="text-red-400">Failed to load analysis. Please try again.</p>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
};

const ScoreBar = ({ label, score, color }: { label: string, score: number, color: string }) => (
  <div className="space-y-1">
     <div className="flex justify-between text-xs font-medium text-gray-300">
       <span>{label}</span>
       <span>{score}/10</span>
     </div>
     <div className="h-2 w-full bg-navy-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`h-full rounded-full ${color}`} 
        />
     </div>
  </div>
);

// --- DIFFICULTY INSIGHT MODAL ---
const DifficultyInsightModal = ({ 
  difficulty, 
  onClose, 
  onStart 
}: { 
  difficulty: InterviewDifficulty, 
  onClose: () => void, 
  onStart: () => void 
}) => {
  const details = DIFFICULTY_DETAILS[difficulty];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700 bg-navy-900 z-20 shrink-0">
          <div className="flex items-center gap-3">
             <Gauge size={24} className={details.color} />
             <div>
               <h2 className="text-xl font-bold text-white leading-none">{difficulty} Mode</h2>
               <span className="text-xs text-gray-400">Difficulty Calibration</span>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-navy-800 rounded-full text-gray-400 hover:text-white hover:bg-navy-700 transition-colors border border-navy-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-navy-900">
           <div className="grid lg:grid-cols-2 gap-8">
            
            {/* LEFT: Video & Intro */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{details.title}</h2>
                <p className="text-lg text-gray-300">{details.tagline}</p>
              </div>

              {/* AI Video Simulator */}
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                     <Video size={12} /> Difficulty Briefing
                   </span>
                   <span className="text-xs text-neon-blue animate-pulse">Live Simulation</span>
                </div>
                <SimulatedVideoPlayer script={details.videoScript} difficulty={difficulty} />
              </div>

              <div className="bg-navy-800/50 p-6 rounded-xl border border-navy-700">
                 <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                   <Info size={18} className="text-neon-blue" />
                   Overview
                 </h3>
                 <p className="text-gray-300 leading-relaxed text-sm">
                   {details.description}
                 </p>
              </div>
              
              <Button onClick={onStart} size="lg" className="w-full text-lg py-4 shadow-[0_0_20px_rgba(47,123,255,0.4)]">
                 <Play fill="currentColor" className="mr-2" /> Start {difficulty} Interview
              </Button>
            </div>

            {/* RIGHT: Cards & Details */}
            <div className="space-y-6">
               
               {/* 1. Key Focus Areas */}
               <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 hover:border-neon-blue/30 transition-all">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Target className="text-neon-blue" size={20} />
                     Key Focus Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                     {details.focus.map((item, i) => (
                       <span key={i} className="px-3 py-1 bg-navy-900 border border-navy-700 rounded-lg text-sm text-gray-300">
                         {item}
                       </span>
                     ))}
                  </div>
               </div>

               {/* 2. Common Questions */}
               <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 hover:border-purple-500/30 transition-all">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <MessageCircle className="text-purple-400" size={20} />
                     Expected Question Types
                  </h3>
                  <ul className="space-y-3">
                     {details.questions.map((q, i) => (
                       <li key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-navy-900/50 p-3 rounded-lg">
                         <span className="text-purple-400 font-bold mt-0.5">{i+1}.</span>
                         {q}
                       </li>
                     ))}
                  </ul>
               </div>

               {/* 3. Tips for Success */}
               <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 hover:border-green-500/30 transition-all">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <CheckCircle2 className="text-green-400" size={20} />
                     Tips for Success
                  </h3>
                  <ul className="space-y-2">
                     {details.tips.map((tip, i) => (
                       <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                         <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                         {tip}
                       </li>
                     ))}
                  </ul>
               </div>

               {/* 4. Common Mistakes */}
               <div className="bg-red-500/5 p-6 rounded-xl border border-red-500/20">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <AlertTriangle className="text-red-400" size={20} />
                     Mistakes to Avoid
                  </h3>
                  <ul className="space-y-2">
                     {details.mistakes.map((mistake, i) => (
                       <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                         <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                         {mistake}
                       </li>
                     ))}
                  </ul>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- PERSONALITY INSIGHT MODAL ---
const PersonalityInsightModal = ({ 
  personality, 
  onClose, 
  onStart 
}: { 
  personality: InterviewPersonality, 
  onClose: () => void, 
  onStart: () => void 
}) => {
  const details = PERSONALITY_DETAILS[personality];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700 bg-navy-900 z-20 shrink-0">
          <div className="flex items-center gap-3">
             <BotIcon personality={personality} size={24} />
             <div>
               <h2 className="text-xl font-bold text-white leading-none">{personality}</h2>
               <span className="text-xs text-gray-400">AI Coach Insight Mode</span>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-navy-800 rounded-full text-gray-400 hover:text-white hover:bg-navy-700 transition-colors border border-navy-700"
            aria-label="Close Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-navy-900">
           <div className="grid lg:grid-cols-2 gap-8">
            
            {/* LEFT: Video & Intro */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{details.title}</h2>
                <p className="text-lg text-gray-300">{details.tagline}</p>
              </div>

              {/* AI Video Simulator */}
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                     <Video size={12} /> AI Coach Training Session
                   </span>
                   <span className="text-xs text-neon-blue animate-pulse">Live Simulation</span>
                </div>
                <SimulatedVideoPlayer script={details.videoScript} personality={personality} />
              </div>

              <div className="bg-navy-800/50 p-6 rounded-xl border border-navy-700">
                 <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                   <Info size={18} className="text-neon-blue" />
                   Overview
                 </h3>
                 <p className="text-gray-300 leading-relaxed text-sm">
                   {details.description}
                 </p>
              </div>
              
              <Button onClick={onStart} size="lg" className="w-full text-lg py-4 shadow-[0_0_20px_rgba(47,123,255,0.4)]">
                 <Play fill="currentColor" className="mr-2" /> Start Interview with {personality}
              </Button>
            </div>

            {/* RIGHT: Cards & Details */}
            <div className="space-y-6">
               
               {/* 1. What They Look For */}
               <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 hover:border-neon-green/30 transition-all">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Target className="text-neon-green" size={20} />
                     What They Look For
                  </h3>
                  <div className="flex flex-wrap gap-2">
                     {details.focus.map((item, i) => (
                       <span key={i} className="px-3 py-1 bg-navy-900 border border-navy-700 rounded-lg text-sm text-gray-300">
                         {item}
                       </span>
                     ))}
                  </div>
               </div>

               {/* 2. Common Questions */}
               <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 hover:border-purple-500/30 transition-all">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <MessageCircle className="text-purple-400" size={20} />
                     Typical Questions
                  </h3>
                  <ul className="space-y-3">
                     {details.questions.map((q, i) => (
                       <li key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-navy-900/50 p-3 rounded-lg">
                         <span className="text-purple-400 font-bold mt-0.5">{i+1}.</span>
                         {q}
                       </li>
                     ))}
                  </ul>
               </div>

               {/* 3. Strategy Tips */}
               <div className="bg-navy-800 p-6 rounded-xl border border-navy-700 hover:border-yellow-500/30 transition-all">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Lightbulb className="text-yellow-400" size={20} />
                     How to Win
                  </h3>
                  <ul className="space-y-2">
                     {details.tips.map((tip, i) => (
                       <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                         <CheckCircle2 size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                         {tip}
                       </li>
                     ))}
                  </ul>
               </div>

               {/* 4. Red Flags */}
               <div className="bg-red-500/5 p-6 rounded-xl border border-red-500/20">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <AlertTriangle className="text-red-400" size={20} />
                     Red Flags (Avoid These)
                  </h3>
                  <ul className="space-y-2">
                     {details.redFlags.map((flag, i) => (
                       <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                         <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                         {flag}
                       </li>
                     ))}
                  </ul>
               </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- VOICE COACHING INSIGHT MODAL ---
const VoiceCoachingInsightModal = ({ onClose, onStart }: { onClose: () => void, onStart: () => void }) => {
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/90 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700 bg-navy-900 z-20 shrink-0">
          <div className="flex items-center gap-3">
             <Mic className="text-neon-blue" size={24} />
             <div>
               <h2 className="text-xl font-bold text-white leading-none">Real-Time Voice Coaching</h2>
               <span className="text-xs text-gray-400">AI Audio Analysis Module</span>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-navy-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-navy-900">
           <div className="grid lg:grid-cols-2 gap-8">
             
             {/* Left: Video & Intro */}
             <div className="space-y-6">
                <div>
                   <h2 className="text-3xl font-bold text-white mb-2">{VOICE_COACHING_DETAILS.title}</h2>
                   <p className="text-lg text-gray-300">{VOICE_COACHING_DETAILS.tagline}</p>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Video size={12} /> AI Voice Lab
                      </span>
                      <span className="text-xs text-neon-blue animate-pulse">Training Simulation</span>
                   </div>
                   <SimulatedVideoPlayer script={VOICE_COACHING_DETAILS.videoScript} />
                </div>

                <div className="bg-navy-800/50 p-6 rounded-xl border border-navy-700">
                   <p className="text-gray-300 leading-relaxed text-sm">
                      {VOICE_COACHING_DETAILS.description}
                   </p>
                </div>

                <Button onClick={onStart} size="lg" className="w-full text-lg py-4 shadow-[0_0_20px_rgba(47,123,255,0.4)]">
                   <Mic fill="currentColor" className="mr-2" /> Start Practice Session
                </Button>
             </div>

             {/* Right: Metrics Grid */}
             <div className="grid gap-4">
                <h3 className="text-xl font-bold text-white mb-2">What We Analyze</h3>
                {VOICE_COACHING_DETAILS.metrics.map((metric, i) => (
                  <div key={i} className="bg-navy-800 p-5 rounded-xl border border-navy-700 hover:border-neon-blue/30 transition-all group">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-navy-900 rounded-lg group-hover:scale-110 transition-transform">
                          {metric.icon}
                        </div>
                        <div className="flex-1">
                           <h4 className="font-bold text-white mb-1">{metric.title}</h4>
                           <p className="text-xs text-gray-400 mb-3">{metric.desc}</p>
                           <div className="bg-navy-900/50 p-2 rounded-lg border border-navy-800">
                              <span className="text-xs font-bold text-neon-blue uppercase block mb-1">Pro Tip:</span>
                              <ul className="list-disc list-inside text-xs text-gray-300">
                                {metric.tips.map((t, idx) => <li key={idx}>{t}</li>)}
                              </ul>
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>

           </div>
        </div>
      </motion.div>
    </div>
  );
};


// --- Resume Review Tool Component ---
const ResumeReviewTool = () => {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [data, setData] = useState<ResumeAnalysisData | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (mode === 'upload' && !file) return;
    if (mode === 'paste' && !text.trim()) return;

    setIsAnalyzing(true);
    try {
      let result;
      if (mode === 'upload' && file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          result = await generateResumeAnalysis(base64, 'pdf');
          setData(result);
          setIsAnalyzing(false);
        };
      } else {
        result = await generateResumeAnalysis(text, 'text');
        setData(result);
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleDownloadReport = () => {
    // Basic text dump download
    if (!data) return;
    const reportText = `RESUME ANALYSIS REPORT\n\nSUMMARY:\n${data.summary}\n\nSTRENGTHS:\n${data.strengths.map(s => `- ${s}`).join('\n')}\n\nMISTAKES:\n${data.mistakes.map(s => `- ${s}`).join('\n')}\n\nIMPROVEMENTS:\n${data.improvements.map(s => `- ${s}`).join('\n')}\n\nSCORES:\nContent: ${data.scores.content}/10\nFormatting: ${data.scores.formatting}/10\nClarity: ${data.scores.clarity}/10\nATS: ${data.scores.atsOptimization}/10`;
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-analysis.txt';
    a.click();
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={48} className="text-neon-blue animate-spin mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">Analyzing Resume...</h3>
        <p className="text-gray-400">Our AI expert is reviewing your content, formatting, and ATS compatibility.</p>
      </div>
    );
  }

  if (data) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Summary */}
        <div className="bg-navy-900 border border-navy-700 p-6 rounded-2xl shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-neon-blue/10 rounded-xl">
               <FileText size={32} className="text-neon-blue" />
            </div>
            <div>
               <h3 className="text-xl font-bold text-white mb-2">Resume Summary</h3>
               <p className="text-gray-300 leading-relaxed">{data.summary}</p>
            </div>
          </div>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <ScoreCard label="Content Quality" score={data.scores.content} icon={<FileText size={16}/>} />
           <ScoreCard label="Formatting" score={data.scores.formatting} icon={<Video size={16}/>} />
           <ScoreCard label="Clarity" score={data.scores.clarity} icon={<Eye size={16}/>} />
           <ScoreCard label="ATS Optimized" score={data.scores.atsOptimization} icon={<Search size={16}/>} />
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
           <DetailList 
             title="Strengths" 
             items={data.strengths} 
             icon={<Star size={20} />} 
             color="text-yellow-400" 
             bg="bg-yellow-400/10" 
             border="border-yellow-400/20"
           />
           <DetailList 
             title="Mistakes / Issues" 
             items={data.mistakes} 
             icon={<AlertTriangle size={20} />} 
             color="text-red-400" 
             bg="bg-red-400/10" 
             border="border-red-400/20"
           />
        </div>
        
        <div className="bg-neon-blue/5 border border-neon-blue/20 p-6 rounded-2xl">
          <h4 className="text-lg font-bold text-neon-blue mb-4 flex items-center gap-2">
            <Wrench size={20} /> Recommended Improvements
          </h4>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-3">
             {data.improvements.map((item, i) => (
               <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                 <ArrowRight size={14} className="mt-1 text-neon-blue shrink-0" />
                 {item}
               </li>
             ))}
          </ul>
        </div>

        <div className="flex justify-between pt-4 border-t border-navy-700">
           <Button variant="secondary" onClick={() => setData(null)}>Re-upload Resume</Button>
           <Button onClick={handleDownloadReport}><Download size={16} className="mr-2" /> Download Report</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Resume Insights & Review</h3>
        <p className="text-gray-400">Get instant expert-level feedback on your resume.</p>
      </div>

      <div className="flex justify-center gap-4 mb-6">
         <button 
           onClick={() => setMode('upload')}
           className={`px-6 py-2 rounded-full font-medium transition-all ${mode === 'upload' ? 'bg-neon-blue text-white' : 'bg-navy-800 text-gray-400 hover:bg-navy-700'}`}
         >
           Upload PDF
         </button>
         <button 
           onClick={() => setMode('paste')}
           className={`px-6 py-2 rounded-full font-medium transition-all ${mode === 'paste' ? 'bg-neon-blue text-white' : 'bg-navy-800 text-gray-400 hover:bg-navy-700'}`}
         >
           Paste Text
         </button>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
         {mode === 'upload' ? (
           <div className="w-full max-w-md text-center">
             <div className="border-2 border-dashed border-navy-600 rounded-xl p-10 hover:border-neon-blue hover:bg-navy-800 transition-all cursor-pointer relative">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload size={48} className="mx-auto text-gray-500 mb-4" />
                <p className="text-white font-medium mb-1">{file ? file.name : "Drag & drop or click to upload"}</p>
                <p className="text-sm text-gray-500">Supported format: PDF</p>
             </div>
             {file && (
               <div className="mt-6">
                 <Button onClick={handleAnalyze} size="lg" className="w-full">Analyze Resume</Button>
               </div>
             )}
           </div>
         ) : (
           <div className="w-full">
             <textarea 
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Paste your resume content here..."
               className="w-full h-64 bg-navy-800 border border-navy-600 rounded-xl p-4 text-white placeholder-gray-500 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue outline-none resize-none mb-4"
             />
             <Button onClick={handleAnalyze} disabled={!text.trim()} size="lg" className="w-full">Analyze Text</Button>
           </div>
         )}
         
         <div className="mt-8 flex items-center gap-2 text-xs text-gray-500 bg-navy-800 px-3 py-1 rounded-full">
            <Lightbulb size={12} className="text-yellow-500" />
            Tip: Upload your resume in PDF for best accuracy.
         </div>
      </div>
    </div>
  );
};

const ScoreCard = ({ label, score, icon }: any) => (
  <div className="bg-navy-800 p-4 rounded-xl border border-navy-700 flex flex-col items-center">
    <div className="text-gray-400 mb-2">{icon}</div>
    <div className={`text-2xl font-bold mb-1 ${score >= 8 ? 'text-neon-green' : score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>{score}/10</div>
    <div className="text-xs uppercase text-gray-500 font-bold tracking-wider">{label}</div>
  </div>
);

const DetailList = ({ title, items, icon, color, bg, border }: any) => (
  <div className={`p-6 rounded-2xl border ${border} ${bg}`}>
     <h4 className={`text-lg font-bold mb-4 flex items-center gap-2 ${color}`}>
       {icon} {title}
     </h4>
     <ul className="space-y-3">
       {items.map((item: string, i: number) => (
         <li key={i} className="flex items-start gap-3 text-sm text-gray-200">
           <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${color.replace('text', 'bg')} shrink-0`}></span>
           <span className="leading-relaxed">{item}</span>
         </li>
       ))}
     </ul>
  </div>
);

// --- Pro Tips Guide Component ---
const ProTipsGuide = () => {
  const proTips = [
    {
      title: "The 'Bridge' Technique",
      icon: <TrendingUp className="text-neon-blue" size={20} />,
      content: "When asked a question you don't like or can't answer well, briefly address it, then 'bridge' to a topic you want to discuss. Example: 'I haven't used that specific software, but [Bridge] in my last role I mastered a similar tool in 2 weeks, which shows my ability to learn quickly.'"
    },
    {
      title: "The 70/30 Rule",
      icon: <Activity className="text-purple-400" size={20} />,
      content: "Aim to speak for 70% of the time and listen for 30%. However, don't monologue. If an answer goes over 2 minutes, check in: 'Does that answer your question, or would you like more detail on X?'"
    },
    {
      title: "The 'Magic' Closing Question",
      icon: <Sparkles className="text-yellow-400" size={20} />,
      content: "At the very end, ask: 'Is there anything about my background that makes you hesitant to hire me?' This gives you one final chance to clear up any misunderstandings before they leave the room."
    },
    {
      title: "Mirroring Body Language",
      icon: <UserCheck className="text-pink-400" size={20} />,
      content: "Subtly mirror the interviewer's energy. If they are lean-forward and energetic, match that. If they are calm and laid back, lower your intensity slightly. It builds unconscious rapport."
    },
    {
      title: "The Portfolio Approach",
      icon: <Briefcase className="text-neon-green" size={20} />,
      content: "Don't just tell—show. Even for non-design roles, saying 'I can show you a quick one-pager I wrote about this' is 10x more powerful than just describing it."
    },
    {
      title: "Reframe Nervousness",
      icon: <BrainCircuit className="text-red-400" size={20} />,
      content: "Anxiety and excitement are physiologically almost identical. Instead of trying to calm down (which is hard), tell yourself 'I am excited'. It shifts your mindset from threat to opportunity."
    }
  ];

  return (
    <div className="space-y-6">
       <div className="bg-navy-900 p-6 rounded-xl border border-navy-700">
         <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
           <Zap className="text-yellow-500" /> Advanced Interview Strategies
         </h4>
         <p className="text-gray-300 text-sm">
           Beyond standard answers, these psychological and strategic tips separate the top 1% of candidates from the rest.
         </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {proTips.map((tip, idx) => (
           <div key={idx} className="bg-navy-800/50 p-5 rounded-xl border border-navy-700 hover:border-neon-blue/40 transition-all">
             <div className="flex items-start gap-4">
               <div className="p-2 bg-navy-900 rounded-lg shrink-0">
                 {tip.icon}
               </div>
               <div>
                 <h5 className="font-bold text-white text-base mb-2">{tip.title}</h5>
                 <p className="text-sm text-gray-400 leading-relaxed">{tip.content}</p>
               </div>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

// --- Salary Negotiation Guide Component ---
const SalaryNegotiationGuide = () => {
  const tips = [
    {
      id: 1,
      title: "Know Your Market Value",
      icon: <Search className="text-neon-blue" size={20} />,
      content: "Research salary ranges using Glassdoor, Levels.fyi, or Naukri. Know the difference between CTC, Base, and RSU."
    },
    {
      id: 2,
      title: "Don't Share Expected First",
      icon: <Shield className="text-red-400" size={20} />,
      content: "Say: \"I would like to understand the role expectations better before discussing compensation.\""
    },
    {
      id: 3,
      title: "Delay Salary Discussion",
      icon: <Clock className="text-yellow-400" size={20} />,
      content: "Focus first on role clarity and growth. Once they want you, your leverage increases."
    },
    {
      id: 4,
      title: "Set a Walk-Away Number",
      icon: <Target className="text-neon-green" size={20} />,
      content: "Decide your minimum acceptable salary in advance based on your expenses and goals."
    },
    {
      id: 5,
      title: "Present Data, Not Emotions",
      icon: <TrendingUp className="text-purple-400" size={20} />,
      content: "Use facts: \"Based on market standards for this seniority, ₹X–₹Y seems appropriate.\""
    },
    {
      id: 6,
      title: "Use Value Statements",
      icon: <Sparkles className="text-orange-400" size={20} />,
      content: "Justify your ask: \"I bring specific expertise in X that will reduce training time and costs.\""
    },
    {
      id: 7,
      title: "Negotiate the Full Package",
      icon: <Gift className="text-pink-400" size={20} />,
      content: "Don't just focus on Base. Ask about Joining Bonus, Stocks, Remote options, and Insurance."
    },
    {
      id: 8,
      title: "Be Confident But Polite",
      icon: <UserCheck className="text-blue-400" size={20} />,
      content: "Avoid aggressive language. Stay professional, calm, and collaborative."
    },
    {
      id: 9,
      title: "Always Counter First Offer",
      icon: <RefreshCcw className="text-cyan-400" size={20} />,
      content: "Say: \"Thank you for the offer. I was expecting something in the range of ₹X. Is there flexibility?\""
    },
    {
      id: 10,
      title: "Use Silence as a Tool",
      icon: <PauseCircle className="text-gray-400" size={20} />,
      content: "After stating your number, stop talking. Wait for them to respond, even if it feels awkward."
    },
    {
      id: 11,
      title: "Think Long-Term",
      icon: <Calendar className="text-green-400" size={20} />,
      content: "Ask about promotion cycles and performance reviews. A lower start might have high growth potential."
    },
    {
      id: 12,
      title: "Get Everything in Writing",
      icon: <FileSignature className="text-white" size={20} />,
      content: "Verbal promises don't count. Ensure bonus, title, and start date are in the official letter."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-6 rounded-xl border border-navy-700">
        <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <DollarSign className="text-neon-green" /> Salary Negotiation Masterclass
        </h4>
        <p className="text-gray-300 text-sm">
          Negotiation is not about conflict; it's about finding a fair exchange of value. 
          Use these 12 principles to maximize your offer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip) => (
          <div key={tip.id} className="bg-navy-800/50 p-4 rounded-xl border border-navy-700 hover:border-neon-blue/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-navy-900 rounded-lg border border-navy-800 shadow-sm shrink-0">
                {tip.icon}
              </div>
              <div>
                <h5 className="font-bold text-white text-sm mb-1">{tip.title}</h5>
                <p className="text-xs text-gray-400 leading-relaxed">{tip.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Company Research Interactive Component ---
const CompanyResearchGuide = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const researchChecklist = [
    { id: 1, text: "Company Snapshot: Size, location, founded date, stock price (if public)." },
    { id: 2, text: "Products & Services: What do they actually sell? Who is the customer?" },
    { id: 3, text: "Recent News: Mergers, funding rounds, product launches (last 90 days)." },
    { id: 4, text: "Leadership: CEO, CTO, and the person you'd report to." },
    { id: 5, text: "Culture & Values: Read their 'About Us' and 'Careers' pages deeply." },
    { id: 6, text: "Role Specifics: Tech stack, design system, or sales methodology used." },
    { id: 7, text: "Glassdoor Reviews: Look for recurring themes in pros/cons." },
    { id: 8, text: "Salary Benchmark: Check Levels.fyi or Glassdoor for range." },
    { id: 9, text: "1-Page Cheat Sheet: Synthesize everything into a brief." },
  ];

  const briefTemplate = `COMPANY RESEARCH BRIEF
----------------------
Company: [Name]
Mission: [Tagline/Mission]
Key Products: [Product A, Product B]
CEO: [Name] | Recent News: [Headline]

THE ROLE
----------------------
My Fit: [Skill 1] matches [Requirement A]
Gap: [Skill 2] (Plan: Mention course/project)
Key Challenge: [Problem they are solving]

QUESTIONS TO ASK
----------------------
1. [Role Specific]
2. [Culture Specific]
3. [Strategic/Growth]

SALARY RANGE: $[X]k - $[Y]k`;

  const aiPrompt = `Act as a senior market research analyst. 
I am interviewing for a [Job Title] role at [Company Name]. 
Please generate a comprehensive 1-page research summary including:
1. The company's core mission and values.
2. Their top 3 products/services and target audience.
3. Recent major news or press releases (last 6 months).
4. Key competitors and [Company Name]'s competitive advantage.
5. Potential challenges the company is facing right now.
6. A list of 5 strategic questions I should ask the interviewer to show deep insight.`;

  return (
    <div className="space-y-4">
      <p className="text-gray-300 mb-4">
        Walking into an interview without research is like walking into a test you didn't study for. 
        Use this module to prepare in under 30 minutes.
      </p>

      {/* 1. Why Research Matters */}
      <ResearchSection 
        id="why" 
        title="Why This Matters" 
        icon={<Lightbulb size={20} className="text-yellow-400" />}
        activeId={activeSection} 
        onToggle={toggleSection}
      >
        <div className="text-sm text-gray-300 space-y-2">
          <p><strong>Confidence:</strong> Knowing the business removes the fear of the unknown.</p>
          <p><strong>Tailored Answers:</strong> You can link your skills to their actual problems.</p>
          <p><strong>Signal Interest:</strong> Candidates who quote recent news stand out immediately.</p>
        </div>
      </ResearchSection>

      {/* 2. 9-Step Checklist */}
      <ResearchSection 
        id="checklist" 
        title="9-Step Research Checklist" 
        icon={<CheckCircle2 size={20} className="text-neon-green" />}
        activeId={activeSection} 
        onToggle={toggleSection}
      >
        <div className="space-y-2">
          {researchChecklist.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2 bg-navy-900 rounded border border-navy-700">
              <div className="mt-0.5 min-w-[20px] h-5 rounded-full border border-gray-500 flex items-center justify-center text-[10px] text-gray-400">
                {item.id}
              </div>
              <span className="text-sm text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>
      </ResearchSection>

      {/* 3. 1-Page Brief Template */}
      <ResearchSection 
        id="template" 
        title="1-Page Brief Template" 
        icon={<FileText size={20} className="text-neon-blue" />}
        activeId={activeSection} 
        onToggle={toggleSection}
      >
        <div className="relative group">
          <pre className="bg-navy-950 p-4 rounded-lg text-xs text-gray-300 font-mono whitespace-pre-wrap border border-navy-700">
            {briefTemplate}
          </pre>
          <button 
            onClick={() => copyToClipboard(briefTemplate, 'template')}
            className="absolute top-2 right-2 p-2 bg-navy-800 rounded hover:bg-navy-700 text-gray-400 hover:text-white transition-colors"
            title="Copy Template"
          >
            {copiedId === 'template' ? <CheckCircle2 size={14} className="text-neon-green" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Copy this into your notes app and fill it out before the call.</p>
      </ResearchSection>

      {/* 4. Tailoring Your Answers */}
      <ResearchSection 
        id="tailoring" 
        title="Tailoring Your Resume & Answers" 
        icon={<UserCheck size={20} className="text-purple-400" />}
        activeId={activeSection} 
        onToggle={toggleSection}
      >
        <div className="space-y-4">
           <div className="p-3 bg-navy-900 border-l-2 border-red-500 rounded-r">
             <span className="text-xs font-bold text-red-400 block mb-1">GENERIC ANSWER</span>
             <p className="text-sm text-gray-400">"I am a great problem solver and I have 5 years of experience in sales."</p>
           </div>
           <div className="p-3 bg-navy-900 border-l-2 border-neon-green rounded-r">
             <span className="text-xs font-bold text-neon-green block mb-1">RESEARCH-BACKED ANSWER</span>
             <p className="text-sm text-gray-300">"I saw that you recently <strong>expanded into the EMEA market</strong>. In my last role, I led a similar expansion that solved the <strong>localization challenge</strong> you might be facing now..."</p>
           </div>
           <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
             <li>Mirror their language (e.g., do they call them "users", "clients", or "partners"?).</li>
             <li>Reference their core values (e.g., "I know you value 'Radical Candor', and here is how I practiced that...").</li>
           </ul>
        </div>
      </ResearchSection>

      {/* 5. Smart Questions to Ask */}
      <ResearchSection 
        id="questions" 
        title="Smart Questions to Ask" 
        icon={<Activity size={20} className="text-blue-400" />}
        activeId={activeSection} 
        onToggle={toggleSection}
      >
        <div className="grid gap-3">
          <div className="bg-navy-900 p-3 rounded">
            <h5 className="text-neon-blue font-bold text-xs uppercase mb-1">Role & Expectations</h5>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• "What does success look like in the first 90 days?"</li>
              <li>• "What is the biggest challenge the team is currently facing?"</li>
            </ul>
          </div>
          <div className="bg-navy-900 p-3 rounded">
            <h5 className="text-neon-blue font-bold text-xs uppercase mb-1">Product & Strategy</h5>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• "How will the recent [News Event] impact the product roadmap?"</li>
              <li>• "Who do you view as your most threatening competitor right now?"</li>
            </ul>
          </div>
          <div className="bg-navy-900 p-3 rounded">
            <h5 className="text-neon-blue font-bold text-xs uppercase mb-1">Culture</h5>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• "What’s one thing you would change about the company culture?"</li>
              <li>• "How are decisions made in this team? Consensus or top-down?"</li>
            </ul>
          </div>
        </div>
      </ResearchSection>

      {/* 6. Role Specific Checks */}
      <ResearchSection 
        id="role" 
        title="Role-Specific Checks" 
        icon={<Briefcase size={20} className="text-pink-400" />}
        activeId={activeSection} 
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-navy-900 p-2 rounded border border-navy-700">
            <strong className="text-white block">Engineering</strong>
            <span className="text-gray-400">Github repo, Tech blog, Stackshare profile.</span>
          </div>
          <div className="bg-navy-900 p-2 rounded border border-navy-700">
            <strong className="text-white block">Product</strong>
            <span className="text-gray-400">Release notes, App Store reviews, Competitors.</span>
          </div>
          <div className="bg-navy-900 p-2 rounded border border-navy-700">
            <strong className="text-white block">Design</strong>
            <span className="text-gray-400">Design system, Dribbble/Behance presence.</span>
          </div>
          <div className="bg-navy-900 p-2 rounded border border-navy-700">
            <strong className="text-white block">Sales/Marketing</strong>
            <span className="text-gray-400">Case studies, Social media engagement, Ads.</span>
          </div>
        </div>
      </ResearchSection>

      {/* 7. Trusted Sources */}
      <ResearchSection 
        id="sources" 
        title="Trusted Research Sources" 
        icon={<Globe size={20} className="text-green-400" />}
        activeId={activeSection} 
        onToggle={toggleSection}
      >
        <div className="flex flex-wrap gap-2">
           <SourceLink name="Official Website" />
           <SourceLink name="LinkedIn (People)" />
           <SourceLink name="Crunchbase (Funding)" />
           <SourceLink name="Glassdoor (Reviews)" />
           <SourceLink name="Blind (Insider Gossip)" />
           <SourceLink name="Levels.fyi (Salary)" />
           <SourceLink name="Google News" />
           <SourceLink name="YouTube (CEO Interviews)" />
        </div>
      </ResearchSection>

      {/* 8. AI Auto-Summary */}
      <ResearchSection 
        id="ai" 
        title="AI Auto-Research Prompt" 
        icon={<Sparkles size={20} className="text-neon-blue animate-pulse" />}
        activeId={activeSection} 
        onToggle={toggleSection}
      >
         <p className="text-sm text-gray-300 mb-3">
           Don't have time? Copy this prompt into Gemini/ChatGPT to get a 5-minute briefing.
         </p>
         <div className="relative group">
          <pre className="bg-navy-950 p-4 rounded-lg text-xs text-neon-green font-mono whitespace-pre-wrap border border-navy-700">
            {aiPrompt}
          </pre>
          <button 
            onClick={() => copyToClipboard(aiPrompt, 'prompt')}
            className="absolute top-2 right-2 p-2 bg-navy-800 rounded hover:bg-navy-700 text-gray-400 hover:text-white transition-colors"
            title="Copy Prompt"
          >
            {copiedId === 'prompt' ? <CheckCircle2 size={14} className="text-neon-green" /> : <Copy size={14} />}
          </button>
        </div>
      </ResearchSection>
    </div>
  );
};

const ResearchSection = ({ id, title, icon, children, activeId, onToggle }: any) => {
  const isOpen = activeId === id;
  return (
    <div className="border border-navy-700 rounded-xl bg-navy-800/50 overflow-hidden transition-all duration-200">
      <button 
        onClick={() => onToggle(id)}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isOpen ? 'bg-navy-800' : 'hover:bg-navy-800/80'}`}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-bold text-white text-sm md:text-base">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 border-t border-navy-700 bg-navy-900/30">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SourceLink = ({ name }: { name: string }) => (
  <div className="px-3 py-1.5 bg-navy-900 border border-navy-700 rounded-lg flex items-center gap-2 text-xs text-gray-300">
    <ExternalLink size={10} className="text-neon-blue" /> {name}
  </div>
);


// --- Content for Preparation Toolkit ---
const TOOLKIT_CONTENT: Record<string, { title: string, content: React.ReactNode }> = {
  "resume-review": {
    title: "Resume Insights & Review",
    content: <ResumeReviewTool />
  },
  "pro-tips": {
    title: "Pro Interview Strategies",
    content: <ProTipsGuide />
  },
  "salary-negotiation": {
    title: "Salary Negotiation Tips",
    content: <SalaryNegotiationGuide />
  },
  "company-research": {
    title: "Company Research Masterclass",
    content: <CompanyResearchGuide />
  },
  "hr-questions": {
    title: "Common HR Questions",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">Master these 5 most common questions to set a strong foundation for your interview.</p>
        <div className="space-y-3">
          <div className="p-3 bg-navy-900 rounded-lg border border-navy-700">
            <h4 className="font-bold text-neon-blue mb-1">1. Tell me about yourself.</h4>
            <p className="text-sm text-gray-400">Do not recite your resume. Focus on your professional journey: Past (experience), Present (current role), and Future (why you want this job).</p>
          </div>
          <div className="p-3 bg-navy-900 rounded-lg border border-navy-700">
            <h4 className="font-bold text-neon-blue mb-1">2. Why should we hire you?</h4>
            <p className="text-sm text-gray-400">Match your skills to their job description. Mention a specific problem they have and how you can solve it.</p>
          </div>
          <div className="p-3 bg-navy-900 rounded-lg border border-navy-700">
            <h4 className="font-bold text-neon-blue mb-1">3. What is your greatest weakness?</h4>
            <p className="text-sm text-gray-400">Choose a real weakness, but one that isn't fatal to the job. Crucially, explain what steps you are taking to improve it.</p>
          </div>
          <div className="p-3 bg-navy-900 rounded-lg border border-navy-700">
            <h4 className="font-bold text-neon-blue mb-1">4. Where do you see yourself in 5 years?</h4>
            <p className="text-sm text-gray-400">Show ambition but stay grounded. Align your goals with the company's growth to show long-term commitment.</p>
          </div>
           <div className="p-3 bg-navy-900 rounded-lg border border-navy-700">
            <h4 className="font-bold text-neon-blue mb-1">5. Do you have any questions for us?</h4>
            <p className="text-sm text-gray-400">Always say yes. Ask about team culture, upcoming challenges, or the interviewer's favorite part of the job.</p>
          </div>
        </div>
      </div>
    )
  },
  "star-method": {
    title: "STAR Method Guide",
    content: (
      <div className="space-y-4">
        <p className="text-gray-300">Use the STAR method to structure answers for behavioral questions (e.g., "Tell me about a time you...").</p>
        <div className="grid grid-cols-1 gap-2">
           <div className="flex gap-4 p-3 bg-navy-900 rounded-lg border border-navy-700">
             <div className="w-8 h-8 rounded-full bg-neon-blue flex items-center justify-center font-bold text-white shrink-0">S</div>
             <div>
               <h4 className="font-bold text-white">Situation</h4>
               <p className="text-sm text-gray-400">Briefly set the scene. Who, what, where, when? Keep it under 20 seconds.</p>
             </div>
           </div>
           <div className="flex gap-4 p-3 bg-navy-900 rounded-lg border border-navy-700">
             <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white shrink-0">T</div>
             <div>
               <h4 className="font-bold text-white">Task</h4>
               <p className="text-sm text-gray-400">Explain the challenge or goal you were working towards.</p>
             </div>
           </div>
           <div className="flex gap-4 p-3 bg-navy-900 rounded-lg border border-navy-700">
             <div className="w-8 h-8 rounded-full bg-neon-green flex items-center justify-center font-bold text-navy-900 shrink-0">A</div>
             <div>
               <h4 className="font-bold text-white">Action</h4>
               <p className="text-sm text-gray-400">The most important part. What specific steps did YOU take? Use "I", not "We".</p>
             </div>
           </div>
           <div className="flex gap-4 p-3 bg-navy-900 rounded-lg border border-navy-700">
             <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-navy-900 shrink-0">R</div>
             <div>
               <h4 className="font-bold text-white">Result</h4>
               <p className="text-sm text-gray-400">Share the outcome. Use numbers if possible (e.g., "Saved 20% time", "Generated $50k").</p>
             </div>
           </div>
        </div>
      </div>
    )
  },
  "resume-tips": {
    title: "Resume Improvement Tips",
    content: (
      <ul className="space-y-3 list-disc list-inside text-gray-300">
        <li><strong>Quantify everything:</strong> Don't just say "managed a team". Say "Managed a team of 6 engineers to deliver 3 projects under budget."</li>
        <li><strong>Tailor keywords:</strong> Mirror the language used in the job description (e.g., "Agile", "Stakeholder Management").</li>
        <li><strong>Keep it clean:</strong> Use a simple, readable font like Arial or Inter. Avoid flashy graphics unless you're a designer.</li>
        <li><strong>Action Verbs:</strong> Start bullet points with strong verbs: "Led", "Developed", "Architected", "Solved".</li>
        <li><strong>One page rule:</strong> Unless you have 10+ years of experience, keep it to one page.</li>
      </ul>
    )
  },
  "dos-and-donts": {
    title: "Interview Do's & Don'ts",
    content: (
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2"><CheckCircle2 size={16}/> DO</h4>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>Research the company beforehand.</li>
            <li>Dress one level above the daily dress code.</li>
            <li>Test your camera and mic 10 mins early.</li>
            <li>Maintain eye contact (look at the camera).</li>
          </ul>
        </div>
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2"><X size={16}/> DON'T</h4>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>Badmouth previous employers.</li>
            <li>Interrupt the interviewer.</li>
            <li>Look at your phone or other screens.</li>
            <li>Give one-word answers (Yes/No).</li>
          </ul>
        </div>
      </div>
    )
  },
  "dress-code": {
    title: "Dress Code Guide",
    content: (
      <div className="space-y-4 text-gray-300">
         <p>When in doubt, it is better to be slightly overdressed than underdressed.</p>
         <div className="p-3 bg-navy-900 border border-navy-700 rounded-lg">
           <h5 className="font-bold text-white">Startups / Tech</h5>
           <p className="text-sm text-gray-400">Smart Casual. A nice button-down shirt, polo, or blouse. Avoid graphic tees or hoodies.</p>
         </div>
         <div className="p-3 bg-navy-900 border border-navy-700 rounded-lg">
           <h5 className="font-bold text-white">Corporate / Finance / Law</h5>
           <p className="text-sm text-gray-400">Business Professional. Suit and tie, or blazer and dress pants/skirt. Stick to neutral colors (Navy, Black, Grey).</p>
         </div>
         <p className="text-sm italic text-gray-500">*Tip: For video interviews, avoid stripes or tight patterns as they can cause moiré effects on camera.</p>
      </div>
    )
  },
  "body-language": {
    title: "Body Language Best Practices",
    content: (
      <ul className="space-y-3 text-gray-300">
         <li className="flex gap-2"><Smile className="text-neon-blue" size={18} /> <strong>Eye Contact:</strong> In video calls, look at the camera lens, not the screen, to simulate eye contact.</li>
         <li className="flex gap-2"><UserCheck className="text-neon-blue" size={18} /> <strong>Posture:</strong> Sit up straight. Leaning back looks disinterested; slouching looks low-energy.</li>
         <li className="flex gap-2"><Activity className="text-neon-blue" size={18} /> <strong>Hands:</strong> Use gestures to emphasize points, but keep them contained. Don't touch your face or hair.</li>
         <li className="flex gap-2"><CheckCircle2 className="text-neon-blue" size={18} /> <strong>Nodding:</strong> Nod occasionally while the interviewer speaks to show active listening.</li>
      </ul>
    )
  },
  "voice-tips": {
    title: "Voice Modulation Tips",
    content: (
       <div className="space-y-3 text-gray-300">
         <p><strong>Pace:</strong> Nervous candidates speak fast. Make a conscious effort to slow down. It projects confidence.</p>
         <p><strong>Tone:</strong> Avoid "upspeak" (ending sentences like a question?). It makes you sound unsure. End sentences with a downward inflection.</p>
         <p><strong>Volume:</strong> Speak slightly louder than your conversational volume to ensure clarity over the microphone.</p>
         <p><strong>Filler Words:</strong> Record yourself. Notice "Umm", "Like", "Uh". Replace them with a silent pause. Silence feels long to you, but thoughtful to the listener.</p>
       </div>
    )
  },
  "checklist": {
    title: "Pre-Interview Checklist",
    content: (
      <ul className="space-y-2 text-gray-300 text-sm">
         <li className="flex items-center gap-2"><CheckCircle2 className="text-neon-green" size={16}/> Laptop charged or plugged in.</li>
         <li className="flex items-center gap-2"><CheckCircle2 className="text-neon-green" size={16}/> Stable internet connection (ethernet if possible).</li>
         <li className="flex items-center gap-2"><CheckCircle2 className="text-neon-green" size={16}/> Camera lens cleaned.</li>
         <li className="flex items-center gap-2"><CheckCircle2 className="text-neon-green" size={16}/> Quiet room with door locked/sign posted.</li>
         <li className="flex items-center gap-2"><CheckCircle2 className="text-neon-green" size={16}/> Copy of resume and job description printed nearby.</li>
         <li className="flex items-center gap-2"><CheckCircle2 className="text-neon-green" size={16}/> Glass of water within reach.</li>
         <li className="flex items-center gap-2"><CheckCircle2 className="text-neon-green" size={16}/> Phone on silent/do not disturb.</li>
      </ul>
    )
  },
  "email-templates": {
    title: "Follow-up Email Template",
    content: (
      <div className="bg-navy-900 p-4 rounded-lg border border-navy-700 font-mono text-sm text-gray-300">
         <p className="mb-2"><span className="text-gray-500">Subject:</span> Thank you - [Your Name] - [Job Title] Interview</p>
         <p className="mb-2">Hi [Interviewer Name],</p>
         <p className="mb-2">Thank you so much for taking the time to speak with me today. I really enjoyed learning more about the [Job Title] role and the team's focus on [Specific Topic Discussed].</p>
         <p className="mb-2">I am even more enthusiastic about the opportunity to contribute to [Company Name], especially given my experience with [Relevant Skill].</p>
         <p className="mb-2">Please let me know if there is any additional information I can provide.</p>
         <p className="mb-2">Best regards,</p>
         <p>[Your Name]</p>
      </div>
    )
  }
};

export const Home: React.FC<HomeProps> = ({ 
  onStart, 
  onHistory,
  selectedPersonality,
  onSelectPersonality,
  selectedDifficulty,
  onSelectDifficulty
}) => {
  const [selectedToolkitItem, setSelectedToolkitItem] = useState<string | null>(null);
  const [activePersonalityDetail, setActivePersonalityDetail] = useState<InterviewPersonality | null>(null);
  const [activeDifficultyDetail, setActiveDifficultyDetail] = useState<InterviewDifficulty | null>(null);
  const [showSmartReportModal, setShowSmartReportModal] = useState(false);
  const [showVoiceCoachingModal, setShowVoiceCoachingModal] = useState(false);

  const personalities: {id: InterviewPersonality, icon: any, desc: string}[] = [
    { id: 'Friendly HR', icon: Smile, desc: "Warm & supportive" },
    { id: 'Strict Manager', icon: Briefcase, desc: "Neutral & structured" },
    { id: 'Google Hiring Manager', icon: Search, desc: "Analytical & STAR-focused" },
    { id: 'Amazon Bar Raiser', icon: BarChart, desc: "Deep probing leadership" },
    { id: 'Startup Founder', icon: Zap, desc: "Fast-paced & practical" },
  ];

  const difficulties: {id: InterviewDifficulty, color: string}[] = [
    { id: 'Beginner', color: 'bg-green-500' },
    { id: 'Intermediate', color: 'bg-yellow-500' },
    { id: 'Hard', color: 'bg-orange-500' },
    { id: 'Extreme', color: 'bg-red-600' },
  ];

  const handlePersonalityClick = (id: InterviewPersonality) => {
    setActivePersonalityDetail(id);
  };

  const handleStartPersonalityInterview = () => {
    if (activePersonalityDetail) {
      onSelectPersonality(activePersonalityDetail);
      onStart('full');
      setActivePersonalityDetail(null);
    }
  };

  const handleDifficultyClick = (id: InterviewDifficulty) => {
    setActiveDifficultyDetail(id);
  };

  const handleStartDifficultyInterview = () => {
    if (activeDifficultyDetail) {
      onSelectDifficulty(activeDifficultyDetail);
      onStart('full');
      setActiveDifficultyDetail(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
      
      {/* --- HERO SECTION --- */}
      <div className="text-center mb-16 max-w-4xl mx-auto">
        
        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
        >
          TalentEcho <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-500">AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Practice. Improve. Get Hired. <br />
          <span className="text-gray-500 text-lg">Real-time analysis of your voice, facial expressions, and answer content.</span>
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Button onClick={() => onStart('quick')} size="lg" className="min-w-[200px] text-lg shadow-[0_0_20px_rgba(47,123,255,0.4)]">
            Start Interview
          </Button>
          <Button onClick={onHistory} variant="secondary" size="lg" className="min-w-[200px] text-lg">
            Past Reports
          </Button>
        </motion.div>
      </div>

      {/* --- INTERVIEW PREPARATION HUB --- */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full mb-16"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-navy-700 flex-1"></div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-neon-blue" size={24} />
            Interview Preparation Hub
          </h2>
          <div className="h-px bg-navy-700 flex-1"></div>
        </div>

        {/* 1. Motivational Corner */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-navy-800 to-navy-900 border border-navy-700 rounded-2xl p-6 relative overflow-hidden group hover:border-neon-green/30 transition-all">
             <div className="absolute top-0 right-0 p-8 bg-neon-blue/5 rounded-full blur-2xl -mr-4 -mt-4 group-hover:bg-neon-blue/10 transition-all"></div>
             <DailyWisdom />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Toolkit & Practice (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 2. Quick Practice Modules */}
            <div>
              <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                <Zap className="text-yellow-500" size={20} /> Quick Practice Modules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                 <PracticeCard icon={<Clock size={20} />} label="Elevator Pitch" onClick={() => onStart('quick')} />
                 <PracticeCard icon={<UserCheck size={20} />} label="About Yourself" onClick={() => onStart('quick')} />
                 <PracticeCard icon={<Dumbbell size={20} />} label="Strengths" onClick={() => onStart('quick')} />
                 <PracticeCard icon={<Activity size={20} />} label="Rapid Fire" onClick={() => onStart('quick')} />
              </div>
            </div>

            {/* 3. Interactive Tools */}
            <div>
              <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                <MonitorCheck className="text-neon-blue" size={20} /> Interactive Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToolCard 
                  icon={<FileText className="text-neon-green" size={24} />}
                  title="Resume Interview"
                  desc="Upload your resume to get an interview tailored to your experience."
                  onClick={() => onStart('resume')} 
                />
                 <ToolCard 
                  icon={<BarChart className="text-pink-500" size={24} />}
                  title="Resume Score & Review"
                  desc="Get expert AI feedback, scores, and improvement tips for your resume."
                  onClick={() => setSelectedToolkitItem("resume-review")} 
                />
                <ToolCard 
                  icon={<BrainCircuit className="text-purple-500" size={24} />}
                  title="AI Question Generator"
                  desc="Generate specific questions for any job role or industry instantly."
                  onClick={() => onStart('full')} 
                />
                <ToolCard 
                  icon={<Search className="text-blue-400" size={24} />}
                  title="Company Research"
                  desc="Learn what key values to mention for top tech companies."
                  onClick={() => setSelectedToolkitItem("company-research")} 
                />
                <ToolCard 
                  icon={<DollarSign className="text-green-400" size={24} />}
                  title="Salary Negotiation"
                  desc="Practice scripts to help you get the offer you deserve."
                  onClick={() => setSelectedToolkitItem("salary-negotiation")} 
                />
              </div>
            </div>

          </div>

          {/* Right Col: Preparation Toolkit (Span 1) */}
          <div className="space-y-4">
             <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
               <BookOpen className="text-neon-green" size={20} /> Preparation Toolkit
             </h3>
             <div className="bg-navy-800/50 border border-navy-700 rounded-2xl p-2">
               <div className="grid grid-cols-1 gap-1">
                 <ToolkitItem icon={<Zap size={16} className="text-yellow-500" />} label="Pro Interview Strategies" onClick={() => setSelectedToolkitItem("pro-tips")} />
                 <ToolkitItem icon={<CheckCircle2 size={16} />} label="Common HR Questions" onClick={() => setSelectedToolkitItem("hr-questions")} />
                 <ToolkitItem icon={<Activity size={16} />} label="STAR Method Guide" onClick={() => setSelectedToolkitItem("star-method")} />
                 <ToolkitItem icon={<FileText size={16} />} label="Resume Tips" onClick={() => setSelectedToolkitItem("resume-tips")} />
                 <ToolkitItem icon={<CheckCircle2 size={16} />} label="Interview Do's & Don'ts" onClick={() => setSelectedToolkitItem("dos-and-donts")} />
                 <ToolkitItem icon={<UserCheck size={16} />} label="Dress Code Guide" onClick={() => setSelectedToolkitItem("dress-code")} />
                 <ToolkitItem icon={<Smile size={16} />} label="Body Language Guide" onClick={() => setSelectedToolkitItem("body-language")} />
                 <ToolkitItem icon={<Mic size={16} />} label="Voice Modulation" onClick={() => setSelectedToolkitItem("voice-tips")} />
                 <ToolkitItem icon={<CheckCircle2 size={16} />} label="Pre-Interview Checklist" onClick={() => setSelectedToolkitItem("checklist")} />
                 <ToolkitItem icon={<Mail size={16} />} label="Follow-up Templates" onClick={() => setSelectedToolkitItem("email-templates")} />
               </div>
             </div>
             
             {/* Extra Call to Action */}
             <div className="bg-gradient-to-br from-purple-900/40 to-navy-900 border border-purple-500/30 rounded-2xl p-6 mt-4 text-center">
                <h4 className="text-white font-bold mb-2">Ready to master it?</h4>
                <p className="text-sm text-gray-400 mb-4">Put these tips into practice with a live session.</p>
                <button onClick={() => onStart('quick')} className="text-neon-blue text-sm font-bold flex items-center justify-center gap-1 hover:gap-2 transition-all">
                  Go to Simulator <ArrowRight size={14} />
                </button>
             </div>
          </div>

        </div>
      </motion.div>

      {/* --- ADVANCED AI COACHING TOOLS SECTION --- */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full"
      >
         <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-gradient-to-r from-transparent to-purple-500 flex-1"></div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCog className="text-purple-400" size={24} />
            Advanced AI Coaching Tools
          </h2>
          <div className="h-px bg-gradient-to-l from-transparent to-purple-500 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* 1. HR Personality Modes */}
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <UserCheck className="text-purple-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">Choose Interviewer Personality</h3>
                <p className="text-xs text-gray-400">Select how tough or friendly your interviewer should be.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {personalities.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => handlePersonalityClick(p.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedPersonality === p.id 
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                    : 'bg-navy-900 border-navy-700 text-gray-400 hover:border-gray-500 hover:bg-navy-800'
                  }`}
                >
                   <p.icon size={20} className={selectedPersonality === p.id ? 'text-purple-400' : ''} />
                   <span className="text-xs font-bold text-center">{p.id}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-gray-500 mt-4 italic">
              AI adopts specific tone, difficulty & follow-up intensity.
            </p>
          </div>

          {/* 4. Difficulty Level Mode */}
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Gauge className="text-red-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">Choose Difficulty Level</h3>
                <p className="text-xs text-gray-400">Practice interviews from beginner to Google-level difficulty.</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-3">
              {difficulties.map((d) => (
                <button 
                  key={d.id}
                  onClick={() => handleDifficultyClick(d.id)}
                  className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all group ${
                    selectedDifficulty === d.id
                    ? 'bg-navy-700 border-white text-white'
                    : 'bg-navy-900 border-navy-700 text-gray-400 hover:bg-navy-800'
                  }`}
                >
                  <span className="font-medium">{d.id}</span>
                  <div className={`h-2 w-24 rounded-full bg-navy-950 overflow-hidden`}>
                     <div className={`h-full ${d.color} ${selectedDifficulty === d.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'}`} style={{ width: d.id === 'Beginner' ? '25%' : d.id === 'Intermediate' ? '50%' : d.id === 'Hard' ? '75%' : '100%' }}></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* 2. Real-Time Voice Coaching Info */}
           <div 
             className="bg-gradient-to-br from-navy-800 to-navy-900 border border-navy-700 rounded-2xl p-6 relative overflow-hidden cursor-pointer group hover:border-neon-blue/40 transition-all"
             onClick={() => setShowVoiceCoachingModal(true)}
           >
              <div className="absolute top-0 right-0 p-16 bg-neon-blue/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-neon-blue/10 transition-all"></div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-neon-blue/20 rounded-xl">
                   <Mic className="text-neon-blue" size={28} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">Real-Time Voice Coaching</h3>
                   <p className="text-sm text-gray-400 mb-4">
                     Live feedback on tone, pace, clarity, hesitation, filler words & confidence while you speak.
                   </p>
                   <ul className="text-sm text-gray-300 space-y-2">
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neon-blue"></div> Speaking Pace Analysis</li>
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neon-blue"></div> Filler Word Detection ("um", "like")</li>
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neon-blue"></div> Confidence Scoring</li>
                   </ul>
                   <div className="mt-4 text-xs font-bold text-neon-blue uppercase tracking-wide flex items-center gap-1">
                     Start Training <ArrowRight size={12} />
                   </div>
                </div>
              </div>
           </div>

           {/* 3. AI Performance Report Info */}
           <div 
             className="bg-gradient-to-br from-navy-800 to-navy-900 border border-navy-700 rounded-2xl p-6 relative overflow-hidden cursor-pointer hover:border-neon-green/40 transition-all group"
             onClick={() => setShowSmartReportModal(true)}
           >
              <div className="absolute top-0 right-0 p-16 bg-neon-green/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-neon-green/10 transition-all"></div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-neon-green/20 rounded-xl">
                   <BarChart className="text-neon-green" size={28} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white mb-2 group-hover:text-neon-green transition-colors">Smart Interview Report</h3>
                   <p className="text-sm text-gray-400 mb-4">
                     Detailed performance analysis with charts, hiring likelihood scores, and AI-rewritten answers.
                   </p>
                   <ul className="text-sm text-gray-300 space-y-2">
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div> 6-Point Scorecard (0-10)</li>
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div> Hiring Likelihood Prediction</li>
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div> STAR Method Answer Rewrites</li>
                   </ul>
                   <div className="mt-4 text-xs font-bold text-neon-green uppercase tracking-wide flex items-center gap-1">
                     Click to view analysis <ArrowRight size={12} />
                   </div>
                </div>
              </div>
           </div>
        </div>

      </motion.div>

      {/* --- TOOLKIT MODAL --- */}
      <AnimatePresence>
        {selectedToolkitItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-navy-800 border border-navy-600 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-navy-700 bg-navy-800/95 rounded-t-2xl z-10">
                <h3 className="text-xl font-bold text-white">
                  {TOOLKIT_CONTENT[selectedToolkitItem]?.title || "Detail View"}
                </h3>
                <button 
                  onClick={() => setSelectedToolkitItem(null)} 
                  className="p-1 rounded-full hover:bg-navy-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {TOOLKIT_CONTENT[selectedToolkitItem]?.content}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-navy-700 flex justify-end bg-navy-800 rounded-b-2xl">
                <Button onClick={() => setSelectedToolkitItem(null)} variant="secondary" size="sm">Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PERSONALITY INSIGHT MODAL --- */}
      <AnimatePresence>
        {activePersonalityDetail && (
          <PersonalityInsightModal 
            personality={activePersonalityDetail} 
            onClose={() => setActivePersonalityDetail(null)}
            onStart={handleStartPersonalityInterview}
          />
        )}
      </AnimatePresence>

      {/* --- DIFFICULTY INSIGHT MODAL --- */}
      <AnimatePresence>
        {activeDifficultyDetail && (
          <DifficultyInsightModal 
            difficulty={activeDifficultyDetail} 
            onClose={() => setActiveDifficultyDetail(null)}
            onStart={handleStartDifficultyInterview}
          />
        )}
      </AnimatePresence>

      {/* --- SMART REPORT MODAL --- */}
      <AnimatePresence>
        {showSmartReportModal && (
          <SmartReportInsightModal onClose={() => setShowSmartReportModal(false)} />
        )}
      </AnimatePresence>

      {/* --- VOICE COACHING MODAL --- */}
      <AnimatePresence>
        {showVoiceCoachingModal && (
          <VoiceCoachingInsightModal 
             onClose={() => setShowVoiceCoachingModal(false)} 
             onStart={() => {
                setShowVoiceCoachingModal(false);
                onStart('quick');
             }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const PracticeCard = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <motion.button 
    whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-3 p-4 bg-navy-800 border border-navy-700 rounded-xl hover:border-neon-blue/50 transition-all group"
  >
    <div className="p-2 rounded-lg bg-navy-900 text-gray-400 group-hover:text-neon-blue group-hover:bg-blue-500/10 transition-colors">
      {icon}
    </div>
    <span className="text-sm font-medium text-gray-300 group-hover:text-white">{label}</span>
  </motion.button>
);

const ToolCard = ({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    onClick={onClick}
    className="p-5 bg-navy-800/80 border border-navy-700 rounded-xl cursor-pointer hover:bg-navy-800 hover:border-neon-blue/30 transition-all group"
  >
    <div className="flex items-start gap-4">
      <div className="p-3 bg-navy-900 rounded-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-white font-bold text-sm mb-1 group-hover:text-neon-blue transition-colors">{title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  </motion.div>
);

const ToolkitItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-navy-700/50 text-left group transition-colors">
    <span className="text-gray-500 group-hover:text-neon-green transition-colors">{icon}</span>
    <span className="text-sm text-gray-300 group-hover:text-white font-medium">{label}</span>
    <ArrowRight className="ml-auto opacity-0 group-hover:opacity-100 text-gray-500 transform -translate-x-2 group-hover:translate-x-0 transition-all" size={14} />
  </button>
);
