import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { useSettings } from 'context/SettingsContext';
import { useTranslation } from 'hooks/useTranslation';
import '../styles/hide-scrollbar.css';
import './ChatBot.css';
import { Welcome } from 'components';
import { BsMic } from 'react-icons/bs';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';

import { useMessageContext } from 'context/MessageProvider';
import { BotStateContext } from 'context/BotState';
import SelectLang from 'components/SelectLang';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import PropTypes from 'prop-types';
import { ChachaCanvas } from './Bot';

const ChatBot = ({ setIsSpeaking }) => {
	const { t } = useTranslation();
	const { settings } = useSettings();

	const samplePhrases = [
		t('chat.sample1'),
		t('chat.sample2'),
		t('chat.sample3')
	];
	// audio=true: voice mode (auto TTS); audio=false: text-only
	const [audio, setAudio] = useState(true);
	const particleCanvasRef = useRef(null);
	// Keep a ref to the latest ttsVoice so event handlers created on mount use
	// the current selection (avoids stale closures).
	const ttsVoiceRef = useRef(settings?.ttsVoice);
	useEffect(() => {
		ttsVoiceRef.current = settings?.ttsVoice;
	}, [settings?.ttsVoice]);
	// On mount, optionally trigger voice flow via custom event. We intentionally don't include
	// addMessage/getResponse/setIsSpeaking in deps to avoid re-wiring handlers repeatedly.
	useEffect(() => {
		const handler = (e) => {
			if (e.detail && e.detail.message == 'hello') {
				// Do not force-enable audio here; respect the user's Voice on/off toggle.
				const userInitiated = !!e.detail.userInitiated;
				if (!userInitiated) {
					// If not user-initiated, do not add a user message or call backend.
					return;
				}
				// User initiated: send the greeting prompt to backend as before
				addMessage('user', 'hello');
				setState('waiting');
				getResponse({ prompt: 'hello', lang }, '/llama-chat').then(resp => {
					setState('idle');
					if (resp && resp.data && resp.data.result) {
						addMessage('assistant', resp.data.result);
						if (audio) {
							if (setIsSpeaking) setIsSpeaking(true);
							playTTS(resp.data.result);
						} else {
							if (setIsSpeaking) setIsSpeaking(false);
						}
					}
				});
			}
		};
		window.addEventListener('activate-chatbot-voice', handler);
		return () => window.removeEventListener('activate-chatbot-voice', handler);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [audio]);

	// Canvas-based particle system (faster than DOM nodes). Respects settings.animationQuality
	useEffect(() => {
		const canvas = particleCanvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		let width = 0;
		let height = 0;
		let dpr = Math.max(1, window.devicePixelRatio || 1);
		let animationId = null;
		let particles = [];
		let mouse = { x: -9999, y: -9999, lastMove: 0 };

		const quality = (settings && settings.animationQuality) ? settings.animationQuality : 'high';
		// Reduce default particle count to make the scene lighter by default.
		// 'low' remains low, 'off' keeps 0, and default/high uses a smaller count.
		const baseCount = quality === 'low' ? 20 : (quality === 'off' ? 0 : 60);

		function resize() {
			width = canvas.clientWidth || canvas.offsetWidth || window.innerWidth;
			height = canvas.clientHeight || canvas.offsetHeight || window.innerHeight;
			dpr = Math.max(1, window.devicePixelRatio || 1);
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = width + 'px';
			canvas.style.height = height + 'px';
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		function randomParticle() {
			return {
				x: Math.random() * width,
				y: height + (Math.random() * 40),
				vx: (Math.random() - 0.5) * 0.4,
				vy: - (0.2 + Math.random() * 0.8),
				size: Math.random() * 2.4 + 0.6,
				alpha: 0,
				life: 0,
				ttl: 4 + Math.random() * 8
			};
		}

		function ensureParticles() {
			const target = baseCount;
			while (particles.length < target) particles.push(randomParticle());
			if (particles.length > target) particles.length = target;
		}

		function draw() {
			ctx.clearRect(0, 0, width, height);
			// subtle fade overlay to create trailing
			ctx.fillStyle = 'rgba(0,0,0,0)';
			ctx.fillRect(0, 0, width, height);

			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;
				p.life += 0.016;
				p.alpha = Math.min(1, p.life / 0.6) * (1 - (p.life / p.ttl));
				if (p.y < -20 || p.life > p.ttl) {
					particles[i] = randomParticle();
					continue;
				}
				ctx.beginPath();
				ctx.globalAlpha = Math.max(0, p.alpha * 0.9);
				const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
				g.addColorStop(0, 'rgba(255,255,255,0.95)');
				g.addColorStop(0.2, 'rgba(255,255,255,0.5)');
				g.addColorStop(1, 'rgba(255,255,255,0)');
				ctx.fillStyle = g;
				ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
				ctx.fill();
				ctx.globalAlpha = 1;
			}

			// subtle parallax on spheres - handled via CSS transforms in mousemove
			animationId = requestAnimationFrame(draw);
		}

		function onMove(e) {
			// convert to canvas coords
			const rect = canvas.getBoundingClientRect();
			mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width) / dpr;
			mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height) / dpr;
			mouse.lastMove = Date.now();
			// burst small number of particles at mouse for interactivity
			const burst = (quality === 'low') ? 1 : 2;
			for (let i = 0; i < burst; i++) {
				const p = randomParticle();
				p.x = (e.clientX - rect.left);
				p.y = (e.clientY - rect.top);
				p.vx = (Math.random() - 0.5) * 1.4;
				p.vy = - (0.6 + Math.random() * 1.6);
				p.life = 0;
				particles.push(p);
			}
			// minor sphere parallax (kept as CSS transforms)
			const spheres = document.querySelectorAll('.chat-gradient-background .gradient-sphere');
			const moveX = (e.clientX / window.innerWidth - 0.5) * 8; // px
			const moveY = (e.clientY / window.innerHeight - 0.5) * 8;
			spheres.forEach(s => { try { s.style.transform = `translate(${moveX}px, ${moveY}px)`; } catch { } });
		}

		function start() {
			resize();
			ensureParticles();
			window.addEventListener('resize', resize);
			window.addEventListener('mousemove', onMove);
			draw();
		}

		function stop() {
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', onMove);
			if (animationId) cancelAnimationFrame(animationId);
			animationId = null;
			try { ctx.clearRect(0, 0, canvas.width, canvas.height); } catch { }
		}

		start();

		return () => {
			stop();
			particles = [];
		};
		// Recreate when the animationQuality setting changes
	}, [settings?.animationQuality]);
	// Mic loudness state
	const [micLevel, setMicLevel] = useState(0);
	const audioContextRef = useRef(null);
	const analyserRef = useRef(null);
	const micStreamRef = useRef(null);
	// Play TTS audio for assistant responses
	async function playTTS(text) {
		try {
			// Force TTS to the standalone proxy per user request
			const forcedBase = 'http://127.0.0.1:6001';
			const apiBase = forcedBase;
			console.debug('playTTS base resolved (forced proxy)', { apiBase, origin: window.location.origin });
			// Pick Piper voice based on current language selection
			const currentLang = (typeof lang === 'string' && lang) || (settings?.ttsLang) || 'en-IN';
			const isHindi = String(currentLang).toLowerCase().startsWith('hi');
			const voiceToSend = isHindi ? 'hi_IN-rohan-medium' : 'en_US-kusal-medium';
			const langToSend = isHindi ? 'hi-IN' : 'en-US';
			console.debug('playTTS sending voice/lang=', voiceToSend, langToSend);
			const postUrl = `${String(apiBase).replace(/\/$/, '')}/tts`;
			console.debug('playTTS POST', postUrl);
			let response = await fetch(postUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				// Use the ref to ensure the latest selected voice is used even when
				// this function is called from an event handler created earlier.
				body: JSON.stringify({
					text,
					voice: voiceToSend,
					rate: typeof settings?.ttsRate === 'number' ? Math.round(settings?.ttsRate) : 160,
					lang: langToSend,
				}),
			});
			if (!response.ok) {
				console.warn('TTS /tts returned non-OK', response.status);
				// Try a quick fallback endpoint if backend exposes it
				try {
					const fastUrl = `${String(apiBase).replace(/\/$/, '')}/fast-tts`;
					console.debug('playTTS fallback POST', fastUrl);
					response = await fetch(fastUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ text, voice: voiceToSend, rate: settings?.ttsRate, lang: settings?.ttsLang || 'en-IN' }),
					});
				} catch (e) { /* no-op */ }
				if (!response.ok) return;
			}
			const blob = await response.blob();
			const audioUrl = URL.createObjectURL(blob);
			const audio = new Audio(audioUrl);
			audio.onended = () => { try { URL.revokeObjectURL(audioUrl); } catch { } };
			try {
				await audio.play();
				console.debug('TTS playback started');
			} catch (playErr) {
				console.warn('Browser blocked autoplay or playback failed; user gesture may be required', playErr);
			}
		} catch (err) {
			console.error('TTS error:', err);
		}
	}
	const [message, setMessage] = useState('');
	const { botState, setBotState } = useContext(BotStateContext);
	const [isTyping, setIsTyping] = useState(false);
	const [state, setState] = useState('idle');
	const [lang, setLang] = useState('en-IN');
	const [streamingEnabled, setStreamingEnabled] = useState(true);
	const inputRef = useRef(null);

	// UI tweaks based on selected language
	const isHindiUI = String(lang || '').toLowerCase().startsWith('hi');

	// Continuation UX: offer a 'Continue?' button if the answer likely truncated
	const [continueHint, setContinueHint] = useState(false);
	const [continueAppend, setContinueAppend] = useState(false);

	const { chatHistory, addMessage, resetHistory, updateLastAssistant } = useMessageContext();

	const bottomRef = useRef(null);
	const containerRef = useRef(null);

	const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();
	const [voiceError, setVoiceError] = useState(null);
	const [speechApiSupported, setSpeechApiSupported] = useState(false);
	const [mediaDevicesSupported, setMediaDevicesSupported] = useState(false);
	const [secureContextFlag, setSecureContextFlag] = useState(false);
	const [micPermission, setMicPermission] = useState('unknown');
	// Recording fallback state
	const [recState, setRecState] = useState('idle'); // idle|recording|ready
	const [recBlob, setRecBlob] = useState(null);
	const recChunksRef = useRef([]);
	const mediaRecorderRef = useRef(null);
	const [isOverlayVisible, setIsOverlayVisible] = useState(false);

	// Track voice talk time when listening is true
	useEffect(() => {
		const KEY = 'chatTalkSeconds';
		let intervalId = null;
		if (listening) {
			intervalId = setInterval(() => {
				try {
					const raw = localStorage.getItem(KEY);
					const val = raw ? parseInt(raw, 10) || 0 : 0;
					localStorage.setItem(KEY, String(val + 1));
				} catch { /* ignore */ }
			}, 1000);
		}
		return () => { if (intervalId) clearInterval(intervalId); };
	}, [listening]);

	// Diagnostics for voice features and permissions on mount
	useEffect(() => {
		try {
			setSpeechApiSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
		} catch { setSpeechApiSupported(false); }
		setMediaDevicesSupported(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
		setSecureContextFlag(!!(window.isSecureContext || window.location.protocol === 'https:' || /localhost|127\./.test(window.location.hostname)));
		try {
			if (navigator.permissions && navigator.permissions.query) {
				navigator.permissions.query({ name: 'microphone' }).then(res => {
					setMicPermission(res.state || 'unknown');
					res.onchange = () => setMicPermission(res.state || 'unknown');
				}).catch(() => setMicPermission('unknown'));
			}
		} catch { setMicPermission('unknown'); }
	}, []);

	useEffect(() => {
		// When chat updates, scroll the container (use instant scroll to avoid
		// the browser trying to scroll the whole page during a smooth animation).
		scrollToBottom({ smooth: false });
	}, [chatHistory, state]);

	const scrollToBottom = (opts = { smooth: false }) => {
		try {
			if (containerRef.current) {
				// Prefer setting scrollTop directly for more predictable behavior
				if (opts.smooth) {
					containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
				} else {
					containerRef.current.scrollTop = containerRef.current.scrollHeight;
				}
				return;
			}
			if (bottomRef.current) {
				bottomRef.current.scrollIntoView({ behavior: opts.smooth ? 'smooth' : 'auto' });
			}
		} catch (e) { void e; }
	};

	useEffect(() => {
		setBotState(state);
		console.log(botState);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state]);

	const focusInput = () => {
		try {
			if (inputRef.current) {
				if (typeof inputRef.current.focus === 'function') {
					try { inputRef.current.focus({ preventScroll: true }); }
					catch (e) { inputRef.current.focus(); }
				}
			}
		} catch (e) { void e; }
	};

	useEffect(() => {
		focusInput();
		// console.log(state, listening);
	}, [state]);

	// Resolve API base robustly across dev/prod/preview
	const isViteDev = !!(typeof import.meta !== 'undefined' && import.meta?.env?.DEV);
	const isViteDevPort = /:(5173|5174)$/i.test(window.location.origin || '');
	const resolvedApiBase = (isViteDev || isViteDevPort)
		? '/api'
		: (import.meta?.env?.VITE_API_BASE_URL || window.location.origin || '').replace(/\/$/, '');
	const baseURL = resolvedApiBase;

	const api = axios.create({
		baseURL: baseURL,
		headers: {
			'Content-Type': 'application/json'
		}
	});

	// const endpoint = 'http://localhost:5000/llama-chat';

	const getResponse = async (userdata, endpoint) => {
		try {
			let ageGroup = null;
			let name = undefined;
			try {
				const p = JSON.parse(localStorage.getItem('userProfile') || 'null');
				const rawAge = p?.age;
				name = p?.name;
				// Accept numbers or strings like "9" in stored profile
				let age = null;
				if (typeof rawAge === 'number') age = rawAge;
				else if (typeof rawAge === 'string' && /^\d+$/.test(rawAge.trim())) age = parseInt(rawAge.trim(), 10);
				if (typeof age === 'number' && !Number.isNaN(age)) {
					ageGroup = age <= 10 ? 'kid' : age < 16 ? 'teen' : 'adult';
				}
			} catch (e) { console.debug('userProfile parse error', e); }
			const userToken = localStorage.getItem('userToken');
			const payload = { ...userdata, ageGroup, name };
			// Provide recent conversation history for context (last 12 messages)
			try {
				payload.history = (chatHistory || []).slice(-12);
			} catch { }
			// Previously we forced a concise, "fast"/fallback mode in voice. That produced
			// gist-like answers (e.g., "Here's the gist…"). Now we default to full answers
			// unless explicitly requested elsewhere. Leave speed undefined to let the
			// server choose its normal behavior.
			try {
				void audio; // no-op, we simply avoid forcing speed here
			} catch { }
			// Ensure we only send a sane Authorization header (avoid sending 'null' or empty)
			const safeToken = (userToken && userToken !== 'null') ? userToken : null;
			const headers = safeToken ? { 'Authorization': `Bearer ${safeToken}` } : {};

			// Debug: log baseURL, headers and payload to help diagnose preflight/latency
			try {
				console.debug('llama-chat request', { baseURL: api.defaults.baseURL, endpoint, headers, payload });
			} catch { /* ignore */ }

			const t0 = performance.now();
			const response = await api.post(endpoint, payload, { headers });
			const t1 = performance.now();
			const serverMs = (response?.data?.latency_ms ?? 0);
			const clientMs = Math.round(t1 - t0);
			console.log(`llama-chat: client ${clientMs}ms, server ${serverMs}ms, retrieved ${response?.data?.retrieved_count}`);
			if (clientMs > 3000 || serverMs > 3000) {
				console.warn('High latency detected for /llama-chat', { clientMs, serverMs, payloadPreview: { prompt: payload.prompt, ageGroup: payload.ageGroup } });
			}
			// console.log('response', response);
			setState('thinking');
			return response;
		} catch (err) {
			console.error(err);
		}
	};

	// Streamed response reader (NDJSON with lines like {"delta":"..."} and final {"done":true})
	const streamResponse = async (userdata, options = {}) => {
		try {
			let ageGroup = null;
			let name = undefined;
			try {
				const p = JSON.parse(localStorage.getItem('userProfile') || 'null');
				const rawAge = p?.age; name = p?.name;
				let age = null;
				if (typeof rawAge === 'number') age = rawAge; else if (typeof rawAge === 'string' && /^\d+$/.test(rawAge.trim())) age = parseInt(rawAge.trim(), 10);
				if (typeof age === 'number' && !Number.isNaN(age)) ageGroup = age <= 10 ? 'kid' : age < 16 ? 'teen' : 'adult';
			} catch { }
			const payload = { ...userdata, ageGroup, name };
			try { payload.history = (chatHistory || []).slice(-12); } catch { }
			try {
				// Do NOT force 'fast' in voice mode; default to balanced/full responses
				if (!payload.speed) payload.speed = 'balanced';
			} catch { }

			// Debug log for networking
			try { console.debug('llama-chat-stream request', { baseURL, url: `${baseURL}/llama-chat-stream`, payload, options }); } catch { }
			// Ensure language hint travels with the request so backend can reply in Hindi when selected
			const currentLang = (typeof lang === 'string' && lang) || (settings?.ttsLang) || 'en-IN';
			payload.lang = currentLang;
			const streamUrl = `${String(baseURL).replace(/\/$/, '')}/llama-chat-stream`;
			const resp = await fetch(streamUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!resp.ok || !resp.body) {
				console.warn('Stream endpoint failed; falling back', { status: resp.status });
				// Fallback to non-streaming path and handle UI updates here
				try {
					const fallback = await getResponse(userdata, '/llama-chat');
					setState('idle');
					if (fallback && fallback.data && fallback.data.result) {
						if (options.appendToLast) {
							updateLastAssistant(String(fallback.data.result || ''));
						} else {
							addMessage('assistant', fallback.data.result);
						}
						try {
							if (audio) await playTTS(fallback.data.result);
						} catch { }
					}
					return;
				} catch (e) {
					console.error('fallback /llama-chat failed', e);
					setState('idle');
					return;
				}
			}
			setState('thinking');
			let created = false;
			// Collect the full assistant text locally so we can TTS it reliably
			let finalText = '';
			if (setIsSpeaking && audio) setIsSpeaking(true);
			const reader = resp.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			while (true) {
				const { value, done } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				let idx;
				while ((idx = buffer.indexOf('\n')) !== -1) {
					const line = buffer.slice(0, idx).trim();
					buffer = buffer.slice(idx + 1);
					if (!line) continue;
					try {
						const obj = JSON.parse(line);
						if (obj.delta) {
							if (!created) {
								if (options.appendToLast) {
									// Do not create a new bubble; append to the existing last assistant
									created = true;
								} else {
									addMessage('assistant', '');
									created = true;
								}
							}
							updateLastAssistant(String(obj.delta));
							finalText += String(obj.delta);
						} else if (obj.done) {
							// meta end; could use for telemetry if needed
						}
					} catch { }
				}
			}
			setState('idle');
			if (setIsSpeaking) setIsSpeaking(false);
			// After the streamed response completes, auto-play TTS if voice mode is on
			try {
				// Prefer the locally accumulated text to avoid stale state closures
				const textToSpeak = (finalText && finalText.trim().length > 0)
					? finalText
					: (() => { try { const last = (chatHistory || [])[Math.max(0, (chatHistory || []).length - 1)]; return (last && last.role === 'assistant') ? last.content : ''; } catch { return ''; } })();
				if (audio && textToSpeak) {
					await playTTS(textToSpeak);
				}
			} catch (e) { console.debug('stream TTS playback skipped', e); }

			// Heuristic: if the answer is long and doesn't end with punctuation,
			// offer a 'Continue?' action that will append more tokens to the same bubble.
			try {
				const longEnough = (finalText || '').trim().length > 800;
				const endsClean = /[\.!?\)]\s*$/.test((finalText || '').trim());
				if (longEnough && !endsClean) {
					setContinueHint(true);
					setContinueAppend(true);
				}
			} catch { }

			// Auto-continue for Hindi as separate bubbles when enabled via options
			try {
				const wantSegments = typeof options.autoContinueSegments === 'number' ? options.autoContinueSegments : 0;
				const currentLang = (typeof lang === 'string' && lang) || (settings?.ttsLang) || 'en-IN';
				const isHindi = String(currentLang).toLowerCase().startsWith('hi');
				// Only auto-continue in Hindi and only when requested
				if (isHindi && wantSegments > 0) {
					// Small pause to let UI render previous bubble nicely
					await new Promise(r => setTimeout(r, 250));
					await streamResponse({ prompt: 'कृपया आगे बताइए', lang: currentLang }, { appendToLast: false, autoContinueSegments: wantSegments - 1 });
				}
			} catch { }
		} catch (e) {
			console.error('streamResponse error', e);
			setState('idle');
		}
	};

	// Start recording/recognition and show overlay UI
	const startRecording = async () => {
		setVoiceError(null);
		setIsOverlayVisible(true);
		// Try to start Web Speech API if available
		if (speechApiSupported && browserSupportsSpeechRecognition) {
			try {
				resetTranscript();
				// request mic first so permissions prompt appears
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
				micStreamRef.current = stream;
				const source = audioContextRef.current.createMediaStreamSource(stream);
				analyserRef.current = audioContextRef.current.createAnalyser();
				analyserRef.current.fftSize = 256;
				source.connect(analyserRef.current);
				// start recognition
				SpeechRecognition.startListening({ continuous: true, language: lang });
				// start level monitor loop
				const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
				const raf = () => {
					if (!analyserRef.current) return;
					analyserRef.current.getByteFrequencyData(dataArray);
					const values = dataArray.reduce((a, b) => a + b, 0);
					const average = values / dataArray.length;
					setMicLevel(average);
					requestAnimationFrame(raf);
				};
				requestAnimationFrame(raf);
			} catch (err) {
				console.error('startRecording (Speech API) error', err);
				setVoiceError('Could not start microphone: ' + (err?.message || err));
				setIsOverlayVisible(false);
			}
			return;
		}
		// Fallback: use MediaRecorder to capture audio and then send to server for STT
		if (mediaDevicesSupported) {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
				micStreamRef.current = stream;
				const source = audioContextRef.current.createMediaStreamSource(stream);
				analyserRef.current = audioContextRef.current.createAnalyser();
				analyserRef.current.fftSize = 256;
				source.connect(analyserRef.current);
				const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
				const raf = () => {
					if (!analyserRef.current) return;
					analyserRef.current.getByteFrequencyData(dataArray);
					const values = dataArray.reduce((a, b) => a + b, 0);
					const average = values / dataArray.length;
					setMicLevel(average);
					requestAnimationFrame(raf);
				};
				requestAnimationFrame(raf);
				recChunksRef.current = [];
				const mr = new MediaRecorder(stream);
				mediaRecorderRef.current = mr;
				mr.ondataavailable = (e) => { if (e.data && e.data.size) recChunksRef.current.push(e.data); };
				mr.onstop = () => {
					const b = new Blob(recChunksRef.current, { type: 'audio/webm' });
					setRecBlob(b);
					setRecState('ready');
					try { stream.getTracks().forEach(t => t.stop()); } catch { }
				};
				mr.start();
				setRecState('recording');
			} catch (e) {
				console.error('Recorder start failed', e);
				setVoiceError('Recorder failed to start. Check mic permissions.');
				setIsOverlayVisible(false);
			}
			return;
		}
		setVoiceError('No available method to capture audio in this environment.');
		setIsOverlayVisible(false);
	};
	// Stop recording/recognition and process transcript
	const stopRecording = async () => {
		setIsOverlayVisible(false);
		// Stop SpeechRecognition if active
		try {
			if (speechApiSupported && browserSupportsSpeechRecognition && listening) {
				SpeechRecognition.stopListening();
				// wait a tick for final transcript to flush
				await new Promise(r => setTimeout(r, 250));
				const t = transcript?.trim();
				if (t && t.length) {
					setMessage(t);
				}
				resetTranscript();
			} else if (mediaRecorderRef.current && recState === 'recording') {
				try {
					mediaRecorderRef.current.stop();
				} catch { }
				// wait for onstop to set recBlob
				let attempts = 0;
				while (recState !== 'ready' && attempts < 40) {
					// wait for blob
					// eslint-disable-next-line no-await-in-loop
					await new Promise(r => setTimeout(r, 100));
					attempts++;
				}
				if (recBlob) {
					// We intentionally avoid using server-side STT here.
					// Prefer the browser SpeechRecognition (Web Speech API) which
					// populates `transcript`. If that's not available, inform the
					// user that local STT isn't supported instead of uploading audio.
					if (speechApiSupported && browserSupportsSpeechRecognition) {
						// Wait a moment for final transcript to settle (if any)
						await new Promise(r => setTimeout(r, 250));
						const t = transcript?.trim();
						if (t && t.length) {
							setMessage(t);
						} else {
							// No transcript even though API is present
							setVoiceError('No speech detected. Please try again or type your question.');
						}
					} else {
						setVoiceError('Local speech recognition not available in this browser. Please type your question or enable a browser that supports Web Speech API.');
					}
				} else {
					setVoiceError('Recording failed; no audio captured.');
				}
			}
		} catch (e) {
			console.error('stopRecording error', e);
			setVoiceError('Failed to process recording.');
		} finally {
			// cleanup audio graph
			if (micStreamRef.current) {
				try { micStreamRef.current.getTracks().forEach(t => t.stop()); } catch { }
				micStreamRef.current = null;
			}
			if (audioContextRef.current) {
				try { audioContextRef.current.close(); } catch { }
				audioContextRef.current = null;
			}
			analyserRef.current = null;
			mediaRecorderRef.current = null;
			setRecState('idle');
			setMicLevel(0);
		}
	};

	useEffect(() => {
		if (!isTyping && listening) {
			setMessage(transcript);
		}
	}, [transcript, listening, isTyping]);

	const handleInputChange = (e) => {
		setMessage(e.target.value);
		setIsTyping(true);
	};

	const handleInputBlur = () => {
		setIsTyping(false);
	};

	// Centralized send function used by button click and Enter key
	const sendMessage = async () => {
		try {
			// Any manual send cancels a pending continuation hint
			setContinueHint(false);
			setContinueAppend(false);
			SpeechRecognition.stopListening();
			resetTranscript();
			setIsTyping(false);
			if (message) {
				addMessage('user', message);
				setState('waiting');
				SpeechRecognition.abortListening();
				if (streamingEnabled) {
					// In Hindi, keep elaborating into 2 extra messages automatically
					const isHindi = String(lang || '').toLowerCase().startsWith('hi');
					const autoSegs = isHindi ? 2 : 0;
					await streamResponse({ prompt: message, lang }, { autoContinueSegments: autoSegs });
					setMessage('');
					resetTranscript();
				} else {
					let resp = await getResponse({ prompt: message, lang }, '/llama-chat');
					setMessage('');
					resetTranscript();
					setState('idle');
					if (resp && resp.data && resp.data.result) {
						addMessage('assistant', resp.data.result);
						if (audio) {
							playTTS(resp.data.result);
							if (setIsSpeaking) setIsSpeaking(true);
						} else {
							if (setIsSpeaking) setIsSpeaking(false);
						}
					}
				}
			}
		} catch (e) { console.error('sendMessage error', e); }
	};

	const handleaudio = () => {
		setAudio(!audio);
		if (setIsSpeaking) setIsSpeaking(!audio); // update mascot speaking state
	};

	const continueAnswer = async () => {
		try {
			setContinueHint(false);
			// Ask the model to continue; append to last assistant bubble
			setState('waiting');
			await streamResponse({ prompt: 'continue' }, { appendToLast: continueAppend });
		} catch (e) { console.error('continueAnswer failed', e); }
	};

	return (
		<main className='relative overflow-hidden bg-gray-900 bg-opacity-95 md:rounded-lg md:shadow-md p-4 pt-2 pb-3 w-full flex flex-col'>
			{/* Gradient animated background */}
			<div className='chat-gradient-background' aria-hidden>
				<div className='gradient-sphere sphere-1' />
				<div className='gradient-sphere sphere-2' />
				<div className='gradient-sphere sphere-3' />
				<div className='glow' />
				<div className='grid-overlay' />
				<div className='noise-overlay' />
				<canvas ref={particleCanvasRef} id='chat-particles-canvas' className='particles-canvas' aria-hidden />
			</div>
			<div className='main-chat-wrapper'>
				<div className='chat-shell'>
					<div className='chat-grid'>
						<aside className='left-rail'>
							<div id='chacha-3d-mount' className='model-holder chacha-3d-pill relative flex items-center justify-center'>
								<ChachaCanvas />
							</div>
						</aside>

						<section className='right-panel'>
							<div className='flex items-center justify-between mb-4'>
								<h1 className='text-2xl md:text-3xl font-extrabold text-white text-center flex-1'>
									{t('chat.title')}
									<span className='block text-blue-300 mt-2 text-lg md:text-xl font-semibold'>{t('chat.subtitle')}</span>
								</h1>
								<div className='flex items-center gap-2'>
									<button
										className='text-xs md:text-sm px-3 py-2 rounded-md bg-gray-800 text-gray-100 border border-gray-600 hover:bg-gray-700'
										onClick={() => { resetHistory(); setState('idle'); setMessage(''); setContinueHint(false); setContinueAppend(false); }}
									>
										{t('chat.newChat')}
									</button>
									<button
										className='text-xs md:text-sm px-3 py-2 rounded-md bg-gray-800 text-gray-100 border border-gray-600 hover:bg-gray-700 flex items-center gap-2'
										onClick={handleaudio}
										title={audio ? 'Disable voice (no auto TTS)' : 'Enable voice (auto TTS)'}
									>
										{audio ? (<><HiOutlineSpeakerWave /><span className='hidden md:inline'>{t('chat.voiceOn')}</span></>) : (<><HiOutlineSpeakerXMark /><span className='hidden md:inline'>{t('chat.voiceOff')}</span></>)}
									</button>
									<label className='flex items-center gap-2 text-xs md:text-sm text-gray-300'>
										<input type='checkbox' checked={streamingEnabled} onChange={(e) => setStreamingEnabled(e.target.checked)} />
										{t('chat.streamReplies')}
									</label>
								</div>
							</div>
							{/* Messages card */}
							<div ref={containerRef} className='messages-card hide-scrollbar flex-1 overflow-y-auto p-4 md:p-6'>
								<div className='flex flex-col space-y-4'>
									{chatHistory.length === 0 ? (
										<Fragment>
											{/* Personalized wave if name known */}
											{(() => { try { const p = JSON.parse(localStorage.getItem('userProfile') || 'null'); if (p?.name) return (<p className='text-gray-300 text-sm mb-2'>{t('chat.greetingPrefix')} {p.name} 👋 {t('chat.greetingSuffix')}</p>); } catch { } return null; })()}
											<Welcome />
											<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
												{samplePhrases.map(phrase => (
													<button
														key={phrase}
														onClick={async () => {
															setMessage(phrase);
															// Use a small delay to ensure the message state is set before sending
															await new Promise(r => setTimeout(r, 50));
															await sendMessage();
														}}
														className='bg-gray-100 border-gray-300 border-2 rounded-md p-2 text-sm'>
														{phrase}
													</button>
												))}
											</div>
										</Fragment>
									) : (
										chatHistory.map((chat, i) => (
											<div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
												<div className={`rounded-2xl px-4 py-3 shadow-sm max-w-[70%] text-sm font-medium ${chat.role === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-100'} mb-3`}>
													{chat.content}
												</div>
											</div>
										))
									)}
									{/* Typing indicator bubble when assistant is thinking */}
									{(state === 'waiting' || state === 'thinking') && (
										<div className='flex justify-start w-full'>
											<div className='rounded-2xl px-4 py-3 shadow-sm max-w-[60%] text-sm font-medium bg-gray-800 text-gray-300 mb-3'>
												<span className='inline-flex items-center space-x-2'>
													<span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0ms' }} />
													<span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '150ms' }} />
													<span className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '300ms' }} />
													<span className='ml-2'>{t('chat.thinking')}</span>
												</span>
											</div>
										</div>
									)}
									{/* Continue hint when answer likely truncated */}
									{continueHint && state === 'idle' && (
										<div className='flex justify-start w-full'>
											<div className='rounded-2xl px-4 py-2 shadow-sm text-sm bg-gray-700 text-gray-100 mb-3 flex items-center gap-3'>
												<span>{t('chat.continuePrompt')}</span>
												<button className='px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white' onClick={() => { void continueAnswer(); }}>{t('chat.continue')}</button>
												<button className='px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded' onClick={() => { setContinueHint(false); setContinueAppend(false); }}>{t('chat.dismiss')}</button>
											</div>
										</div>
									)}
								</div>
								<div ref={bottomRef} />
							</div>

							{/* Input row inside the right panel */}
							<div className='chat-box-input-field mt-3'>
								<div className='chat-pill-container'>
									<div className='chat-pill' role='search'>
										<div className='chat-pill__left'>
											<div style={{ width: '120px' }}>
												<SelectLang setLang={setLang} />
											</div>
										</div>

										<div className='chat-pill__input-wrap'>
											{(isOverlayVisible || listening || recState === 'recording') ? (
												<div className='chat-pill__waveform' onClick={() => { /* focus or toggle */ }}>
													{Array.from({ length: 26 }).map((_, idx) => (
														<VisualizerBar key={idx} idx={idx} analyserRef={analyserRef} listening={listening || recState === 'recording'} />
													))}
												</div>
											) : (
												<input
													type='text'
													ref={inputRef}
													className='chat-pill__input chat-input'
													placeholder={state === 'idle' ? (isHindiUI ? 'कुछ भी पूछें' : t('chat.placeholderAsk')) : '...'}
													value={message}
													onChange={handleInputChange}
													onKeyDown={(e) => {
														if (e.key === 'Enter' && !e.shiftKey) {
															e.preventDefault();
															void sendMessage();
														}
													}}
													onBlur={handleInputBlur}
													disabled={state !== 'idle'}
												/>
											)}
										</div>

										<div className='chat-pill__actions'>
											<button
												title={(isOverlayVisible || listening) ? 'Stop' : 'Start voice input'}
												onClick={async () => {
													if (isOverlayVisible) await stopRecording(); else await startRecording();
												}}
												className={'chat-pill__mic ' + (isOverlayVisible || listening ? 'active' : '')}
											>
												<BsMic />
											</button>

											<button
												className='chat-pill__send'
												onClick={() => { void sendMessage(); }}
												disabled={!message || state !== 'idle'}
												aria-label='Send'
											>
												<span className='chat-pill__send-text'>{t('chat.send')}</span>
											</button>
										</div>
									</div>
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		</main>
	);
};

export default ChatBot;

ChatBot.propTypes = {
	setIsSpeaking: PropTypes.func,
};

// Small visualizer bar component that reads the analyser node and scales height
function VisualizerBar({ idx, analyserRef, listening }) {
	const ref = useRef(null);
	useEffect(() => {
		let rafId = null;
		const el = ref.current;
		const update = () => {
			try {
				const analyser = analyserRef.current;
				if (!analyser || !el) {
					el.style.height = '4px';
					rafId = requestAnimationFrame(update);
					return;
				}
				const bins = analyser.frequencyBinCount;
				const arr = new Uint8Array(bins);
				analyser.getByteFrequencyData(arr);
				// pick a frequency band per bar, spread across the array
				const band = Math.floor((idx / 18) * bins);
				const v = arr[band] / 255; // 0..1
				const min = 4;
				const max = 48;
				const h = Math.round(min + v * (max - min));
				el.style.height = h + 'px';
				el.style.opacity = String(0.35 + v * 0.65);
			} catch (e) { /* ignore */ }
			rafId = requestAnimationFrame(update);
		};
		if (listening) update();
		return () => { if (rafId) cancelAnimationFrame(rafId); };
	}, [analyserRef, idx, listening]);
	return <div ref={ref} style={{ width: 6, height: 6, background: 'linear-gradient(180deg,#60a5fa,#0369a1)', borderRadius: 3 }} className='transform-gpu' />;
}
