import * as React from 'react';
import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Lock, User, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (email: string, password: string, name?: string, isRegister?: boolean) => Promise<void>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (authMode === 'login') {
          if (!email || !password) {
              throw new Error("Email and password are required");
          }
          await onLogin(email, password);
      } 
      else if (authMode === 'register') {
          if (!email || !password || !name) {
              throw new Error("All fields are required");
          }
          // Simulate check for existing user before verify step if possible, 
          // but for now just move to verify as per flow
          setAuthMode('verify');
          setIsLoading(false); // Stop loading to let user input code
          return;
      }
      else if (authMode === 'verify') {
          if (verificationCode !== '123456') {
              throw new Error("Invalid verification code. Try '123456'");
          }
          // Proceed with registration
          await onLogin(email, password, name, true);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-nexus-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-nexus-500/5 border border-white">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-nexus-600 to-nexus-400 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-nexus-500/30 transform rotate-3">
            N
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {authMode === 'register' ? "Create Account" : authMode === 'verify' ? "Verify Email" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {authMode === 'register' 
                ? "Join the community today" 
                : authMode === 'verify' 
                ? "We sent a code to " + email 
                : "Sign in to your Nexus dashboard"}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* Registration Fields */}
          {authMode === 'register' && (
            <div className="space-y-1 animate-in slide-in-from-top-2 fade-in">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  className="block w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:border-nexus-500 focus:ring-nexus-500/20 focus:bg-white transition-all outline-none border"
                  placeholder="e.g. AlexRivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Login/Register Fields */}
          {(authMode === 'login' || authMode === 'register') && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                    type="email"
                    required
                    className="block w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:border-nexus-500 focus:ring-nexus-500/20 focus:bg-white transition-all outline-none border"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                    type="password"
                    required
                    className="block w-full rounded-xl border-slate-200 bg-slate-50 pl-10 pr-3 py-3 text-slate-900 placeholder-slate-400 focus:border-nexus-500 focus:ring-nexus-500/20 focus:bg-white transition-all outline-none border"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
              </div>
            </>
          )}

          {/* Verification Field */}
          {authMode === 'verify' && (
             <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                <div className="flex justify-center my-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <Mail size={32} />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Verification Code</label>
                    <input
                    type="text"
                    required
                    autoFocus
                    className="block w-full text-center tracking-[0.5em] text-2xl font-bold rounded-xl border-slate-200 bg-white py-4 text-slate-900 placeholder-slate-300 focus:border-nexus-500 focus:ring-nexus-500/20 transition-all outline-none border"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <p className="text-center text-xs text-slate-400 mt-2">Use code <b>123456</b> for demo</p>
                </div>
             </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-nexus-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-nexus-700 hover:shadow-lg hover:shadow-nexus-600/20 focus:outline-none focus:ring-2 focus:ring-nexus-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {authMode === 'login' && "Sign In"}
                    {authMode === 'register' && "Create Account"}
                    {authMode === 'verify' && "Verify & Login"}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
            {/* Demo Hint */}
            {authMode === 'login' && (
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Demo Access:</span> demo@nexus.com / password
              </div>
            )}

            {authMode === 'verify' ? (
                <button 
                    onClick={() => setAuthMode('register')}
                    className="text-sm font-medium text-slate-500 hover:text-nexus-600 transition-colors"
                >
                    Change Email
                </button>
            ) : (
                <p className="text-sm text-slate-500">
                    {authMode === 'register' ? "Already have an account? " : "Don't have an account? "}
                    <button 
                    onClick={() => {
                        setAuthMode(authMode === 'login' ? 'register' : 'login');
                        setError('');
                    }}
                    className="font-bold text-nexus-600 hover:text-nexus-500 focus:outline-none hover:underline"
                    >
                    {authMode === 'register' ? "Log in" : "Sign up"}
                    </button>
                </p>
            )}
        </div>
      </div>
    </div>
  );
};