import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import CarouselComp from '../components/CarouselComp';
import GreetingPopup from './Greeting';
import { useTranslation } from 'hooks/useTranslation';

const ChatBot = lazy(() => import('./ChatBot'));
const Bot = lazy(() => import('./Bot'));

const Home = () => {
  const { t } = useTranslation();
  const initialGreeting = (() => {
    if (typeof window === 'undefined') return false;
    if (window.location.hash === '#about') return false;
    try { return !localStorage.getItem('greetingShownOnce'); } catch { return true; }
  })();

  const [showGreeting, setShowGreeting] = useState(initialGreeting);
  const [showChat, setShowChat] = useState(false);
  const [loadBot, setLoadBot] = useState(false);
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1400));
  const isNarrow = vw < 1280;
  const botContainerRef = useRef(null);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (loadBot) return;
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
    try { localStorage.setItem('greetingShownOnce', '1'); } catch { }
    const audio = new Audio('/assets/chacha-cahaudhary/Greeting.wav');
    let played = false;
    const playGreeting = (userInitiated = false) => {
      if (!played) {
        played = true;
        audio.play().catch(() => { });
        if (userInitiated) {
          setTimeout(() => window.dispatchEvent(new CustomEvent('activate-chatbot-voice', { detail: { message: 'hello', userInitiated: true } })), 1500);
        }
        window.removeEventListener('click', clickHandler);
        window.removeEventListener('keydown', clickHandler);
      }
    };
    const clickHandler = () => playGreeting(true);
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

  // Premium Glass Card Style
  const glassCardClass = "bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl rounded-3xl overflow-hidden";
  const textGradient = "bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent";

  return (
    <section className="relative w-full min-h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full flex items-center justify-center pt-12 pb-16">
        <div className={`w-full max-w-[1400px] mx-auto flex flex-wrap justify-center gap-8 px-4 ${isNarrow ? 'flex-col' : ''}`}>

          {/* Left Column: Carousel + Intro */}
          <div className="flex flex-col gap-6 flex-1 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`${glassCardClass} h-[320px]`}
            >
              <CarouselComp />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`${glassCardClass} p-8 flex items-center justify-center text-center h-[320px]`}
            >
              <div>
                <h1 className={`text-4xl font-extrabold mb-4 ${textGradient}`}>{t('home.heroTitle')}</h1>
                <p className="text-gray-300 text-lg leading-relaxed">{t('home.heroDesc')}</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3D Bot */}
          <div className="flex-1 max-w-xl flex items-center justify-center" ref={botContainerRef}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className={`${glassCardClass} w-full h-[664px] flex items-center justify-center relative bg-gradient-to-b from-white/5 to-transparent`}
            >
              <div className="w-full h-full rounded-3xl overflow-hidden relative">
                {!loadBot ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="text-gray-400 text-lg">{t('home.3dNotLoaded')}</div>
                    <button
                      onClick={() => setLoadBot(true)}
                      className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg transition-all hover:scale-105"
                    >
                      {t('home.load3d')}
                    </button>
                    <div className='text-xs text-gray-500'>{t('home.modelDisclaimer')}</div>
                  </div>
                ) : (
                  <Suspense fallback={<div className="flex items-center justify-center h-full text-blue-300 animate-pulse">{t('home.loadingModel')}</div>}>
                    <Bot />
                  </Suspense>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative z-10 w-full py-20 bg-black/20 backdrop-blur-sm border-y border-white/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 ${textGradient}`}>{t('home.featuresTitle')}</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">{t('home.featuresDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { title: t('home.featChatTitle'), desc: t('home.featChatDesc'), emoji: '💬', color: 'from-blue-500/20 to-cyan-500/20' },
              { title: t('home.featEcoTitle'), desc: t('home.featEcoDesc'), emoji: '🌿', color: 'from-emerald-500/20 to-green-500/20' },
              { title: t('home.featNavTitle'), desc: t('home.featNavDesc'), emoji: '🧭', color: 'from-purple-500/20 to-indigo-500/20' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className={`${glassCardClass} p-8 relative group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className="text-5xl mb-6">{f.emoji}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 w-full py-20">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className={`text-3xl md:text-4xl font-bold mb-6 ${textGradient}`}
          >
            {t('home.aboutTitle')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-gray-300 text-lg mb-12 max-w-3xl mx-auto"
          >
            {t('home.aboutDesc')}
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className={`${glassCardClass} p-8 bg-blue-900/20 border-blue-500/30`}
            >
              <h3 className="text-xl font-bold text-blue-300 mb-3">{t('home.missionTitle')}</h3>
              <p className="text-gray-400">{t('home.missionDesc')}</p>
            </motion.div>
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className={`${glassCardClass} p-8 bg-emerald-900/20 border-emerald-500/30`}
            >
              <h3 className="text-xl font-bold text-emerald-300 mb-3">{t('home.visionTitle')}</h3>
              <p className="text-gray-400">{t('home.visionDesc')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 w-full py-16 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            {[
              { stat: '4', label: t('home.statsModules') },
              { stat: '100+', label: t('home.statsFacts') },
              { stat: '24/7', label: t('home.statsAvail') },
              { stat: 'Kids', label: t('home.statsKids') }
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, type: "spring" }}
                className="flex flex-col items-center"
              >
                <span className={`text-4xl md:text-5xl font-bold ${textGradient}`}>{s.stat}</span>
                <span className="text-gray-400 mt-2 font-medium">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 w-full py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${textGradient}`}>{t('home.contactTitle')}</h2>
            <p className="text-gray-400">{t('home.contactDesc')}</p>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className={`md:col-span-7 ${glassCardClass} p-8`}
            >
              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('home.formName')} required />
                  <input className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" type="email" placeholder={t('home.formEmail')} required />
                </div>
                <input className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('home.formSubject')} />
                <textarea className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]" placeholder={t('home.formMessage')} required />
                <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold shadow-lg hover:shadow-blue-500/30 transition-all">
                  {t('home.formSend')}
                </button>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className={`md:col-span-5 ${glassCardClass} p-8 flex flex-col justify-center`}
            >
              <div className="space-y-8">
                <div>
                  <h3 className="font-bold text-xl text-white mb-1">Harshavardhan V Kurtkoti</h3>
                  <a href="mailto:kurtkoti.harsha@gmial.com" className="text-blue-400 hover:text-blue-300 transition-colors block">kurtkoti.harsha@gmial.com</a>
                  <a href="tel:+917892125856" className="text-gray-400 hover:text-white transition-colors block mt-1">+91 78921 25856</a>
                </div>
                <div>
                  <h3 className="font-bold text-xl text-white mb-1">Ananya R</h3>
                  <a href="mailto:anublr04@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors block">anublr04@gmail.com</a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Chat popup */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowChat(false); }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-6xl h-[85vh] bg-gray-900 rounded-3xl overflow-hidden border border-gray-700 shadow-2xl flex"
          >
            <button className="absolute top-4 right-4 z-50 p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" onClick={() => setShowChat(false)}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="hidden md:flex w-1/3 bg-gray-800/50 border-r border-gray-700 items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
              <Suspense fallback={<div className="animate-pulse w-32 h-32 bg-gray-700 rounded-full" />}> <Bot /> </Suspense>
            </div>

            <div className="flex-1 bg-gray-900 relative">
              <Suspense fallback={<div className='flex items-center justify-center h-full text-gray-500'>Loading chat interface...</div>}>
                <ChatBot />
              </Suspense>
            </div>
          </motion.div>
        </div>
      )}

      {showGreeting && <GreetingPopup onClose={() => setShowGreeting(false)} />}
    </section>
  );
};

export default Home;
