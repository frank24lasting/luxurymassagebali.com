import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/admin-auth';
import { useBrandingSettings } from '@/lib/branding';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isLoading, signIn } = useAuth();
  const { siteName, logoLoginUrl } = useBrandingSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) {
      navigate('/langitdewata/dashboard', { replace: true });
    }
  }, [isAdmin, isAuthenticated, isLoading, navigate]);

  if (!isLoading && isAuthenticated && isAdmin) {
    return <Navigate to="/langitdewata/dashboard" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await signIn(email.trim(), password);

      if (!result.success) {
        setError(result.error);
        return;
      }

      navigate('/langitdewata/dashboard', { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-dark text-white relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(33,64,56,0.34),transparent_36%),linear-gradient(135deg,#0c1a16_0%,#19322c_55%,#10231d_100%)]" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-dark-lighter shadow-2xl">
          <div className="border-b border-white/5 p-8 text-center">
            {logoLoginUrl ? (
              <div className="mx-auto mb-5 flex h-20 items-center justify-center max-w-[240px]">
                <img src={logoLoginUrl} alt={`${siteName} login logo`} className="h-full w-auto max-w-full object-contain" />
              </div>
            ) : (
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-clean">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
            )}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {siteName} Admin
            </div>
            <h1 className="text-2xl font-heading font-bold">Backend Login</h1>
            <p className="text-sm text-gray-400 mt-2">Masuk dengan akun Supabase Auth admin.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="admin-email" className="block text-sm text-gray-400 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="admin@luxurymassagebali.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Masukkan password admin"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full rounded-xl bg-gradient-brand py-3.5 font-bold text-white shadow-clean transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Masuk Admin'}
            </button>

            <p className="text-[11px] leading-relaxed text-gray-500 text-center">
              Password tidak disimpan di project. Akun admin dibuat di Supabase Auth dan diberi metadata role admin.
            </p>
          </form>
        </div>
      </motion.section>
    </main>
  );
}
