/* eslint-disable react/no-unknown-property */
import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import PropTypes from 'prop-types';

function ChachaModel({ isSpeaking }) {
	const gltf = useGLTF('/assets/chacha-cahaudhary/ChaCha.glb');

	// Check prefers-reduced-motion
	const [reducedMotion, setReducedMotion] = useState(false);
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		setReducedMotion(mq.matches);
		const handler = (e) => setReducedMotion(e.matches);
		if (mq.addEventListener) {
			mq.addEventListener('change', handler);
			return () => mq.removeEventListener('change', handler);
		}
	}, []);

	const baseScale = 0.9;
	const speakingScale = isSpeaking && !reducedMotion ? baseScale + 0.08 : baseScale;

	return (
		<group position={[0, -2, 0]}>
			<primitive object={gltf.scene} scale={speakingScale} />
		</group>
	);
}

// 2D fallback component when WebGL fails or model loading encounters an issue
function Fallback2DAvatar({ isSpeaking }) {
	return (
		<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-900/30 to-slate-900 p-4">
			<img
				src={isSpeaking ? '/assets/chacha-cahaudhary/Lspeaking-bg.png' : '/assets/chacha-cahaudhary/Lresting-bg.png'}
				alt="Chacha Chaudhary"
				className={`max-h-[80%] max-w-[80%] object-contain drop-shadow-xl transition-transform duration-300 ${isSpeaking ? 'scale-105' : 'scale-100'}`}
				onError={(e) => {
					e.target.src = '/assets/chacha-cahaudhary/chacha.webp';
				}}
			/>
			<span className="text-xs text-blue-300/80 mt-2 font-medium">Chacha Chaudhary</span>
		</div>
	);
}

Fallback2DAvatar.propTypes = {
	isSpeaking: PropTypes.bool,
};

export function ChachaCanvas({ isSpeaking = false }) {
	const [hasWebGl, setHasWebGl] = useState(true);
	const [webGlError, setWebGlError] = useState(false);

	useEffect(() => {
		try {
			const canvas = document.createElement('canvas');
			const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (!gl) setHasWebGl(false);
		} catch {
			setHasWebGl(false);
		}
	}, []);

	if (!hasWebGl || webGlError) {
		return <Fallback2DAvatar isSpeaking={isSpeaking} />;
	}

	return (
		<div style={{ width: '100%', height: '100%', position: 'relative' }}>
			<Canvas
				camera={{ position: [0, 2, 8], fov: 40 }}
				style={{ width: '100%', height: '100%' }}
				onCreated={({ gl }) => {
					gl.toneMappingExposure = 1.1;
				}}
				onError={() => setWebGlError(true)}
			>
				<ambientLight intensity={1.1} />
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
		<div style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', background: '#fff' }}>
			<ChachaCanvas isSpeaking={isSpeaking} />
		</div>
	);
};

export default Bot;

ChachaModel.propTypes = {
	isSpeaking: PropTypes.bool,
};

ChachaCanvas.propTypes = {
	isSpeaking: PropTypes.bool,
};
