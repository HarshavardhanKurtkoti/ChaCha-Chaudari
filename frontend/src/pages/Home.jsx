import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import React, { Suspense } from 'react';
const Bot = React.lazy(() => import('./Bot'));
const ChatBot = React.lazy(() => import('./ChatBot'));
import CarouselComp from '../components/CarouselComp';
import GreetingPopup from './Greeting';

const Home = () => {
  useEffect(() => {
    // Always play greeting and activate chatbot on mount
    const audio = new Audio('/assets/chacha-cahaudhary/Greeting.wav');
    let played = false;
    const playGreeting = () => {
      if (!played) {
        played = true;
        audio.play();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('activate-chatbot-voice', { detail: { message: 'hello' } }));
        }, 2000);
        window.removeEventListener('click', playGreeting);
        window.removeEventListener('keydown', playGreeting);
      }
    };
    audio.play().then(() => {
      played = true;
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('activate-chatbot-voice', { detail: { message: 'hello' } }));
      }, 2000);
    }).catch(() => {
      window.addEventListener('click', playGreeting);
      window.addEventListener('keydown', playGreeting);
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
      window.removeEventListener('click', playGreeting);
      window.removeEventListener('keydown', playGreeting);
    };
  }, []);
  // Listen for global event to open chat (dispatched by NavBar)
  useEffect(() => {
    const onOpenChat = () => {
      setModelTransition(true);
      setTimeout(() => setShowChat(true), 180);
    };
    window.addEventListener('open-chat', onOpenChat);
    return () => window.removeEventListener('open-chat', onOpenChat);
  }, []);
  const [showChat, setShowChat] = useState(false);
  const [modelTransition, setModelTransition] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1920));

  // Track viewport width for responsive layout
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isNarrow = vw < 1280; // below ~lg screens

  // Full screen canvas for Bot, positioned with transition
  const botCanvasStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 5,
  };

  // Animate Bot from right edge to just left of the right container
  const botModelStyle = modelTransition
    ? {
        position: 'absolute',
        top: '50%',
        right: isNarrow ? '4vw' : '58vw', // Destination moves further right on narrow screens
        transform: 'translateY(-50%)',
        width: isNarrow ? '320px' : '420px',
        height: isNarrow ? '420px' : '520px',
        maxWidth: isNarrow ? '340px' : '500px',
        pointerEvents: 'none',
        transition: 'all 0.7s linear',
        zIndex: 20,
      }
    : {
        position: 'absolute',
        top: '50%',
        right: isNarrow ? '2vw' : '10vw', // Start near right edge
        transform: 'translateY(-50%)',
        width: isNarrow ? '320px' : '420px',
        height: isNarrow ? '420px' : '520px',
        maxWidth: isNarrow ? '340px' : '500px',
        pointerEvents: 'none',
        transition: 'all 0.7s cubic-bezier(0.77,0,0.175,1)',
        zIndex: 20,
      };

  // Main content container, layered above Bot canvas
  const mainContainerStyle = {
    position: 'relative',
    zIndex: 2,
    minHeight: '600px',
    display: 'flex',
    flexDirection: isNarrow ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isNarrow ? '1.25rem' : '2rem',
    width: '100%',
    height: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: isNarrow ? '1rem' : '0',
  };

  // Style for right column (now just a spacer)
  const rightColumnStyle = {
    display: isNarrow ? 'none' : 'block',
    flex: 1.7,
    height: '620px',
    maxWidth: '700px',
    background: 'rgba(255,255,255,0.0)',
    borderRadius: '1.5rem',
    boxShadow: 'none',
    overflow: 'hidden',
  };
  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-yellow-100 via-blue-50 to-yellow-200">
      {/* HERO: self-contained area so overlayed Bot doesn't spill below */}
      <div className="relative w-full flex items-center justify-center pt-8 pb-12">
        {/* Bot overlay only within hero area */}
        {!showChat && !isNarrow && (
          <div style={{ ...botCanvasStyle, position: 'absolute' }}>
            <div style={botModelStyle}>
              <Suspense fallback={<div />}> 
                <Bot />
              </Suspense>
            </div>
          </div>
        )}

        {/* Top right chat button (relative to hero) */}
        <button
          className="absolute top-4 right-4 z-20 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition"
          onClick={() => {
            setModelTransition(true);
            setTimeout(() => setShowChat(true), 700);
          }}
        >
          Chat
        </button>

        {/* Main content container, layered above Bot */}
        <div style={mainContainerStyle}>
          {/* Left column: slideshow + text */}
          <div
            className="flex flex-col justify-between gap-8"
            style={{
              flex: isNarrow ? '1 1 100%' : 1.2,
              height: isNarrow ? 'auto' : '680px',
              maxWidth: isNarrow ? '100%' : '1100px',
              marginLeft: 0,
              marginRight: 0,
            }}
          >
            {/* Slideshow container */}
            <div
              className="bg-white/90 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden"
              style={{ height: isNarrow ? '260px' : '380px', width: '100%' }}
            >
              <CarouselComp />
            </div>
            {/* Text container */}
            <div
              className="bg-white/90 rounded-3xl shadow-xl flex items-center justify-center p-8 max-w-4xl mx-auto"
              style={{ height: isNarrow ? 'auto' : '220px', width: '100%' }}
            >
              <div className="text-center text-lg font-medium leading-relaxed">
                <p className='font-headline text-4xl md:text-6xl font-extrabold text-blue-700 mb-4 drop-shadow-lg text-center'>Ganga Knowledge Portal</p>
                <p className="text-gray-700 max-w-3xl mx-auto">
                  Explore Maa Ganga&apos;s heritage, ecology, and initiatives. Chat with <span className="text-blue-700 font-bold">Chacha Chaudhary</span>, learn with interactive modules, and navigate key sites with ease.
                </p>
              </div>
            </div>
          </div>
          {/* Right column: just a spacer now */}
          <div style={rightColumnStyle}></div>
        </div>
      </div>

      {/* GTMS-like sections: Features, About, Stats, Contact */}
      <section id="features" className="w-full py-16 bg-white/70 border-y">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Why this portal?</h2>
            <p className="mt-3 max-w-2xl mx-auto text-gray-600">Designed to educate and engage with rich, interactive content about the Ganga river.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { title: 'Interactive Chat', desc: 'Converse with Chacha Chaudhary to learn about Ganga’s history, culture, and conservation.', emoji: '💬' },
              { title: 'Riverine Ecology', desc: 'Understand ecosystems, biodiversity, and environmental challenges through visuals.', emoji: '🌿' },
              { title: 'Smart Navigation', desc: 'Locate key ghats and landmarks and measure distances easily.', emoji: '🧭' },
            ].map((f) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ duration: 0.45 }}
                className="rounded-2xl bg-white p-6 shadow border min-h-[180px]"
              >
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
            {[
              { stat: '4', label: 'Key Modules' },
              { stat: '100+', label: 'Facts & Tips' },
              { stat: '24/7', label: 'Chat Availability' },
              { stat: 'Kids', label: 'Friendly Design' },
            ].map((s) => (
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
            <h2 className="font-headline text-3xl md:text-4xl font-bold">Get in touch</h2>
            <p className="mt-3 text-gray-600">Questions or suggestions about the portal? We’d love to hear from you.</p>
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
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <a href="mailto:info@nmcg.gov.in" className="text-gray-600 hover:text-blue-600">info@nmcg.gov.in</a>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-gray-600">+91-11-0000-0000</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Chat popup, controlled by showChat state */}
      {showChat && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 bg-opacity-95"
          onClick={e => {
            if (e.target === e.currentTarget) {
              setShowChat(false);
              setModelTransition(false);
            }
          }}
        >
          <div
            className="relative rounded-3xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-row items-stretch justify-center p-0 border border-gray-700 bg-gray-900"
          >
            <button
              className="absolute top-6 right-6 text-3xl font-bold text-gray-400 hover:text-blue-400 transition-all duration-200"
              style={{ background: 'transparent', border: 'none', zIndex: 10 }}
              onClick={() => {
                setShowChat(false);
                setModelTransition(false);
              }}
              aria-label="Close chat"
            >
              &times;
            </button>
            {/* Left: Character and controls */}
            <div className="flex flex-col items-center justify-between bg-gray-800 rounded-l-3xl p-8 w-1/3 min-w-[260px]" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15)', height: '100%' }}>
              {/* Character model centered vertically */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <div style={{ width: '220px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Suspense fallback={<div />}> 
                    <Bot />
                  </Suspense>
                </div>
              </div>
              {/* Controls below character, with extra bottom padding */}
              <div className="w-full flex flex-col items-center gap-4 pb-4" />
            </div>
            {/* Right: Chat area */}
            <div className="flex flex-col flex-grow justify-end p-8 w-2/3 bg-gray-900 rounded-r-3xl" style={{ minHeight: '100%' }}>
              <Suspense fallback={<div className='text-gray-300'>Loading chat…</div>}> 
                <ChatBot />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Greeting popup, shown on initial load */}
      {showGreeting && (
        <GreetingPopup onClose={() => setShowGreeting(false)} />
      )}
    </section>
  );
};

export default Home;
