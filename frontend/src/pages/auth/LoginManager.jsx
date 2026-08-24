import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Mail, Lock, ArrowLeft, Users,
} from 'lucide-react';

export default function LoginManager() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, 'manager');
      toast.success('Login successful');
      navigate(from, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen overflow-hidden bg-slate-50">

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex lg:w-[55%] h-screen flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)' }}
      >
        {/* Blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />

        {/* Top-left branding */}
        <div className="relative z-10 flex items-center gap-2.5 px-10 pt-8">
          <img
            src="/logo.svg"
            alt="Debox"
            className="w-30 h-30 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
          <div className="text-black text-[10px] uppercase tracking-widest font-medium">Manager Portal</div>
        </div>

        {/* Center — image + text, fills remaining space */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 py-8 text-center gap-6">

          {/* Illustration */}
          <img
            src="/manager.png"
            alt="Manager"
            className="w-full max-w-sm max-h-80 xl:max-h-96 object-contain drop-shadow-xl"
            onError={(e) => {
              e.currentTarget.src = '/login.png';
              e.currentTarget.onerror = null;
            }}
          />

          {/* Text */}
          <div>
            <h2 className="text-2xl xl:text-3xl font-bold text-slate-800 leading-snug mb-2">
              Lead with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700">
                Confidence
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-[260px] mx-auto leading-relaxed">
              Empower your team, track performance, and drive results with real-time insights.
            </p>
          </div>
        </div>

        {/* Bottom label */}
        <div className="relative z-10 flex items-center gap-2 px-10 pb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          <span className="text-[11px] text-slate-400">Leadership dashboard &bull; Real-time analytics</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[45%] h-screen overflow-y-auto flex items-center justify-center relative px-5 sm:px-10 py-10 bg-slate-50">

        {/* Corner decorations */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-sky-50 to-transparent rounded-tr-full pointer-events-none" />

        {/* Back button */}
        <Link
          to="/login"
          className="absolute top-7 left-6 sm:left-8 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="w-full max-w-sm relative z-10">

          {/* Accent bar */}
          <div className="w-14 h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 mb-8" />

          {/* Logo only — no company name */}
          <div className="mb-6">
            <img
              src="/logo.svg"
              alt="Debox Technology"
              className="w-28 h-14 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center hidden">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Manager Portal</h2>
          <p className="text-sm text-slate-400 mb-8">Sign in to manage your team</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@company.com"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-600">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  Signing in...
                </span>
              ) : 'Sign in as Manager'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Wrong role?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-700 font-medium transition-colors">
                Choose a different portal
              </Link>
            </p>
          </div>

          <p className="text-center text-[11px] text-slate-300 mt-5">
            &copy; {new Date().getFullYear()} Debox Technology. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}