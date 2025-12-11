
export type ViewState = 'home' | 'configure' | 'interview' | 'report' | 'history' | 'auth' | 'about';

export type InterviewPersonality = 'Friendly HR' | 'Strict Manager' | 'Google Hiring Manager' | 'Amazon Bar Raiser' | 'Startup Founder';
export type InterviewDifficulty = 'Beginner' | 'Intermediate' | 'Hard' | 'Extreme';

export interface InterviewSettings {
  type: 'quick' | 'full' | 'resume';
  questions: string[];
  resumeText?: string;
  category?: 'general' | 'behavioral' | 'technical';
  personality?: InterviewPersonality;
  difficulty?: InterviewDifficulty;
}

export interface VoiceCoachingData {
  pace_wpm: number;
  pace_feedback: string;
  clarity_feedback: string;
  filler_words: string[];
  filler_word_count: number;
  hesitation_level: "Low" | "Moderate" | "High";
  confidence_score: number;
  tone_analysis: string;
  energy_level: "Low" | "Neutral" | "High" | "Enthusiastic";
}

export interface FeedbackData {
  summary: string;
  voiceFeedback: string;
  contentFeedback: string;
  bodyLanguageFeedback: string;
  scores: {
    voice: number;
    content: number;
    bodyLanguage: number;
  };
  suggestions: string[];
  suggestedNextQuestion?: string;
  isFollowUp?: boolean;
  repeatRequested?: boolean;
  voiceCoaching?: VoiceCoachingData;
}

export interface QuestionResult {
  question: string;
  feedback: FeedbackData | null;
  videoUrl?: string; // Blob URL for playback
}

export interface FullReport {
  id: string;
  date: string;
  type: string;
  overallScore: number;
  results: QuestionResult[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ResumeAnalysisData {
  summary: string;
  strengths: string[];
  mistakes: string[];
  improvements: string[];
  scores: {
    content: number;
    formatting: number;
    clarity: number;
    atsOptimization: number;
  };
}

export interface SmartAnalysisData {
  hiringLikelihood: number; // 0-100
  scores: {
    communication: number;
    confidence: number;
    clarity: number;
    bodyLanguage: number;
    structure: number;
    hiringProbability: number;
  };
  strengths: string[];
  weaknesses: string[];
  starRewrite: {
    originalTopic: string;
    improvedAnswer: string;
  };
  trendAnalysis: string;
}

export const MOCK_QUESTIONS = {
  general: [
    "Tell me about yourself.",
    "Why do you want to work here?",
    "What are your greatest strengths?",
    "Where do you see yourself in 5 years?"
  ],
  behavioral: [
    "Tell me about a time you faced a conflict at work.",
    "Describe a situation where you showed leadership.",
    "Give me an example of a time you failed."
  ],
  technical: [
    "Explain a complex technical concept to a 5-year-old.",
    "How do you stay updated with the latest technology trends?",
    "Describe your process for debugging a difficult issue."
  ]
};
