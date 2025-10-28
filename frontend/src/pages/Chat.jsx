import React, { Suspense, useEffect } from 'react';
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
        <Suspense fallback={<div className='text-gray-300'>Loading chat…</div>}>
          <ChatBot />
        </Suspense>
      </div>
    </section>
  );
};

export default Chat;
