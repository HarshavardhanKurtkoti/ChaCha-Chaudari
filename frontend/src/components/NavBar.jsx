
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const links = [
	{ link: '/riverine_ecology', label: 'Riverine Ecology' },
	{ link: '/navigation', label: 'Navigation' },
	{ link: '/warRoom_museum', label: 'WarRoom' },
];



const NavBar = () => {
	const [menuOpen, setMenuOpen] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogoClick = () => {
		navigate('/home');
	};

	return (
		<nav className="bg-white shadow-md sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-20 items-center">
					<div className="flex items-center">
						<img
							className="w-16 h-16 cursor-pointer"
							src="https://nmcg.nic.in/images/nmcgGif.gif"
							alt="NMCG"
							onClick={handleLogoClick}
						/>
					</div>
                    {/* Avatar/Profile Icon */}
                    <div className="flex items-center ml-auto">
                        <img
                            src="https://ui-avatars.com/api/?name=User"
                            alt="Profile"
                            className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-md cursor-pointer object-cover"
                            style={{ marginRight: '1rem' }}
                        />
                    </div>
									<div className="hidden md:flex space-x-6">
										{links.map((link) => (
											<Link
												key={link.label}
												to={link.link}
												className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 hover:bg-blue-100 hover:text-blue-700 ${
													location.pathname === link.link ? 'bg-blue-500 text-white' : 'text-gray-700'
												}`}
											>
												{link.label}
											</Link>
										))}
									</div>
					<div className="md:hidden flex items-center">
						<button
							onClick={() => setMenuOpen(!menuOpen)}
							className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-700 hover:bg-blue-100 focus:outline-none"
							aria-label="Toggle menu"
						>
							<svg
								className="h-6 w-6"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								{menuOpen ? (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								) : (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								)}
							</svg>
						</button>
					</div>
				</div>
			</div>
			{/* Mobile menu */}
			{menuOpen && (
				<div className="md:hidden bg-white shadow-lg px-2 pt-2 pb-3 space-y-1">
										{links.map((link) => (
											<Link
												key={link.label}
												to={link.link}
												className={`block px-4 py-2 rounded-md font-medium transition-colors duration-200 hover:bg-blue-100 hover:text-blue-700 ${
													location.pathname === link.link ? 'bg-blue-500 text-white' : 'text-gray-700'
												}`}
												onClick={() => setMenuOpen(false)}
											>
												{link.label}
											</Link>
										))}
				</div>
			)}
		</nav>
	);
};

export default NavBar;
