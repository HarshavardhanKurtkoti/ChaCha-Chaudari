import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * TiltCard provides interactive 3D perspective tilt on hover,
 * with automatic fallback to flat scaling when prefers-reduced-motion is active.
 */
const TiltCard = ({
  children,
  maxTilt = 15,
  hoverScale = 1.05,
  className = '',
  disabled = false,
  ...props
}) => {
  const cardRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e) => setReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 180, damping: 18 };
  const mouseX = useSpring(x, springConfig);
  const mouseY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    if (disabled || reducedMotion) return;
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    const xPct = mouseXPos / rect.width - 0.5;
    const yPct = mouseYPos / rect.height - 0.5;

    x.set(xPct * maxTilt);
    y.set(yPct * maxTilt);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (reducedMotion || disabled) {
    return (
      <div
        ref={cardRef}
        className={`transition-transform duration-200 hover:scale-[1.01] ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{ perspective: 1000 }}
      className="inline-block w-full"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateY: mouseX,
          rotateX: mouseY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: hoverScale }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className={`will-change-transform ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    </div>
  );
};

TiltCard.propTypes = {
  children: PropTypes.node.isRequired,
  maxTilt: PropTypes.number,
  hoverScale: PropTypes.number,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default TiltCard;

