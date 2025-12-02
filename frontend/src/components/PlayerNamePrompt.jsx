import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaUser } from 'react-icons/fa';

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
    <div className="rounded-xl bg-gray-800/60 p-4 shadow-lg border border-gray-700 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-100 font-headline">Player Name</h4>
        <button 
          onClick={useAccountName}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-blue-400/10"
          title="Use your logged-in account name"
        >
          <FaUser size={10} />
          Use account name
        </button>
      </div>
      <div className="flex gap-2 items-stretch">
        <input
          disabled={locked}
          className={`flex-1 bg-gray-900/60 placeholder-gray-500 text-gray-100 rounded-lg px-3 py-2 border border-gray-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${locked ? 'opacity-70 cursor-not-allowed bg-gray-800' : ''}`}
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
        />
        {!locked ? (
          <button 
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95" 
            onClick={save}
          >
            Save
          </button>
        ) : (
          <button 
            className="px-4 py-2 bg-slate-700 text-gray-200 rounded-lg font-medium hover:bg-slate-600 transition-all border border-slate-600 hover:border-slate-500 active:scale-95" 
            onClick={() => { setLocked(false); }}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerNamePrompt;

PlayerNamePrompt.propTypes = {
  onChange: PropTypes.func,
};
