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
				getResponse({ prompt: 'hello' }, '/chat').then(resp => {
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
			const response = await fetch('http://localhost:5000/tts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
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

	let endpoint = '/chat';

	const getResponse = async (userdata, endpoint) => {
		try {
			const response = await api.post(endpoint, userdata);
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
		<main className='bg-white bg-opacity-60 backdrop-blur-2xl md:rounded-lg md:shadow-md p-4 pt-1 pb-2  w-full h-full flex flex-col'>
			<h1 className='text-lg text-gray-800  '>Welcome to NMCG - <span className='underline underline-offset-2 text-blue-400'> Chacha Chaudhary</span></h1>
			<section className='chat-box border-t-4 border-stone-300 pt-[0.15rem]  overflow-y-auto flex-grow  pb-2 h-56 '>
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
						chatHistory.map((chat, i) => <ChatMessage key={i} message={chat} />)
					)}

					{/* Remove currentChat and currentMessage usage, or define them safely */}
				</div>

				<div ref={bottomRef} />
			</section>
			 <div className='chat-box-input-field flex items-center justify-center rounded-xl p-2 bg-gradient-to-r from-blue-50 via-white to-yellow-50 shadow-md border border-gray-200 mt-2'>
				<button onClick={handleaudio} className='text-3xl mr-1'>
					{audio ? <HiOutlineSpeakerWave /> : <HiOutlineSpeakerXMark />}
				</button>
				<div className='w-32'><SelectLang setLang={setLang} /></div>
				<div className='flex flex-col items-center'>
					<div className='flex items-center'>
						<button
							onClick={handleListen}
							className={listening ? `bg-blue-500 text-white mx-1 py-1 rounded-full animate-pulse border-4 border-blue-700` : `bg-gray-200 mx-1 py-1 rounded-full border-2 border-gray-400`}
							disabled={listening}
							title={listening ? 'Listening...' : 'Start voice input'}
						>
							<BsMic className='text-3xl' />
						</button>
						{listening && (
							<span className='ml-2 text-blue-700 font-bold animate-pulse'>Listening...</span>
						)}
						{listening && (
							<button
								onClick={handleStop}
								className='bg-red-500 text-white mx-1 py-1 rounded-full px-3 font-bold border-2 border-red-700'
							>
								Stop
							</button>
						)}
						{!listening && (
							<button
								onClick={handleListen}
								className='bg-yellow-400 text-black mx-1 py-1 rounded-full px-3 font-bold border-2 border-yellow-700'
								title='Retry voice input'
							>
								Retry
							</button>
						)}
					</div>
					{/* Mic loudness bar */}
					{listening && (
						<div className='w-40 h-3 bg-gray-200 rounded mt-2 relative'>
							<div
								className='h-3 rounded bg-green-500 transition-all duration-100'
								style={{ width: `${Math.min(100, micLevel)}%` }}
							/>
						</div>
					)}
				</div>
				 <input
				 type='text'
				 ref={inputRef}
				 className='w-full rounded-lg p-4 text-lg min-h-[48px] border-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 shadow-sm bg-white placeholder-gray-400'
				 style={{ minWidth: '300px', maxWidth: '600px' }}
				 placeholder={state === 'idle' ? 'Type your message...' : '...'}
				 value={message}
				 onChange={handleInputChange}
				 onBlur={handleInputBlur}
				 disabled={state !== 'idle'}
				 />
				 <button
				 className='bg-blue-600 hover:bg-blue-700 text-white text-base font-bold py-2 px-5 rounded-lg shadow transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed ml-2'
				 disabled={message && state === 'idle' ? false : true}
				 onClick={async () => {
						SpeechRecognition.stopListening();
						resetTranscript();
						setIsTyping(false);
						if (message) {
							addMessage('user', message);
							setState('waiting');
							SpeechRecognition.abortListening();
							let resp = await getResponse({ prompt: message }, '/chat');
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
		</main>
	);
};

export default ChatBot;
