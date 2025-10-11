import React, { Suspense, useEffect } from 'react';

const Bot = React.lazy(() => import('./Bot'));
const ChatBot = React.lazy(() => import('./ChatBot'));

const Chat = () => {
  // Ensure we are at the top when this page mounts (helps with route transitions)
  useEffect(() => {
    // Use rAF twice to run after layout/transition completes and also set a short timeout
    const runScrollTop = () => {
      try {
        // robustly reset all scroll roots
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      } catch (e) { void e; }

      // Try to focus the chat input if ChatBot has rendered an input element, but prevent scrolling
      try {
        const input = document.querySelector('.chat-input, input[type="text"], textarea');
        if (input && typeof input.focus === 'function') {
          // preventScroll option avoids moving page position when focusing
          try {
            input.focus({ preventScroll: true });
          } catch (err) {
            // fallback if browser doesn't support preventScroll
            input.focus();
          }
        }
      } catch (err) { void err; }
    };

    requestAnimationFrame(() => requestAnimationFrame(() => runScrollTop()));
    // Also run once more after a small timeout to cover animated transitions
    const t = setTimeout(runScrollTop, 220);
    return () => clearTimeout(t);
  }, []);
  return (
    <section className="relative w-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative rounded-3xl shadow-2xl w-full min-h-[70vh] flex flex-row items-stretch justify-center p-0 border border-gray-700 bg-gray-900">
          {/* Left: Character */}
          <div className="flex flex-col items-center justify-between bg-gray-800 rounded-l-3xl p-8 w-1/3 min-w-[260px]" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{ width: '240px', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Suspense fallback={<div />}> 
                  <Bot />
                </Suspense>
              </div>
            </div>
            <div className="w-full flex flex-col items-center gap-4 pb-2" />
          </div>
          {/* Right: Chat area */}
          <div className="flex flex-col flex-grow justify-end p-8 w-2/3 bg-gray-900 rounded-r-3xl" style={{ minHeight: '100%' }}>
            <Suspense fallback={<div className='text-gray-300'>Loading chat…</div>}> 
              <ChatBot />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Chat;
