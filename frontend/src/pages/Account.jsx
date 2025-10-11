import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthUIContext } from 'context/AuthUIContext';
import useSiteTimer from 'hooks/useSiteTimer';

const STORAGE_KEY_GAME = 'gangaGameProgress:v2';
const STORAGE_KEY_SITE_TIME = 'siteTimeSeconds';
const STORAGE_KEY_CHAT_TALK_SEC = 'chatTalkSeconds';

const Account = () => {
  const { openLoginModal } = useContext(AuthUIContext);
  const [game, setGame] = useState({ points: 0, badges: [], gamesPlayed: 0, achievements: [], streak: 0 });
  const [siteSeconds, setSiteSeconds] = useState(0);
  const [chatTalkSeconds, setChatTalkSeconds] = useState(0);
  const [profile, setProfile] = useState(null);
  const [ageInput, setAgeInput] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  useSiteTimer();

  // Pull stats from localStorage
  useEffect(() => {
    const readAll = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_GAME);
        if (raw) setGame(JSON.parse(raw));
      } catch { /* ignore */ }
      try {
        const s = parseInt(localStorage.getItem(STORAGE_KEY_SITE_TIME) || '0', 10) || 0;
        setSiteSeconds(s);
      } catch { setSiteSeconds(0); }
      try {
        const t = parseInt(localStorage.getItem(STORAGE_KEY_CHAT_TALK_SEC) || '0', 10) || 0;
        setChatTalkSeconds(t);
      } catch { setChatTalkSeconds(0); }
      try {
        const p = JSON.parse(localStorage.getItem('userProfile') || 'null');
        if (p) {
          setProfile(p);
          if (p.age && !ageInput) setAgeInput(String(p.age));
        }
      } catch { /* ignore */ }
    };
    readAll();
    const id = setInterval(readAll, 1500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Consider either a backend token or a locally persisted userProfile as "logged in"
    const hasToken = !!localStorage.getItem('userToken');
    const hasProfile = !!localStorage.getItem('userProfile');
    setLoggedIn(hasToken || hasProfile);
    const onLogin = () => setLoggedIn(true);
    const onLogout = () => {
      try { localStorage.removeItem('userToken'); localStorage.removeItem('userProfile'); } catch (e) { /* ignore */ }
      setProfile(null);
      setLoggedIn(false);
    };
    window.addEventListener('user-logged-in', onLogin);
    window.addEventListener('user-logged-out', onLogout);
    const onProfile = (e) => { setProfile(e.detail); setLoggedIn(true); };
    window.addEventListener('profile-updated', onProfile);
    return () => {
      window.removeEventListener('user-logged-in', onLogin);
      window.removeEventListener('user-logged-out', onLogout);
      window.removeEventListener('profile-updated', onProfile);
    };
  }, []);

  const fmtHMS = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const progressPct = useMemo(() => Math.min(100, Math.round((game.points / 150) * 100)), [game.points]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-lg backdrop-blur">
          {profile?.picture ? (
            <img src={profile.picture} alt={profile.name || 'Profile'} className="w-12 h-12 rounded-full border border-gray-700" />
          ) : (
            <img src="https://nmcg.nic.in/images/nmcgGif.gif" alt="NMCG" className="w-12 h-12" />
          )}
          <div>
            <h1 className="text-2xl font-semibold">{profile?.name ? `${profile.name}'s Account` : 'Your Account'}</h1>
            <p className="text-sm text-gray-300">One place for progress, activity, and preferences.</p>
            {profile?.age != null && (
              <div className="text-sm text-gray-400 mt-1">Age: <span className="font-medium text-white">{profile.age}</span></div>
            )}
          </div>
          {loggedIn ? (
            <button onClick={() => {
              localStorage.removeItem('userToken');
              localStorage.removeItem('userProfile');
              window.dispatchEvent(new CustomEvent('user-logged-out'));
              setProfile(null);
              setLoggedIn(false);
            }} className="ml-auto rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-medium">Logout</button>
          ) : (
            <button onClick={openLoginModal} className="ml-auto rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium">Login / Sign up</button>
          )}
        </header>

        <section className="grid grid-cols-12 gap-6 mt-6">
          {/* Left column: Profile + Activity */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Game Progress */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6">
              <h2 className="text-lg font-medium text-emerald-300">Game Progress</h2>
              <div className="mt-4">
                <div className="h-3 w-full rounded-full bg-gray-800 border border-gray-700 overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-300">
                  <span>Points: <span className="font-semibold text-white">{game.points}</span> / 150</span>
                  <span className="ml-4">Games played: <span className="font-semibold text-white">{game.gamesPlayed}</span></span>
                  <span className="ml-4">Streak: <span className="font-semibold text-white">{game.streak || 0}</span> 🔥</span>
                </div>
                {game.badges?.length > 0 && (
                  <div className="mt-3 text-sm text-gray-300">Badges unlocked: {game.badges.join(', ')}</div>
                )}
              </div>
            </div>

            {/* Activity */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6">
              <h2 className="text-lg font-medium text-blue-300">Your Activity</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                  <div className="text-sm text-gray-400">Time on site</div>
                  <div className="text-xl font-semibold mt-1">{fmtHMS(siteSeconds)}</div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                  <div className="text-sm text-gray-400">Chat talk time</div>
                  <div className="text-xl font-semibold mt-1">{fmtHMS(chatTalkSeconds)}</div>
                  <div className="text-xs text-gray-500 mt-1">Tracked when speaking in voice mode</div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                  <div className="text-sm text-gray-400">Achievements</div>
                  <div className="text-xl font-semibold mt-1">{game.achievements?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Quick actions / Preferences */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6">
              <h3 className="text-base font-medium">Quick Actions</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                <li>• Manage voice/TTS settings</li>
                <li>• Reset game progress</li>
                <li>• Privacy & security</li>
              </ul>
              {loggedIn ? (
                <button onClick={() => { localStorage.removeItem('userToken'); localStorage.removeItem('userProfile'); window.dispatchEvent(new CustomEvent('user-logged-out')); setProfile(null); setLoggedIn(false); }} className="mt-4 w-full rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-sm font-medium">Logout</button>
              ) : (
                <button onClick={openLoginModal} className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium">Open Login</button>
              )}
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-6">
              <h3 className="text-base font-medium">Badges</h3>
              {(!game.badges || game.badges.length === 0) ? (
                <p className="text-sm text-gray-400 mt-2">No badges yet — play the games to unlock them!</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {game.badges.map((b) => (
                    <span key={b} className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs text-gray-200">{b}</span>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-200">Your age</h4>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    className="w-28 px-3 py-2 rounded border border-gray-700 bg-gray-950 text-gray-100"
                    placeholder="Age"
                  />
                  <button
                    className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs text-white"
                    onClick={() => {
                      const p = profile || {};
                      const updated = { ...p, age: ageInput ? Number(ageInput) : null, updatedAt: Date.now() };
                      setProfile(updated);
                      try {
                        localStorage.setItem('userProfile', JSON.stringify(updated));
                      } catch (e) { /* ignore */ }
                      // notify other UI (NavBar, etc.) that profile changed
                      try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: updated })); } catch (e) { /* ignore */ }
                    }}
                  >
                    Save
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">We’ll use age to tailor questions, games, and chat responses.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Account;
