import React, { Fragment } from 'react';
import { Carousel, NavBar } from 'components';
import './WarRoom_museum.css';


function WarRoom_museum() {
	return (
		<Fragment>
			<NavBar />
			<div className="warroom-container">
				<div className="warroom-gallery">
					<div>
						<img src="https://media.darpanmagazine.com/library/uploads/news/content/gangesriveristock.jpg" alt="Ganges River" />
						<p className="warroom-legend">Ganga River Glory</p>
					</div>
					<div>
						<img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80" alt="Wildlife Institute" />
						<p className="warroom-legend">Wildlife & Conservation</p>
					</div>
					<div>
						<img src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80" alt="Museum Exhibit" />
						<p className="warroom-legend">Museum Exhibit</p>
					</div>
				</div>
				<h1 className="warroom-header">War Room Museum</h1>
				<div className="warroom-description">
					The museum at Chandi Ghat, Haridwar is a collaborative effort of NMCG and the Wildlife Institute of India, Dehradun. Apart from showcasing Ganga river’s glory, the museum also provides information on the issues of Ganga conservation and the initiatives taken up by the Ministry of Jal Shakti to rejuvenate the River. The bilingual mode of narration of the museum will be instrumental in communicating the message across the masses, right from the local people to the international tourists. The museum will contribute immensely in spreading awareness in view of its location in Haridwar, a pilgrimage city and the site for the Kumbh mela in 2021.
					<ul className="warroom-list">
						<li><b>Established by NMCG</b></li>
						<li><b>Inauguration date</b>: 29 Sept 2020</li>
						<li><b>History</b>: The NMCG established the museum to create awareness about the cultural, ecological and economic importance of the Ganges River and its basin, as well as to showcase the efforts being made to clean and protect the river. The museum is designed to be an interactive and educational experience for visitors of all ages. The exhibits in the museum were developed in collaboration with experts from various fields, including historians, scientists, and environmentalists. The museum features a range of exhibits, including photographs, models, and artifacts related to the Ganges River.</li>
					</ul>
				</div>
				<iframe
					className="warroom-iframe"
					width="560"
					height="315"
					src="https://www.youtube.com/embed/H0BKaVbcC8I"
					title="War Room Museum Video"
					frameBorder="0"
					allowFullScreen
				></iframe>
				<div className="warroom-description">
					<ul className="warroom-list">
						<li><b>Location</b>: Kanpur, Varanasi, Prayagraj in Uttar Pradesh, and Haridwar in Uttarakhand</li>
						<li><b>Different sections</b>: Introduction Gallery, Aquatic Life Gallery, Pollution Control Gallery, Sewage Treatment Gallery, Interactive Gallery.</li>
									<li><b>Timings</b>
										<div className="warroom-table-container">
											<table className="warroom-table">
												<thead>
													<tr>
														<th>Day</th>
														<th>Timings</th>
													</tr>
												</thead>
												<tbody>
													<tr><td>Sunday</td><td>Holiday</td></tr>
													<tr><td>Monday</td><td>10:00 AM to 5:00 PM</td></tr>
													<tr><td>Tuesday</td><td>10:00 AM to 5:00 PM</td></tr>
													<tr><td>Wednesday</td><td>10:00 AM to 5:00 PM</td></tr>
													<tr><td>Thursday</td><td>10:00 AM to 5:00 PM</td></tr>
													<tr><td>Friday</td><td>10:00 AM to 5:00 PM</td></tr>
													<tr><td>Saturday</td><td>10:00 AM to 5:00 PM</td></tr>
												</tbody>
											</table>
										</div>
									</li>
					</ul>
				</div>
			</div>
		</Fragment>
	);


}
export default WarRoom_museum;
