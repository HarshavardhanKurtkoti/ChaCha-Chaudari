import { useTranslation } from 'hooks/useTranslation';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-900 text-white py-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {t('nav.title')}. {t('footer.rights')}
          </p>
        </div>
        <div className="flex space-x-6">
          <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
            {t('footer.privacy')}
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
            {t('footer.terms')}
          </a>
          <a href="#contact" className="text-gray-400 hover:text-white transition-colors text-sm">
            {t('footer.contact')}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
