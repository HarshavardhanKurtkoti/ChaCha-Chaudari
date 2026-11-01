const ChachaChaudhary = '/assets/images/chacha-chaudhary.png';
import { useTranslation } from 'hooks/useTranslation';
import { Sparkles, Waves } from 'lucide-react';

const Welcome = () => {
  const { t } = useTranslation();

  return (
    <div className="bento-card p-6 sm:p-7 bg-surface-900/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl text-slate-100 my-4 space-y-3">
      <div className="flex items-center gap-3.5">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-ganga-600/30 border border-ganga-400/40 p-0.5 shadow-glow-cyan shrink-0">
          <img
            loading="lazy"
            className="w-full h-full object-cover rounded-[10px]"
            src={ChachaChaudhary}
            alt="Chacha Chaudhary"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-headline text-white">
              {t('chat.welcome') || 'Namaste! I am Chacha Chaudhary'}
            </h2>
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Digital Ambassador • Namami Gange
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed font-normal pt-1">
        {t('chat.welcomeDesc') || 'I am here to guide you through Ganga river conservation, sacred ghats, aquatic ecology, and government initiatives. Ask me any question in English or हिन्दी!'}
      </p>
    </div>
  );
};

export default Welcome;
