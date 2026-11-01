import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * ParallaxLayer provides subtle background parallax scroll movement
 * with automatic fallback when reduced-motion is requested.
 */
const ParallaxLayer = ({ speed = -120, className = '', children, ...props }) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handler = (e) => setReducedMotion(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else if (mq.addListener) {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  const { scrollY } = useScroll();
  const y = useTransform(scrollY, (v) => (reducedMotion ? 0 : (v * speed) / 1000));

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      style={{ y }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

ParallaxLayer.propTypes = {
  speed: PropTypes.number,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default ParallaxLayer;

