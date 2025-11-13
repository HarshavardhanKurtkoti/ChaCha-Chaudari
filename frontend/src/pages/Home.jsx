import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import React, { Suspense } from 'react';
const ChatBot = React.lazy(() => import('./ChatBot'));
import CarouselComp from '../components/CarouselComp';
import GreetingPopup from './Greeting';
// Defer loading the 3D Bot (three.js + model) until it's actually rendered
const Bot = React.lazy(() => import('./Bot'));

const Home = () => {
  // greeting: show once per browser session (unless user opened #about)
  const initialGreeting = (() => {
    if (typeof window === 'undefined') return false;
    if (window.location.hash === '#about') return false;
    try { return !localStorage.getItem('greetingShownOnce'); } catch { return true; }
  })();

  const [showGreeting, setShowGreeting] = useState(initialGreeting);
  const [showChat, setShowChat] = useState(false);
  // Only actually mount the heavy 3D Bot component after user interaction or explicit chat open
  const [loadBot, setLoadBot] = useState(false);
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1400));
  const isNarrow = vw < 1280;
  const botContainerRef = useRef(null);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-load the 3D Bot when its container comes into view
  useEffect(() => {
    if (loadBot) return; // already loaded
    const el = botContainerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setLoadBot(true);
          io.disconnect();
          break;
        }
      }
    }, { root: null, threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [loadBot]);

  useEffect(() => {
    if (!showGreeting) return;
    try { localStorage.setItem('greetingShownOnce', '1'); } catch {}
    const audio = new Audio('/assets/chacha-cahaudhary/Greeting.wav');
    let played = false;
    // Only dispatch the chatbot-voice activation when the greeting was triggered
    // by an explicit user interaction (click/keydown). If the browser allows
    // autoplay and the audio plays on page load, do not send the "hello" request
    // to the backend to avoid unnecessary calls on page refresh.
    const playGreeting = (userInitiated = false) => {
      if (!played) {
        played = true;
        audio.play().catch(() => {});
        if (userInitiated) {
          // dispatch only for user-initiated activations
          setTimeout(() => window.dispatchEvent(new CustomEvent('activate-chatbot-voice', { detail: { message: 'hello', userInitiated: true } })), 1500);
        }
        window.removeEventListener('click', clickHandler);
        window.removeEventListener('keydown', clickHandler);
      }
    };

    const clickHandler = () => playGreeting(true);

    // Try to autoplay; if autoplay is blocked, wait for user interaction and
    // then trigger the greeting (this will dispatch the chatbot activation).
    audio.play().catch(() => {
      window.addEventListener('click', clickHandler);
      window.addEventListener('keydown', clickHandler);
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
      window.removeEventListener('click', playGreeting);
      window.removeEventListener('keydown', playGreeting);
    };
  }, [showGreeting]);

  const mainContainerStyle = {
    display: 'flex',
    gap: isNarrow ? '1rem' : '2rem',
    alignItems: 'flex-start',
    justifyContent: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: isNarrow ? '1rem' : '0',
  };

  const rightColumnStyle = { display: isNarrow ? 'none' : 'block' };

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-yellow-100 via-blue-50 to-yellow-200">
      <div className="relative w-full flex items-center justify-center pt-8 pb-12">
        <div style={mainContainerStyle} className="w-full">
          {/* Left: Images + Welcome stacked */}
          <div className="flex flex-col gap-6" style={{ flex: isNarrow ? '1 1 100%' : '0 0 48%', maxWidth: isNarrow ? '100%' : '560px' }}>
            <div className="bg-white rounded-3xl border overflow-hidden" style={{ height: isNarrow ? '220px' : '320px' }}>
              <CarouselComp />
            </div>

            <div className="bg-white rounded-3xl border p-8 flex items-center justify-center" style={{ height: isNarrow ? '220px' : '320px' }}>
              <div className="text-center">
                <h2 className="text-3xl font-extrabold text-blue-700">Ganga Knowledge Portal</h2>
                <p className="text-gray-700 mt-2 max-w-lg">Explore Maa Ganga's heritage, ecology, and initiatives. Chat with <span className="text-blue-700 font-bold">Chacha Chaudhary</span>, learn with interactive modules, and navigate key sites with ease.</p>
              </div>
            </div>
          </div>

          {/* Right: Big single card */}
          <div style={{ ...rightColumnStyle, flex: isNarrow ? '1 1 100%' : '0 0 48%' }} className="flex items-center justify-center px-4" ref={botContainerRef}>
            <div className="bg-white rounded-3xl border p-6 w-full flex items-center justify-center" style={{ height: isNarrow ? '320px' : '640px' }}>
              <div style={{ width: isNarrow ? '320px' : '500px', height: isNarrow ? '320px' : '620px', borderRadius: '20px', overflow: 'hidden' }}>
                {/* Show lightweight placeholder and load the heavy 3D component only when user requests it */}
                {!loadBot ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white">
                    <div className="text-center text-gray-700">3D character not loaded</div>
                    <button onClick={() => setLoadBot(true)} className="px-4 py-2 rounded bg-blue-600 text-white">Load 3D model</button>
                    <div className='text-xs text-gray-400'>Models are loaded on demand to speed up page load.</div>
                  </div>
                ) : (
                  <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400">Loading model</div>}>
                    <Bot />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="features" className="w-full py-16 bg-white/70 border-y">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.5 }} className="text-center mb-10">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Why this portal?</h2>
            <p className="mt-3 max-w-2xl mx-auto text-gray-600">Designed to educate and engage with rich, interactive content about the Ganga river.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { title: 'Interactive Chat', desc: 'Converse with Chacha Chaudhary to learn about Ganga’s history, culture, and conservation.', emoji: '💬' },
              { title: 'Riverine Ecology', desc: 'Understand ecosystems, biodiversity, and environmental challenges through visuals.', emoji: '🌿' },
              { title: 'Smart Navigation', desc: 'Locate key ghats and landmarks and measure distances easily.', emoji: '🧭' },
            ].map((f) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.2 }} transition={{ duration: 0.45 }} className="rounded-2xl bg-white p-6 shadow border min-h-[180px]">
                <div className="text-3xl">{f.emoji}</div>
                <h3 className="mt-3 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-gray-600 mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative z-10 w-full py-16">
        <div className="container mx-auto px-4 text-center max-w-5xl">
          <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.5 }} className="font-headline text-3xl md:text-4xl font-bold">About the Portal</motion.h2>
          <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6 }} className="mt-4 text-gray-600">This portal supports the Namami Gange mission by making knowledge accessible and engaging for all ages through conversation, visuals, and mini-games.</motion.p>
          <div className="grid md:grid-cols-2 gap-6 mt-8 text-left">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.45 }} className="rounded-xl bg-blue-50 p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900">Our Mission</h3>
              <p className="text-gray-700 mt-2">To foster awareness and action for a cleaner, healthier Ganga by simplifying complex topics into interactive experiences.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.45 }} className="rounded-xl bg-green-50 p-6 border border-green-100">
              <h3 className="font-semibold text-gray-900">Our Vision</h3>
              <p className="text-gray-700 mt-2">An informed community that cherishes and safeguards the river’s ecological and cultural wealth.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="stats" className="relative z-10 w-full py-16 bg-white/70 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            {[{ stat: '4', label: 'Key Modules' }, { stat: '100+', label: 'Facts & Tips' }, { stat: '24/7', label: 'Chat Availability' }, { stat: 'Kids', label: 'Friendly Design' }].map((s) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.35 }} className="flex flex-col items-center gap-1">
                <p className="font-headline text-4xl font-bold text-gray-900">{s.stat}</p>
                <p className="text-gray-600 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 w-full py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.2 }} transition={{ duration: 0.5 }} className="text-center mb-8">
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Developers</h2>
            <p className="mt-3 text-gray-600">Contact the developers — reach out for support, feedback, or contributions.</p>
          </motion.div>
          <div className="grid md:grid-cols-12 gap-6">
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.45 }} className="md:col-span-7 rounded-xl bg-white p-6 shadow border">
              <form className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="w-full border rounded px-3 py-2" placeholder="Full Name *" required />
                  <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email *" required />
                </div>
                <input className="w-full border rounded px-3 py-2" placeholder="Subject" />
                <textarea className="w-full border rounded px-3 py-2 min-h-[120px]" placeholder="Message *" required />
                <button type="submit" className="w-full px-4 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">Send Message</button>
              </form>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.45 }} className="md:col-span-5 rounded-xl bg-white p-6 shadow border">
              <div className="space-y-6 text-sm">
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-gray-900 text-base">Harshavardhan V Kurtkoti</h3>
                  <a href="mailto:kurtkoti.harsha@gmial.com" className="text-gray-600 hover:text-blue-600 break-all">kurtkoti.harsha@gmial.com</a>
                  <a href="tel:+917892125856" className="text-gray-600 hover:text-blue-600">+91 78921 25856</a>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-gray-900 text-base">Ananya R</h3>
                  <a href="mailto:anublr04@gmail.com" className="text-gray-600 hover:text-blue-600 break-all">anublr04@gmail.com</a>
                  <a href="tel:+918197714521" className="text-gray-600 hover:text-blue-600"></a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Chat popup */}
      {showChat && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80" onClick={(e) => { if (e.target === e.currentTarget) setShowChat(false); }}>
          <div className="relative rounded-3xl w-full max-w-5xl h-[80vh] flex flex-row items-stretch p-0 bg-gray-900">
            <button className="absolute top-4 right-4 text-3xl text-gray-300" onClick={() => setShowChat(false)}>&times;</button>
            <div className="flex flex-col items-center justify-center bg-gray-800 rounded-l-3xl p-6 w-1/3">
              <Suspense fallback={<div />}> <Bot /> </Suspense>
            </div>
            <div className="flex-1 bg-gray-900 p-6 rounded-r-3xl overflow-auto">
              <Suspense fallback={<div className='text-gray-300'>Loading chat…</div>}>
                <ChatBot />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Greeting popup */}
      {showGreeting && <GreetingPopup onClose={() => setShowGreeting(false)} />}
    </section>
  );
};

export default Home;
