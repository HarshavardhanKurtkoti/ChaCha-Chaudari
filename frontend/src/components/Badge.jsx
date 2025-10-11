import PropTypes from 'prop-types';

const Badge = ({ label, unlocked }) => {
  return (
    <div className={`flex flex-col items-center p-3 rounded-lg border ${unlocked ? 'bg-gray-800/50 border-transparent shadow-sm' : 'bg-gray-800/30 border-gray-700 text-gray-400'}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${unlocked ? 'bg-amber-400 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>
        <span className="text-lg">{unlocked ? '🏅' : '🔒'}</span>
      </div>
      <div className="text-sm font-medium text-center text-gray-200">{label}</div>
    </div>
  );
};

export default Badge;

Badge.propTypes = {
  label: PropTypes.string,
  unlocked: PropTypes.bool,
};
