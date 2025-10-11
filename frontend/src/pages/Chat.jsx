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
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="relative rounded-3xl w-full min-h-[70vh] flex flex-col md:flex-row items-stretch justify-center p-0 border border-gray-700 bg-gray-900">
          {/* Left: Character */}
          <div className="flex flex-col items-center justify-between bg-gray-800 md:rounded-l-3xl md:rounded-tr-none rounded-t-3xl p-4 md:p-8 md:w-1/3 w-full min-w-[240px]">
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div style={{ width: '220px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Suspense fallback={<div />}> 
                  <Bot />
                </Suspense>
              </div>
            </div>
            <div className="w-full flex flex-col items-center gap-4 pb-2" />
          </div>
          {/* Right: Chat area */}
          <div className="flex flex-col flex-grow justify-end p-4 md:p-8 md:w-2/3 w-full bg-gray-900 md:rounded-r-3xl rounded-b-3xl" style={{ minHeight: '100%' }}>
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
