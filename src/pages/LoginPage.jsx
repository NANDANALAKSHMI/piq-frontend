import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Eye, EyeOff, MapPin, MessageSquare, Smartphone } from 'lucide-react';
import { LogoMark } from '../components/layout/Logo.jsx';
import Button from '../components/common/Button.jsx';
import { TextField, Checkbox } from '../components/common/FormFields.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/common/Toast.jsx';

const HIGHLIGHTS = [
  { icon: Briefcase, text: 'Track every job stage by stage' },
  { icon: MapPin, text: 'Match jobs to the right unit and team' },
  { icon: MessageSquare, text: 'Photos, comments and decisions on every job' },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('anil@piq.in');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    // Small delay so the button's loading state is visible, like a real request.
    window.setTimeout(() => {
      const result = login({ identifier, password, remember });
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      navigate(location.state?.from ?? '/', { replace: true });
    }, 500);
  };

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <section className="hidden flex-col justify-between gap-10 bg-navy p-14 text-white lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark size={46} />
          <div>
            <span className="block text-[26px] font-bold leading-none tracking-wide">PIQ</span>
            <span className="text-xs text-navy-muted">Packaging &amp; Job Management</span>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Every job, from enquiry to delivery.</h2>
          <p className="mt-3.5 text-base text-[#c9d2e3]">
            One place for clients, jobs, workflows, units and vendors across every city you work in.
          </p>
          <ul className="mt-8 flex flex-col gap-3.5">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[10px] bg-navy-2 text-brand">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-navy-muted">Internal system · authorised staff only</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <LogoMark size={42} />
            <span className="text-2xl font-bold tracking-wide">PIQ</span>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-7 sm:p-9" noValidate>
            <div>
              <h1 className="text-[26px] font-bold tracking-tight">Sign in</h1>
              <p className="mt-1 text-muted">Welcome back. Use your PIQ staff account.</p>
            </div>
            <TextField
              label="Email or mobile number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              inputClassName="h-11.5"
              required
            />
            <div className="relative">
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="At least 6 characters"
                inputClassName="h-11.5 pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute bottom-1.5 right-1.5 grid size-8.5 place-items-center rounded-lg text-muted hover:bg-slate-100"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Checkbox label="Keep me signed in" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <button
                type="button"
                onClick={() => showToast('Password reset link sent to your email.', { tone: 'info' })}
                className="text-[13px] font-semibold text-brand-ink hover:underline"
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" fullWidth disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <div className="flex items-center gap-3 text-[13px] text-muted">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>
            <Button
              variant="secondary"
              size="lg"
              icon={Smartphone}
              fullWidth
              onClick={() => showToast('OTP sent to your registered mobile number.', { tone: 'info' })}
            >
              Sign in with OTP
            </Button>
            <p className="rounded-lg bg-canvas px-3 py-2.5 text-center text-xs text-muted">
              Demo: any team email (e.g. <b className="text-ink">anil@piq.in</b>) and any password of 6+ characters.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
