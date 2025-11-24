const ChachaChaudhary = '/assets/images/chacha-chaudhary.png';

import { useTranslation } from 'hooks/useTranslation';

const Welcome = () => {
	const { t } = useTranslation();
	return (
		<div className='bg-white border-gray-200 border-2 rounded-md px-4 py-3 mr-8 w-full my-3'>
			<div className='flex flex-row justify-start items-center'>
				<img loading="lazy" className='w-14 h-14 rounded-full border-gray-400 mr-3' src={ChachaChaudhary} alt='Chacha Chaudhary' />
				<h1 className='text-lg font-semibold mb-1'>{t('chat.welcome')}</h1>
			</div>
			<p className='text-sm'>
				{t('chat.welcomeDesc')}
			</p>
		</div>
	);
};

export default Welcome;
