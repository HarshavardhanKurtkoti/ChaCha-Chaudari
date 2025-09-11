import '../assets/carousel.min.css';
	import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Carousel } from 'react-responsive-carousel';
import namamigange1 from '../assets/images/namamigange1.jpg';
import namamigange2 from '../assets/images/namamigange2.jpg';
import namamigange4 from '../assets/images/namamigange4.jpg';
import namamigange5 from '../assets/images/namamigange5.jpg';

const CarouselItem = ({ imgSrc }) => (
	<div>
		<img src={imgSrc} className='w-full h-[50vh] object-cover' />
	</div>
);

const CarouselComp = () => (
		<div className="flex justify-center items-center w-full py-8 px-4 bg-white rounded-xl shadow-lg mt-40">
		<div className="w-full max-w-3xl">
			<Carousel
				width={'100%'}
				infiniteLoop
				dynamicHeight={false}
				autoPlay
				showThumbs={false}
				showStatus={false}
				className="rounded-lg overflow-hidden"
			>
				<CarouselItem imgSrc={namamigange1} />
				<CarouselItem imgSrc={namamigange2} />
				<CarouselItem imgSrc={namamigange4} />
				<CarouselItem imgSrc={namamigange5} />
			</Carousel>
		</div>
	</div>
);

export default CarouselComp;
