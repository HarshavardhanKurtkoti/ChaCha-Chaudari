
import CarouselsReco from 'components/CarouselsReco';
import { motion } from 'framer-motion';
import { useTranslation } from 'hooks/useTranslation';

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
      className={`rounded-xl p-4 ${accent} text-white shadow-lg flex flex-col border border-white/10`}
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
      className="rounded-xl bg-gray-800/50 backdrop-blur-md shadow-xl p-6 border border-gray-700 h-full flex flex-col hover:bg-gray-800/70 transition-colors"
    >
      <h3 className="text-xl font-semibold text-blue-400 mb-4">{title}</h3>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.45 }} className="text-gray-300 prose prose-invert max-w-none flex-grow">
        {children}
      </motion.div>
    </motion.article>
  );
}

function RiverineEcology() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-16 pt-20">
      {/* HERO */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900/80 to-emerald-900/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative"
        >
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
          <div className="flex-1 relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{t('ecology.title')}</h1>
            <p className="mt-4 text-lg text-gray-200">{t('ecology.subtitle')}</p>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard value="1,086,000 km²" label={t('ecology.stats.area')} accent="bg-indigo-600/80" />
              <StatCard value="260 MLD" label={t('ecology.stats.waste')} accent="bg-red-600/80" />
              <StatCard value="150+" label={t('ecology.stats.species')} accent="bg-emerald-600/80" />
              <StatCard value="24/7" label={t('ecology.stats.chat')} accent="bg-blue-700/80" />
            </div>
          </div>

          <div className="w-full md:w-2/5 relative z-10">
            <motion.div
              initial={{ scale: 0.98 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.45 }}
              className="rounded-xl overflow-hidden bg-gray-800/50 p-3 border border-white/10"
            >
              <CarouselsReco />
            </motion.div>
          </div>
        </motion.div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Left Side */}
          <section className="lg:col-span-8 space-y-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={{ show: { transition: { staggerChildren: 0.12 } } }}
              className="space-y-8"
            >
              <InfoCard title={t('ecology.intro.title')}>
                <ul className="list-disc pl-5 space-y-3">
                  <li>{t('ecology.intro.p1')}</li>
                  <li>{t('ecology.intro.p2')}</li>
                </ul>
              </InfoCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard title={t('ecology.basin.title')}>
                  <p>{t('ecology.basin.p1')}</p>
                  <ul className="list-disc pl-5 mt-4 space-y-2">
                    <li>{t('ecology.basin.l1')}</li>
                    <li>{t('ecology.basin.l2')}</li>
                  </ul>
                </InfoCard>

                <InfoCard title={t('ecology.bio.title')}>
                  <p>{t('ecology.bio.p1')}</p>
                  <p className="mt-3">{t('ecology.bio.p2')}</p>
                </InfoCard>
              </div>

              <InfoCard title={t('ecology.toxic.title')}>
                <ul className="list-disc pl-5 space-y-3">
                  <li>{t('ecology.toxic.l1')}</li>
                  <li>{t('ecology.toxic.l2')}</li>
                  <li>{t('ecology.toxic.l3')}</li>
                </ul>
              </InfoCard>
            </motion.div>
          </section>

          {/* Sidebar - Right Side */}
          <aside className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-xl bg-gray-800/50 backdrop-blur-md shadow-xl p-6 border border-gray-700"
            >
              <h4 className="font-semibold text-blue-300 text-lg mb-4">{t('ecology.quickFacts')}</h4>
              <ul className="text-sm text-gray-300 list-disc pl-5 space-y-3">
                <li>{t('ecology.quickFactsList.fact1')}</li>
                <li>{t('ecology.quickFactsList.fact2')}</li>
                <li>{t('ecology.quickFactsList.fact3')}</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="rounded-xl bg-gray-800/50 backdrop-blur-md shadow-xl p-6 border border-gray-700"
            >
              <h4 className="font-semibold text-blue-300 text-lg mb-4">{t('ecology.explore')}</h4>
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors font-medium"
                >
                  {t('ecology.exploreButtons.species')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors font-medium"
                >
                  {t('ecology.exploreButtons.threats')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors font-medium"
                >
                  {t('ecology.exploreButtons.stories')}
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="rounded-xl bg-gray-800/50 backdrop-blur-md shadow-xl p-6 border border-gray-700"
            >
              <h4 className="font-semibold text-blue-300 text-lg mb-4">{t('ecology.learnMore')}</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{t('ecology.learnMoreDesc')}</p>
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default RiverineEcology;

