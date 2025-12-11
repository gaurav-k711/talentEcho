
import React, { useState } from 'react';
import { FullReport } from '../types';
import { Button } from '../components/Button';
import { CheckCircle, BarChart2, Download, Home as HomeIcon, Loader2 } from 'lucide-react';

interface ReportProps {
  report: FullReport;
  onHome: () => void;
}

export const Report: React.FC<ReportProps> = ({ report, onHome }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const element = document.getElementById('report-content');
    
    if (!element) {
      setIsDownloading(false);
      return;
    }

    const opt = {
      margin: 0.5,
      filename: `TalentEcho_Report_${new Date(report.date).toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#0B1623' // Force dark background
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      // @ts-ignore
      if (window.html2pdf) {
        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();
      } else {
        alert("PDF generator is loading. Please try again in a moment or use Print (Ctrl+P).");
        window.print();
      }
    } catch (err) {
      console.error("PDF Download failed:", err);
      alert("Could not generate PDF. Opening print dialog instead.");
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Action Bar (Not visible in PDF) */}
      <div className="flex justify-between items-center mb-8 sticky top-20 z-10 bg-navy-900/80 backdrop-blur-md p-4 rounded-xl border border-navy-700">
        <div>
           <h2 className="text-xl font-bold text-white">Session Complete</h2>
           <p className="text-gray-400 text-sm">Review your performance below</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleDownloadPDF} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Download size={18} className="mr-2" />}
            {isDownloading ? 'Generating...' : 'Save PDF Report'}
          </Button>
          <Button onClick={onHome}>
            <HomeIcon size={18} className="mr-2" /> Back to Home
          </Button>
        </div>
      </div>

      {/* Printable Report Content */}
      <div id="report-content" className="bg-navy-900 text-white p-2">
        
        {/* Report Header */}
        <div className="mb-10 pb-6 border-b border-navy-700">
          <h1 className="text-4xl font-bold text-white mb-2">Interview Analysis Report</h1>
          <p className="text-gray-400">
            Generated on {new Date(report.date).toLocaleDateString()} at {new Date(report.date).toLocaleTimeString()}
          </p>
          <div className="inline-block mt-4 px-3 py-1 rounded-full bg-navy-800 border border-navy-600 text-sm text-neon-blue font-bold uppercase tracking-wider">
            {report.type === 'resume' ? 'Resume-Based Interview' : `${report.type} Interview`}
          </div>
        </div>

        {/* Overall Score Card */}
        <div className="bg-gradient-to-r from-navy-800 to-navy-900 p-8 rounded-3xl border border-navy-700 mb-10 relative overflow-hidden print:border-gray-500">
           {/* Decorative background for screen only, might look odd in PDF so we keep it simple or remove blur effects for print if needed */}
           <div className="absolute top-0 right-0 p-32 bg-neon-blue/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Performance Summary</h2>
                <p className="text-gray-300 max-w-xl text-lg leading-relaxed">
                  You completed <span className="text-white font-bold">{report.results.length} questions</span>. 
                  {report.overallScore >= 8 ? " Excellent work! You demonstrated strong confidence and clarity." : 
                   report.overallScore >= 5 ? " Good effort. Focus on reducing filler words and structuring your answers better." :
                   " Needs improvement. Practice speaking more confidently and maintaining eye contact."}
                </p>
              </div>
              <div className="flex flex-col items-center">
                 <div className="relative w-32 h-32 flex items-center justify-center">
                   {/* Simplified Circle for PDF consistency */}
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="64" cy="64" r="56" stroke="#1A273C" strokeWidth="12" fill="none" />
                     <circle 
                       cx="64" cy="64" r="56" stroke="#2F7BFF" strokeWidth="12" fill="none" 
                       strokeDasharray={351} 
                       strokeDashoffset={351 - (351 * report.overallScore) / 10} 
                     />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                     <span className="text-4xl font-bold text-white">{report.overallScore}</span>
                     <span className="text-xs text-gray-400 uppercase">Overall</span>
                   </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Question Breakdown */}
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-neon-blue pl-4">
          Detailed Analysis
        </h3>
        
        <div className="space-y-8">
          {report.results.map((res, index) => (
            <div key={index} className="bg-navy-800 rounded-2xl p-6 border border-navy-700 shadow-sm print:bg-navy-900 print:border-gray-600">
               <div className="flex justify-between items-start mb-6">
                  <h4 className="text-xl font-bold text-white">
                    <span className="text-neon-blue mr-2">Q{index + 1}.</span> 
                    {res.question}
                  </h4>
               </div>
               
               {res.feedback ? (
                 <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-5">
                      <ReportFeedbackRow label="Voice Delivery" text={res.feedback.voiceFeedback} score={res.feedback.scores.voice} />
                      <ReportFeedbackRow label="Content Quality" text={res.feedback.contentFeedback} score={res.feedback.scores.content} />
                      <ReportFeedbackRow label="Body Language" text={res.feedback.bodyLanguageFeedback} score={res.feedback.scores.bodyLanguage} />
                   </div>
                   
                   <div className="bg-navy-900/50 p-5 rounded-xl border border-navy-800">
                     <h5 className="text-sm font-bold text-neon-green uppercase mb-3 flex items-center gap-2">
                       <CheckCircle size={16} /> Coach's Suggestions
                     </h5>
                     <ul className="space-y-3">
                       {res.feedback.suggestions.map((s, i) => (
                         <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                           <span className="text-neon-blue mt-1.5 text-[10px]">●</span> 
                           <span className="leading-relaxed">{s}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               ) : (
                 <p className="text-gray-500 italic">No feedback generated for this question.</p>
               )}
            </div>
          ))}
        </div>

        {/* Footer for PDF */}
        <div className="mt-12 pt-6 border-t border-navy-800 text-center text-gray-500 text-sm">
           <p>TalentEcho • Powered by Gemini Pro Vision</p>
        </div>
      </div>
    </div>
  );
};

const ReportFeedbackRow = ({ label, text, score }: { label: string, text: string, score: number }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${score >= 7 ? 'bg-green-500/20 text-green-400' : score >= 5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
        {score}/10
      </span>
    </div>
    <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-navy-700 pl-3">{text}</p>
  </div>
);
