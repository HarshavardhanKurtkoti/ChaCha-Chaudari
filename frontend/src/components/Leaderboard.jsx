import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const LEADERBOARD_KEY = 'gangaLeaderboard:v1';

const readBoard = () => {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeBoard = (board) => localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));

const NAME_KEY = 'gangaPlayerName:v1';

const Leaderboard = ({ currentUser, currentScore = 0 }) => {
  const [board, setBoard] = useState([]);

  useEffect(() => {
  const savedName = localStorage.getItem(NAME_KEY) || 'You';
    const b = readBoard();
    // Add or update current user
    const user = currentUser || savedName;
    const idx = b.findIndex((r) => r.name === user);
    if (idx >= 0) b[idx].score = Math.max(b[idx].score, currentScore);
    else b.push({ name: user, score: currentScore });
    // sort
    b.sort((a, z) => z.score - a.score);
    // trim to top 10
    const trimmed = b.slice(0, 10);
    setBoard(trimmed);
    writeBoard(trimmed);
  }, [currentUser, currentScore]);

  return (
    <div className="mt-3">
      <ol className="space-y-2">
        {board.length === 0 && <li className="text-sm text-gray-400">No scores yet — be the first!</li>}
        {board.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between bg-transparent px-3 py-2 rounded">
            <span className="flex items-center gap-3">
              <span className="w-6 text-sm font-semibold text-gray-300">{i + 1}.</span>
              <span className="text-sm text-gray-200">{r.name}</span>
            </span>
            <span className="text-sm font-bold text-emerald-300">{r.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;

Leaderboard.propTypes = {
  currentUser: PropTypes.string,
  currentScore: PropTypes.number,
};
