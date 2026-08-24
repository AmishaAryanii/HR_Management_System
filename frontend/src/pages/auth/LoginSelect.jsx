import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const roles = [
  {
    id: 'admin',
    title: 'Administrator',
    tagline: 'Full system control & oversight',
    icon: ShieldCheck,
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-600',
    lightBorder: 'border-blue-100',
    hoverBorder: 'hover:border-blue-300',
  },
  {
    id: 'manager',
    title: 'Manager',
    tagline: 'Team leadership & performance',
    icon: Users,
    lightBg: 'bg-blue-50',
    lightText: 'text-blue-500',
    lightBorder: 'border-blue-100',
    hoverBorder: 'hover:border-blue-200',
  },
  {
    id: 'employee',
    title: 'Employee',
    tagline: 'Personal workspace & tools',
    icon: User,
    lightBg: 'bg-sky-50',
    lightText: 'text-sky-600',
    lightBorder: 'border-sky-100',
    hoverBorder: 'hover:border-sky-300',
  },
];

export default function LoginSelect() {
  const navigate = useNavigate();

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
          <div className="text-black text-[10px] uppercase tracking-widest font-medium">HR Portal</div>
        </div>

        {/* Center — image + text */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 py-8 text-center gap-6">

          {/* Illustration */}
          <img
            src="/login.png"
            alt="HR Management"
            className="w-full max-w-sm max-h-80 xl:max-h-96 object-contain drop-shadow-xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
          {/* Illustration fallback */}
          <div
            style={{ display: 'none' }}
            className="w-full h-40 items-center justify-center"
          >
            <div className="w-28 h-28 rounded-full bg-blue-200/50 flex items-center justify-center">
              <Users className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-2xl xl:text-3xl font-bold text-slate-800 leading-snug mb-2">
              Manage with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700">
                Clarity
              </span>
            </h2>
            <p className="text-sm text-slate-400 max-w-[260px] mx-auto leading-relaxed">
              One platform for admins, managers, and employees to collaborate seamlessly.
            </p>
          </div>
        </div>

        {/* Bottom label */}
        <div className="relative z-10 flex items-center gap-2 px-10 pb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          <span className="text-[11px] text-slate-400">HR Management Platform &bull; Secure &amp; Encrypted</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[45%] h-screen overflow-y-auto flex items-center justify-center relative px-5 sm:px-10 py-10 bg-slate-50">

        {/* Corner decorations */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-sky-50 to-transparent rounded-tr-full pointer-events-none" />

        <div className="w-full max-w-sm relative z-10">

          {/* Accent bar */}

      

          {/* Header */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-600 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome Back
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Choose your portal</h2>
            <p className="text-sm text-slate-400">Select your role to access the dashboard</p>
          </div>

          {/* Role Cards */}
          <div className="space-y-3 mb-7">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => navigate(`/login/${role.id}`)}
                  className={`
                    group w-full text-left bg-white rounded-2xl border
                    ${role.lightBorder} ${role.hoverBorder}
                    shadow-sm hover:shadow-md
                    transition-all duration-200 ease-out hover:-translate-y-0.5
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2
                  `}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className={`w-11 h-11 rounded-xl ${role.lightBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${role.lightText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                        {role.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">{role.tagline}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg ${role.lightBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                      <ArrowRight className={`w-4 h-4 ${role.lightText}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-slate-50 px-3 text-xs text-slate-400">Secure &amp; Encrypted</span>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-7 flex-wrap">
            {['🔒 SSL Secured', '✅ GDPR Ready', '⚡ 99.9% Uptime'].map((badge, i) => (
              <span key={i} className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                {badge}
              </span>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-300">
            &copy; {new Date().getFullYear()} Debox Technology. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}