import React, { useState } from 'react';
import { Button } from '../components/Button';
import { User } from '../types';
import { loginUser, registerUser } from '../services/authService';
import { UserCircle, Mail, Lock, ArrowRight } from 'lucide-react';

interface AuthProps {
  onSuccess: (user: User) => void;
  onCancel: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await loginUser(formData.email, formData.password);
      } else {
        if (!formData.name) throw new Error("Name is required");
        user = await registerUser(formData.name, formData.email, formData.password);
      }
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-4">
      <div className="bg-navy-800 p-8 rounded-2xl border border-navy-700 shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-neon-green/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="relative z-10 text-center mb-8">
           <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-navy-700 shadow-lg">
             <UserCircle size={32} className="text-neon-blue" />
           </div>
           <h2 className="text-3xl font-bold text-white mb-2">
             {isLogin ? 'Welcome Back' : 'Create Account'}
           </h2>
           <p className="text-gray-400">
             {isLogin ? 'Log in to access your saved reports' : 'Sign up to save your interview progress'}
           </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircle size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-navy-900 border border-navy-600 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-navy-900 border border-navy-600 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-navy-900 border border-navy-600 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full mt-2" isLoading={isLoading}>
            {isLogin ? 'Log In' : 'Create Account'} <ArrowRight size={18} className="ml-2" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ name: '', email: '', password: '' });
              }}
              className="text-neon-blue font-semibold hover:text-blue-400 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
        
        <div className="mt-4 text-center">
           <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-300">
             Cancel and go back
           </button>
        </div>
      </div>
    </div>
  );
};