
import React, { useState, useEffect } from 'react';
import { ViewState, InterviewSettings, FullReport, User, InterviewPersonality, InterviewDifficulty } from './types';
import { Home } from './pages/Home';
import { ConfigureSession } from './pages/ConfigureSession';
import { InterviewSession } from './pages/InterviewSession';
import { Report } from './pages/Report';
import { History } from './pages/History';
import { Auth } from './pages/Auth';
import { About } from './pages/About';
import { Footer } from './components/Footer';
import { getCurrentUser, logoutUser } from './services/authService';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, User as UserIcon, AudioWaveform } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [settings, setSettings] = useState<InterviewSettings | null>(null);
  const [currentReport, setCurrentReport] = useState<FullReport | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [configureTab, setConfigureTab] = useState<'quick' | 'full' | 'resume'>('quick');

  // Global preferences
  const [selectedPersonality, setSelectedPersonality] = useState<InterviewPersonality>('Friendly HR');
  const [selectedDifficulty, setSelectedDifficulty] = useState<InterviewDifficulty>('Intermediate');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) setCurrentUser(user);
  }, []);

  const startConfiguration = (tab: 'quick' | 'full' | 'resume' = 'quick') => {
    setConfigureTab(tab);
    setView('configure');
  };

  const startInterview = (newSettings: InterviewSettings) => {
    // Merge global preferences into settings
    setSettings({
      ...newSettings,
      personality: selectedPersonality,
      difficulty: selectedDifficulty
    });
    setView('interview');
  };

  const finishInterview = (report: FullReport) => {
    setCurrentReport(report);
    setView('report');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-navy-900 text-gray-100 selection:bg-neon-blue selection:text-white overflow-x-hidden flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-900/80 backdrop-blur-md border-b border-navy-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => setView('home')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-purple-600 flex items-center justify-center shadow-lg shadow-neon-blue/20 group-hover:shadow-neon-blue/40 transition-all">
                <AudioWaveform className="text-white" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-white leading-none">TalentEcho</span>
                <span className="text-[10px] text-neon-blue font-bold tracking-widest uppercase">AI Coach</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setView('home')} 
                className={`text-sm font-medium transition-colors ${view === 'home' ? 'text-neon-blue' : 'text-gray-400 hover:text-white'}`}
              >
                Home
              </button>
              <button 
                onClick={() => setView('history')} 
                className={`text-sm font-medium transition-colors ${view === 'history' ? 'text-neon-blue' : 'text-gray-400 hover:text-white'}`}
              >
                Past Reports
              </button>
              
              <div className="w-px h-5 bg-navy-700 hidden sm:block"></div>

              {currentUser ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center">
                       <UserIcon size={14} className="text-neon-green" />
                    </div>
                    <span>{currentUser.name.split(' ')[0]}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-medium"
                  >
                    <LogOut size={14} /> <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setView('auth')}
                  className="px-4 py-2 rounded-xl bg-neon-blue text-white text-sm font-bold shadow-lg shadow-neon-blue/20 hover:bg-blue-600 hover:shadow-neon-blue/40 transition-all"
                >
                  Sign Up / Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 flex-grow">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Home 
                onStart={startConfiguration} 
                onHistory={() => setView('history')} 
                selectedPersonality={selectedPersonality}
                onSelectPersonality={setSelectedPersonality}
                selectedDifficulty={selectedDifficulty}
                onSelectDifficulty={setSelectedDifficulty}
              />
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <Auth 
                onSuccess={(user) => {
                  setCurrentUser(user);
                  setView('home');
                }} 
                onCancel={() => setView('home')} 
              />
            </motion.div>
          )}

          {view === 'configure' && (
            <motion.div 
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ConfigureSession 
                initialTab={configureTab}
                onStart={startInterview} 
                onBack={() => setView('home')} 
              />
            </motion.div>
          )}

          {view === 'interview' && settings && (
            <motion.div 
              key="interview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4 }}
              className="h-[calc(100vh-80px)]"
            >
              <InterviewSession 
                settings={settings} 
                userId={currentUser?.id}
                onFinish={finishInterview} 
                onAbort={() => setView('home')} 
              />
            </motion.div>
          )}

          {view === 'report' && currentReport && (
            <motion.div 
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Report report={currentReport} onHome={() => setView('home')} />
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <History 
                userId={currentUser?.id}
                onViewReport={(report) => {
                  setCurrentReport(report);
                  setView('report');
                }} 
                onBack={() => setView('home')}
              />
            </motion.div>
          )}

          {view === 'about' && (
             <motion.div 
               key="about"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.3 }}
             >
               <About onBack={() => setView('home')} />
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer onNavigate={setView} />
    </div>
  );
};

export default App;
