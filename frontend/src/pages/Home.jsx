import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useTranslation } from 'hooks/useTranslation';
import CarouselsReco from 'components/CarouselsReco';
import {
  MessageSquare,
  Sparkles,
  Compass,
  Waves,
  Landmark,
  Gamepad2,
  ArrowRight,
  ShieldCheck,
  Flame,
  Zap,
  Activity,
  Globe,
  Award,
  ChevronRight,
  Play
} from 'lucide-react';

const Bot = lazy(() => import('./Bot'));

const Home = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loadBot, setLoadBot] = useState(true);
  const heroRef = useRef(null);
  const bentoRef = useRef(null);

  // Initial greeting audio (once per session)
  useEffect(() => {
    try {
      const shown = sessionStorage.getItem('greetingAudioPlayed');
      if (!shown) {
        sessionStorage.setItem('greetingAudioPlayed', '1');
        const audio = new Audio('/assets/chacha-cahaudhary/Greeting.wav');
        audio.volume = 0.5;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser autoplay blocked until user gesture
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

  // GSAP subtle entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gsap-hero-title', {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });
      gsap.from('.gsap-bento-card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power2.out',
        delay: 0.3,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const samplePrompts = [
    { text: 'Tell me about the Ganges River Dolphin', lang: 'en', icon: '🐬' },
    { text: 'गंगा आरती और दशाश्वमेध घाट का इतिहास', lang: 'hi', icon: '🪔' },
    { text: 'How do Sewage Treatment Plants protect the river?', lang: 'en', icon: '💧' },
    { text: 'नमामि गंगे मिशन के प्रमुख उद्देश्य क्या हैं?', lang: 'hi', icon: '🌿' },
  ];

  const handleLaunchChat = (promptText = '') => {
    navigate('/chat', { state: { initialPrompt: promptText } });
  };

  return (
    <div className="relative w-full min-h-screen bg-surface-950 text-slate-100 overflow-x-hidden pt-20">
      {/* Dynamic Spatial Mesh Background (ThreeUI / 21st.dev inspired) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-ganga-600/12 blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/10 blur-[150px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[35%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/8 blur-[120px]" />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      <div ref={heroRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* =========================================================================
            1. HERO SECTION: Spatial Typography + 3D Mascot Pedestal
           ========================================================================= */}
        <section className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8 pb-16 min-h-[calc(100vh-6rem)]">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Master Headline */}
            <h1 className="gsap-hero-title font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              The Living Spirit of{' '}
              <span className="gradient-text-cyan">River Ganga</span>,{' '}
              <span className="gradient-text-gold">Reimagined</span>.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
              Meet Chacha Chaudhary in full 3D interactive avatar. Powered by grounded RAG, bilingual Hindi-English intelligence, and river conservation data from the National Mission for Clean Ganga.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => handleLaunchChat()}
                className="group relative overflow-hidden flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-ganga-600 via-cyan-500 to-ganga-600 bg-[length:200%_auto] hover:bg-right text-white font-semibold text-sm sm:text-base shadow-glow-cyan transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Talk to Chacha Chaudhary</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => navigate('/warRoom_museum')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/6 hover:bg-white/10 border border-white/12 text-slate-200 hover:text-white font-medium text-sm sm:text-base transition-all duration-200"
              >
                <Landmark className="w-4 h-4 text-cyan-400" />
                <span>Virtual Museum</span>
              </button>

              <button
                onClick={() => navigate('/games')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/6 hover:bg-white/10 border border-white/12 text-slate-200 hover:text-white font-medium text-sm sm:text-base transition-all duration-200"
              >
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
                <span>Play Quests</span>
              </button>
            </div>

            {/* Interactive Prompt Chips */}
            <div className="pt-4 border-t border-white/8">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400 block mb-2.5">
                Suggested Questions to Ask Chacha:
              </span>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleLaunchChat(p.text)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 border border-white/8 hover:border-ganga-400/40 text-slate-300 hover:text-cyan-200 transition-all duration-200 group text-left"
                  >
                    <span>{p.icon}</span>
                    <span className="truncate max-w-[260px] sm:max-w-none">{p.text}</span>
                    <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic Pedestal Viewport */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full aspect-[4/5] max-w-md sm:max-w-lg rounded-3xl p-1 bg-gradient-to-b from-cyan-500/20 via-transparent to-emerald-500/20 shadow-2xl">
              <div className="relative w-full h-full rounded-[22px] bg-surface-900/80 backdrop-blur-2xl border border-white/10 overflow-hidden flex flex-col">
                {/* Header status bar inside card */}
                <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-950/70 border border-white/10 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono text-slate-300">Avatar Stream Active</span>
                  </div>
                  <button
                    onClick={() => handleLaunchChat('Hello Chacha!')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-ganga-600/80 hover:bg-ganga-500 text-white text-[11px] font-semibold backdrop-blur-md transition-transform hover:scale-105"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Start Voice</span>
                  </button>
                </div>

                {/* 3D Model Canvas Viewport */}
                <div className="relative flex-1 w-full h-full">
                  <Suspense
                    fallback={
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-mono">Initializing 3D Mascot...</span>
                      </div>
                    }
                  >
                    <Bot />
                  </Suspense>

                  {/* Holographic Pedestal Ambient Floor Glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 rounded-full bg-cyan-400/25 blur-xl pointer-events-none" />
                </div>

                {/* Bottom info banner */}
                <div className="relative z-20 px-4 py-3 bg-surface-950/90 border-t border-white/8 backdrop-blur-md flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-headline font-bold text-white">Chacha Chaudhary</span>
                    <span className="text-[10px] text-slate-400">Official Mascot • Diamond Toons & NMCG</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    Bilingual Voice
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. IMPACT METRICS / REAL-TIME STATS BAR
           ========================================================================= */}
        <section className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl glass-panel">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-3">
              <span className="text-2xl sm:text-3xl font-extrabold font-headline gradient-text-cyan">
                2,525 km
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">Ganga River Length</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">Himalayas to Bay of Bengal</span>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-3 border-l border-white/8">
              <span className="text-2xl sm:text-3xl font-extrabold font-headline gradient-text-emerald">
                140+ Species
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">Aquatic Biodiversity</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">Dolphins, Otters & Gharials</span>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-3 border-l border-white/8">
              <span className="text-2xl sm:text-3xl font-extrabold font-headline gradient-text-gold">
                ₹20,000 Cr
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">Namami Gange Outlay</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">Flagship Clean Mission</span>
            </div>

            <div className="flex flex-col items-center sm:items-start text-center sm:text-left p-3 border-l border-white/8">
              <span className="text-2xl sm:text-3xl font-extrabold font-headline text-white">
                5 States
              </span>
              <span className="text-xs sm:text-sm text-slate-400 mt-1">Basin Coverage</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">UK, UP, Bihar, JH, WB</span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. MODERN BENTO GRID (21st.dev / TasteSkill Architecture)
           ========================================================================= */}
        <section ref={bentoRef} className="mb-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
              Integrated Capabilities
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tight text-white">
              Everything You Need for River Awareness
            </h3>
            <p className="text-slate-400 text-sm sm:text-base mt-3">
              Explore the four core pillars of the SmartGanga Mascot ecosystem designed for school children, citizens, and environmental researchers.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-6">
            {/* Bento Card 1: AI Chatbot & RAG Engine (Col 7) */}
            <div
              onClick={() => handleLaunchChat()}
              className="gsap-bento-card md:col-span-7 bento-card p-6 sm:p-8 cursor-pointer group flex flex-col justify-between min-h-[340px]"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-ganga-600/20 border border-ganga-500/30 text-cyan-400 w-fit">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Age-Adaptive AI</span>
                </div>
              </div>

              <div className="my-6">
                <h4 className="text-xl sm:text-2xl font-bold font-headline text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  Conversational Mascot with Document RAG
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Tailored answers for kids (friendly stories), youth (practical ecological actions), and adults (NMCG policies, STP data). Includes natural Hindi voice synthesis via Piper ONNX.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/8 text-sm font-semibold text-cyan-400 group-hover:text-cyan-300">
                <span>Start Conversation</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
              </div>
            </div>

            {/* Bento Card 2: Ghats & Aarti Distance Radar (Col 5) */}
            <div
              onClick={() => navigate('/navigation')}
              className="gsap-bento-card md:col-span-5 bento-card p-6 sm:p-8 cursor-pointer group flex flex-col justify-between min-h-[340px]"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 w-fit">
                  <Compass className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
                  Live Distance
                </span>
              </div>

              <div className="my-6">
                <h4 className="text-xl sm:text-2xl font-bold font-headline text-white mb-2 group-hover:text-amber-300 transition-colors">
                  Sacred Ghats & Aarti Radar
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Calculates real-time geodesic distance to Dashashwamedh Ghat in Varanasi for evening Ganga Aarti ceremonies, with map coordinate bearings.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/8 text-sm font-semibold text-amber-400 group-hover:text-amber-300">
                <span>Open Radar View</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
              </div>
            </div>

            {/* Bento Card 3: River Basin War Room (Col 5) */}
            <div
              onClick={() => navigate('/warRoom_museum')}
              className="gsap-bento-card md:col-span-5 bento-card p-6 sm:p-8 cursor-pointer group flex flex-col justify-between min-h-[340px]"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 w-fit">
                  <Landmark className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-300">
                  Virtual Exhibits
                </span>
              </div>

              <div className="my-6">
                <h4 className="text-xl sm:text-2xl font-bold font-headline text-white mb-2 group-hover:text-purple-300 transition-colors">
                  River Basin War Room & Museum
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Interactive touch exhibits guiding visitors through the history, sewage interception milestones, and ecological recovery of the Ganga basin.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/8 text-sm font-semibold text-purple-400 group-hover:text-purple-300">
                <span>Enter War Room</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
              </div>
            </div>

            {/* Bento Card 4: Gamified Quests & Leaderboard (Col 7) */}
            <div
              onClick={() => navigate('/games')}
              className="gsap-bento-card md:col-span-7 bento-card p-6 sm:p-8 cursor-pointer group flex flex-col justify-between min-h-[340px]"
            >
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 w-fit">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Streak & Daily Rewards</span>
                </div>
              </div>

              <div className="my-6">
                <h4 className="text-xl sm:text-2xl font-bold font-headline text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  Eco-Gamification, Quests & Badges
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Play river clean-up simulations, quiz challenges, and earn badges from Ganga Seedling to River Hero. Complete daily logins to maintain your streak on the live leaderboard.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/8 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
                <span>Play & Earn XP</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. RIVERINE ECOLOGY DISCOVERY SECTION
           ========================================================================= */}
        <section className="mb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1">
                Biodiversity Showcase
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-headline text-white">
                Guardians of the River Basin
              </h3>
            </div>
            <button
              onClick={() => navigate('/riverine_ecology')}
              className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Explore Full Encyclopedia</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <CarouselsReco onPromptSelect={(p) => handleLaunchChat(p)} />
        </section>
      </div>
    </div>
  );
};

export default Home;
