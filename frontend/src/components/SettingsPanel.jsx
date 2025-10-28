import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { useSettings } from 'context/SettingsContext';

const SettingsPanel = ({ onResetProgress, onResetLeaderboard }) => {
  const { settings, setSetting } = useSettings();
  // Fallback local Piper-like identifiers when API unavailable
  const fallbackVoices = useMemo(() => ([
    { id: 'en_IN-male-medium', label: 'en_IN-male-medium (Piper)' },
    { id: 'hi_IN-male-medium', label: 'hi_IN-male-medium (Piper)' },
  ]), []);

  const [voiceOptions, setVoiceOptions] = useState(fallbackVoices);
  const [loadingVoices, setLoadingVoices] = useState(false);
  // Local selected voice to make sample playback respond immediately
  const [currentVoice, setCurrentVoice] = useState(settings?.ttsVoice || fallbackVoices[0]?.id);

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
            setCurrentVoice(preferred);
          }
        } else {
          setVoiceOptions(fallbackVoices);
          // ensure local currentVoice is valid
          setCurrentVoice(settings?.ttsVoice || fallbackVoices[0]?.id);
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
  // Keep local currentVoice in sync when settings change (e.g., load from storage)
  useEffect(() => {
    if (settings?.ttsVoice) setCurrentVoice(settings.ttsVoice);
  }, [settings?.ttsVoice]);
  // Compute the effective language hint to display (matches playSample logic)
  const effectiveLang = (settings?.ttsLang && settings.ttsLang !== 'en-IN')
    ? settings.ttsLang
    : (currentVoice && currentVoice.toLowerCase().includes('hi') ? 'hi-IN' : 'en-IN');
  const playSample = async () => {
    try {
      const apiBase = import.meta?.env?.DEV ? '/api' : 'http://localhost:5000';
      // determine the voice to send (prefer immediate selection)
      const voiceToSend = currentVoice || settings?.ttsVoice || voiceOptions[0]?.id;
      // derive a language hint: prefer an explicit user setting only if it's not the default 'en-IN'
      const langToSend = (settings?.ttsLang && settings.ttsLang !== 'en-IN')
        ? settings.ttsLang
        : (voiceToSend && voiceToSend.toLowerCase().includes('hi') ? 'hi-IN' : 'en-IN');
      // choose sample text appropriate for the language so Hindi voices speak Hindi
      const sample = (langToSend && langToSend.toLowerCase().startsWith('hi'))
        ? 'नमस्ते, मेरा नाम चाचा चौधरी है'
        : 'I am ChaCha Chaudhary';
      const body = { text: sample, voice: voiceToSend, rate: settings?.ttsRate, lang: langToSend };
      console.debug('TTS sample request body:', body);
      const res = await fetch(`${apiBase}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        // Try to get JSON error for debugging
        try {
          const j = await res.json();
          console.error('TTS /tts error response:', j);
          window.alert('TTS server error: ' + (j?.error || JSON.stringify(j)));
        } catch (e) {
          console.error('TTS error, non-json response', e);
          window.alert('TTS request failed (non-200 response)');
        }
        // attempt fallback to fast-tts
        console.info('Attempting fallback to /fast-tts');
        try {
          const fb = await fetch(`${apiBase}/fast-tts`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: body.text, voice: body.voice, rate: body.rate })
          });
          if (fb.ok) {
            const fblob = await fb.blob();
            if (fblob && fblob.size > 0) {
              const furl = URL.createObjectURL(fblob);
              const fa = document.createElement('audio'); fa.src = furl; fa.autoplay = true; fa.controls = true; document.body.appendChild(fa);
              return;
            }
          }
        } catch (e) { console.warn('fast-tts fallback failed', e); }
        return;
      }
      const blob = await res.blob();
      // If the returned blob is empty, attempt fallback and surface an error
      if (!blob || blob.size === 0) {
        console.error('TTS returned empty audio blob; size=0');
        window.alert('TTS returned empty audio. Server may be misconfigured. Check backend logs.');
        // attempt fallback to /fast-tts
        try {
          const fb = await fetch(`${apiBase}/fast-tts`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: body.text, voice: body.voice, rate: body.rate })
          });
          if (fb.ok) {
            const fblob = await fb.blob();
            if (fblob && fblob.size > 0) {
              const furl = URL.createObjectURL(fblob);
              const fa = document.createElement('audio'); fa.src = furl; fa.autoplay = true; fa.controls = true; document.body.appendChild(fa);
              return;
            }
          }
        } catch (e) { console.warn('fast-tts fallback failed', e); }
        return;
      }
  // Create an audio element and append it so autoplay restrictions can be bypassed by user
  const url = URL.createObjectURL(blob);
      const audio = document.createElement('audio');
      audio.src = url;
      audio.autoplay = true;
      audio.controls = true;
      // Clean up when finished
      audio.onended = () => {
        try { URL.revokeObjectURL(url); if (audio.parentNode) audio.parentNode.removeChild(audio); } catch (e) { void e; }
      };
      audio.onerror = (ev) => {
        console.error('Audio playback error', ev);
      };
      // Append to body so user can press play if autoplay is blocked
      document.body.appendChild(audio);
      audio.play().catch(err => {
        console.warn('Autoplay failed, user interaction may be required:', err);
      });
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
          value={currentVoice ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setCurrentVoice(v);
            setSetting('ttsVoice', v);
          }}
          disabled={!settings}
        >
          {voiceOptions.map(v => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
  <div className="text-xs text-gray-400 ml-2">Using: {currentVoice} · {effectiveLang}</div>
        {loadingVoices && (
          <span className="text-xs text-gray-400">Loading…</span>
        )}
      </div>
      <div className="mt-3">
        <label className="text-sm text-gray-200">TTS Speed</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="range"
            min={80}
            max={240}
            value={settings?.ttsRate ?? 150}
            onChange={(e) => setSetting('ttsRate', parseInt(e.target.value, 10))}
            className="w-full"
          />
          <div className="w-14 text-sm text-gray-200 text-right">{settings?.ttsRate ?? 150}</div>
        </div>
        <div className="text-xs text-gray-400 mt-1">Lower = slower, higher = faster. Adjust for clearer speech.</div>
      </div>
      <div className="mt-3">
        <label className="text-sm text-gray-200">Animation Quality</label>
        <div className="flex items-center gap-2 mt-1">
          <select
            className="px-2 py-1 rounded bg-gray-700 text-gray-100 border border-gray-600 text-sm"
            value={settings?.animationQuality ?? 'high'}
            onChange={(e) => setSetting('animationQuality', e.target.value)}
          >
            <option value="high">High (rich particles)</option>
            <option value="low">Low (lighter)</option>
            <option value="off">Off</option>
          </select>
          <div className="text-xs text-gray-400 ml-2">Controls Chat page particle animations.</div>
        </div>
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
