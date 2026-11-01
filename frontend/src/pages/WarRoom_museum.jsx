import { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useTranslation } from 'hooks/useTranslation';
import TiltCard from 'components/TiltCard';
import ParallaxLayer from 'components/ParallaxLayer';
import { Landmark, Calendar, MapPin, Clock, Video, Sparkles, Compass, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@mantine/core';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function WarRoom_museum() {
  const { t } = useTranslation();

  const exhibits = [
    {
      src: 'https://media.darpanmagazine.com/library/uploads/news/content/gangesriveristock.jpg',
      alt: 'Ganges River Basin',
      title: 'Sacred River Basin Glory',
      desc: 'Topographical and cultural mapping of the 2,525 km river journey from Gaumukh to the Bay of Bengal.',
      tag: 'Introduction Gallery',
    },
    {
      src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      alt: 'Wildlife Institute',
      title: 'Biodiversity & Aquatic Species',
      desc: 'Conservation sanctuaries protecting endangered Ganges River Dolphins, Gharials, and Otters.',
      tag: 'Aquatic Life Gallery',
    },
    {
      src: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
      alt: 'Sewage Treatment Exhibits',
      title: 'STP Infrastructure & Recovery',
      desc: 'Modern bioremediation, sewage interception networks, and real-time river water quality telemetry.',
      tag: 'Pollution Abatement',
    },
  ];

  return (
    <div className="relative min-h-screen bg-surface-950 text-slate-100 pb-24 pt-28 px-4 sm:px-6">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
            <Landmark className="w-3.5 h-3.5 text-purple-400" />
            <span>Chandi Ghat, Haridwar • NMCG & WII</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-headline tracking-tight text-white">
            River Basin War Room & Ganga Museum
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            A state-of-the-art interactive memorial and education center created by the National Mission for Clean Ganga in collaboration with the Wildlife Institute of India, Dehradun.
          </p>
        </motion.div>

        {/* Gallery Bento Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {exhibits.map((exhibit, idx) => (
            <TiltCard key={idx} className="bento-card group flex flex-col justify-between overflow-hidden p-1">
              <div className="relative w-full h-48 rounded-[20px] overflow-hidden">
                <ImageWithSkeleton src={exhibit.src} alt={exhibit.alt} />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-surface-950/80 backdrop-blur-md text-[11px] font-mono text-cyan-300 border border-white/10">
                  {exhibit.tag}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold font-headline text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {exhibit.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {exhibit.desc}
                  </p>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        {/* Key Highlights Bento Section */}
        <div className="grid md:grid-cols-12 gap-6 items-stretch">
          {/* Left Info Card */}
          <div className="md:col-span-7 bento-card p-6 sm:p-8 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Mission & Institutional History</span>
              </div>
              <h2 className="text-2xl font-bold font-headline text-white mb-3">
                Connecting Heritage, Science, and Community
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Apart from showcasing the sacred river’s glory, the museum provides scientific telemetry on river conservation and the comprehensive interventions spearheaded by the Ministry of Jal Shakti. Its bilingual exhibits educate pilgrims, schoolchildren, and international tourists alike.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-white/8 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><b>Inaugurated:</b> 29 September 2020</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><b>Partner:</b> Wildlife Institute of India (WII)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><b>Medium:</b> Bilingual English & Hindi Exhibits</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><b>Focus:</b> Aquatic Ecology & STP Telemetry</span>
              </div>
            </div>
          </div>

          {/* Right Schedule / Timings Card */}
          <div className="md:col-span-5 bento-card p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
                <Clock className="w-4 h-4" />
                <span>Visitor Schedule & Centers</span>
              </div>
              <h3 className="text-xl font-bold font-headline text-white mb-3">
                Visiting Hours & Key Locations
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Primary centers at Haridwar (Chandi Ghat), Varanasi, Kanpur, and Prayagraj.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 bg-surface-950/60 text-xs">
              <div className="flex items-center justify-between p-3 border-b border-white/8 font-mono font-semibold text-slate-300 bg-white/5">
                <span>Days</span>
                <span>Operational Hours</span>
              </div>
              <div className="p-3 flex items-center justify-between border-b border-white/5">
                <span className="text-slate-200">Monday – Saturday</span>
                <span className="text-emerald-400 font-mono font-bold">10:00 AM – 5:00 PM</span>
              </div>
              <div className="p-3 flex items-center justify-between bg-white/[0.02]">
                <span className="text-slate-200">Sunday</span>
                <span className="text-rose-400 font-mono">Weekly Maintenance</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Free admission for students and educational tours</span>
            </div>
          </div>
        </div>

        {/* Video Showcase Card */}
        <div className="bento-card p-1 overflow-hidden shadow-2xl">
          <div className="relative w-full aspect-video rounded-[22px] overflow-hidden bg-black">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/H0BKaVbcC8I"
              title="Ganga War Room Documentary"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarRoom_museum;

function ImageWithSkeleton({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="w-full h-full relative">
      {!loaded && <Skeleton height="100%" radius="md" color="#1e293b" className="absolute inset-0" />}
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
  );
}

ImageWithSkeleton.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
};
