import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  User,
  Wrench,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'worker') {
        navigate('/worker');
      } else {
        navigate('/citizen');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    // Instant submission
    setError('');
    setLoading(true);
    login(demoEmail, demoPassword)
      .then((user) => {
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'worker') navigate('/worker');
        else navigate('/citizen');
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Quick login failed.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Activity className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign In to CivicPulse
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-500">
          Access your role-based civic portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@civicpulse.org"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                1-Click Hackathon Demo Logins:
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('citizen@civicpulse.org', 'citizen123')}
                className="flex items-center p-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-left transition group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mr-2 text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-[11px] font-bold text-slate-800 truncate">
                    Citizen A
                  </span>
                  <span className="block text-[10px] text-slate-500">Priya Sharma</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('citizen2@civicpulse.org', 'citizen123')}
                className="flex items-center p-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-left transition group"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mr-2 text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-[11px] font-bold text-slate-800 truncate">
                    Citizen B
                  </span>
                  <span className="block text-[10px] text-slate-500">Vikram Patel</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@civicpulse.org', 'admin123')}
                className="flex items-center p-2 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-left transition group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mr-2 text-xs">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-[11px] font-bold text-slate-800 truncate">
                    Municipal Admin
                  </span>
                  <span className="block text-[10px] text-slate-500">Comm. Verma</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('worker@civicpulse.org', 'worker123')}
                className="flex items-center p-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-left transition group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mr-2 text-xs">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <span className="block text-[11px] font-bold text-slate-800 truncate">
                    Field Worker
                  </span>
                  <span className="block text-[10px] text-slate-500">Suresh Kumar</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

