import React, { createContext, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';

// Lazy route pages
const Home = React.lazy(() => import('pages/Home'));
const Navigation = React.lazy(() => import('pages/Navigation'));
const Games = React.lazy(() => import('pages/Games'));
const RiverineEcology = React.lazy(() => import('pages/RiverineEcology'));
const WarRoom_museum = React.lazy(() => import('pages/WarRoom_museum'));
const Chat = React.lazy(() => import('pages/Chat'));
const Account = React.lazy(() => import('pages/Account'));

import NavBar from 'components/NavBar';
import Footer from 'components/Footer';
import ScrollToTopButton from 'components/ScrollToTopButton';
import PropTypes from 'prop-types';

const RouteDirectionContext = createContext('forward');

const RouteContainer = () => {
  const location = useLocation();
  // Detect navigation direction using history index.
  const lastIndexRef = useRef(window.history.state?.idx ?? 0);
  const currentIndex = window.history.state?.idx ?? 0;
  const direction = currentIndex >= lastIndexRef.current ? 'forward' : 'back';
  lastIndexRef.current = currentIndex;

  const ctx = useMemo(() => direction, [direction]);

  // Determine if the current route should use dark header/footer styling
  const isGames = location.pathname.startsWith('/games') || location.pathname === '/chat' || location.pathname === '/account';

  return (
    <RouteDirectionContext.Provider value={ctx}>
      <div className="min-h-screen flex flex-col">
        {/* Pass dark-mode flag to NavBar/Footer when on /games or /chat */}
        <NavBar isDark={isGames} />
        <main className="flex-1 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path='/' element={<Page><Home /></Page>} />
              <Route path='/home' element={<Page><Home /></Page>} />
              <Route path='/navigation' element={<Page><Navigation /></Page>} />
              <Route path='/riverine_ecology' element={<Page><RiverineEcology /></Page>} />
              <Route path='/warRoom_museum' element={<Page><WarRoom_museum /></Page>} />
              <Route path='/games' element={<Page><Games /></Page>} />
              <Route path='/chat' element={<Page variant="scale"><Chat /></Page>} />
              <Route path='/account' element={<Page><Account /></Page>} />
            </Routes>
          </AnimatePresence>
        </main>
        <Footer isDark={isGames} />
        <ScrollToTopButton />
      </div>
    </RouteDirectionContext.Provider>
  );
};

const Page = ({ children, variant = 'slide' }) => {
  const dir = React.useContext(RouteDirectionContext);
  // Polished transitions: subtle fade + lift + scale for regular pages,
  // and a refined scale+fade for the Chat route.
  const slide = {
    forward: {
      initial: { opacity: 0, y: 12, scale: 0.995 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.995 },
    },
    back: {
      initial: { opacity: 0, y: -12, scale: 0.995 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 8, scale: 0.995 },
    },
  };

  const scale = {
    forward: {
      initial: { opacity: 0, y: 8, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: 8, scale: 0.98 },
    },
    back: {
      initial: { opacity: 0, y: -8, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.98 },
    },
  };

  const all = variant === 'scale' ? scale : slide;
  const v = all[dir] || all.forward;
  // Slightly longer duration and gentle cubic-bezier easing for a polished feel
  const TRANS = { duration: 0.52, ease: [0.16, 1, 0.3, 1] };

  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={TRANS}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};

Page.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.string,
};

export default RouteContainer;
