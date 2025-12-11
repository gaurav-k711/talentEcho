
import React from 'react';
import { Button } from '../components/Button';
import { ArrowLeft, BrainCircuit, Users, ShieldCheck, Sparkles, Heart } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-full bg-navy-800 hover:bg-navy-700 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-bold text-white">About Us</h2>
      </div>

      <div className="space-y-12">
        {/* Mission Section */}
        <div className="bg-navy-800/50 border border-navy-700 rounded-2xl p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-32 bg-neon-blue/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
           <div className="relative z-10">
             <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-neon-blue/20">
                <BrainCircuit size={32} className="text-white" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
             <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
               To democratize career preparation by providing accessible, world-class interview coaching to everyone, everywhere. We believe confidence comes from preparation, and technology can bridge the gap between talent and opportunity.
             </p>
           </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
           <div className="bg-navy-800 p-6 rounded-xl border border-navy-700">
              <Sparkles className="text-neon-green mb-4" size={32} />
              <h4 className="font-bold text-white text-lg mb-2">AI-Powered Analysis</h4>
              <p className="text-gray-400 text-sm">
                Leveraging Google's Gemini Pro Vision to analyze not just what you say, but how you say it—your voice, expression, and confidence.
              </p>
           </div>
           <div className="bg-navy-800 p-6 rounded-xl border border-navy-700">
              <Users className="text-purple-400 mb-4" size={32} />
              <h4 className="font-bold text-white text-lg mb-2">Personalized Coaching</h4>
              <p className="text-gray-400 text-sm">
                From "Friendly HR" to "Strict Manager", our dynamic personas simulate real-world scenarios to prepare you for any interviewer.
              </p>
           </div>
           <div className="bg-navy-800 p-6 rounded-xl border border-navy-700">
              <ShieldCheck className="text-blue-400 mb-4" size={32} />
              <h4 className="font-bold text-white text-lg mb-2">Private & Secure</h4>
              <p className="text-gray-400 text-sm">
                Your practice sessions are private. We prioritize data security so you can practice without fear of judgment.
              </p>
           </div>
        </div>

        {/* Team Section */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 border border-navy-700 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
           <div>
              <h3 className="text-xl font-bold text-white mb-2">Who We Are</h3>
              <p className="text-gray-300 mb-4">
                We are a passionate team of developers and career enthusiasts dedicated to building tools that empower job seekers.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                 <span>Made with</span>
                 <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
                 <span>by <span className="text-neon-blue font-bold">Finx</span></span>
              </div>
           </div>
           <Button onClick={onBack} size="lg">Start Interview Now</Button>
        </div>
      </div>
    </div>
  );
};
