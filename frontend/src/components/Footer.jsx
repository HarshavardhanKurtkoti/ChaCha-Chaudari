import { Link, useLocation, useNavigate } from 'react-router-dom';

// A GTMS-like footer styled with Tailwind, adapted for the Capstone project
const Footer = ({ isDark = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navLinks = [
    { href: '/home', label: 'Home' },
    { href: '/riverine_ecology', label: 'Riverine Ecology' },
    { href: '/navigation', label: 'Navigation' },
    { href: '/warRoom_museum', label: 'War Room' },
    { href: '/games', label: 'Games' },
  ];

  const productLinks = [
    { href: '/home#features', label: 'Features' },
    { href: '/home#about', label: 'About' },
    { href: '/home#contact', label: 'Contact' },
  ];

  const legalLinks = [
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'Terms of Service' },
  ];

  return (
    <footer className={`mt-auto transition-colors duration-450 ${isDark ? 'bg-gray-900 text-gray-100 border-t border-gray-800' : 'bg-white text-gray-700 border-t border-gray-200'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <Link to="/home" className="flex items-center gap-2" style={{ color: isDark ? undefined : undefined }}>
              <img
                src="https://nmcg.nic.in/images/nmcgGif.gif"
                alt="NMCG"
                className="h-8 w-8"
              />
              <span className="font-headline text-xl font-bold tracking-tight">
                Ganga Knowledge Portal
              </span>
            </Link>
            <p className="mt-4 text-sm max-w-xs" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : undefined }}>
              Explore the heritage, ecology, and initiatives around River Ganga with interactive content and a friendly guide.
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-semibold" style={{ color: isDark ? '#fff' : undefined }}>Navigation</h3>
            <ul className="mt-4 space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    onClick={(e) => {
                      const [path, hash] = link.href.split('#');
                      // If staying on same path, prevent default and just scroll
                      if (location.pathname === path) {
                        e.preventDefault();
                        if (hash) {
                          const el = document.getElementById(hash);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          else window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      } else {
                        // navigate to route; ScrollToTop will handle top scroll
                        navigate(link.href);
                      }
                    }}
                    className="text-sm hover:text-blue-600"
                    style={{ color: isDark ? 'rgba(255,255,255,0.8)' : undefined }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-semibold" style={{ color: isDark ? '#fff' : undefined }}>Explore</h3>
            <ul className="mt-4 space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={(e) => {
                      const [path, hash] = link.href.split('#');
                      if (location.pathname === path) {
                        e.preventDefault();
                        if (hash) {
                          const el = document.getElementById(hash);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          else window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      } else {
                        navigate(link.href);
                      }
                    }}
                    className="text-sm hover:text-blue-600"
                    style={{ color: isDark ? 'rgba(255,255,255,0.8)' : undefined }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold" style={{ color: isDark ? '#fff' : undefined }}>Contact</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="sr-only">Email</span>
                <a href="mailto:info@nmcg.gov.in" className="text-gray-500 hover:text-blue-600">info@nmcg.gov.in</a>
              </div>
              <div className="flex items-start gap-3">
                <span className="sr-only">Phone</span>
                <p className="text-gray-500">+91-11-0000-0000</p>
              </div>
            </div>
          </div>
        </div>

    <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center text-sm" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : undefined, color: isDark ? 'rgba(255,255,255,0.6)' : undefined }}>
          <p>&copy; {new Date().getFullYear()} Ganga Knowledge Portal. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            {legalLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-blue-600">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
