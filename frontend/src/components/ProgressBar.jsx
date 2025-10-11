import PropTypes from 'prop-types';

const ProgressBar = ({ value = 0, max = 100 }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-800/40 rounded-full h-4 overflow-hidden border border-gray-700">
      <div className="h-4 bg-gradient-to-r from-emerald-500 to-emerald-400 text-xs text-white rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
};

export default ProgressBar;

ProgressBar.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
};
