import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const SETTINGS_KEY = 'gangaSettings:v1';

const defaultSettings = {
  soundEnabled: true,
  // Default to a local Piper-like English India voice id
  ttsVoice: 'en_IN-male-medium',
  // Default TTS playback rate (pyttsx3 uses absolute rate; lower = slower)
  // Typical default on Windows is ~200; choose a slightly slower default for clarity
  ttsRate: 150,
  // Language hint passed to backend to improve pronunciation choices
  ttsLang: 'en-IN',
  // Animation quality for particle effects on Chat page: 'high' | 'low' | 'off'
  animationQuality: 'high',
};

const SettingsContext = createContext({ settings: defaultSettings, setSetting: () => {} });

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
    } catch {
      // ignore JSON parse or storage errors
    }
  }, []);

  const setSetting = useCallback((key, val) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage write errors
    }
  }, [settings]);

  const value = useMemo(() => ({ settings, setSetting }), [settings, setSetting]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);

export const SettingsConsumer = SettingsContext.Consumer;

export const SettingsContextObj = SettingsContext;

export const SettingsProviderPropTypes = {};

SettingsProvider.propTypes = {
  children: PropTypes.node,
};
