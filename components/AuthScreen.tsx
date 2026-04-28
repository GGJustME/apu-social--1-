import * as React from 'react';
import { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  onGoogleLogin: () => Promise<void>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onGoogleLogin }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-nexus-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-nexus-500/5 border border-white">
        
        {/* Header Logo */}
        <div className="text-center mb-10">
          <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-nexus-600 to-nexus-400 rounded-2xl flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-lg shadow-nexus-500/30 transform rotate-3">
            N
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Nexus Social
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Sign in to your Nexus dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center animate-in fade-in slide-in-from-top-1">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative flex w-full justify-center items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-nexus-600/30 border-t-nexus-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            Powered by Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
};
