import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { useSettings } from 'context/SettingsContext';
import '../styles/hide-scrollbar.css';
import { Welcome } from 'components';
import { BsMic } from 'react-icons/bs';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { samplePhrases } from 'data';
import { useMessageContext } from 'context/MessageProvider';
import { BotStateContext } from 'context/BotState';
import SelectLang from 'components/SelectLang';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import PropTypes from 'prop-types';

const ChatBot = ({ setIsSpeaking }) => {
	const { settings } = useSettings();
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
			if (e.detail && e.detail.message === 'hello') {
				setAudio(true); // activate voice mode
				addMessage('user', 'hello');
				setState('waiting');
				getResponse({ prompt: 'hello' }, '/llama-chat').then(resp => {
					setState('idle');
					if (resp && resp.data && resp.data.result) {
						addMessage('assistant', resp.data.result);
						if (setIsSpeaking) setIsSpeaking(true);
						playTTS(resp.data.result);
					}
				});
			}
		};
		window.addEventListener('activate-chatbot-voice', handler);
		return () => window.removeEventListener('activate-chatbot-voice', handler);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	// Mic loudness state
	const [micLevel, setMicLevel] = useState(0);
	const audioContextRef = useRef(null);
	const analyserRef = useRef(null);
	const micStreamRef = useRef(null);
	// Play Gemini TTS audio for assistant responses
	async function playTTS(text) {
		try {
			const apiBase = import.meta?.env?.DEV ? '/api' : 'http://localhost:5000';
			const voiceToSend = ttsVoiceRef.current || settings?.ttsVoice;
			console.debug('playTTS sending voice=', voiceToSend);
			const response = await fetch(`${apiBase}/tts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				// Use the ref to ensure the latest selected voice is used even when
				// this function is called from an event handler created earlier.
				body: JSON.stringify({ text, voice: voiceToSend }),
			});
			if (!response.ok) return;
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const audio = new Audio(url);
			audio.play();
		} catch (err) {
			console.error('TTS error:', err);
		}
	}
	const [message, setMessage] = useState('');
	// audio=true: voice mode (3D mascot), audio=false: text mode (popup)
	const [audio, setAudio] = useState(true);
	const { botState, setBotState } = useContext(BotStateContext);
	const [isTyping, setIsTyping] = useState(false);
	const [state, setState] = useState('idle');
	const [lang, setLang] = useState('en-IN');
	const inputRef = useRef(null);

	const { chatHistory, addMessage } = useMessageContext();

	const bottomRef = useRef(null);
	const containerRef = useRef(null);

	const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

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

	useEffect(() => {
		// On mount, make sure chat container is scrolled to bottom without smooth
		scrollToBottom({ smooth: false });
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

	const baseURL = import.meta?.env?.DEV ? '/api' : 'http://localhost:5000';

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
				// Provide recent conversation history for context (last 8 messages)
				try {
					payload.history = (chatHistory || []).slice(-8);
				} catch {}
				// In voice mode we prefer fast fallback, but let kids get full richer answers
				const isKid = payload.ageGroup === 'kid';
				if (audio && !payload.fallback && !isKid) {
					payload.fallback = true;
				}
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

	const handleListen = async () => {
		if (browserSupportsSpeechRecognition) {
			resetTranscript();
			SpeechRecognition.startListening({ continuous: true, language: lang });
			// Start mic loudness monitoring
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
				micStreamRef.current = stream;
				const source = audioContextRef.current.createMediaStreamSource(stream);
				analyserRef.current = audioContextRef.current.createAnalyser();
				analyserRef.current.fftSize = 256;
				source.connect(analyserRef.current);
				const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
				const updateMicLevel = () => {
					analyserRef.current.getByteFrequencyData(dataArray);
					// Get average volume
					const values = dataArray.reduce((a, b) => a + b, 0);
					const average = values / dataArray.length;
					setMicLevel(average);
					if (listening) {
						requestAnimationFrame(updateMicLevel);
					}
				};
				updateMicLevel();
			} catch (err) {
				console.error('Mic access error:', err);
			}
		}
	};
	const handleStop = () => {
		SpeechRecognition.stopListening();
		resetTranscript();
		// Stop mic loudness monitoring
		if (micStreamRef.current) {
			micStreamRef.current.getTracks().forEach(track => track.stop());
			micStreamRef.current = null;
		}
		if (audioContextRef.current) {
			audioContextRef.current.close();
			audioContextRef.current = null;
		}
		analyserRef.current = null;
		setMicLevel(0);
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
			SpeechRecognition.stopListening();
			resetTranscript();
			setIsTyping(false);
			if (message) {
				addMessage('user', message);
				setState('waiting');
				SpeechRecognition.abortListening();
				let resp = await getResponse({ prompt: message }, '/llama-chat');
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
		} catch (e) { console.error('sendMessage error', e); }
	};

	const handleaudio = () => {
		setAudio(!audio);
		if (setIsSpeaking) setIsSpeaking(!audio); // update mascot speaking state
	};

	return (
	<main className='bg-gray-900 bg-opacity-95 md:rounded-lg md:shadow-md p-4 pt-2 pb-3 w-full h-full flex flex-col'>
		<h1 className='text-base text-gray-100 font-semibold mb-1'>Welcome to NMCG - <span className='underline underline-offset-2 text-blue-300'> Chacha Chaudhary</span></h1>
			<div className='relative w-full px-6 md:px-8 h-[56vh] md:h-[60vh]'>
				<section ref={containerRef} className='chat-box border-t-2 border-gray-700 pt-4 overflow-y-auto h-full pb-28 hide-scrollbar px-4 md:px-6'>
				<div className='flex flex-col space-y-4'>
					{chatHistory.length === 0 ? (
						<Fragment>
							<Welcome />
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
								{samplePhrases.map(phrase => (
									<button
										key={phrase}
										onClick={() => {
											addMessage('user', phrase);
											setTimeout(() => {
												setState('idle');
												addMessage('assistant', 'Wait, I am looking for your query!');
											}, 1100);
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

					{/* Remove currentChat and currentMessage usage, or define them safely */}
				</div>

					<div ref={bottomRef} />
				</section>

				{/* input bar fixed to bottom of the chat card */}
				<div className='chat-box-input-field absolute left-6 right-6 bottom-6 z-20 mx-auto max-w-[920px] flex flex-row items-center justify-between gap-4 rounded-2xl p-4 bg-gray-800/90 backdrop-blur-sm shadow-md border border-gray-700'>
				<div className='flex flex-row items-center gap-3'>
					<button onClick={handleaudio} className='text-3xl text-gray-300 hover:text-blue-400'>
						{audio ? <HiOutlineSpeakerWave /> : <HiOutlineSpeakerXMark />}
					</button>
					<div className='w-32 text-sm'><SelectLang setLang={setLang} /></div>
					<button
						onClick={handleListen}
						className={listening ? `bg-blue-600 text-white py-2 px-3 rounded-full animate-pulse border-2 border-blue-700 text-sm` : `bg-gray-700 text-gray-200 py-2 px-3 rounded-full border border-gray-600 text-sm`}
						disabled={listening}
						title={listening ? 'Listening...' : 'Start voice input'}
					>
						<BsMic className='text-2xl' />
					</button>
					{listening && (
						<span className='ml-1 text-blue-400 font-semibold text-sm animate-pulse'>Listening...</span>
					)}
					{listening && (
						<button
							onClick={handleStop}
							className='bg-red-600 text-white py-1 px-2 rounded-full font-semibold border border-red-700 ml-1 text-sm'
						>
							Stop
						</button>
					)}
					{!listening && transcript && (
						<button
							onClick={handleListen}
							className='bg-yellow-400 text-black py-1 px-2 rounded-full font-semibold border border-yellow-600 ml-1 text-sm'
							title='Retry voice input'
						>
							Retry
						</button>
					)}
					{listening && (
						<div className='w-28 h-2 bg-gray-200 rounded mt-2 relative'>
							<div
								className='h-2 rounded bg-green-500 transition-all duration-100'
								style={{ width: `${Math.min(100, micLevel)}%` }}
							/>
						</div>
					)}
				</div>
				<div className='flex flex-row flex-wrap items-center gap-3 flex-grow' style={{ maxWidth: '720px' }}>
					<input
						type='text'
						ref={inputRef}
				className='flex-grow chat-input rounded-md px-4 py-3 text-base min-h-[48px] border border-gray-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-900 transition-all duration-150 shadow-sm bg-gray-900 text-gray-100 placeholder-gray-400'
						style={{ minWidth: '0', maxWidth: '420px' }}
						placeholder={state === 'idle' ? 'Type your message...' : '...'}
						value={message}
						onChange={handleInputChange}
						onKeyDown={(e) => {
							// Send on Enter, but allow Shift+Enter for new lines
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								void sendMessage();
							}
						}}
						onBlur={handleInputBlur}
						disabled={state !== 'idle'}
					/>
					<button
						className='bg-blue-700 hover:bg-blue-800 text-white text-base font-semibold py-3 px-6 rounded-md shadow-md transition-all duration-150 disabled:bg-gray-700 disabled:cursor-not-allowed'
						disabled={message && state === 'idle' ? false : true}
						onClick={() => { void sendMessage(); }}
					>
						Send
					</button>
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
