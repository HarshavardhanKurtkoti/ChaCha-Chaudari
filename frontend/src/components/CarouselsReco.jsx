import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const DEFAULT_RECOMMENDATIONS = [
  {
    id: 1,
    title: 'Gangetic River Dolphin',
    tag: 'Flagship Species',
    desc: 'The National Aquatic Animal of India, blind by nature and navigating via echolocation. A vital indicator of freshwater health.',
    prompt: 'Tell me about the Gangetic Dolphin and its conservation.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 2,
    title: 'Gharial Recovery',
    tag: 'Critically Endangered',
    desc: 'Specialized fish-eating crocodilians thriving in deep, fast-flowing pools of the Ganga and Chambal tributaries.',
    prompt: 'How is Namami Gange helping Gharial populations?',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 3,
    title: 'Hilsa Fish Migration',
    tag: 'River Connectivity',
    desc: 'Navigation locks and fish passes are being created at Farakka Barrage to enable Hilsa to swim upstream to spawn.',
    prompt: 'What are fish passes and how do they help Hilsa in Ganga?',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    id: 4,
    title: 'Afforestation Along Banks',
    tag: 'Ecosystem Restoration',
    desc: 'Over 30,000 hectares planted with native riverine trees to curb soil erosion and filter surface runoff.',
    prompt: 'What afforestation projects are active under Namami Gange?',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
];

function CarouselsReco({ items = DEFAULT_RECOMMENDATIONS }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  const activeItems = items && items.length > 0 ? items : DEFAULT_RECOMMENDATIONS;
  const current = activeItems[index] || activeItems[0];

  useEffect(() => {
    if (isPaused || activeItems.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeItems.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, activeItems.length]);

  const nextSlide = () => setIndex((prev) => (prev + 1) % activeItems.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  };

  const handleAskChacha = (promptText) => {
    navigate('/chat', { state: { prefill: promptText } });
  };

  return (
    <div
      className="relative flex flex-col justify-between min-h-[260px] p-4 text-white select-none focus:outline-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Riverine Recommendations Carousel"
    >
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-sm tracking-wide uppercase">
            💡 Eco Highlight
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${current.badgeColor || 'border-cyan-500/30 text-cyan-300'}`}>
            {current.tag}
          </span>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {index + 1} / {activeItems.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id || index}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.28 }}
          className="flex-1 flex flex-col justify-between"
        >
          <div>
            <h4 className="text-lg font-bold text-white mb-1.5">{current.title}</h4>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{current.desc}</p>
          </div>

          <div className="mt-4 pt-2">
            <button
              onClick={() => handleAskChacha(current.prompt)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white transition-colors duration-150 shadow-sm"
              aria-label={`Ask Chacha about ${current.title}`}
            >
              <span>Ask Chacha</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/10">
        <div className="flex gap-1.5">
          {activeItems.map((item, i) => (
            <button
              key={item.id || i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === index ? 'w-5 bg-cyan-400' : 'w-1.5 bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex gap-1">
          <button
            onClick={prevSlide}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Previous slide"
          >
            &#8592;
          </button>
          <button
            onClick={nextSlide}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            aria-label="Next slide"
          >
            &#8594;
          </button>
        </div>
      </div>
    </div>
  );
}

export default CarouselsReco;

CarouselsReco.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object),
};
