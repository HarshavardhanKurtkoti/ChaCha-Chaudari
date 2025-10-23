import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useSettings } from 'context/SettingsContext';

const SettingsPanel = ({ onResetProgress, onResetLeaderboard }) => {
  const { settings, setSetting } = useSettings();
  // Fallback local Piper-like identifiers when API unavailable
  const fallbackVoices = useMemo(() => ([
    { id: 'en_IN-male-medium', label: 'en_IN-male-medium (Piper)' },
    { id: 'hi_IN-male-medium', label: 'hi_IN-male-medium (Piper)' },
    { id: 'en_IN-male-medium', label: 'en_IN-male-medium (Piper)' },
    { id: 'hi_IN-male-medium', label: 'hi_IN-male-medium (Piper)' },
  ]), []);

  const [voiceOptions, setVoiceOptions] = useState(fallbackVoices);
  const [loadingVoices, setLoadingVoices] = useState(false);

  useEffect(() => {
    const loadVoices = async () => {
      setLoadingVoices(true);
      try {
        const apiBase = import.meta?.env?.DEV ? '/api' : 'http://localhost:5000';
        const res = await fetch(`${apiBase}/voices`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Piper voices: [{ id, shortName, locale }]
        const valid = (data?.voices || []).filter(v => {
          const loc = String(v.locale || '').toUpperCase();
          return loc === 'EN-IN' || loc === 'HI-IN';
        });
        const items = valid.map(v => ({ id: v.id || v.shortName, label: v.shortName || v.id }));
        if (items.length) {
          const map = new Map();
          for (const it of items) { if (!map.has(it.id)) map.set(it.id, it); }
          const uniq = Array.from(map.values()).sort((a,b) => a.label.localeCompare(b.label));
          setVoiceOptions(uniq);
          if (!uniq.some(u => u.id === (settings?.ttsVoice))) {
            // Prefer Piper en_IN, then Piper hi_IN, then first available voice
            const preferred =
              (uniq.find(u => u.id.toLowerCase().startsWith('en_in'))?.id) ||
              (uniq.find(u => u.id.toLowerCase().startsWith('hi_in'))?.id) ||
              uniq[0].id;
            setSetting('ttsVoice', preferred);
          }
        } else {
          setVoiceOptions(fallbackVoices);
        }
      } catch (e) {
        console.warn('Failed to load voices from API, using fallback list', e);
        setVoiceOptions(fallbackVoices);
      } finally {
        setLoadingVoices(false);
      }
    };
    loadVoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallbackVoices]);
  const playSample = async () => {
    try {
      const apiBase = import.meta?.env?.DEV ? '/api' : 'http://localhost:5000';
  const sample = `I am ChaCha Chaudhary`;
      const res = await fetch(`${apiBase}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sample, voice: settings?.ttsVoice || voiceOptions[0]?.id })
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) {
      console.error('Sample TTS failed', e);
    }
  };
  return (
    <div className="rounded-xl bg-gray-800/60 p-4 shadow-lg border border-gray-700">
      <h4 className="font-semibold text-gray-100">Settings</h4>
      <div className="mt-3 flex items-center justify-between">
        <label className="text-sm text-gray-200">Sound Effects</label>
        <button
          className={`px-3 py-1 rounded text-sm ${settings.soundEnabled ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-200'}`}
          onClick={() => setSetting('soundEnabled', !settings.soundEnabled)}
        >
          {settings.soundEnabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="text-sm text-gray-200">TTS Voice</label>
        <select
          className="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 text-sm"
          value={settings?.ttsVoice ?? ''}
          onChange={(e) => setSetting('ttsVoice', e.target.value)}
          disabled={!settings}
        >
          {voiceOptions.map(v => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
        {loadingVoices && (
          <span className="text-xs text-gray-400">Loading…</span>
        )}
      </div>
      <div className="mt-2">
        <button className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white" onClick={playSample}>
          Play sample
        </button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        <button className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm" onClick={onResetProgress}>Reset Progress</button>
        <button className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm" onClick={onResetLeaderboard}>Reset Leaderboard</button>
      </div>
    </div>
  );
};

export default SettingsPanel;

SettingsPanel.propTypes = {
  onResetProgress: PropTypes.func,
  onResetLeaderboard: PropTypes.func,
};
