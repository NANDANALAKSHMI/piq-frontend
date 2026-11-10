import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Eye, EyeOff, MailCheck, MessageSquare, Users } from 'lucide-react';
import Logo, { LogoMark } from '../components/layout/Logo.jsx';
import Button from '../components/common/Button.jsx';
import { TextField, Checkbox } from '../components/common/FormFields.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/common/Toast.jsx';

const HIGHLIGHTS = [
  { icon: Briefcase, text: 'Track every job stage by stage' },
  { icon: Users, text: 'Assign the right team to every job' },
  { icon: MessageSquare, text: 'Photos, comments and decisions on every job' },
];

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Shown when the page is opened from an invitation email (/login?invite=person@example.com). */
function InvitePanel({ email, error, loading, onGoogle, onSwitch }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-7 sm:p-9">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">
          <MailCheck className="size-3.5" aria-hidden="true" />
          Team invitation
        </span>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight">Join Box Theory</h1>
        <p className="mt-1 text-muted">You&apos;ve been invited to the team. Continue with the Google account for this email to accept.</p>
      </div>
      <div className="rounded-xl border border-brand-line bg-brand-soft px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink">Invited email</p>
        <p className="mt-0.5 break-all text-[15px] font-semibold">{email}</p>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700">
          {error}
        </p>
      )}
      <Button variant="secondary" size="lg" icon={GoogleIcon} fullWidth onClick={onGoogle} disabled={loading}>
        {loading ? 'Connecting to Google…' : 'Continue with Google'}
      </Button>
      <button type="button" onClick={onSwitch} className="self-center text-[13px] font-semibold text-brand-ink hover:underline">
        Not you? Sign in another way
      </button>
    </div>
  );
}

export default function LoginPage() {
  const { user, login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const inviteEmail = (new URLSearchParams(location.search).get('invite') ?? '').trim().toLowerCase();
  const [identifier, setIdentifier] = useState('anil@piq.in');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await loginWithGoogle({ remember, loginHint: inviteEmail || undefined });
    setGoogleLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(location.state?.from ?? '/', { replace: true });
  };

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-navy p-14 text-white lg:flex">
        <LogoMark size={520} color="#5a463d" className="pointer-events-none absolute -bottom-28 -right-28 opacity-60" />
        <Logo tone="dark" size={52} className="relative px-0" />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Every job, from enquiry to delivery.</h2>
          <p className="mt-3.5 text-base text-[#e6ddd3]">
            One place for clients, jobs, team and vendors across every city you work in.
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
        <p className="relative text-xs text-navy-muted">Internal system · authorised staff only</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px]">
          <Logo tone="light" size={44} className="mb-6 px-0 lg:hidden" />
          {inviteEmail ? (
            <InvitePanel
              email={inviteEmail}
              error={error}
              loading={googleLoading}
              onGoogle={handleGoogle}
              onSwitch={() => {
                setError('');
                navigate('/login', { replace: true });
              }}
            />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-7 sm:p-9" noValidate>
              <div>
                <h1 className="text-[26px] font-bold tracking-tight">Sign in</h1>
                <p className="mt-1 text-muted">Welcome back to Box Theory.</p>
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
                icon={GoogleIcon}
                fullWidth
                onClick={handleGoogle}
                disabled={googleLoading || submitting}
              >
                {googleLoading ? 'Connecting to Google…' : 'Sign in with Google'}
              </Button>

            </form>
          )}
        </div>
      </section>
    </div>
  );
}
