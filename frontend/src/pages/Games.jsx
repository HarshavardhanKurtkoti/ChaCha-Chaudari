import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Leaderboard from 'components/Leaderboard';
import AchievementModal from 'components/AchievementModal';
import PlayerNamePrompt from 'components/PlayerNamePrompt';
import DailyReward from 'components/DailyReward';
import PropTypes from 'prop-types';
import { useTranslation } from 'hooks/useTranslation';
import { Gamepad2, Flame, Trophy, Award, Sparkles, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';

const STORAGE_KEY = 'gangaGameProgress:v2';
const loadProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { points: 0, badges: [], gamesPlayed: 0, achievements: [], lastPlayDate: null, streak: 0 };
  } catch {
    return { points: 0, badges: [], gamesPlayed: 0, achievements: [], lastPlayDate: null, streak: 0 };
  }
};
const saveProgress = (p) => localStorage.setItem(STORAGE_KEY, JSON.stringify(p));

const badgeRules = [
  { id: 'seedling', label: 'Ganga Seedling', threshold: 25, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
  { id: 'streamkeeper', label: 'Stream Keeper', threshold: 75, color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
  { id: 'river-guardian', label: 'River Guardian', threshold: 150, color: 'bg-blue-500/15 text-blue-300 border-blue-500/40' },
  { id: 'river-champion', label: 'River Champion', threshold: 300, color: 'bg-purple-500/15 text-purple-300 border-purple-500/40' },
  { id: 'river-legend', label: 'River Legend', threshold: 600, color: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
  { id: 'river-hero', label: 'River Hero', threshold: 1200, color: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
];

const achievementsCatalog = [
  { id: 'first-quiz', icon: '🧠', label: 'First Quiz Completed' },
  { id: 'first-trash', icon: '🗑️', label: 'First Trash Sort Completed' },
  { id: 'first-cleanup', icon: '🌊', label: 'First Cleanup Completed' },
  { id: 'streak-3', icon: '🔥', label: '3-Day Streak' },
  { id: 'streak-7', icon: '⚡', label: '7-Day Streak' },
];

const QUIZ = [
  { q: 'Why is the Ganga vital to over 500 million citizens?', options: ['It looks pretty', 'It provides drinking water, agriculture, and ecosystem life', 'It is a highway', 'It is a mountain pass'], a: 1, fact: 'The Ganga supports drinking water, farming, fish, and rich biodiversity across 5 Indian states.' },
  { q: 'What is the correct way to handle single-use plastic near ghats?', options: ['Throw in the river stream', 'Burn in open air', 'Sort into recyclable blue bins', 'Bury in riparian sand'], a: 2, fact: 'Recycling stops microplastics from poisoning aquatic animals like the Gangetic Dolphin.' },
  { q: 'Which ecological action best protects riverbanks from erosion?', options: ['Plant indigenous riparian trees near banks', 'Dump laundry chemicals', 'Leave plastic wrappers on ghats', 'Pour motor oil into drains'], a: 0, fact: 'Riparian tree roots stabilize soil, regulate stream temperature, and filter runoff water.' },
  { q: 'Who is responsible for preserving our national river?', options: ['Only the government', 'Only school teachers', 'All citizens, communities, and youth together', 'No one can help'], a: 2, fact: 'Small collective daily habits create the behavioral shift needed for clean river ecosystems.' },
  { q: 'What is the primary objective of the Namami Gange programme?', options: ['A sports tournament', 'Integrated rejuvenation and pollution abatement for the Ganga basin', 'A shopping complex', 'A festival feast'], a: 1, fact: 'Namami Gange is India’s flagship integrated mission combining sewage treatment, biodiversity, and public awareness.' },
];

function QuizGame({ onScore }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const current = QUIZ[index];

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === current.a;
    if (correct) setScore((s) => s + 10);
  };

  const handleNext = () => {
    if (index + 1 < QUIZ.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      setFinished(true);
      onScore(score, { mission: 'quiz', event: 'completed' });
    }
  };

  if (finished) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl">
          🏆
        </div>
        <h3 className="text-3xl font-extrabold font-headline gradient-text-emerald">Quiz Challenge Completed!</h3>
        <p className="text-slate-300 text-sm max-w-md">
          You earned <span className="font-bold text-emerald-400 font-mono text-lg">{score}</span> XP points towards your river guardian rank!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-white/8">
        <span>Question {index + 1} of {QUIZ.length}</span>
        <span className="text-cyan-400 font-bold">XP Earned: {score}</span>
      </div>

      <h3 className="text-lg sm:text-xl font-bold font-headline text-white leading-snug">
        {current.q}
      </h3>

      <div className="grid gap-3">
        {current.options.map((opt, i) => {
          let btnStyle = 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200';
          if (selected !== null) {
            if (i === current.a) btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-glow-emerald';
            else if (i === selected) btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300';
            else btnStyle = 'bg-white/5 border-white/5 opacity-40';
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all ${btnStyle}`}
            >
              <div className="flex items-center justify-between">
                <span>{opt}</span>
                {selected !== null && i === current.a && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {selected !== null && i === selected && i !== current.a && <XCircle className="w-4 h-4 text-rose-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p><b>Eco Fact:</b> {current.fact}</p>
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 self-end sm:self-auto"
          >
            {index + 1 < QUIZ.length ? 'Next Question →' : 'Finish Quiz →'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
QuizGame.propTypes = { onScore: PropTypes.func.isRequired };

const TRASH_ITEMS = [
  { id: 1, name: 'Banana Peel', type: 'Organic', icon: '🍌' },
  { id: 2, name: 'Plastic Soda Bottle', type: 'Recycle', icon: '🥤' },
  { id: 3, name: 'Used Battery', type: 'Hazard', icon: '🔋' },
  { id: 4, name: 'Cardboard Box', type: 'Recycle', icon: '📦' },
  { id: 5, name: 'Old Paint Can', type: 'Hazard', icon: '🛢️' },
  { id: 6, name: 'Leftover Food', type: 'Organic', icon: '🍲' },
];

function TrashSort({ onScore }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const currentItem = TRASH_ITEMS[index];

  const handleSort = (binType) => {
    if (currentItem.type === binType) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      onScore(10, { mission: 'trash', event: 'progress' });
    } else {
      setStreak(0);
    }
    if (index + 1 < TRASH_ITEMS.length) {
      setIndex((i) => i + 1);
    } else {
      setFinished(true);
      onScore(score + 10, { mission: 'trash', event: 'completed' });
    }
  };

  if (finished) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-3xl">
          ♻️
        </div>
        <h3 className="text-3xl font-extrabold font-headline gradient-text-emerald">Waste Sorting Mastered!</h3>
        <p className="text-slate-300 text-sm">
          You earned <span className="font-bold text-emerald-400 font-mono text-lg">{score}</span> points keeping the ghats pristine!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center py-6 space-y-6">
      <div className="flex items-center justify-between w-full text-xs font-mono text-slate-400 border-b border-white/8 pb-2">
        <span>Item {index + 1} of {TRASH_ITEMS.length}</span>
        <span className="text-emerald-400">Streak: {streak} 🔥 | Score: {score}</span>
      </div>

      <div className="w-28 h-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-6xl shadow-inner">
        {currentItem.icon}
      </div>

      <div>
        <h4 className="text-xl font-bold font-headline text-white">{currentItem.name}</h4>
        <p className="text-xs text-slate-400 mt-1">Choose the designated recycling category:</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {[
          { bin: 'Organic', color: 'from-emerald-600 to-green-700', label: '🌱 Organic Composting' },
          { bin: 'Recycle', color: 'from-blue-600 to-cyan-700', label: '♻️ Dry Recyclables' },
          { bin: 'Hazard', color: 'from-rose-600 to-red-700', label: '⚠️ Toxic / Hazardous' },
        ].map((item) => (
          <button
            key={item.bin}
            onClick={() => handleSort(item.bin)}
            className={`px-5 py-3 rounded-xl bg-gradient-to-r ${item.color} text-white font-semibold text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
TrashSort.propTypes = { onScore: PropTypes.func.isRequired };

function RiverCleanup({ onScore }) {
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [finished, setFinished] = useState(false);
  const scoreRef = useRef(0);
  const onScoreRef = useRef(onScore);

  useEffect(() => {
    onScoreRef.current = onScore;
  }, [onScore]);

  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => {
      const id = Date.now();
      const type = Math.random() > 0.3 ? 'trash' : 'fish';
      const icons = type === 'trash' ? ['🥤', '🥡', '🛍️', '🛢️'] : ['🐟', '🐠', '🐡'];
      const icon = icons[Math.floor(Math.random() * icons.length)];
      const top = Math.random() * 75 + 10;
      setItems((prev) => [...prev, { id, type, icon, top, left: -10 }]);
    }, 700);
    return () => clearInterval(interval);
  }, [finished]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setFinished(true);
          onScoreRef.current(scoreRef.current, { mission: 'cleanup', event: 'completed' });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const mover = setInterval(() => {
      setItems((prev) => prev.map((item) => ({ ...item, left: item.left + 1.2 })).filter((item) => item.left < 105));
    }, 50);

    return () => {
      clearInterval(timer);
      clearInterval(mover);
    };
  }, [finished]);

  const handleClick = (id, type) => {
    if (finished) return;
    if (type === 'trash') {
      const newScore = score + 10;
      setScore(newScore);
      scoreRef.current = newScore;
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      const newScore = Math.max(0, score - 5);
      setScore(newScore);
      scoreRef.current = newScore;
    }
  };

  if (finished) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center text-3xl">
          🌊
        </div>
        <h3 className="text-3xl font-extrabold font-headline gradient-text-cyan">Cleanup Mission Completed!</h3>
        <p className="text-slate-300 text-sm">
          You rescued the stream and gained <span className="font-bold text-cyan-400 font-mono text-lg">{score}</span> XP!
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-b from-surface-900 to-ganga-950 border border-ganga-500/30 shadow-inner select-none">
      <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-surface-950/80 backdrop-blur-md text-xs font-mono text-cyan-300 border border-white/10">
        Time Left: {timeLeft}s
      </div>
      <div className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-surface-950/80 backdrop-blur-md text-xs font-mono text-emerald-400 border border-white/10">
        Score: {score} XP
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-surface-950/80 backdrop-blur-md text-[11px] text-slate-300 border border-white/10">
        Click trash 🥤 to collect. Protect aquatic fish 🐟!
      </div>

      {items.map((item) => (
        <motion.div
          key={item.id}
          className="absolute text-4xl cursor-pointer hover:scale-125 active:scale-90 transition-transform"
          style={{ top: `${item.top}%`, left: `${item.left}%` }}
          onClick={() => handleClick(item.id, item.type)}
        >
          {item.icon}
        </motion.div>
      ))}
    </div>
  );
}
RiverCleanup.propTypes = { onScore: PropTypes.func.isRequired };

export default function Games() {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(loadProgress());
  const [activeGame, setActiveGame] = useState(null);
  const [showAchievement, setShowAchievement] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [lbKey, setLbKey] = useState(0);

  const addPoints = (pts, meta = {}) => {
    const streak = progress.streak || 0;
    const bonusMultiplier = Math.min(1 + streak * 0.1, 1.5);
    const delta = Math.round(pts * bonusMultiplier);
    const updated = { ...progress, points: progress.points + delta, gamesPlayed: progress.gamesPlayed + 1 };
    setProgress(updated);
    saveProgress(updated);
    setLbKey((k) => k + 1);

    if (meta.mission === 'quiz' && meta.event === 'completed' && !progress.achievements?.includes('first-quiz')) grantAchievement('first-quiz');
    if (meta.mission === 'trash' && meta.event === 'progress' && !progress.achievements?.includes('first-trash')) grantAchievement('first-trash');
    if (meta.mission === 'cleanup' && meta.event === 'completed' && !progress.achievements?.includes('first-cleanup')) grantAchievement('first-cleanup');
  };

  const grantAchievement = (id) => {
    if (progress.achievements?.includes(id)) return;
    const updated = { ...progress, achievements: [...(progress.achievements || []), id] };
    setProgress(updated);
    saveProgress(updated);
    const meta = achievementsCatalog.find((a) => a.id === id);
    if (meta) setShowAchievement({ title: `${meta.label}!`, message: 'Congratulations on this milestone!' });
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 pb-24 pt-28 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <header className="rounded-3xl glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-400 p-0.5 shadow-glow-emerald shrink-0">
              <div className="w-full h-full bg-surface-950 rounded-[14px] flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-headline gradient-text-emerald">
                {t('games.title') || 'River Guardian Quests & Missions'}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                {t('games.subtitle') || 'Complete daily challenges, level up your environmental score, and earn official river hero badges.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-mono block">Streak</span>
              <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-headline flex items-center gap-1 justify-end">
                {progress.streak || 0} <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              </span>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex flex-col items-center justify-center shadow-lg font-mono text-white">
              <span className="text-xl font-bold">{progress.points}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-80">XP</span>
            </div>
          </div>
        </header>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Quest Area */}
          <div className="lg:col-span-8">
            <div className="bento-card p-6 sm:p-8 min-h-[480px] flex flex-col justify-between">
              {!activeGame ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-headline text-white mb-1">
                      Choose Your Conservation Quest
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Earn bonus multipliers by completing all three mini-missions today.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 pt-2">
                    <GameCard
                      title="Ecology Quiz"
                      desc="5 interactive questions on Ganga wildlife & conservation"
                      icon="🧠"
                      color="from-purple-600/30 to-indigo-600/30"
                      onClick={() => setActiveGame('quiz')}
                    />
                    <GameCard
                      title="Ghats Waste Sort"
                      desc="Sort recyclables and organic waste correctly"
                      icon="♻️"
                      color="from-emerald-600/30 to-teal-600/30"
                      onClick={() => setActiveGame('trash')}
                    />
                    <GameCard
                      title="River Cleanup"
                      desc="Collect stream plastic before it reaches the sea"
                      icon="🌊"
                      color="from-blue-600/30 to-cyan-600/30"
                      onClick={() => setActiveGame('cleanup')}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/8">
                    <h3 className="text-lg font-bold font-headline text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>{activeGame === 'quiz' ? 'Ecology Quiz' : activeGame === 'trash' ? 'Waste Sorter' : 'River Cleanup Action'}</span>
                    </h3>
                    <button
                      onClick={() => setActiveGame(null)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Missions</span>
                    </button>
                  </div>
                  {activeGame === 'quiz' && <QuizGame onScore={addPoints} />}
                  {activeGame === 'trash' && <TrashSort onScore={addPoints} />}
                  {activeGame === 'cleanup' && <RiverCleanup onScore={addPoints} />}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Daily Reward & Name */}
            <div className="bento-card p-5 space-y-4">
              <PlayerNamePrompt onChange={setPlayerName} />
              <DailyReward progress={progress} onClaim={(pts) => addPoints(pts, { mission: 'daily', event: 'claim' })} />
            </div>

            {/* Badges Gallery */}
            <div className="bento-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Unlocked Badges</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {badgeRules.map((b) => {
                  const unlocked = progress.points >= b.threshold;
                  return (
                    <div
                      key={b.id}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center border transition-all ${
                        unlocked ? b.color : 'bg-surface-950/60 border-white/5 opacity-35'
                      }`}
                    >
                      <span className="text-2xl mb-1">{unlocked ? '🏆' : '🔒'}</span>
                      <span className="text-[10px] leading-tight font-medium">{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Leaderboard */}
            <div className="bento-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Top River Protectors</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <Leaderboard key={lbKey} currentUser={playerName} currentScore={progress.points} />
            </div>
          </div>
        </div>

        {showAchievement && (
          <AchievementModal
            title={showAchievement.title}
            message={showAchievement.message}
            onClose={() => setShowAchievement(null)}
          />
        )}
      </div>
    </div>
  );
}

function GameCard({ title, desc, icon, color, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bento-card p-6 flex flex-col items-center text-center justify-between min-h-[220px] group transition-all"
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-3xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold font-headline text-white group-hover:text-cyan-300 transition-colors">{title}</h4>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{desc}</p>
      </div>
      <span className="text-xs font-mono text-cyan-400 mt-3 flex items-center gap-1 group-hover:underline">
        Play Mission →
      </span>
    </motion.button>
  );
}
GameCard.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};
