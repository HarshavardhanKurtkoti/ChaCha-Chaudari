
import CarouselsReco from 'components/CarouselsReco';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function StatCard({ value, label, accent = 'bg-blue-500' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      className={`rounded-xl p-4 ${accent} text-white shadow-lg flex flex-col`}
    >
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-sm opacity-90 mt-1">{label}</div>
    </motion.div>
  );
}

function InfoCard({ title, children }) {
  return (
    <motion.article
      variants={sectionVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      className="rounded-xl bg-white/95 shadow p-6 border border-gray-100 h-full flex flex-col"
    >
      <h3 className="text-xl font-semibold text-blue-800 mb-3">{title}</h3>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.45 }} className="text-gray-700 prose max-w-none flex-grow">
        {children}
      </motion.div>
    </motion.article>
  );
}

function RiverineEcology() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-100 pb-12">
      {/* HERO */}
      <header className="max-w-7xl mx-auto px-4 mt-8">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">Dive into the Hidden World of Riverine Ecosystems</h1>
            <p className="mt-3 text-lg text-white/90">Explore biodiversity, threats, and the vital services rivers provide. Interactive visuals and key facts help you learn quickly.</p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard value="1,086,000 km²" label="Ganga Basin area" accent="bg-indigo-600" />
              <StatCard value="260 MLD" label="Industrial waste/day" accent="bg-red-600" />
              <StatCard value="150+" label="Species & habitats" accent="bg-emerald-600" />
              <StatCard value="24/7" label="Chat & Learning" accent="bg-blue-700" />
            </div>
          </div>

          <div className="w-full md:w-2/5">
            <motion.div initial={{ scale: 0.98 }} whileInView={{ scale: 1 }} transition={{ duration: 0.45 }} className="rounded-xl overflow-hidden bg-white/90 p-3">
              <CarouselsReco />
            </motion.div>
          </div>
        </motion.div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start min-h-[60vh]">
        <section className="lg:col-span-2 space-y-6 h-full">
          <motion.div initial="hidden" whileInView="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
            <InfoCard title="Introduction">
              <ul className="list-disc pl-5">
                <li>The Himalaya has the largest concentration of glaciers outside the polar caps with a coverage area of 33,000 km², providing vast freshwater resources to Asia's major rivers.</li>
                <li>The mountain system is fragile: glaciated sediments and changing climate patterns affect river flow regimes and long-term water supply.</li>
              </ul>
            </InfoCard>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
              <InfoCard title="Ganga Basin">
                <p>The Ganga basin drains an area of ~1,086,000 km²; much of the catchment falls inside India across several states. It includes the Himalayan hills, central highlands and the alluvial Gangetic plains.</p>
                <ul className="list-disc pl-5 mt-3">
                  <li>The basin supports agriculture, fisheries and riverine communities across multiple states.</li>
                  <li>Physiographic zones: Himalayan mountains, Central highlands, and Gangetic plain.</li>
                </ul>
              </InfoCard>

              <InfoCard title="Biodiversity & Services">
                <p>River ecosystems provide water, food, nutrient cycling and waste assimilation. Biodiversity plays a key role in maintaining water quality and productivity.</p>
                <p className="mt-2">Conservation of fish, amphibians and aquatic plants is essential for resilient river health.</p>
              </InfoCard>
            </div>

            <InfoCard title="Toxic Chemicals & Pollution">
              <ul className="list-disc pl-5">
                <li>The river receives vast volumes of industrial and municipal waste; pollutants accumulate and threaten wildlife and human health.</li>
                <li>Persistent pesticides and industrial chemicals bio-accumulate, affecting fish and top predators like the Ganges dolphin.</li>
                <li>Long-term solutions focus on source control, treatment infrastructure and community engagement.</li>
              </ul>
            </InfoCard>
          </motion.div>
        </section>

        <aside className="space-y-6 h-full flex flex-col justify-between">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="rounded-xl bg-white/95 shadow p-4 border border-gray-100 flex-none">
            <h4 className="font-semibold text-gray-800">Quick Facts</h4>
            <ul className="mt-3 text-sm text-gray-700 list-disc pl-5 space-y-2">
              <li>Ganga supports millions of livelihoods.</li>
              <li>Industrial + municipal loads are a major stressor.</li>
              <li>Community action reduces local pollution.</li>
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.06 }} className="rounded-xl bg-white/95 shadow p-4 border border-gray-100 flex-none">
            <h4 className="font-semibold text-gray-800">Explore</h4>
            <div className="mt-3 flex flex-col gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full text-left px-3 py-2 rounded bg-blue-50 hover:bg-blue-100">Riverine species</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full text-left px-3 py-2 rounded bg-blue-50 hover:bg-blue-100">Threat maps</motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full text-left px-3 py-2 rounded bg-blue-50 hover:bg-blue-100">Community stories</motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }} className="rounded-xl bg-white/95 shadow p-4 border border-gray-100 flex-none">
            <h4 className="font-semibold text-gray-800">Want to learn more?</h4>
            <p className="mt-2 text-sm text-gray-700">Use the chat to ask specific questions about riverine ecology, species, or conservation actions.</p>
          </motion.div>
        </aside>
      </main>
    </div>
  );
}

export default RiverineEcology;

