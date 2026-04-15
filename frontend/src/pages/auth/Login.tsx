import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Loader2, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const loginWithCredentials = useAuthStore(state => state.loginWithCredentials);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginWithCredentials(identifier.trim(), password);
      
      // Navigate based on role
      const user = useAuthStore.getState().user;
      if (!user) return;

      switch (user.role) {
        case 'Admin':
          navigate('/admin');
          break;
        case 'Waiter':
        case 'Cashier':
          navigate('/pos/tables');
          break;
        case 'Chef':
          navigate('/kds');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-orange-50 to-stone-100">
      <div className="max-w-md w-full mx-4">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-600 text-white font-bold text-2xl shadow-lg shadow-orange-600/30 mb-4">
            R
          </div>
          <h2 className="text-3xl font-bold text-stone-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-stone-500">Sign in to Rasoi360 POS</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Email or Phone Number
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@rasoi360.com"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-stone-800 placeholder:text-stone-400 transition-all"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-stone-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-stone-800 placeholder:text-stone-400 transition-all"
                required
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  Signing in... <Loader2 size={18} className="animate-spin" />
                </>
              ) : (
                <>
                  Sign In <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          {/* Test accounts hint */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Test Accounts</p>
            <div className="space-y-1.5 text-xs text-stone-500">
              <div className="flex justify-between bg-stone-50 px-3 py-2 rounded-lg">
                <span className="font-medium">Admin</span>
                <span className="font-mono">admin@rasoi360.com / admin123</span>
              </div>
              <div className="flex justify-between bg-stone-50 px-3 py-2 rounded-lg">
                <span className="font-medium">Waiter</span>
                <span className="font-mono">waiter@rasoi360.com / waiter123</span>
              </div>
              <div className="flex justify-between bg-stone-50 px-3 py-2 rounded-lg">
                <span className="font-medium">Chef</span>
                <span className="font-mono">chef@rasoi360.com / chef123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
