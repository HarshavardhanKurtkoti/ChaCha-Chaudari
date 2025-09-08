import React, { Fragment, useContext, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense } from 'react';
import speaking from 'assets/chacha-cahaudhary/Lspeaking-bg.png';
import ChatBot from './ChatBot';
import { BotStateContext } from 'context/BotState';

function ChachaModel({ isSpeaking, isOpen }) {
	const gltf = useGLTF('/src/assets/chacha-cahaudhary/ChaCha.glb');
	// Animate scale based on chat open state
	// Make the model smaller and always centered
	const baseScale = 0.9; // smaller scale
	const speakingScale = isSpeaking ? baseScale + 0.1 : baseScale;
	// Center the model in the canvas
	return (
		<group position={[0, -2, 0]}>
			<primitive object={gltf.scene} scale={speakingScale} />
		</group>
	);
}
useGLTF.preload('/src/assets/chacha-cahaudhary/ChaCha.glb');

const Bot = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { botState, setBotState } = useContext(BotStateContext);
	const [isSpeaking, setIsSpeaking] = useState(false);

	const handleButton = () => {
		setIsOpen(prev => !prev);
	};

	return (
		<>
			{/* Info Banner */}
			{/* Chacha Chaudhary & Chat */}
			<section className="flex flex-col md:flex-row items-end gap-4 px-3 py-4">
				{/* 3D Model Container with animation */}
				<div className="flex flex-col items-center md:items-start w-full">
					<div
						className={`transition-transform duration-700 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-0'} relative`}
						style={{ width: '500px', height: '600px', maxWidth: '500px', margin: '0 auto', cursor: 'pointer', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
						onClick={handleButton}
					>
						<Canvas camera={{ position: [0, 2, 8], fov: 40 }} style={{ width: '100%', height: '100%' }}>
							<ambientLight intensity={1} />
							<directionalLight position={[10, 10, 10]} intensity={1.2} />
							<Suspense fallback={null}>
									<ChachaModel isSpeaking={isSpeaking} isOpen={isOpen} />
								</Suspense>
							<OrbitControls enablePan={true} enableZoom={true} />
						</Canvas>
					</div>
				</div>
				{/* Chat box with fade-in animation only */}
				<div
					className={`flex-1 transition-opacity duration-700 ease-in-out ${isOpen ? 'opacity-100 z-10' : 'opacity-0 z-0'} relative`}
					style={{ maxWidth: '800px', minHeight: '600px', margin: '0 auto', height: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', borderRadius: '24px' }}
				>
					{isOpen && (
						<ChatBot setIsSpeaking={setIsSpeaking} />
					)}
				</div>
			</section>
		</>
	);
};

export default Bot;
