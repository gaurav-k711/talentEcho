import React from 'react';
import { getReports } from '../services/storageService';
import { FullReport } from '../types';
import { Button } from '../components/Button';
import { Calendar, ChevronRight, BarChart, ArrowLeft } from 'lucide-react';

interface HistoryProps {
  userId?: string;
  onViewReport: (report: FullReport) => void;
  onBack: () => void;
}

export const History: React.FC<HistoryProps> = ({ userId, onViewReport, onBack }) => {
  const reports = getReports(userId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-navy-800 hover:bg-navy-700 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-bold text-white">Past Sessions</h2>
      </div>
      
      {reports.length === 0 ? (
        <div className="text-center py-20 bg-navy-800 rounded-2xl border border-navy-700 border-dashed">
          <p className="text-gray-400 text-lg mb-4">No reports found.</p>
          <p className="text-sm text-gray-500">
            {userId ? "You haven't completed any sessions yet." : "Log in to save your reports permanently, or complete a session as a guest."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div 
              key={report.id} 
              className="bg-navy-800 hover:bg-navy-750 transition-colors p-6 rounded-2xl border border-navy-700 flex items-center justify-between group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold ${
                  report.overallScore >= 8 ? 'bg-neon-green/10 text-neon-green' : 
                  report.overallScore >= 5 ? 'bg-yellow-500/10 text-yellow-500' : 
                  'bg-red-500/10 text-red-500'
                }`}>
                  {report.overallScore}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white capitalize mb-1">
                    {report.type === 'resume' ? 'Resume Interview' : `${report.type} Interview`}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(report.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart size={14} />
                      {report.results.length} Questions
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={() => onViewReport(report)} variant="secondary" size="sm">
                View Details <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};