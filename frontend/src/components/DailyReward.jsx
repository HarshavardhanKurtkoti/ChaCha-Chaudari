import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const CLAIM_KEY = 'gangaDailyReward:v1';

const getToday = () => new Date().toDateString();

// DailyReward: shows a claim button once per day. Base reward is 15 points.
// Props:
// - progress: current progress object (used to show streak info)
// - onClaim(points): callback to award points to the player
export default function DailyReward({ progress, onClaim }) {
  const [lastClaim, setLastClaim] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLAIM_KEY);
      if (raw) setLastClaim(raw);
    } catch (e) {
      console.warn('DailyReward: read error', e);
    }
  }, []);

  const today = getToday();
  const claimedToday = lastClaim === today;

  const baseReward = 15; // addPoints will apply streak multiplier

  const handleClaim = () => {
    if (claimedToday) return;
    onClaim?.(baseReward);
    try { localStorage.setItem(CLAIM_KEY, today); } catch (e) { console.warn('DailyReward: write error', e); }
    setLastClaim(today);
  };

  return (
    <div className="mt-3">
      {!claimedToday ? (
        <div className="flex items-center justify-between rounded border p-3 bg-gray-800/50 border-gray-700">
          <div>
            <div className="text-sm text-gray-200">Daily bonus available</div>
            <div className="text-xs text-gray-400">Base: {baseReward} pts • Streak: {progress.streak || 0}x 10% multiplier</div>
          </div>
          <button onClick={handleClaim} className="px-3 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 text-sm">Claim</button>
        </div>
      ) : (
        <div className="rounded border p-3 bg-gray-800/40 text-sm text-gray-300">You have claimed today&apos;s reward. Come back tomorrow!</div>
      )}
    </div>
  );
}

DailyReward.propTypes = {
  progress: PropTypes.shape({ streak: PropTypes.number }),
  onClaim: PropTypes.func,
};
