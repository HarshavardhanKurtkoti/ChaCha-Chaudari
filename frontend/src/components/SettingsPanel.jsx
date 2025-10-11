import PropTypes from 'prop-types';
import { useSettings } from 'context/SettingsContext';

const SettingsPanel = ({ onResetProgress, onResetLeaderboard }) => {
  const { settings, setSetting } = useSettings();
  return (
    <div className="rounded-xl bg-gray-800/60 p-4 shadow-lg border border-gray-700">
      <h4 className="font-semibold text-gray-100">Settings</h4>
      <div className="mt-3 flex items-center justify-between">
        <label className="text-sm text-gray-200">Sound Effects</label>
        <button
          className={`px-3 py-1 rounded text-sm ${settings.soundEnabled ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-200'}`}
          onClick={() => setSetting('soundEnabled', !settings.soundEnabled)}
        >
          {settings.soundEnabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        <button className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm" onClick={onResetProgress}>Reset Progress</button>
        <button className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm" onClick={onResetLeaderboard}>Reset Leaderboard</button>
      </div>
    </div>
  );
};

export default SettingsPanel;

SettingsPanel.propTypes = {
  onResetProgress: PropTypes.func,
  onResetLeaderboard: PropTypes.func,
};
