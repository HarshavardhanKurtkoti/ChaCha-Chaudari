import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProgressBar from 'components/ProgressBar';
import Badge from 'components/Badge';
import Leaderboard from 'components/Leaderboard';
import AchievementModal from 'components/AchievementModal';
import PlayerNamePrompt from 'components/PlayerNamePrompt';
import DailyReward from 'components/DailyReward';
import SettingsPanel from 'components/SettingsPanel';
import PropTypes from 'prop-types';

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

// Expanded badge rules (higher thresholds added so progress keeps growing)
const badgeRules = [
  { id: 'seedling', label: 'Ganga Seedling', threshold: 25, color: 'bg-green-200 text-green-900' },
  { id: 'streamkeeper', label: 'Stream Keeper', threshold: 75, color: 'bg-blue-200 text-blue-900' },
  { id: 'river-guardian', label: 'River Guardian', threshold: 150, color: 'bg-indigo-200 text-indigo-900' },
  { id: 'river-champion', label: 'River Champion', threshold: 300, color: 'bg-emerald-200 text-emerald-900' },
  { id: 'river-legend', label: 'River Legend', threshold: 600, color: 'bg-yellow-200 text-yellow-900' },
  { id: 'river-hero', label: 'River Hero', threshold: 1200, color: 'bg-pink-200 text-pink-900' },
];

// Achievements independent of badges
const achievementsCatalog = [
  { id: 'first-quiz', icon: '🧠', label: 'First Quiz Completed' },
  { id: 'first-trash', icon: '🗑️', label: 'First Trash Sort Completed' },
  { id: 'streak-3', icon: '🔥', label: '3-Day Streak' },
  { id: 'streak-7', icon: '⚡', label: '7-Day Streak' },
];

// Quiz questions (kid-friendly and educational)
const QUIZ = [
  {
    q: 'Why is the Ganga important to people?',
    options: ['It looks pretty', 'It gives water and life to many', 'It is a road', 'It is a desert'],
    a: 1,
    fact: 'The Ganga supports drinking water, farming, fish, and wildlife for millions of people.'
  },
  {
    q: 'What should we do with plastic bottles?',
    options: ['Throw in river', 'Burn outside', 'Recycle properly', 'Bury in sand'],
    a: 2,
    fact: 'Recycling keeps plastic out of rivers and oceans and saves energy.'
  },
  {
    q: 'Which is good for the river?',
    options: ['Plant trees near banks', 'Dump soap water', 'Leave trash after picnics', 'Pour oil'],
    a: 0,
    fact: 'Trees protect soil, give shade, and help keep river water clean.'
  },
  {
    q: 'Who keeps the river clean?',
    options: ['Only the government', 'Only grown-ups', 'All of us together', 'No one can'],
    a: 2,
    fact: 'When everyone helps a little, the river stays healthy and happy.'
  },
  {
    q: 'What is Namami Gange?',
    options: ['A new cartoon', 'A program to clean and protect the Ganga', 'A sports team', 'A festival food'],
    a: 1,
    fact: 'Namami Gange is a mission to clean, protect, and restore the Ganga river.'
  }
  ,
  {
    q: 'How can you help keep rivers clean?',
    options: ['Throw trash in water', 'Pick up litter and recycle', 'Use too much soap', 'Cut down trees'],
    a: 1,
    fact: 'Picking up litter and recycling reduces pollution that harms fish and people.'
  },
  {
    q: 'Which of these is water-friendly farming?',
    options: ['Using lots of chemical runoff', 'Planting buffer trees and reducing runoff', 'Draining wetlands', 'Dumping waste'],
    a: 1,
    fact: 'Trees and careful farming prevent soil and pollutants from entering rivers.'
  },
  {
    q: 'Why should we not pour oil down the drain?',
    options: ['It feeds fish', 'It causes pollution and harms aquatic life', 'It cleans water', 'It disappears'],
    a: 1,
    fact: 'Oil and grease pollute water and make it hard for plants and animals to live.'
  },
  {
    q: 'What should you do with old batteries?',
    options: ['Throw in regular trash', 'Put in river', 'Take to hazardous waste or recycling point', 'Burn them'],
    a: 2,
    fact: 'Batteries contain chemicals that need special disposal to avoid soil and water contamination.'
  }
];

function QuizGame({ onScore }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = QUIZ[index];

  const handleAnswer = (i) => {
    if (selected !== null) return; // already answered
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
    }, 900);
  };

  if (finished) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-2xl font-bold text-emerald-300">Quiz Complete!</h3>
        <p className="mt-3 text-lg">You earned <span className="font-semibold">{score}</span> points.</p>
        <p className="text-sm text-gray-400 mt-2">Great job learning how to protect our river!</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <div className="text-sm text-gray-400">Question {index + 1} of {QUIZ.length}</div>
      <h3 className="text-2xl font-semibold mt-2 text-white">{current.q}</h3>
      <div className="grid gap-4 mt-6 md:grid-cols-2">
        {current.options.map((opt, i) => {
          const isCorrect = selected !== null && i === current.a;
          const isWrong = selected === i && i !== current.a;
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-transform transform ${
                isCorrect ? 'bg-emerald-500 text-white shadow-md scale-[1.01]' : isWrong ? 'bg-rose-500 text-white shadow-md' : 'bg-gray-800/50 hover:bg-gray-700 border border-gray-700 text-gray-100 hover:shadow-lg'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <p className="mt-4 text-sm text-gray-400"><span className="font-medium">Did you know?</span> {current.fact}</p>
      )}
    </div>
  );
}
QuizGame.propTypes = { onScore: PropTypes.func.isRequired };

// Trash sort mini-game: pick the correct bin for a random item
const TRASH = [
  { name: 'Plastic bottle', bin: 'Recycle' },
  { name: 'Banana peel', bin: 'Organic' },
  { name: 'Newspaper', bin: 'Recycle' },
  { name: 'Broken glass', bin: 'Recycle' },
  { name: 'Oil/grease', bin: 'Hazard' },
  { name: 'Food leftover', bin: 'Organic' },
  { name: 'Battery', bin: 'Hazard' },
  { name: 'Cardboard box', bin: 'Recycle' },
  { name: 'Yoghurt cup', bin: 'Recycle' },
  { name: 'Tea bag', bin: 'Organic' },
  { name: 'Glass bottle', bin: 'Recycle' },
  { name: 'Tin can', bin: 'Recycle' },
  { name: 'Cloth rag', bin: 'Organic' },
  { name: 'E-waste (old phone)', bin: 'Hazard' },
  { name: 'Plastic bag', bin: 'Recycle' }
];
const BINS = ['Organic', 'Recycle', 'Hazard'];


function TrashSort({ onScore }) {
  // Use an index to avoid immediately repeating the same item
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * TRASH.length));
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);

  const next = () => setCurrentIndex((prev) => {
    if (TRASH.length <= 1) return prev;
    let idx = Math.floor(Math.random() * TRASH.length);
    // avoid immediate repeat
    let attempts = 0;
    while (idx === prev && attempts < 6) { idx = Math.floor(Math.random() * TRASH.length); attempts += 1; }
    return idx;
  });

  const choose = (bin) => {
    const item = TRASH[currentIndex];
    const correct = bin === item.bin;
    setTotal((prev) => {
      const newTotal = prev + 1;
      if (correct) {
        setStreak((s) => s + 1);
        onScore(5, { mission: 'trash', event: 'progress' }); // small incremental points
      } else {
        setStreak(0);
      }
      if (newTotal >= 10) {
        setDone(true);
      } else {
        next();
      }
      return newTotal;
    });
  };

  if (done) {
    return (
      <div className="p-4">
        <h3 className="text-xl font-bold text-emerald-300">Nice sorting!</h3>
        <p className="mt-2 text-gray-200">You completed 10 items. Keep rivers clean by putting waste in the right bin.</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <div className="text-sm text-gray-400">Round {total + 1} of 10</div>
      <h3 className="text-2xl font-semibold mt-2 text-white">Where should this go?</h3>
      <div className="mt-6 p-6 rounded-lg bg-gray-900/50 border border-gray-700 text-gray-100 flex items-center justify-center gap-4">
        <span className="text-4xl">🧺</span>
        <span className="ml-2 text-lg font-medium text-gray-100">{TRASH[currentIndex].name}</span>
      </div>
      <div className="flex gap-4 mt-6 justify-center">
        {BINS.map((b) => (
          <button key={b} onClick={() => choose(b)} className="px-5 py-2 rounded-full bg-emerald-600 text-white shadow hover:bg-emerald-500 transition-transform hover:-translate-y-0.5">
            {b}
          </button>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-400">Streak: <span className="font-semibold text-emerald-300">{streak}</span></div>
    </div>
  );
}
TrashSort.propTypes = { onScore: PropTypes.func.isRequired };

function BadgeCabinet({ points, badges }) {
  const unlocked = useMemo(() => badgeRules.filter((b) => points >= b.threshold).map((b) => b.id), [points]);
  return (
    <div className="grid grid-cols-3 gap-2">
      {badgeRules.map((b) => {
        const isOn = unlocked.includes(b.id) || badges.includes(b.id);
        return (
          <div key={b.id} className={`rounded px-2 py-3 text-center border ${isOn ? b.color : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
            {b.label}
          </div>
        );
      })}
    </div>
  );
}
BadgeCabinet.propTypes = {
  points: PropTypes.number.isRequired,
  badges: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default function Games() {
  const [progress, setProgress] = useState(loadProgress());
  const [activeGame, setActiveGame] = useState(null); // 'quiz' | 'trash' | null
  const [showAchievement, setShowAchievement] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [lbKey, setLbKey] = useState(0);

  // motion variants for page and cards
  const page = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, when: 'beforeChildren' } },
    exit: { opacity: 0, y: -6 }
  };
  const card = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
    hover: { scale: 1.02, boxShadow: '0 18px 40px rgba(2,6,23,0.12)' }
  };

  // reusable card class for consistent dark surface
  const CARD = 'rounded-xl bg-gray-800/60 p-4 shadow-lg border border-gray-700 backdrop-blur-sm';

  const grantAchievement = useCallback((id) => {
    if (progress.achievements?.includes(id)) return;
    const updated = { ...progress, achievements: [...(progress.achievements || []), id] };
    setProgress(updated);
    saveProgress(updated);
    const meta = achievementsCatalog.find(a => a.id === id);
    if (meta) setShowAchievement({ title: `${meta.label}!`, message: 'Great job!' });
  }, [progress]);

  useEffect(() => {
    // award missing badges based on points
    const needObjs = badgeRules.filter((b) => progress.points >= b.threshold && !progress.badges.includes(b.id));
    if (needObjs.length) {
      // add badges and notify for the first newly unlocked
      const newBadges = needObjs.map((b) => b.id);
      const updated = { ...progress, badges: [...new Set([...progress.badges, ...newBadges])] };
      setProgress(updated);
      saveProgress(updated);
      // Show achievement modal for the first new badge
      setShowAchievement({ title: `${needObjs[0].label} Unlocked!`, message: `You reached ${needObjs[0].threshold} points.` });
    }
  }, [progress]);

  // Streak handling on mount/day change
  useEffect(() => {
    const today = new Date().toDateString();
    if (!progress.lastPlayDate) {
      const updated = { ...progress, lastPlayDate: today, streak: 1 };
      setProgress(updated);
      saveProgress(updated);
      return;
    }
    if (progress.lastPlayDate !== today) {
      const last = new Date(progress.lastPlayDate);
      const now = new Date(today);
      const dayDiff = Math.round((now - last) / (1000 * 60 * 60 * 24));
      let newStreak = progress.streak || 0;
      if (dayDiff === 1) newStreak += 1; else newStreak = 1;
      const updated = { ...progress, lastPlayDate: today, streak: newStreak };
      setProgress(updated);
      saveProgress(updated);
      if (newStreak === 3 && !progress.achievements?.includes('streak-3')) {
        grantAchievement('streak-3');
      }
      if (newStreak === 7 && !progress.achievements?.includes('streak-7')) {
        grantAchievement('streak-7');
      }
    }
  }, [progress, grantAchievement]);


  const addPoints = (pts, meta = {}) => {
    const streak = progress.streak || 0;
    const bonusMultiplier = Math.min(1 + (streak * 0.1), 1.5); // up to +50%
    const delta = Math.round(pts * bonusMultiplier);
    const updated = { ...progress, points: progress.points + delta, gamesPlayed: progress.gamesPlayed + 1 };
    setProgress(updated);
    saveProgress(updated);
    if (meta.mission === 'quiz' && meta.event === 'completed' && !(progress.achievements || []).includes('first-quiz')) {
      grantAchievement('first-quiz');
    }
    if (meta.mission === 'trash' && meta.event === 'progress' && !(progress.achievements || []).includes('first-trash')) {
      grantAchievement('first-trash');
    }
  };

  const resetProgress = () => {
    const cleared = { points: 0, badges: [], gamesPlayed: 0, achievements: [], lastPlayDate: null, streak: 0 };
    setProgress(cleared);
    saveProgress(cleared);
  };

  const resetLeaderboard = () => {
    try {
      localStorage.removeItem('gangaLeaderboard:v1');
    } catch (e) {
      // ignore storage errors
    }
    setLbKey((k) => k + 1); // remount Leaderboard to reload from storage
  };

  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={page} className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-gray-100">
      <div className="max-w-6xl mx-auto p-6">
        <motion.header variants={card} className="rounded-2xl bg-gradient-to-br from-gray-800/70 to-gray-900/70 shadow-lg p-6 flex items-center gap-4 transform-gpu backdrop-blur-sm border border-gray-700">
          <img src="https://nmcg.nic.in/images/nmcgGif.gif" alt="NMCG" className="w-14 h-14" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">River Guardians: Play & Learn</h1>
            <p className="text-gray-300 text-sm">Have fun while learning how to protect Maa Ganga. Earn points and unlock badges!</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="text-sm text-gray-300">Daily Streak</div>
              <div className="text-xs text-gray-300">{progress.streak || 0} 🔥</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500 text-white w-20 h-20 flex flex-col items-center justify-center shadow-lg">
                <div className="text-sm font-bold">{progress.points}</div>
                <div className="text-[10px]">pts</div>
              </div>
            </div>
          </div>
        </motion.header>

        <section className="grid grid-cols-12 gap-6 mt-6 items-start">
          {/* Mission area: large rounded container with centered buttons */}
          <motion.div variants={card} className={`col-span-12 ${CARD.replace('p-4','p-6')} rounded-2xl`}>
            <div className="max-w-3xl mx-auto text-center py-6">
              {!activeGame && (
                <>
                  <h3 className="font-semibold text-blue-700 text-lg mb-4">Choose a mission</h3>
                  <div className="flex gap-6 justify-center">
                    <motion.button whileHover={{ scale: 1.03 }} whileFocus={{ scale: 1.02 }} onClick={() => setActiveGame('quiz')} className="px-6 py-3 rounded-md bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-700 hover:brightness-110">
                      <div className="text-sm font-semibold text-white">Ganga quiz</div>
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03 }} whileFocus={{ scale: 1.02 }} onClick={() => setActiveGame('trash')} className="px-6 py-3 rounded-md bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-700 hover:brightness-110">
                      <div className="text-sm font-semibold text-white">Trash sort</div>
                    </motion.button>
                  </div>
                </>
              )}

              {activeGame === 'quiz' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-blue-700 text-lg">Mission: Ganga Quiz</h3>
                    <button className="text-sm text-blue-700 underline" onClick={() => setActiveGame(null)}>Back</button>
                  </div>
                  <QuizGame onScore={(pts) => addPoints(pts)} />
                </div>
              )}

              {activeGame === 'trash' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-blue-700 text-lg">Mission: Trash Sort</h3>
                    <button className="text-sm text-blue-700 underline" onClick={() => setActiveGame(null)}>Back</button>
                  </div>
                  <TrashSort onScore={(pts) => addPoints(pts)} />
                </div>
              )}
            </div>
          </motion.div>

          {/* Two-column layout: left small stacked boxes, right big badges + daily */}
          <div className="col-span-12 grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-6 space-y-6">
              <motion.div variants={card} className={CARD}>
                <PlayerNamePrompt onChange={setPlayerName} />
              </motion.div>

              <motion.div variants={card} className={CARD}>
                <h3 className="font-semibold text-gray-100">Leaderboard</h3>
                <Leaderboard key={lbKey} currentUser={playerName || undefined} currentScore={progress.points} />
              </motion.div>

              <motion.div variants={card} className={CARD}>
                <SettingsPanel onResetProgress={resetProgress} onResetLeaderboard={resetLeaderboard} />
              </motion.div>

              <motion.div variants={card} className={CARD}>
                <h4 className="font-semibold text-gray-100">Achievements</h4>
                {(!progress.achievements || progress.achievements.length === 0) ? (
                  <p className="text-sm text-gray-300 mt-2">No achievements yet. Complete missions and keep a streak going!</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    {progress.achievements.map(id => {
                      const meta = achievementsCatalog.find(a => a.id === id);
                      if (!meta) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 p-3 rounded border bg-gray-800/40 border-gray-700">
                          <div className="text-xl">{meta.icon}</div>
                          <div className="text-sm font-medium text-gray-100">{meta.label}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>

            <div className="col-span-12 lg:col-span-6 space-y-6">
              <motion.div variants={card} className={CARD}>
                <h3 className="font-semibold text-emerald-300">Badges & Progress</h3>
                <div className="mt-3">
                  {/* ProgressBar now scales to the next badge threshold so it never 'finishes' prematurely */}
                  <ProgressBar value={progress.points} max={(() => {
                    // find first badge threshold greater than current points
                    const next = badgeRules.find(b => b.threshold > (progress.points || 0));
                    if (next) return next.threshold;
                    // if all badges passed, use 1.5x of current points as max so it keeps growing
                    return Math.ceil((progress.points || 1) * 1.5);
                  })()} />
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    {badgeRules.map((b) => (
                      <Badge key={b.id} label={b.label} unlocked={progress.points >= b.threshold || progress.badges.includes(b.id)} />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <button onClick={resetProgress} className="text-xs text-rose-400 underline">Reset Progress</button>
                    <span className="ml-auto text-gray-300">Games played: {progress.gamesPlayed}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={card} className={CARD}>
                <h4 className="font-semibold text-gray-100">Daily Reward</h4>
                <p className="text-sm text-gray-300 mt-2">Come back each day to claim a bonus. Your current streak adds a multiplier!</p>
                <DailyReward progress={progress} onClaim={(pts) => addPoints(pts, { mission: 'daily', event: 'claim' })} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Duplicate section removed: content lives in the right sidebar now */}

        {showAchievement && (
          <AchievementModal title={showAchievement.title} message={showAchievement.message} onClose={() => setShowAchievement(null)} />
        )}

        <motion.section variants={card} className="rounded-xl bg-gray-800/60 p-4 shadow border border-gray-700 mt-6">
          <h3 className="font-semibold text-emerald-300">About</h3>
          <p className="text-sm text-gray-300 mt-1">
            These games support the Namami Gange objective by helping children learn and practice small actions
            that strengthen the river-people connect: proper waste sorting, tree planting, saving water and
            responsible celebration near ghats.
          </p>
        </motion.section>
      </div>
    </motion.div>
  );
}
