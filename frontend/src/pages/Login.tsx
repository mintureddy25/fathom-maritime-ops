import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { authApi } from '../api/endpoints';
import { Spinner } from '../components/Spinner';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const [email, setEmail] = useState('admin@fathom.io');
  const [password, setPassword] = useState('admin123');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { token, user } = await authApi.login(email, password);
      setSession(user, token);
      toast.success(`Welcome, ${user.name.split(' ')[0]}`);
      const dest = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/';
      navigate(dest, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <img src="/anchor.svg" alt="" className="h-6 w-6" style={{ filter: 'brightness(0)' }} />
            </div>
            <div className="text-left">
              <div className="text-xl font-semibold text-slate-50">Fathom Maritime Ops</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.22em]">Compliance console</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md shadow-2xl shadow-black/30 p-7">
          <h1 className="text-lg font-semibold text-slate-50">Sign in</h1>
          <p className="text-sm text-slate-400 mt-1">Use a demo account or your fleet credentials</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-[0.18em]">Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-950/60 px-3 py-2.5 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5 uppercase tracking-[0.18em]">Password</label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-950/60 px-3 py-2.5 text-slate-100"
              />
            </div>
            <button
              disabled={busy}
              className="group w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-semibold py-3 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition"
            >
              {busy ? <Spinner className="text-slate-900" /> : null}
              {busy ? 'Signing in…' : 'Sign in'}
              {!busy && <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>
          </form>
          <div className="mt-6 pt-4 text-xs text-slate-500 space-y-1 border-t border-slate-800/60">
            <div className="font-medium text-slate-400 uppercase tracking-[0.18em] mb-1">Demo accounts</div>
            <div><span className="text-slate-300">Admin</span> · admin@fathom.io / admin123</div>
            <div><span className="text-slate-300">Crew</span> · rao@fathom.io / crew123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
