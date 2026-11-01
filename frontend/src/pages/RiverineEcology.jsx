import PropTypes from 'prop-types';
import CarouselsReco from 'components/CarouselsReco';
import { motion } from 'framer-motion';
import { useTranslation } from 'hooks/useTranslation';
import { Waves, Droplets, Trees, ShieldAlert, Sparkles, Fish, Compass, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function StatCard({ value, label, sublabel, accent = 'text-cyan-400' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bento-card p-5 flex flex-col justify-between"
    >
      <div className={`text-2xl sm:text-3xl font-extrabold font-headline ${accent}`}>{value}</div>
      <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-2">{label}</div>
      {sublabel && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sublabel}</div>}
    </motion.div>
  );
}

StatCard.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sublabel: PropTypes.string,
  accent: PropTypes.string,
};

function InfoCard({ icon: Icon, title, tag, children }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4 }}
      className="bento-card p-6 sm:p-7 flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 w-fit">
              <Icon className="w-5 h-5" />
            </div>
          )}
          {tag && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
              {tag}
            </span>
          )}
        </div>
        <h3 className="text-lg sm:text-xl font-bold font-headline text-white mb-3 group-hover:text-cyan-300 transition-colors">
          {title}
        </h3>
        <div className="text-slate-300 text-sm leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </motion.article>
  );
}

InfoCard.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  tag: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function RiverineEcology() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 pb-24 pt-28 px-4 sm:px-6">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-600/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Hero Header */}
        <header className="rounded-3xl glass-panel p-6 sm:p-10 relative overflow-hidden">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
              <Waves className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ganga Basin Hydro-Ecological System</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-headline tracking-tight text-white leading-tight">
              {t('ecology.title') || 'Riverine Ecology & Biodiversity'}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {t('ecology.subtitle') || 'Explore the critical aquatic habitats, ecological sanctuaries, and biodiversity recovery programmes supported across the entire Ganges river basin.'}
            </p>
          </div>

          {/* Stat Cards */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard value="1,086,000 km²" label="Basin Catchment Area" sublabel="India's largest river basin" accent="gradient-text-cyan" />
            <StatCard value="150+ Species" label="Freshwater Fish Species" sublabel="Including Golden Mahseer" accent="gradient-text-emerald" />
            <StatCard value="2,525 km" label="Main Stem River Length" sublabel="Origin to Bay of Bengal" accent="gradient-text-gold" />
            <StatCard value="11 States" label="Complete Basin Reach" sublabel="43% of Indian population" accent="text-cyan-400" />
          </div>
        </header>

        {/* Interactive Species Carousel */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold font-headline text-white flex items-center gap-2">
              <Fish className="w-5 h-5 text-cyan-400" />
              <span>Flagship Riverine Species</span>
            </h2>
            <button
              onClick={() => navigate('/chat', { state: { initialPrompt: 'Tell me about all the aquatic animals in the Ganga river' } })}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>Ask Chacha about Wildlife</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <CarouselsReco onPromptSelect={(p) => navigate('/chat', { state: { initialPrompt: p } })} />
        </section>

        {/* Detailed Ecology Bento Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard icon={Droplets} title="Hydrology & Stream Health" tag="Water Quality">
            <p>
              The Ganga is characterized by unique sediment transport dynamics and seasonal monsoonal floods. Ensuring environmental flow (E-Flow) is critical to preserving riparian zones and maintaining natural oxygenation levels.
            </p>
          </InfoCard>

          <InfoCard icon={Fish} title="Aquatic Sanctuaries" tag="National Aquatic Animal">
            <p>
              The Gangetic River Dolphin is a bio-indicator for river health. Vikramshila Gangetic Dolphin Sanctuary in Bihar represents one of the premier protected zones safeguarding their echolocating populations.
            </p>
          </InfoCard>

          <InfoCard icon={Trees} title="Riparian Forestry & Afforestation" tag="Ecosystem Buffer">
            <p>
              Under Namami Gange, extensive afforestation along both riverbanks prevents silt erosion, regulates surface temperature, and restores natural riverine wetlands for migratory waterfowl.
            </p>
          </InfoCard>

          <InfoCard icon={ShieldAlert} title="Pollution Abatement & STPs" tag="Clean Water Mission">
            <p>
              Over 100 Sewage Treatment Plants (STPs) have been deployed across major cities like Kanpur, Varanasi, and Prayagraj to treat domestic and industrial effluent before discharging into the river.
            </p>
          </InfoCard>

          <InfoCard icon={Sparkles} title="Community Rejuvenation" tag="Citizen Action">
            <p>
              Ganga Praharis and local volunteers monitor water clarity, clean ghats, and protect nesting sites for freshwater turtles and gharials during annual breeding seasons.
            </p>
          </InfoCard>

          <InfoCard icon={Compass} title="AI Mascot Educational Connect" tag="SmartGanga">
            <p>
              Chacha Chaudhary serves as the conversational bridge, turning scientific ecological telemetry into accessible comic lessons for youth, inspiring the next generation of river champions.
            </p>
          </InfoCard>
        </section>
      </div>
    </div>
  );
}

export default RiverineEcology;
