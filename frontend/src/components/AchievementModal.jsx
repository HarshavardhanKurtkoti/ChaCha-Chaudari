import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSettings } from 'context/SettingsContext';

function playChime(soundEnabled) {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(660, ctx.currentTime);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    o.connect(g).connect(ctx.destination);
    o.start();
    // quick up-down arpeggio
    o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.24);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn('Achievement sound error', e);
  }
}

const AchievementModal = ({ title, message, onClose }) => {
  const canvasRef = useRef(null);
  const [confettiLoaded, setConfettiLoaded] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    if (!title) return;
    playChime(settings?.soundEnabled);

    // Try dynamic import of canvas-confetti for a nicer burst
    (async () => {
      try {
        const mod = await import('canvas-confetti');
        const confetti = mod.default || mod;
        confetti({ particleCount: 160, spread: 70, origin: { y: 0.3 } });
        setConfettiLoaded(true);
      } catch {
        // fallback to local canvas animation below
      }
    })();

    const canvas = canvasRef.current;
    if (!canvas) return;
  const ctx = canvas.getContext('2d');
    let animationId;
    const particles = new Array(120).fill(0).map(() => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height,
      r: 2 + Math.random() * 4,
      c: `hsl(${Math.floor(Math.random() * 360)},80%,60%)`,
      vx: -1 + Math.random() * 2,
      vy: 2 + Math.random() * 3,
      a: Math.random() * Math.PI * 2,
      va: -0.05 + Math.random() * 0.1,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.va;
        if (p.y - p.r > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      });
      animationId = requestAnimationFrame(draw);
    };

    // Only run fallback animation if confetti lib didn't fire
    if (!confettiLoaded) {
      draw();
    }
    const id = setTimeout(() => onClose && onClose(), 3500);
    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(id);
      window.removeEventListener('resize', resize);
    };
  }, [title, onClose, confettiLoaded, settings?.soundEnabled]);

  if (!title) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-80 text-center border">
        <div className="text-3xl mb-2">🏅</div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
      </div>
    </div>
  );
};

export default AchievementModal;

AchievementModal.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  onClose: PropTypes.func,
};
