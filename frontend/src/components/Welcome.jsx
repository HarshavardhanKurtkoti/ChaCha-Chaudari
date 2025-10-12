const ChachaChaudhary = '/assets/images/chacha-chaudhary.png';

const Welcome = () => (
	<div className='bg-white border-gray-200 border-2 rounded-md px-4 py-3 mr-8 w-full my-3'>
		<div className='flex flex-row justify-start items-center'>
			<img loading="lazy" className='w-14 h-14 rounded-full border-gray-400 mr-3' src={ChachaChaudhary} alt='Chacha Chaudhary' />
			<h1 className='text-lg font-semibold mb-1'> Hello, I am Chacha Chaudhary Bot</h1>
		</div>
		<p className='text-sm'>
			I am here to help you get a better understanding of <span className='text-sm font-semibold underline underline-offset-2'>Ganga Ghat</span>. I am also available to answer your questions related to this place.
		</p>
	</div>
);

export default Welcome;
