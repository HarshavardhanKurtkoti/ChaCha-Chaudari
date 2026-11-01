import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * ConfettiCanvas provides celebratory confetti particle bursts
 * using canvas-confetti with an internal requestAnimationFrame fallback.
 */
const ConfettiCanvas = ({
  active = false,
  particleCount = 100,
  spread = 70,
  duration = 3000,
  onComplete,
}) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    let firedLibrary = false;

    // 1. Try canvas-confetti library
    import('canvas-confetti')
      .then((mod) => {
        const confetti = mod.default || mod;
        confetti({
          particleCount,
          spread,
          origin: { y: 0.6 },
        });
        firedLibrary = true;
      })
      .catch(() => {
        // Fallback to local canvas particles
        firedLibrary = false;
      });

    // 2. Local fallback animation if needed
    const canvas = canvasRef.current;
    if (canvas && !firedLibrary) {
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = Array.from({ length: Math.min(particleCount, 80) }, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.4 + Math.random() * 50,
        r: 3 + Math.random() * 4,
        color: `hsl(${Math.floor(Math.random() * 360)}, 85%, 60%)`,
        vx: (Math.random() - 0.5) * 6,
        vy: -3 - Math.random() * 5,
        gravity: 0.15,
        alpha: 1,
      }));

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let anyVisible = false;

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.alpha -= 0.008;

          if (p.alpha > 0) {
            anyVisible = true;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        if (anyVisible) {
          animRef.current = requestAnimationFrame(render);
        }
      };

      animRef.current = requestAnimationFrame(render);
    }

    timerRef.current = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, particleCount, spread, duration, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
    />
  );
};

ConfettiCanvas.propTypes = {
  active: PropTypes.bool,
  particleCount: PropTypes.number,
  spread: PropTypes.number,
  duration: PropTypes.number,
  onComplete: PropTypes.func,
};

export default ConfettiCanvas;

