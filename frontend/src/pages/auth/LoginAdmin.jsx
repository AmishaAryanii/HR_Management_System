import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminIllustration } from '../../components/auth/LoginSVGs';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Mail, Lock, ArrowLeft, ShieldCheck,
} from 'lucide-react';

export default function LoginAdmin() {
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
      await login(email, password, 'admin');
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
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* ── LEFT: Vector Illustration (clean, light) ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col bg-white">
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 lg:p-14">
          {/* Top branding */}
            <div className="relative z-10 flex items-center -bottom-200 gap-2.5 px-10 pt-8">
          <img
            src="/logo.svg"
            alt="Debox"
            className="w-30 h-30 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
          <div className="text-black text-[10px] uppercase tracking-widest font-medium">Admin Portal</div>
        </div>

          {/* Center - Illustration */}
          <div className="flex-1 flex flex-col items-center justify-center -mx-4">
        

                <img
            src="/admin.png"
            alt="Manager"
            className="w-full max-w-sm max-h-80 xl:max-h-96 object-contain drop-shadow-xl"
            onError={(e) => {
              e.currentTarget.src = '/login.png';
              e.currentTarget.onerror = null;
            }}
          />

            <div className="text-center mt-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.15s both' }}>
          
              <p className="text-secondary-400 text-sm max-w-xs mx-auto leading-relaxed">
                Monitor, configure, and control your entire organization from one central hub.
              </p>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-2 text-secondary-300 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Secure connection &bull; Encrypted
          </div>
        </div>
      </div>

      {/* ── RIGHT: Login Form ── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 bg-gray-50 relative">
        <Link
          to="/login"
          className="absolute top-6 sm:top-8 left-6 sm:left-8 flex items-center gap-1.5 text-sm text-secondary-400 hover:text-secondary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Accent bar */}
          <div className="w-14 h-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mb-8" />

          {/* Logo + name */}
          <div className="flex items-center gap-3 mb-6">
              <img
              src="/logo.svg"
              alt="Debox Technology"
              className="w-28 h-14 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
        
          </div>

          <h2 className="text-2xl font-bold text-secondary-900 font-display mb-1">Admin Access</h2>
          <p className="text-secondary-400 text-sm mb-8">Authorized personnel only</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full pl-10 pr-3.5 py-3 bg-white border border-gray-200 rounded-xl text-sm text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all shadow-sm"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-secondary-700">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm text-secondary-900 placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign in to Admin'
              )}
            </button>
          </form>

          <div className="mt-8 pt-5 border-t border-gray-100 text-center">
            <p className="text-[11px] text-secondary-400">
              Wrong role?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Choose a different portal
              </Link>
            </p>
          </div>

          <p className="text-center text-[11px] text-secondary-400 mt-5">
            &copy; {new Date().getFullYear()} 'Debox Technology'
          </p>
        </div>
      </div>
    </div>
  );
}
