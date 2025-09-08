import React, { Fragment, useContext, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense } from 'react';
import speaking from 'assets/chacha-cahaudhary/Lspeaking-bg.png';
import ChatBot from './ChatBot';
import { BotStateContext } from 'context/BotState';

function ChachaModel({ isSpeaking }) {
	const gltf = useGLTF('/src/assets/chacha-cahaudhary/ChaCha.glb');
	// Example: scale up when speaking
	// Reduce scale and center vertically
	// Further reduce scale and adjust vertical position
	return <primitive object={gltf.scene} scale={isSpeaking ? 0.85 : 0.7} position={[0, -1.2, 0]} />;
}
useGLTF.preload('/src/assets/chacha-cahaudhary/ChaCha.glb');

const Bot = () => {
		const [isOpen, setIsOpen] = useState(false);
		const { botState, setBotState } = useContext(BotStateContext);
		const [isSpeaking, setIsSpeaking] = useState(false);

	const handleButton = () => {
		console.log('clicked');
		setIsOpen(prev => !prev);
	};
	// idle  , waiting
			return (
				<>
					{/* Info Banner */}
					<section
						className={`${isOpen ? 'hidden' : 'block'} font-sans text-center text-lg bg-white/80 m-6 px-6 py-4 rounded-2xl shadow-md border border-blue-100`}
					>
						<span className="block text-gray-700">
							To know more about the holy river Ganga—its history, significance, and beyond—try a conversation with
							<span className="inline font-bold text-blue-700"> Chacha Chaudhary </span>
							by clicking on him.
						</span>
					</section>
					{/* Chacha Chaudhary & Chat */}
					<section className="flex flex-col md:flex-row items-end gap-4 px-3 py-4">
						<div className="flex flex-col items-center md:items-start w-full">
							<div style={{ width: '100%', height: '500px', maxWidth: '700px', margin: '0 auto', cursor: 'pointer', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }} onClick={handleButton}>
								<Canvas camera={{ position: [0, 2.5, 8.5], fov: 36 }} style={{ width: '100%', height: '100%' }}>
									<ambientLight intensity={1} />
									<directionalLight position={[10, 10, 10]} intensity={1.2} />
									<Suspense fallback={null}>
										<ChachaModel isSpeaking={isSpeaking} />
									</Suspense>
									<OrbitControls enablePan={true} enableZoom={true} />
								</Canvas>
							</div>
							<span className="text-base text-gray-700 mt-2 block text-center font-bold">Click the 3D Chacha Chaudhary to chat!</span>
						</div>
						<div className={`flex-1 ${isOpen ? 'block' : 'hidden'}`}> 
							{/* if state === idle for few seconds close chatbot */}
							<ChatBot setIsSpeaking={setIsSpeaking} />
						</div>
					</section>
				</>
	);
};

export default Bot;
