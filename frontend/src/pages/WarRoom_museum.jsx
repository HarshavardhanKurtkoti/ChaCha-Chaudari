import { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './WarRoom_museum.css';
import { Skeleton } from '@mantine/core';

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.15 }
	},
};

const item = {
	hidden: { opacity: 0, y: 16 },
	show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function WarRoom_museum() {
	return (
		<Fragment>
			<div className="warroom-container">
				<motion.div
					variants={container}
					initial="hidden"
					whileInView="show"
					viewport={{ once: false, amount: 0.3 }}
					className="warroom-gallery"
				>
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
							<ImageWithSkeleton src={img.src} alt={img.alt} />
							<p className="warroom-legend">{img.legend}</p>
						</motion.div>
					))}
				</motion.div>

						<motion.h1
							variants={item}
							initial="hidden"
							whileInView="show"
							viewport={{ once: false, amount: 0.2 }}
							className="warroom-header"
						>
							War Room Museum
						</motion.h1>

						<motion.div
							variants={item}
							initial="hidden"
							whileInView="show"
							viewport={{ once: false, amount: 0.2 }}
							className="warroom-description"
						>
					The museum at Chandi Ghat, Haridwar is a collaborative effort of NMCG and the Wildlife Institute of India, Dehradun. Apart from showcasing Ganga river’s glory, the museum also provides information on the issues of Ganga conservation and the initiatives taken up by the Ministry of Jal Shakti to rejuvenate the River. The bilingual mode of narration of the museum will be instrumental in communicating the message across the masses, right from the local people to the international tourists. The museum will contribute immensely in spreading awareness in view of its location in Haridwar, a pilgrimage city and the site for the Kumbh mela in 2021.
					<ul className="warroom-list">
						<li>
							<b>Established by NMCG</b>
						</li>
						<li>
							<b>Inauguration date</b>: 29 Sept 2020
						</li>
						<li>
							<b>History</b>: The NMCG established the museum to create awareness about the cultural, ecological and economic importance of the Ganges River and its basin, as well as to showcase the efforts being made to clean and protect the river. The museum is designed to be an interactive and educational experience for visitors of all ages. The exhibits in the museum were developed in collaboration with experts from various fields, including historians, scientists, and environmentalists. The museum features a range of exhibits, including photographs, models, and artifacts related to the Ganges River.
						</li>
					</ul>
				</motion.div>

						<motion.iframe
							variants={item}
							initial="hidden"
							whileInView="show"
							viewport={{ once: false, amount: 0.2 }}
							className="warroom-iframe"
							width="560"
							height="315"
							src="https://www.youtube.com/embed/H0BKaVbcC8I"
							title="War Room Museum Video"
							frameBorder="0"
							allowFullScreen
						/>

						<motion.div
							variants={item}
							initial="hidden"
							whileInView="show"
							viewport={{ once: false, amount: 0.2 }}
							className="warroom-description"
						>
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
										<tr>
											<td>Sunday</td>
											<td>Holiday</td>
										</tr>
										<tr>
											<td>Monday</td>
											<td>10:00 AM to 5:00 PM</td>
										</tr>
										<tr>
											<td>Tuesday</td>
											<td>10:00 AM to 5:00 PM</td>
										</tr>
										<tr>
											<td>Wednesday</td>
											<td>10:00 AM to 5:00 PM</td>
										</tr>
										<tr>
											<td>Thursday</td>
											<td>10:00 AM to 5:00 PM</td>
										</tr>
										<tr>
											<td>Friday</td>
											<td>10:00 AM to 5:00 PM</td>
										</tr>
										<tr>
											<td>Saturday</td>
											<td>10:00 AM to 5:00 PM</td>
										</tr>
									</tbody>
								</table>
							</div>
						</li>
					</ul>
				</motion.div>
			</div>
		</Fragment>
	);
}

export default WarRoom_museum;

	function ImageWithSkeleton({ src, alt }) {
		const [loaded, setLoaded] = useState(false);
		return (
			<div>
				{!loaded && <Skeleton height={200} radius="md" />}
				<img
					src={src}
					alt={alt}
					onLoad={() => setLoaded(true)}
					style={{ display: loaded ? 'block' : 'none' }}
				/>
			</div>
		);
	}

	ImageWithSkeleton.propTypes = {
		src: PropTypes.string.isRequired,
		alt: PropTypes.string,
	};
