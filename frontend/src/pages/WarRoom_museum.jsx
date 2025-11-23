import { Fragment, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import './WarRoom_museum.css';
import { Skeleton } from '@mantine/core';
import { useTranslation } from 'hooks/useTranslation';

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.2, delayChildren: 0.1 }
	},
};

const item = {
	hidden: { opacity: 0, y: 30, scale: 0.95 },
	show: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: { type: "spring", stiffness: 50, damping: 20 }
	},
};

function ParallaxLayer({ speed = -120, className = '' }) {
	const { scrollY } = useScroll();
	const y = useTransform(scrollY, (v) => (v * speed) / 1000);
	return <motion.div aria-hidden className={`warroom-bg-layer ${className}`} style={{ y }} />;
}

function TiltCard({ children, maxTilt = 15, hoverScale = 1.05 }) {
	const ref = useRef(null);
	const x = useMotionValue(0);
	const y = useMotionValue(0);

	const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
	const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

	function handleMove(e) {
		const el = ref.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;
		const mouseXVal = e.clientX - rect.left;
		const mouseYVal = e.clientY - rect.top;

		const xPct = mouseXVal / width - 0.5;
		const yPct = mouseYVal / height - 0.5;

		x.set(xPct * maxTilt);
		y.set(yPct * maxTilt);
	}

	function handleLeave() {
		x.set(0);
		y.set(0);
	}

	return (
		<motion.div
			className="warroom-card"
			ref={ref}
			onMouseMove={handleMove}
			onMouseLeave={handleLeave}
			whileHover={{ scale: hoverScale, zIndex: 10 }}
			style={{
				rotateX: mouseY, // Inverted for natural feel
				rotateY: mouseX,
				transformStyle: "preserve-3d"
			}}
		>
			<div className="warroom-card-glass">
				{children}
			</div>
		</motion.div>
	);
}

function WarRoom_museum() {
	const { t } = useTranslation();

	return (
		<Fragment>
			<div className="warroom-container">
				{/* Parallax background layers */}
				<ParallaxLayer className="warroom-bg-lines" speed={-100} />
				<ParallaxLayer className="warroom-bg-glow" speed={-200} />

				<motion.div
					variants={container}
					initial="hidden"
					whileInView="show"
					viewport={{ once: true, amount: 0.1 }}
					className="warroom-content-wrapper"
				>
					<motion.h1 variants={item} className="warroom-header">
						{t('warroom.title')}
					</motion.h1>

					<motion.p variants={item} className="warroom-subtitle">
						{t('warroom.desc')}
					</motion.p>

					<motion.div variants={container} className="warroom-gallery">
						{[{
							src: 'https://media.darpanmagazine.com/library/uploads/news/content/gangesriveristock.jpg',
							alt: 'Ganges River',
							legend: 'Ganga River Glory',
						}, {
							src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
							alt: 'Wildlife Institute',
							legend: 'Wildlife & Conservation',
						}, {
							src: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80',
							alt: 'Museum Exhibit',
							legend: 'Museum Exhibit',
						}].map((img, i) => (
							<motion.div key={i} variants={item}>
								<TiltCard>
									<div className="warroom-card-content">
										<ImageWithSkeleton src={img.src} alt={img.alt} />
										<p className="warroom-legend">{img.legend}</p>
									</div>
								</TiltCard>
							</motion.div>
						))}
					</motion.div>

					<motion.div variants={item} className="warroom-description-card">
						<p>
							The museum at Chandi Ghat, Haridwar is a collaborative effort of NMCG and the Wildlife Institute of India, Dehradun. Apart from showcasing Ganga river’s glory, the museum also provides information on the issues of Ganga conservation and the initiatives taken up by the Ministry of Jal Shakti to rejuvenate the River. The bilingual mode of narration of the museum will be instrumental in communicating the message across the masses, right from the local people to the international tourists. The museum will contribute immensely in spreading awareness in view of its location in Haridwar, a pilgrimage city and the site for the Kumbh mela in 2021.
						</p>
						<ul className="warroom-list">
							<li><b>Established by NMCG</b></li>
							<li><b>Inauguration date</b>: 29 Sept 2020</li>
							<li>
								<b>History</b>: The NMCG established the museum to create awareness about the cultural, ecological and economic importance of the Ganges River and its basin, as well as to showcase the efforts being made to clean and protect the river. The museum is designed to be an interactive and educational experience for visitors of all ages. The exhibits in the museum were developed in collaboration with experts from various fields, including historians, scientists, and environmentalists. The museum features a range of exhibits, including photographs, models, and artifacts related to the Ganges River.
							</li>
						</ul>
					</motion.div>

					<motion.div variants={item} className="warroom-video-container">
						<iframe
							className="warroom-iframe"
							src="https://www.youtube.com/embed/H0BKaVbcC8I"
							title="War Room Museum Video"
							frameBorder="0"
							allowFullScreen
						/>
					</motion.div>

					<motion.div variants={item} className="warroom-description-card">
						<ul className="warroom-list">
							<li>
								<b>Location</b>: Kanpur, Varanasi, Prayagraj in Uttar Pradesh, and Haridwar in Uttarakhand
							</li>
							<li>
								<b>Different sections</b>: Introduction Gallery, Aquatic Life Gallery, Pollution Control Gallery, Sewage Treatment Gallery, Interactive Gallery.
							</li>
							<li>
								<b>Timings</b>
								<div className="warroom-table-container">
									<table className="warroom-table">
										<thead>
											<tr>
												<th>Day</th>
												<th>Timings</th>
											</tr>
										</thead>
										<tbody>
											{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
												<tr key={day}>
													<td>{day}</td>
													<td>10:00 AM to 5:00 PM</td>
												</tr>
											))}
											<tr>
												<td>Sunday</td>
												<td>Holiday</td>
											</tr>
										</tbody>
									</table>
								</div>
							</li>
						</ul>
					</motion.div>
				</motion.div>
			</div>
		</Fragment>
	);
}

export default WarRoom_museum;

function ImageWithSkeleton({ src, alt }) {
	const [loaded, setLoaded] = useState(false);
	return (
		<div className="warroom-image-wrapper">
			{!loaded && <Skeleton height={200} radius="md" className="warroom-skeleton" />}
			<motion.img
				initial={{ opacity: 0 }}
				animate={{ opacity: loaded ? 1 : 0 }}
				transition={{ duration: 0.5 }}
				src={src}
				alt={alt}
				onLoad={() => setLoaded(true)}
				className="warroom-image"
			/>
		</div>
	);
}

ImageWithSkeleton.propTypes = {
	src: PropTypes.string.isRequired,
	alt: PropTypes.string,
};
