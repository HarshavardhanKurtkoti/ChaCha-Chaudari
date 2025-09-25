import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { Welcome, ChatMessage } from 'components';
import { BsCheckLg, BsMic } from 'react-icons/bs';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';
import { samplePhrases } from 'data';
import { useMessageContext } from 'context/MessageProvider';
import { BotStateContext } from 'context/BotState';
import SelectLang from 'components/SelectLang';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import axios from 'axios';
import bhashini from 'bhashini-translation';

const ChatBot = ({ setIsSpeaking }) => {
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
	}, []);
	// Mic loudness state
	const [micLevel, setMicLevel] = useState(0);
	const audioContextRef = useRef(null);
	const analyserRef = useRef(null);
	const micStreamRef = useRef(null);
	// Play Gemini TTS audio for assistant responses
	async function playTTS(text) {
		try {
			const userToken = localStorage.getItem('userToken');
			const response = await fetch('http://localhost:5000/tts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': userToken || ''
				},
				body: JSON.stringify({ text }),
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

	const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

	useEffect(() => {
		scrollToBottom();
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [chatHistory, state]);

	const scrollToBottom = () => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		setBotState(state);
		console.log(botState);
	}, [state]);

	const focusInput = () => {
		inputRef.current?.focus();
	};

	useEffect(() => {
		focusInput();
		// console.log(state, listening);
	}, [state]);

	const baseURL = 'http://localhost:5000';

	const api = axios.create({
		baseURL: baseURL,
		headers: {
			'Content-Type': 'application/json'
		}
	});

	let endpoint = 'http://localhost:5000/llama-chat';

	const getResponse = async (userdata, endpoint) => {
		try {
			const userToken = localStorage.getItem('userToken');
			const response = await api.post(endpoint, userdata, {
				headers: {
					'Authorization': userToken || ''
				}
			});
			console.log('response', response);
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

	const handleaudio = () => {
		setAudio(!audio);
		if (setIsSpeaking) setIsSpeaking(!audio); // update mascot speaking state
	};

	return (
	<main className='bg-gray-900 bg-opacity-95 md:rounded-lg md:shadow-md p-6 pt-2 pb-4 w-full h-full flex flex-col'>
		<h1 className='text-lg text-gray-100 font-semibold mb-2'>Welcome to NMCG - <span className='underline underline-offset-2 text-blue-300'> Chacha Chaudhary</span></h1>
	<section className='chat-box border-t-4 border-gray-700 pt-2 overflow-y-auto flex-grow pb-4 h-[55vh]'>
			<div className='flex flex-col space-y-4'>
					{chatHistory.length === 0 ? (
						<Fragment>
							<Welcome />
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
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
										className='bg-gray-100 border-gray-300 border-2 rounded-lg p-4'>
										{phrase}
									</button>
								))}
							</div>
						</Fragment>
					) : (
						chatHistory.map((chat, i) => (
							<div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
								<div className={`rounded-2xl px-5 py-3 shadow-md max-w-[70%] text-base font-medium ${chat.role === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-100'} mb-2`}>
									{chat.content}
								</div>
							</div>
						))
					)}

					{/* Remove currentChat and currentMessage usage, or define them safely */}
				</div>

				<div ref={bottomRef} />
			</section>
			 <div className='chat-box-input-field flex flex-row items-end justify-between gap-4 rounded-xl p-4 bg-gray-800 shadow-md border border-gray-700 mt-4'>
				<div className='flex flex-row items-center gap-3'>
					<button onClick={handleaudio} className='text-3xl text-gray-300 hover:text-blue-400'>
						{audio ? <HiOutlineSpeakerWave /> : <HiOutlineSpeakerXMark />}
					</button>
					<div className='w-32'><SelectLang setLang={setLang} /></div>
					<button
						onClick={handleListen}
						className={listening ? `bg-blue-600 text-white py-2 px-3 rounded-full animate-pulse border-4 border-blue-700` : `bg-gray-700 text-gray-200 py-2 px-3 rounded-full border-2 border-gray-600`}
						disabled={listening}
						title={listening ? 'Listening...' : 'Start voice input'}
					>
						<BsMic className='text-2xl' />
					</button>
					{listening && (
						<span className='ml-2 text-blue-400 font-bold animate-pulse'>Listening...</span>
					)}
					{listening && (
						<button
							onClick={handleStop}
							className='bg-red-600 text-white py-2 px-3 rounded-full font-bold border-2 border-red-700 ml-2'
						>
							Stop
						</button>
					)}
					{/* Show Retry only if user has tried and failed, not on initial render */}
					{!listening && transcript && (
						<button
							onClick={handleListen}
							className='bg-yellow-400 text-black py-2 px-3 rounded-full font-bold border-2 border-yellow-600 ml-2'
							title='Retry voice input'
						>
							Retry
						</button>
					)}
					{/* Mic loudness bar */}
					{listening && (
						<div className='w-32 h-3 bg-gray-200 rounded mt-2 relative'>
							<div
								className='h-3 rounded bg-green-500 transition-all duration-100'
								style={{ width: `${Math.min(100, micLevel)}%` }}
							/>
						</div>
					)}
				</div>
				<div className='flex flex-row flex-wrap items-center gap-3 flex-grow' style={{ maxWidth: '600px' }}>
					<input
						type='text'
						ref={inputRef}
						className='flex-grow rounded-lg p-4 text-lg min-h-[48px] border-2 border-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-900 transition-all duration-200 shadow-sm bg-gray-900 text-gray-100 placeholder-gray-400'
						style={{ minWidth: '0', maxWidth: '350px' }}
						placeholder={state === 'idle' ? 'Type your message...' : '...'}
						value={message}
						onChange={handleInputChange}
						onBlur={handleInputBlur}
						disabled={state !== 'idle'}
					/>
					<button
						className='bg-blue-700 hover:bg-blue-800 text-white text-base font-bold py-3 px-7 rounded-lg shadow transition-all duration-200 disabled:bg-gray-700 disabled:cursor-not-allowed'
						disabled={message && state === 'idle' ? false : true}
						onClick={async () => {
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
						}}
					>
						Send
					</button>
				</div>
			</div>
		</main>
	);
};

export default ChatBot;
