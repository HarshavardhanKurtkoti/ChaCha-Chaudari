import React, { Fragment, useContext, useState } from 'react';
import speaking from 'assets/chacha-cahaudhary/Lspeaking-bg.png';
import ChatBot from './ChatBot';
import { BotStateContext } from 'context/BotState';

const Bot = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { botState, setBotState } = useContext(BotStateContext)

	const handleButton = () => {
		console.log('clicked');
		setIsOpen(prev => !prev);
	};
	// idle  , waiting
	return (
				<>
					{/* Info Banner */}
					<section
						className={`$ {
							isOpen ? 'hidden' : 'block'
						} font-sans text-center text-lg bg-white/80 m-6 px-6 py-4 rounded-2xl shadow-md border border-blue-100`}
					>
						<span className="block text-gray-700">
							To know more about the holy river Ganga—its history, significance, and beyond—try a conversation with
							<span className="inline font-bold text-blue-700"> Chacha Chaudhary </span>
							by clicking on him.
						</span>
					</section>
					{/* Chacha Chaudhary & Chat */}
					<section className="flex flex-col md:flex-row items-end gap-4 px-3 py-4">
						<div className="flex flex-col items-center md:items-start">
							<img
								className="w-32 md:w-40 cursor-pointer drop-shadow-lg hover:scale-105 transition-transform duration-200"
								src={speaking}
								alt="Chacha Chaudhary"
								onClick={handleButton}
							/>
							<span className="text-xs text-gray-500 mt-1 hidden md:block">Click to chat!</span>
						</div>
						<div className={`flex-1 ${isOpen ? 'block' : 'hidden'}`}>
							{/* if state === idle for few seconds close chatbot */}
							<ChatBot />
						</div>
					</section>
				</>
	);
};

export default Bot;
