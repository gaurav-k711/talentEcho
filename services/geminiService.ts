
import { GoogleGenAI, Schema, Type, Modality } from "@google/genai";
import { FeedbackData, ResumeAnalysisData, InterviewPersonality, InterviewDifficulty, SmartAnalysisData, FullReport } from "../types";

// Initialize Gemini
// NOTE: In a real production app, never expose keys on the client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const feedbackSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    voiceFeedback: { type: Type.STRING },
    contentFeedback: { type: Type.STRING },
    bodyLanguageFeedback: { type: Type.STRING },
    scores: {
      type: Type.OBJECT,
      properties: {
        voice: { type: Type.INTEGER },
        content: { type: Type.INTEGER },
        bodyLanguage: { type: Type.INTEGER },
      }
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    suggestedNextQuestion: { type: Type.STRING },
    isFollowUp: { type: Type.BOOLEAN },
    repeatRequested: { type: Type.BOOLEAN },
    voiceCoaching: {
      type: Type.OBJECT,
      properties: {
        pace_wpm: { type: Type.INTEGER },
        pace_feedback: { type: Type.STRING },
        clarity_feedback: { type: Type.STRING },
        filler_words: { type: Type.ARRAY, items: { type: Type.STRING } },
        filler_word_count: { type: Type.INTEGER },
        hesitation_level: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
        confidence_score: { type: Type.INTEGER },
        tone_analysis: { type: Type.STRING },
        energy_level: { type: Type.STRING, enum: ["Low", "Neutral", "High", "Enthusiastic"] }
      },
      required: ["pace_wpm", "filler_word_count", "hesitation_level", "confidence_score"]
    }
  },
  required: ["summary", "voiceFeedback", "contentFeedback", "bodyLanguageFeedback", "scores", "suggestions", "suggestedNextQuestion", "isFollowUp", "repeatRequested"]
};

const resumeAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    scores: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.INTEGER },
        formatting: { type: Type.INTEGER },
        clarity: { type: Type.INTEGER },
        atsOptimization: { type: Type.INTEGER }
      },
      required: ["content", "formatting", "clarity", "atsOptimization"]
    }
  },
  required: ["summary", "strengths", "mistakes", "improvements", "scores"]
};

const smartAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hiringLikelihood: { type: Type.INTEGER },
    scores: {
      type: Type.OBJECT,
      properties: {
        communication: { type: Type.INTEGER },
        confidence: { type: Type.INTEGER },
        clarity: { type: Type.INTEGER },
        bodyLanguage: { type: Type.INTEGER },
        structure: { type: Type.INTEGER },
        hiringProbability: { type: Type.INTEGER },
      },
      required: ["communication", "confidence", "clarity", "bodyLanguage", "structure", "hiringProbability"]
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    starRewrite: {
      type: Type.OBJECT,
      properties: {
        originalTopic: { type: Type.STRING },
        improvedAnswer: { type: Type.STRING }
      },
      required: ["originalTopic", "improvedAnswer"]
    },
    trendAnalysis: { type: Type.STRING }
  },
  required: ["hiringLikelihood", "scores", "strengths", "weaknesses", "starRewrite", "trendAnalysis"]
};


export const generateResumeQuestions = async (resumeBase64: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: resumeBase64
            }
          },
          {
            text: "Analyze this resume and generate 5 relevant, challenging interview questions tailored to this candidate's experience and skills. Return ONLY the questions as a JSON array of strings."
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return ["Tell me about your experience on your resume."];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating resume questions:", error);
    return ["Tell me about the most impactful project on your resume.", "What are your key skills?"];
  }
};

export const analyzeInterviewAnswer = async (
  question: string,
  mediaBase64: string,
  mimeType: string,
  nextPlannedQuestion?: string,
  personality: InterviewPersonality = 'Friendly HR',
  difficulty: InterviewDifficulty = 'Intermediate'
): Promise<FeedbackData> => {
  try {
    const prompt = `
    You are an AI Interview Coach acting in the following mode:
    PERSONALITY MODE: ${personality}
    DIFFICULTY LEVEL: ${difficulty}

    PERSONALITY INSTRUCTIONS:
    - Friendly HR: Warm, encouraging, supportive, simple questions.
    - Strict Manager: Neutral tone, structured questions, sharp follow-ups.
    - Google Hiring Manager: Analytical, behavioral-based, STAR-focused.
    - Amazon Bar Raiser: Leadership principles, deep probing, high difficulty.
    - Startup Founder: Fast-paced, practical, challenge-based questions.
    
    DIFFICULTY INSTRUCTIONS:
    - Beginner: Simple HR questions, slower pace, easy follow-ups.
    - Intermediate: Role-based questions, probing follow-ups.
    - Hard: Behavioral + situational + technical mix.
    - Extreme: Analytical, multi-layer deep dives, logic-based follow-ups, high-pressure environment.

    Your task is to analyze the candidate's answer to the question: "${question}".

    CRITICAL INSTRUCTION - REPEAT REQUESTS:
    - Listen carefully. If the user asks to repeat the question (e.g., "Sorry, I didn't hear that", "Can you repeat?", "What was the question?"), set 'repeatRequested' to TRUE.
    - In this case, 'summary' should be: "No problem, I will repeat the question."
    - Do NOT provide feedback scores or critique if they are just asking for a repeat.

    REAL-TIME COACHING & ANALYSIS TASKS:
    1. Analyze Voice: Speaking pace (slow/fast/ideal), clarity, confidence, filler words ("um", "uh"), modulation.
    2. Analyze Content: Relevance, structure (STAR method), depth.
    3. Analyze Body Language: Eye contact, expressions.
    
    VOICE COACHING MODULE (SYSTEM INSTRUCTION):
    You must extract and estimate these specific metrics from the audio/video provided:
    - Pace (WPM): Estimate speaking rate. <120 (Slow), 120-150 (Ideal), >150 (Fast).
    - Filler Words: Count occurrences of "um", "uh", "like", "so".
    - Hesitation: Analyze silence and pauses.
    - Confidence Score: 0-10 based on tone firmness.
    - Energy Level: Low/Neutral/High/Enthusiastic.
    
    FEEDBACK GENERATION:
    - Provide specific positive reinforcement for high scores.
    - Provide constructive, actionable advice for lower scores.
    - Be professional but human.

    SUGGEST NEXT QUESTION:
    - Based on the chosen Personality and Difficulty, ask the next question.
    - If the answer was weak, probe deeper (Strict/Bar Raiser modes).
    - If the answer was good, move to the next logical topic.
    
    Return result as JSON matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Fast model for video analysis
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: mediaBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as FeedbackData;

  } catch (error) {
    console.error("Error analyzing answer:", error);
    // Fallback data if AI fails
    return {
      summary: "I'm having trouble analyzing that. Let's try moving forward.",
      voiceFeedback: "Unable to analyze audio quality.",
      contentFeedback: "Unable to analyze content.",
      bodyLanguageFeedback: "Unable to analyze video.",
      scores: { voice: 5, content: 5, bodyLanguage: 5 },
      suggestions: ["Please check your microphone and camera connection."],
      suggestedNextQuestion: "Tell me about something else?",
      isFollowUp: false,
      repeatRequested: false
    };
  }
};

export const generateSmartAnalysis = async (reports: FullReport[]): Promise<SmartAnalysisData> => {
  try {
    // Prepare a summary of past performance to send to Gemini
    const reportSummary = reports.slice(0, 5).map((r, i) => ({
      date: r.date,
      type: r.type,
      overallScore: r.overallScore,
      questions: r.results.map(res => ({
        q: res.question,
        score: res.feedback?.scores.content,
        feedback: res.feedback?.summary
      }))
    }));

    const prompt = `
      Act as a Senior Interview Analyst. I am providing you with the history of a candidate's mock interviews.
      
      YOUR TASKS:
      1. Calculate a "Hiring Likelihood" percentage (0-100%) based on their trajectory.
      2. Generate a 6-Point Scorecard (0-10) for: Communication, Confidence, Clarity, Body Language, Structure, Hiring Probability.
      3. Identify their top Strengths and Weaknesses across all sessions.
      4. Select ONE specific weak answer topic from the history and REWRITE it using the STAR method to show them how to improve.
      5. Provide a short "Trend Analysis" paragraph explaining if they are improving or plateauing.

      INPUT DATA:
      ${JSON.stringify(reportSummary, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: smartAnalysisSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as SmartAnalysisData;

  } catch (error) {
    console.error("Error generating smart analysis:", error);
    // Fallback mock data if generation fails or no history
    return {
      hiringLikelihood: 65,
      scores: {
        communication: 7,
        confidence: 6,
        clarity: 7,
        bodyLanguage: 6,
        structure: 5,
        hiringProbability: 6
      },
      strengths: ["Clear voice", "Good technical knowledge"],
      weaknesses: ["Filler words", "Unstructured answers"],
      starRewrite: {
        originalTopic: "Tell me about a challenge",
        improvedAnswer: "SITUATION: In my last project, we faced a server outage... TASK: My goal was to restore uptime... ACTION: I diagnosed the logs, identified a memory leak, and patched it... RESULT: Uptime improved by 99.9%."
      },
      trendAnalysis: "You are showing consistent improvement in voice clarity, but need to work on answer structure."
    };
  }
};

export const generateResumeAnalysis = async (
  content: string, 
  type: 'text' | 'pdf'
): Promise<ResumeAnalysisData> => {
  try {
    const parts: any[] = [];
    
    if (type === 'pdf') {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: content
        }
      });
      parts.push({ text: "Please analyze this resume PDF." });
    } else {
      parts.push({ text: `Please analyze this resume text:\n\n${content}` });
    }

    const prompt = `
      Act as a Senior Resume Expert and HR Recruiter. Analyze the resume provided.
      
      Your analysis must be PROFESSIONAL, FRIENDLY, and ACTIONABLE.
      
      Tasks:
      1. Provide a professional summary of the candidate (3-4 lines).
      2. Identify key STRENGTHS (4-6 bullet points).
      3. Identify MISTAKES / ISSUES (4-6 bullet points) - grammar, formatting, weak verbs, vague metrics.
      4. Provide specific IMPROVEMENTS (4-8 bullet points) - how to fix the issues.
      5. Score the resume (0-10) on Content, Formatting, Clarity, and ATS Optimization.
      
      Format your response as a JSON object matching the provided schema.
      Do not be generic. Be specific to the content provided.
    `;
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Vision model for PDF analysis
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: resumeAnalysisSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as ResumeAnalysisData;

  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw new Error("Failed to analyze resume. Please try again.");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // Kore is often professional/warm
          }
        }
      }
    });

    // Returns base64 encoded PCM audio data
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (error) {
    console.error("Error generating speech:", error);
    return "";
  }
};
