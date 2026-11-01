import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-lg w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-md"
      >
        <div className="text-7xl mb-4 select-none">🗺️</div>
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-3">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
          River Bend Not Found
        </h2>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
          The page or river tributary you are looking for has flowed elsewhere or doesn&apos;t exist.
          Let Chacha Chaudhary guide you back to the main ghat!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-600/20 active:scale-95"
          >
            Back to Home
          </Link>
          <Link
            to="/chat"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700 active:scale-95"
          >
            Ask Chacha 💬
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

