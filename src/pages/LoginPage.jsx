import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, Eye, EyeOff, MailCheck, MessageSquare, Users } from 'lucide-react';
import Logo, { LogoMark } from '../components/layout/Logo.jsx';
import Button from '../components/common/Button.jsx';
import { Checkbox, TextField } from '../components/common/FormFields.jsx';
import { useAuth } from '../context/AuthContext.jsx';

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

const CARD = 'flex flex-col gap-4 rounded-2xl border border-line bg-white p-7 sm:p-9';
const LINK = 'self-center text-[13px] font-semibold text-brand-ink hover:underline';

function Alert({ tone = 'error', children }) {
  if (!children) return null;
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700'
          : 'rounded-lg bg-green-50 px-3 py-2.5 text-[13px] font-medium text-green-800'
      }
    >
      {children}
    </p>
  );
}

/** Password input with a show/hide button. */
function PasswordField({ label, value, onChange, autoComplete, placeholder = 'At least 6 characters' }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextField
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputClassName="h-11.5 pr-11"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute bottom-1.5 right-1.5 grid size-8.5 place-items-center rounded-lg text-muted hover:bg-slate-100"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-[13px] text-muted">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function InviteBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-ink">
      <MailCheck className="size-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}

/** Email + password sign-in, with Google as an alternative. */
function SignInPanel({ initialEmail, remember, setRemember, busy, error, onSubmit, onGoogle, onForgot }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  return (
    <form
      className={CARD}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ email, password });
      }}
    >
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-muted">Welcome back to Box Theory.</p>
      </div>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        inputClassName="h-11.5"
        required
      />
      <PasswordField
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        placeholder="Your password"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Checkbox label="Keep me signed in" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        <button type="button" onClick={() => onForgot(email)} className="text-[13px] font-semibold text-brand-ink hover:underline">
          Forgot password?
        </button>
      </div>
      <Alert>{error}</Alert>
      <Button type="submit" variant="primary" size="lg" fullWidth disabled={Boolean(busy)}>
        {busy === 'password' ? 'Signing in…' : 'Sign in'}
      </Button>
      <OrDivider />
      <Button variant="secondary" size="lg" icon={GoogleIcon} fullWidth onClick={onGoogle} disabled={Boolean(busy)}>
        {busy === 'google' ? 'Connecting to Google…' : 'Sign in with Google'}
      </Button>
      <p className="border-t border-line pt-4 text-[13px] text-muted">
        New here? Open the invitation email from your admin to create your password.
      </p>
    </form>
  );
}

/** Opened from an invitation email (/login?invite=person@example.com): create a password. */
function InvitePanel({ email, remember, setRemember, busy, error, onCreate, onGoogle, onSignIn }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (password.length < 6) return setProblem('Use at least 6 characters for your password.');
    if (password !== confirm) return setProblem('The two passwords don’t match.');
    setProblem('');
    return onCreate({ email, password });
  };
  return (
    <form className={CARD} noValidate onSubmit={submit}>
      <div>
        <InviteBadge>Team invitation</InviteBadge>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight">Join Box Theory</h1>
        <p className="mt-1 text-muted">Create a password for your invited email.</p>
      </div>
      <div className="rounded-xl border border-brand-line bg-brand-soft px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink">Your email</p>
        <p className="mt-0.5 break-all text-[15px] font-semibold">{email}</p>
      </div>
      {/* Lets password managers save the new password against this email. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <PasswordField label="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      <PasswordField
        label="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
        placeholder="Type it again"
      />
      <Checkbox label="Keep me signed in" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
      <Alert>{problem || error}</Alert>
      <Button type="submit" variant="primary" size="lg" fullWidth disabled={Boolean(busy)}>
        {busy === 'create' ? 'Creating your account…' : 'Create account'}
      </Button>
      <OrDivider />
      <Button variant="secondary" size="lg" icon={GoogleIcon} fullWidth onClick={onGoogle} disabled={Boolean(busy)}>
        {busy === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
      </Button>
      <button type="button" onClick={onSignIn} className={LINK}>
        Already have a password? Sign in
      </button>
    </form>
  );
}

/** Password accounts confirm their email once before they can get in. */
function VerifyPanel({ email, busy, error, notice, onContinue, onResend, onCancel }) {
  return (
    <div className={CARD}>
      <div>
        <InviteBadge>One more step</InviteBadge>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight">Confirm your email</h1>
        <p className="mt-1 text-muted">
          We sent a link to <b className="break-all text-ink">{email}</b>. Open it to confirm it’s you, then come back and continue.
        </p>
      </div>
      <Alert tone="note">{notice}</Alert>
      <Alert>{error}</Alert>
      <Button variant="primary" size="lg" fullWidth onClick={onContinue} disabled={Boolean(busy)}>
        {busy === 'verify' ? 'Checking…' : 'I’ve confirmed — continue'}
      </Button>
      <Button variant="secondary" size="lg" fullWidth onClick={onResend} disabled={Boolean(busy)}>
        {busy === 'resend' ? 'Sending…' : 'Send the email again'}
      </Button>
      <button type="button" onClick={onCancel} className={LINK}>
        Use a different account
      </button>
      <p className="border-t border-line pt-4 text-[13px] text-muted">Can’t find it? Check your spam or promotions folder.</p>
    </div>
  );
}

/** "Forgot password?": Firebase emails a link to choose a new password. */
function ResetPanel({ initialEmail, busy, error, notice, onSend, onBack }) {
  const [email, setEmail] = useState(initialEmail);
  return (
    <form
      className={CARD}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSend(email);
      }}
    >
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-muted">We’ll email you a link to choose a new password.</p>
      </div>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        inputClassName="h-11.5"
        required
      />
      <Alert tone="note">{notice}</Alert>
      <Alert>{error}</Alert>
      <Button type="submit" variant="primary" size="lg" fullWidth disabled={Boolean(busy)}>
        {busy === 'reset' ? 'Sending…' : 'Send reset link'}
      </Button>
      <button type="button" onClick={onBack} className={LINK}>
        Back to sign in
      </button>
    </form>
  );
}

export default function LoginPage() {
  const {
    user,
    pendingVerification,
    loginWithPassword,
    createAccount,
    loginWithGoogle,
    resendVerification,
    confirmVerified,
    resetPassword,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inviteEmail = (new URLSearchParams(location.search).get('invite') ?? '').trim().toLowerCase();
  const [mode, setMode] = useState(inviteEmail ? 'invite' : 'signin'); // signin | invite | reset
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  if (user) return <Navigate to={location.state?.from ?? '/'} replace />;

  const goIn = () => navigate(location.state?.from ?? '/', { replace: true });

  /** Runs one sign-in action with a busy state and shows its error (the confirm screen explains itself). */
  const run = async (kind, action) => {
    setBusy(kind);
    setError('');
    setNotice('');
    const result = await action();
    setBusy('');
    if (!result.ok && !result.needsVerification) setError(result.error);
    return result;
  };

  const switchMode = (next, email = '') => {
    setError('');
    setNotice('');
    setResetEmail(email);
    setMode(next);
  };

  const handlePassword = async ({ email, password }) => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    if ((await run('password', () => loginWithPassword({ email, password, remember }))).ok) goIn();
  };

  const handleCreate = async ({ email, password }) => {
    if ((await run('create', () => createAccount({ email, password, remember }))).ok) goIn();
  };

  const handleGoogle = async () => {
    if ((await run('google', () => loginWithGoogle({ remember, loginHint: inviteEmail || undefined }))).ok) goIn();
  };

  const handleConfirm = async () => {
    const result = await run('verify', confirmVerified);
    if (result.ok) goIn();
    else if (result.needsVerification) setError(result.error);
  };

  const handleResend = async () => {
    if ((await run('resend', resendVerification)).ok) setNotice('Sent again. Check your inbox (and spam folder).');
  };

  const handleReset = async (email) => {
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    if ((await run('reset', () => resetPassword(email))).ok) {
      setNotice(`If ${email.trim()} has a Box Theory password, a reset link is on its way.`);
    }
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
          {pendingVerification ? (
            <VerifyPanel
              email={pendingVerification}
              busy={busy}
              error={error}
              notice={notice}
              onContinue={handleConfirm}
              onResend={handleResend}
              onCancel={() => {
                logout();
                switchMode(inviteEmail ? 'invite' : 'signin');
              }}
            />
          ) : mode === 'reset' ? (
            <ResetPanel
              initialEmail={resetEmail}
              busy={busy}
              error={error}
              notice={notice}
              onSend={handleReset}
              onBack={() => switchMode('signin')}
            />
          ) : mode === 'invite' && inviteEmail ? (
            <InvitePanel
              email={inviteEmail}
              remember={remember}
              setRemember={setRemember}
              busy={busy}
              error={error}
              onCreate={handleCreate}
              onGoogle={handleGoogle}
              onSignIn={() => switchMode('signin')}
            />
          ) : (
            <SignInPanel
              initialEmail={inviteEmail}
              remember={remember}
              setRemember={setRemember}
              busy={busy}
              error={error}
              onSubmit={handlePassword}
              onGoogle={handleGoogle}
              onForgot={(email) => switchMode('reset', email)}
            />
          )}
        </div>
      </section>
    </div>
  );
}
