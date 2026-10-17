import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.4-4.7 7l7.3 5.7c4.3-4 6.8-9.9 6.8-17.2z" />
    <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.6 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-[428px] rounded-2xl border border-line px-[50px] py-12">
        <h1 className="text-center text-3xl font-bold">Login</h1>

        {/* Styled to match the design; Google's real (invisible) button sits on top so it stays a genuine OAuth flow */}
        <div className="relative mt-7 h-11 w-full">
          <div className="pointer-events-none flex h-full items-center justify-center gap-2 rounded-lg bg-brand-mint text-sm font-medium">
            <GoogleG /> Login with Google
          </div>
          <div className="absolute inset-0 overflow-hidden opacity-0 [&_iframe]:!h-11 [&>div]:!w-full">
            <GoogleLogin
              width="328"
              onSuccess={async (res) => {
                try {
                  await loginWithGoogle(res.credential);
                } catch (e) {
                  toast.error(e.message);
                }
              }}
              onError={() => toast.error('Google sign-in failed. Try again.')}
            />
          </div>
        </div>

        <div className="my-6 flex items-center gap-4 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          or sign up through email
          <span className="h-px flex-1 bg-line" />
        </div>

        <form className="space-y-3 opacity-60" onSubmit={(e) => e.preventDefault()} aria-describedby="email-note">
          <input disabled type="email" placeholder="Email ID" aria-label="Email ID" className="h-12 w-full rounded-lg bg-surface px-4 text-sm placeholder:text-muted" />
          <input disabled type="password" placeholder="Password" aria-label="Password" className="h-12 w-full rounded-lg bg-surface px-4 text-sm placeholder:text-muted" />
          <button disabled className="btn-solid mt-3 w-full">Login</button>
        </form>
        <p id="email-note" className="mt-4 text-center text-xs text-muted">Email sign-in isn't available yet. Continue with Google.</p>
      </div>
    </main>
  );
}
