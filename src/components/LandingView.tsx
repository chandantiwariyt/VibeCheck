import React from 'react';
import { BookOpen, ShieldCheck, Sparkles, BrainCircuit, Lock, ArrowRight, MessageSquareCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingView: React.FC = () => {
  const { signInWithGoogle, loading, authError } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-between text-[#E0E0E0]">
      {/* Top minimalistic bar */}
      <header className="w-full border-b border-white/10 bg-[#080808]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-sm bg-white flex items-center justify-center shrink-0 shadow-lg">
              <div className="w-5 h-5 border-2 border-black rotate-45" />
            </div>
            <span className="text-base sm:text-lg font-light tracking-[0.25em] uppercase text-white">
              VibeCheck
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-indigo-400/80 bg-white/5 border border-white/10 px-3 py-1 rounded-sm uppercase">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              Cryptographic Isolation
            </span>
          </div>
        </div>
      </header>

      {/* Main hero & sign-in card */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-5xl mx-auto grid md:grid-cols-12 gap-12 items-center">
          {/* Left Narrative Column */}
          <div className="md:col-span-7 space-y-7 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] tracking-[0.2em] uppercase font-mono">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Gemini 3.8 Flash &bull; Private Synthesis
            </div>

            <h1 className="font-serif italic text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.15]">
              Clarify your thoughts, unpack tensions, and discover enduring insights.
            </h1>

            <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-xl font-light">
              An obsidian sanctuary for your innermost reflections.
              Engage in multi-turn intellectual dialogue with Gemini, distill key realizations,
              and build an enduring chronicle of personal wisdom.
            </p>

            {/* Core guarantees */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-white/10 bg-[#080808] p-5 hover:border-white/20 transition-all">
                <div className="flex items-center gap-2.5 text-white font-medium text-sm mb-1.5">
                  <Lock className="h-4 w-4 text-indigo-400" />
                  <span>Strictly User-Isolated</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed font-light">
                  Protected by hardened Cloud Firestore security rules. Your reflections are inaccessible to any other identity.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#080808] p-5 hover:border-white/20 transition-all">
                <div className="flex items-center gap-2.5 text-white font-medium text-sm mb-1.5">
                  <BrainCircuit className="h-4 w-4 text-indigo-400" />
                  <span>Multi-Turn Dialogue</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed font-light">
                  Brainstorm creative vectors, reframe challenging emotions, and automatically synthesize structured takeaways.
                </p>
              </div>
            </div>
          </div>

          {/* Right Authentication Card */}
          <div className="md:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-[#080808] p-8 sm:p-10 shadow-2xl text-center relative">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-sm bg-white text-black shadow-xl">
                <div className="w-7 h-7 border-2 border-black rotate-45" />
              </div>

              <h2 className="font-serif italic text-2xl font-normal text-white">
                Enter The Chronicle
              </h2>
              <p className="text-xs text-white/40 mt-2 mb-8 font-light tracking-wide">
                Authenticate via your Google Account to access your personal reflection space.
              </p>

              {authError && (
                <div className="mb-6 rounded-xl bg-rose-950/40 border border-rose-500/30 p-3.5 text-left text-xs text-rose-300">
                  <p className="font-semibold uppercase tracking-wider text-[10px]">Authentication notice</p>
                  <p className="mt-1 text-rose-200/90">{authError}</p>
                </div>
              )}

              {/* Google Sign-in Button */}
              <button
                id="landing-google-signin-btn"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black shadow-lg hover:bg-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-white/50 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-neutral-400 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In With Google</span>
                  </>
                )}
              </button>

              <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-mono tracking-widest text-white/30 uppercase">
                <ShieldCheck className="h-3.5 w-3.5 text-white/30" />
                <span>Cloud Firestore Protected</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#080808] py-6 text-center text-[10px] uppercase tracking-[0.25em] text-white/30 font-mono">
        <p>VibeCheck &bull; Google AI Studio &bull; Cloud Firestore</p>
      </footer>
    </div>
  );
};
