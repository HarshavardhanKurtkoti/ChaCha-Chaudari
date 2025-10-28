/* eslint-disable react/no-unknown-property */
/* eslint-disable no-mixed-spaces-and-tabs */
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense } from 'react';

import PropTypes from 'prop-types';

function ChachaModel({ isSpeaking }) {
	// Defer model preload until the component mounts so importing the module
	// doesn't trigger a network request during initial page load.
	// useGLTF will load when called during render; additionally we trigger
	// a preload in an effect when the Bot mounts.
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

// Remove global preload: preload only when Bot mounts to avoid early network usage.

export function ChachaCanvas({ isSpeaking = false }) {
	return (
		<div style={{ width: '100%', height: '100%' }}>
			<Canvas camera={{ position: [0, 2, 8], fov: 40 }} style={{ width: '100%', height: '100%' }}>
				<ambientLight intensity={1} />
				<directionalLight position={[10, 10, 10]} intensity={1.2} />
				<Suspense fallback={null}>
						<ChachaModel isSpeaking={isSpeaking} />
					</Suspense>
				<OrbitControls enablePan={true} enableZoom={true} />
			</Canvas>
		</div>
	);
}

const Bot = () => {
	const [isSpeaking] = useState(false);

	return (
		<>
			{/* Standalone model canvas for legacy usage */}
			<section className="px-3 py-4">
				<div className="chacha-3d-pill" style={{ width: '500px', height: '600px', maxWidth: '500px', margin: '0 auto', borderRadius: '24px', overflow: 'hidden' }}>
					<ChachaCanvas isSpeaking={isSpeaking} />
				</div>
			</section>
		</>
	);
};

export default Bot;

ChachaModel.propTypes = {
	isSpeaking: PropTypes.bool,
};

ChachaCanvas.propTypes = {
	isSpeaking: PropTypes.bool,
};
