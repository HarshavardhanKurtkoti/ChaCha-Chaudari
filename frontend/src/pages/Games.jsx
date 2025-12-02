import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressBar from 'components/ProgressBar';
import Badge from 'components/Badge';
import Leaderboard from 'components/Leaderboard';
import AchievementModal from 'components/AchievementModal';
import PlayerNamePrompt from 'components/PlayerNamePrompt';
import DailyReward from 'components/DailyReward';

import PropTypes from 'prop-types';
import { useTranslation } from 'hooks/useTranslation';

// Local storage helpers
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

// Expanded badge rules
const badgeRules = [
  { id: 'seedling', label: 'Ganga Seedling', threshold: 25, color: 'bg-green-500/20 text-green-300 border-green-500/50' },
  { id: 'streamkeeper', label: 'Stream Keeper', threshold: 75, color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
  { id: 'river-guardian', label: 'River Guardian', threshold: 150, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' },
  { id: 'river-champion', label: 'River Champion', threshold: 300, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
  { id: 'river-legend', label: 'River Legend', threshold: 600, color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
  { id: 'river-hero', label: 'River Hero', threshold: 1200, color: 'bg-pink-500/20 text-pink-300 border-pink-500/50' },
];

const achievementsCatalog = [
  { id: 'first-quiz', icon: '🧠', label: 'First Quiz Completed' },
  { id: 'first-trash', icon: '🗑️', label: 'First Trash Sort Completed' },
  { id: 'first-cleanup', icon: '🌊', label: 'First Cleanup Completed' },
  { id: 'streak-3', icon: '🔥', label: '3-Day Streak' },
  { id: 'streak-7', icon: '⚡', label: '7-Day Streak' },
];

const QUIZ = [
  { q: 'Why is the Ganga important to people?', options: ['It looks pretty', 'It gives water and life to many', 'It is a road', 'It is a desert'], a: 1, fact: 'The Ganga supports drinking water, farming, fish, and wildlife for millions of people.' },
  { q: 'What should we do with plastic bottles?', options: ['Throw in river', 'Burn outside', 'Recycle properly', 'Bury in sand'], a: 2, fact: 'Recycling keeps plastic out of rivers and oceans and saves energy.' },
  { q: 'Which is good for the river?', options: ['Plant trees near banks', 'Dump soap water', 'Leave trash after picnics', 'Pour oil'], a: 0, fact: 'Trees protect soil, give shade, and help keep river water clean.' },
  { q: 'Who keeps the river clean?', options: ['Only the government', 'Only grown-ups', 'All of us together', 'No one can'], a: 2, fact: 'When everyone helps a little, the river stays healthy and happy.' },
  { q: 'What is Namami Gange?', options: ['A new cartoon', 'A program to clean and protect the Ganga', 'A sports team', 'A festival food'], a: 1, fact: 'Namami Gange is a mission to clean, protect, and restore the Ganga river.' },
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
    setTimeout(() => {
      if (index + 1 === QUIZ.length) {
        setFinished(true);
        onScore(score + (i === current.a ? 10 : 0), { mission: 'quiz', event: 'completed' });
      } else {
        setIndex((ix) => ix + 1);
        setSelected(null);
      }
    }, 1000);
  };

  if (finished) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-3xl font-bold text-emerald-400 mb-4">Quiz Complete!</h3>
        <p className="text-xl text-gray-200">You earned <span className="font-bold text-white">{score}</span> points.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>Question {index + 1} of {QUIZ.length}</span>
        <span>Score: {score}</span>
      </div>
      <h3 className="text-2xl font-semibold mb-6 text-white">{current.q}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {current.options.map((opt, i) => {
          const isCorrect = selected !== null && i === current.a;
          const isWrong = selected === i && i !== current.a;
          let bg = 'bg-gray-800/50 hover:bg-gray-700 border-gray-600';
          if (isCorrect) bg = 'bg-emerald-600 border-emerald-500';
          if (isWrong) bg = 'bg-rose-600 border-rose-500';

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`w-full px-6 py-4 rounded-xl text-left border transition-all ${bg}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-lg bg-blue-900/30 border border-blue-500/30">
          <p className="text-blue-200"><span className="font-bold">Did you know?</span> {current.fact}</p>
        </motion.div>
      )}
    </div>
  );
}
QuizGame.propTypes = { onScore: PropTypes.func.isRequired };

const TRASH_ITEMS = [
  { name: 'Plastic bottle', bin: 'Recycle', icon: '🥤' },
  { name: 'Banana peel', bin: 'Organic', icon: '🍌' },
  { name: 'Newspaper', bin: 'Recycle', icon: '📰' },
  { name: 'Battery', bin: 'Hazard', icon: '🔋' },
  { name: 'Apple core', bin: 'Organic', icon: '🍎' },
  { name: 'Glass jar', bin: 'Recycle', icon: '🫙' },
];

function TrashSort({ onScore }) {
  const [currentItem, setCurrentItem] = useState(() => TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)]);
  const [score, setScore] = useState(0);
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleSort = (bin) => {
    const correct = bin === currentItem.bin;
    if (correct) {
      setScore(s => s + 5);
      onScore(5, { mission: 'trash', event: 'progress' });
    }
    if (count >= 9) {
      setFinished(true);
    } else {
      setCount(c => c + 1);
      setCurrentItem(TRASH_ITEMS[Math.floor(Math.random() * TRASH_ITEMS.length)]);
    }
  };

  if (finished) return <div className="p-8 text-center"><h3 className="text-2xl font-bold text-emerald-400">Sorting Complete!</h3><p className="mt-2">Score: {score}</p></div>;

  return (
    <div className="p-6 text-center">
      <div className="text-6xl mb-4">{currentItem.icon}</div>
      <h3 className="text-xl font-bold mb-8">{currentItem.name}</h3>
      <div className="flex justify-center gap-4">
        {['Organic', 'Recycle', 'Hazard'].map(bin => (
          <button key={bin} onClick={() => handleSort(bin)} className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-500 transition-colors">
            {bin}
          </button>
        ))}
      </div>
    </div>
  );
}
TrashSort.propTypes = { onScore: PropTypes.func.isRequired };

// --- New Game: River Cleanup ---
function RiverCleanup({ onScore }) {
  const [items, setItems] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [finished, setFinished] = useState(false);
  const containerRef = useRef(null);

  // Refs to access latest state inside intervals without resetting them
  const scoreRef = useRef(0);
  const onScoreRef = useRef(onScore);

  useEffect(() => {
    onScoreRef.current = onScore;
  }, [onScore]);

  // Spawn items
  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => {
      const id = Date.now();
      const type = Math.random() > 0.3 ? 'trash' : 'fish'; // 70% trash
      const icons = type === 'trash' ? ['🥤', '🥡', '🛍️', '🛢️'] : ['🐟', '🐠', '🐡'];
      const icon = icons[Math.floor(Math.random() * icons.length)];
      const top = Math.random() * 80 + 10; // 10% to 90% height
      setItems(prev => [...prev, { id, type, icon, top, left: -10 }]);
    }, 800);
    return () => clearInterval(interval);
  }, [finished]);

  // Move items & Timer
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setFinished(true);
          onScoreRef.current(scoreRef.current, { mission: 'cleanup', event: 'completed' });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const mover = setInterval(() => {
      setItems(prev => prev.map(item => ({ ...item, left: item.left + 1 })).filter(item => item.left < 105));
    }, 50);

    return () => { clearInterval(timer); clearInterval(mover); };
  }, [finished]);

  const handleClick = (id, type) => {
    if (finished) return;
    if (type === 'trash') {
      const newScore = score + 10;
      setScore(newScore);
      scoreRef.current = newScore;
      setItems(prev => prev.filter(i => i.id !== id));
    } else {
      const newScore = Math.max(0, score - 5); // Penalty for clicking fish
      setScore(newScore);
      scoreRef.current = newScore;
    }
  };

  if (finished) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-3xl font-bold text-emerald-400 mb-4">Cleanup Time's Up!</h3>
        <p className="text-xl">You cleaned up the river and earned <span className="font-bold text-white">{score}</span> points.</p>
      </div>
    );
  }

  return (
    <div className="relative h-96 bg-gradient-to-b from-blue-800 to-blue-600 rounded-xl overflow-hidden border border-blue-400/30 shadow-inner" ref={containerRef}>
      <div className="absolute top-4 right-4 bg-black/40 px-3 py-1 rounded text-white font-mono">
        Time: {timeLeft}s | Score: {score}
      </div>
      <div className="absolute bottom-0 w-full h-12 bg-blue-900/50 backdrop-blur-sm flex items-center justify-center text-sm text-blue-200">
        Click trash 🥤 to clean. Don't click fish 🐟!
      </div>
      {items.map(item => (
        <motion.div
          key={item.id}
          className="absolute text-4xl cursor-pointer select-none hover:scale-110 active:scale-90 transition-transform"
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
    const bonusMultiplier = Math.min(1 + (streak * 0.1), 1.5);
    const delta = Math.round(pts * bonusMultiplier);
    const updated = { ...progress, points: progress.points + delta, gamesPlayed: progress.gamesPlayed + 1 };
    setProgress(updated);
    saveProgress(updated);

    // Check achievements
    if (meta.mission === 'quiz' && meta.event === 'completed' && !progress.achievements?.includes('first-quiz')) grantAchievement('first-quiz');
    if (meta.mission === 'trash' && meta.event === 'progress' && !progress.achievements?.includes('first-trash')) grantAchievement('first-trash');
    if (meta.mission === 'cleanup' && meta.event === 'completed' && !progress.achievements?.includes('first-cleanup')) grantAchievement('first-cleanup');
  };

  const grantAchievement = (id) => {
    if (progress.achievements?.includes(id)) return;
    const updated = { ...progress, achievements: [...(progress.achievements || []), id] };
    setProgress(updated);
    saveProgress(updated);
    const meta = achievementsCatalog.find(a => a.id === id);
    if (meta) setShowAchievement({ title: `${meta.label}!`, message: 'Great job!' });
  };



  const CARD_CLASS = "bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 shadow-xl";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-slate-900 to-black text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className={`${CARD_CLASS} flex flex-col md:flex-row items-center gap-6`}>
          <img src="https://nmcg.nic.in/images/nmcgGif.gif" alt="NMCG" className="w-16 h-16 object-contain" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {t('games.title')}
            </h1>
            <p className="text-gray-400 mt-1">{t('games.subtitle')}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-gray-400">Streak</div>
              <div className="text-xl font-bold text-orange-400">{progress.streak || 0} 🔥</div>
            </div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center shadow-lg shadow-emerald-900/20">
              <span className="text-2xl font-bold">{progress.points}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">pts</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Game Area */}
          <div className="lg:col-span-8">
            <motion.div layout className={`${CARD_CLASS} min-h-[500px]`}>
              {!activeGame ? (
                <div className="h-full flex flex-col items-center justify-center py-12">
                  <h2 className="text-2xl font-semibold mb-8 text-blue-300">{t('games.mission')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl px-4">
                    <GameCard
                      title={t('games.quiz')}
                      icon="🧠"
                      color="from-purple-500 to-indigo-600"
                      onClick={() => setActiveGame('quiz')}
                    />
                    <GameCard
                      title={t('games.trash')}
                      icon="♻️"
                      color="from-emerald-500 to-teal-600"
                      onClick={() => setActiveGame('trash')}
                    />
                    <GameCard
                      title={t('games.cleanup')}
                      icon="🌊"
                      color="from-blue-500 to-cyan-600"
                      onClick={() => setActiveGame('cleanup')}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <h2 className="text-xl font-semibold text-blue-300">
                      {activeGame === 'quiz' && t('games.quiz')}
                      {activeGame === 'trash' && t('games.trash')}
                      {activeGame === 'cleanup' && t('games.cleanup')}
                    </h2>
                    <button onClick={() => setActiveGame(null)} className="text-sm text-gray-400 hover:text-white transition-colors">
                      ← Back to Menu
                    </button>
                  </div>
                  {activeGame === 'quiz' && <QuizGame onScore={addPoints} />}
                  {activeGame === 'trash' && <TrashSort onScore={addPoints} />}
                  {activeGame === 'cleanup' && <RiverCleanup onScore={addPoints} />}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className={CARD_CLASS}>
              <PlayerNamePrompt onChange={setPlayerName} />
            </div>

            <div className={CARD_CLASS}>
              <h3 className="font-semibold text-gray-200 mb-4">Badges</h3>
              <div className="grid grid-cols-3 gap-2">
                {badgeRules.map(b => {
                  const unlocked = progress.points >= b.threshold;
                  return (
                    <div key={b.id} className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-center border ${unlocked ? b.color : 'bg-gray-800 border-gray-700 opacity-50'}`}>
                      <div className="text-2xl mb-1">{unlocked ? '🏆' : '🔒'}</div>
                      <div className="text-[10px] leading-tight">{b.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={CARD_CLASS}>
              <h3 className="font-semibold text-gray-200 mb-4">Leaderboard</h3>
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

function GameCard({ title, icon, color, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-6 h-48 flex flex-col items-center justify-center gap-4 text-white shadow-lg group`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition-opacity`} />
      <div className={`absolute inset-0 border-2 border-white/10 rounded-2xl`} />
      <div className="text-5xl drop-shadow-md">{icon}</div>
      <div className="font-bold text-lg tracking-wide">{title}</div>
    </motion.button>
  );
}
GameCard.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.string,
  color: PropTypes.string,
  onClick: PropTypes.func
};
