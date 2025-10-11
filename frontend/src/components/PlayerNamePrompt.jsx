import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const NAME_KEY = 'gangaPlayerName:v1';

const PlayerNamePrompt = ({ onChange }) => {
  const [name, setName] = useState('');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    // Prefer an authenticated profile name if available
    try {
      const p = JSON.parse(localStorage.getItem('userProfile') || 'null');
      if (p?.name) {
        setName(p.name);
        setLocked(true);
        onChange && onChange(p.name);
        return;
      }
    } catch (e) { /* ignore */ }
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) {
      setName(saved);
      onChange && onChange(saved);
    }
  }, [onChange]);

  const save = () => {
    const trimmed = name.trim() || 'Anonymous';
    try { localStorage.setItem(NAME_KEY, trimmed); } catch (e) { /* ignore */ }
    onChange && onChange(trimmed);
  };

  const useAccountName = () => {
    try {
      const p = JSON.parse(localStorage.getItem('userProfile') || 'null');
      if (p?.name) {
        setName(p.name);
        setLocked(true);
        onChange && onChange(p.name);
        try { localStorage.setItem(NAME_KEY, p.name); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="rounded-xl bg-gray-800/60 p-4 shadow border border-gray-700">
      <h4 className="font-semibold text-gray-100">Player Name</h4>
      <div className="mt-2 flex gap-3 items-center">
        <input
          disabled={locked}
          className={`flex-1 bg-gray-900/60 placeholder-gray-400 text-gray-100 rounded px-3 py-2 border border-gray-700 outline-none focus:ring-2 focus:ring-emerald-300 ${locked ? 'opacity-70 cursor-not-allowed' : ''}`}
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
        />
        {!locked ? (
          <button className="px-3 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600" onClick={save}>Save</button>
        ) : (
          <button className="px-3 py-2 bg-slate-600 text-white rounded hover:bg-slate-700" onClick={() => { setLocked(false); }}>Edit</button>
        )}
        <div className="ml-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm" onClick={useAccountName}>Use account name</button>
        </div>
      </div>
    </div>
  );
};

export default PlayerNamePrompt;

PlayerNamePrompt.propTypes = {
  onChange: PropTypes.func,
};
