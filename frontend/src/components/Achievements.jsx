import PropTypes from 'prop-types';
import { ACHIEVEMENTS } from '../gamification/logic';

export const ACHIEVEMENTS_CATALOG = [
  {
    id: ACHIEVEMENTS.FIRST_QUIZ,
    title: 'Quiz Whiz',
    desc: 'Complete your first Namami Gange knowledge quiz',
    icon: '🧠',
    tier: 'Bronze',
  },
  {
    id: ACHIEVEMENTS.FIRST_TRASH,
    title: 'Sorter Extraordinaire',
    desc: 'Correctly classify recyclable and organic waste items',
    icon: '♻️',
    tier: 'Bronze',
  },
  {
    id: ACHIEVEMENTS.FIRST_CLEANUP,
    title: 'River Rescuer',
    desc: 'Complete a 30-second rapid river cleanup mission',
    icon: '🌊',
    tier: 'Silver',
  },
  {
    id: ACHIEVEMENTS.STREAK_3,
    title: 'Consistent Caretaker',
    desc: 'Maintain a 3-day learning streak',
    icon: '🔥',
    tier: 'Silver',
  },
  {
    id: ACHIEVEMENTS.STREAK_7,
    title: 'Ganga Devotee',
    desc: 'Maintain a 7-day river preservation streak',
    icon: '✨',
    tier: 'Gold',
  },
];

const Achievements = ({ unlockedIds = [], title = 'Achievements & Badges', showSummary = true }) => {
  const unlockedSet = new Set(unlockedIds || []);
  const total = ACHIEVEMENTS_CATALOG.length;
  const unlockedCount = ACHIEVEMENTS_CATALOG.filter((a) => unlockedSet.has(a.id)).length;
  const percent = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 text-white backdrop-blur-md">
      {showSummary && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700/60">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🏅</span>
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Earn awards by exploring stories, sorting waste, and keeping daily streaks!
            </p>
          </div>
          <div className="sm:text-right">
            <span className="text-2xl font-black text-cyan-400">
              {unlockedCount} / {total}
            </span>
            <div className="w-36 h-2 bg-slate-700 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ACHIEVEMENTS_CATALOG.map((item) => {
          const isUnlocked = unlockedSet.has(item.id);

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all duration-200 ${
                isUnlocked
                  ? 'bg-slate-800/80 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-800/20 border-slate-700/40 opacity-50 grayscale'
              }`}
            >
              <div
                className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-2xl ${
                  isUnlocked ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700/40 text-slate-500'
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-semibold text-sm text-white truncate">{item.title}</h4>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isUnlocked
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Achievements.propTypes = {
  unlockedIds: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string,
  showSummary: PropTypes.bool,
};

export default Achievements;

