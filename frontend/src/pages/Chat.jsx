import React, { Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
const ChatBot = React.lazy(() => import('./ChatBot'));

const Chat = () => {
  const location = useLocation();

  useEffect(() => {
    const runScrollTop = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      } catch (e) { void e; }

      try {
        const input = document.querySelector('.chat-input, input[type="text"], textarea');
        if (input && typeof input.focus === 'function') {
          try {
            input.focus({ preventScroll: true });
          } catch {
            input.focus();
          }
        }
      } catch { /* ignore */ }
    };

    requestAnimationFrame(() => requestAnimationFrame(() => runScrollTop()));
    const t = setTimeout(runScrollTop, 220);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative w-full min-h-screen bg-surface-950 text-slate-100 pt-24 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-ganga-600/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Initializing Chacha Intelligence...</span>
            </div>
          }
        >
          <ChatBot initialPrompt={location.state?.initialPrompt} />
        </Suspense>
      </div>
    </section>
  );
};

export default Chat;
