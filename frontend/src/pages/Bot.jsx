/* eslint-disable react/no-unknown-property */
/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense } from 'react';

import PropTypes from 'prop-types';

function ChachaModel({ isSpeaking }) {
	const gltf = useGLTF('/assets/chacha-cahaudhary/ChaCha.glb');
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
useGLTF.preload('/assets/chacha-cahaudhary/ChaCha.glb');

const Bot = () => {
	const [isSpeaking] = useState(false);

	return (
		<>
			{/* Info Banner */}
			{/* Chacha Chaudhary & Chat */}
			<section className="flex flex-col md:flex-row items-end gap-4 px-3 py-4">
				{/* 3D Model Container with animation */}
				<div className="flex flex-col items-center md:items-start w-full">
					   <div
						   className={`transition-transform duration-700 ease-in-out translate-x-0 relative`}
						   style={{ width: '500px', height: '600px', maxWidth: '500px', margin: '0 auto', borderRadius: '24px', overflow: 'hidden' }}
					   >
						<Canvas camera={{ position: [0, 2, 8], fov: 40 }} style={{ width: '100%', height: '100%' }}>
							<ambientLight intensity={1} />
							<directionalLight position={[10, 10, 10]} intensity={1.2} />
							<Suspense fallback={null}>
									<ChachaModel isSpeaking={isSpeaking} />
								</Suspense>
							<OrbitControls enablePan={true} enableZoom={true} />
						</Canvas>
					</div>
				</div>
				{/* Chat box with fade-in animation only */}
				   {/* Chat box removed from Bot.jsx. Only accessible from Home.jsx top right button. */}
			</section>
		</>
	);
};

export default Bot;

ChachaModel.propTypes = {
	isSpeaking: PropTypes.bool,
};
