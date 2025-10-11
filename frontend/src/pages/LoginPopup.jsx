import PropTypes from 'prop-types';

const LoginPopup = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold mb-3 text-gray-900">Welcome back</h3>
        <p className="text-gray-600 mb-6">Sign in to save your progress and personalize your experience.</p>
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
            onClick={onClose}
          >
            Continue
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
            onClick={onClose}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPopup;

LoginPopup.propTypes = {
  onClose: PropTypes.func,
};
