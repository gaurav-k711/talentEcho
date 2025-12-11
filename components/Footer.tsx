
import React from 'react';
import { Linkedin, Github, Mail, Heart, AudioWaveform } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-navy-700 bg-navy-900/90 backdrop-blur-lg mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-purple-600 flex items-center justify-center">
                <AudioWaveform className="text-white" size={16} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">TalentEcho</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Empowering You to Ace Every Interview. 
              Real-time analysis, expert feedback, and comprehensive preparation tools.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-neon-blue transition-colors text-left">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('configure')} className="hover:text-neon-blue transition-colors text-left">
                  Start Interview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('history')} className="hover:text-neon-blue transition-colors text-left">
                  Past Reports
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-neon-blue transition-colors text-left">
                  About Us
                </button>
              </li>
              <li>
                <span className="opacity-70 cursor-not-allowed">Contact</span>
              </li>
            </ul>
          </div>

          {/* Social & Signature */}
          <div>
            <h4 className="text-white font-bold mb-4">Connect With Us</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="p-2.5 bg-navy-800 rounded-lg hover:bg-neon-blue/20 hover:text-neon-blue text-gray-400 transition-all border border-navy-700 hover:border-neon-blue/50">
                <Linkedin size={20} />
              </a>
              <a href="#" className="p-2.5 bg-navy-800 rounded-lg hover:bg-neon-blue/20 hover:text-neon-blue text-gray-400 transition-all border border-navy-700 hover:border-neon-blue/50">
                <Github size={20} />
              </a>
              <a href="#" className="p-2.5 bg-navy-800 rounded-lg hover:bg-neon-blue/20 hover:text-neon-blue text-gray-400 transition-all border border-navy-700 hover:border-neon-blue/50">
                <Mail size={20} />
              </a>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-navy-800 border border-navy-700 text-xs text-gray-400">
               <span>Made with</span>
               <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" />
               <span>by <span className="text-neon-blue font-semibold">Finx</span></span>
            </div>
          </div>
        </div>

        <div className="border-t border-navy-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>&copy; 2025 TalentEcho. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
