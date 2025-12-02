import React from 'react';

const VoiceActivityBox = ({ active }) => {
    // Use a high z-index and ensure pointer events don't block interaction
    if (!active) return null;

    return (
        <div
            className="absolute left-1/2 transform -translate-x-1/2 z-[9999] flex items-center justify-center pointer-events-none"
            style={{ top: '40%' }}
        >
            <div className="
        relative px-3 py-1.5 
        bg-black/80 backdrop-blur-xl 
        border border-purple-500/50 
        rounded-full 
        shadow-[0_0_30px_rgba(139,92,246,0.6)]
        flex items-center gap-1.5
        transition-all duration-300 ease-out
        scale-75
      ">
                {/* Animated bars */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 bg-gradient-to-t from-purple-400 to-blue-300 rounded-full animate-pulse"
                        style={{
                            height: '16px',
                            animation: `voice-wave 0.8s ease-in-out infinite`,
                            animationDelay: `${i * 0.1}s`
                        }}
                    />
                ))}

                <style>{`
          @keyframes voice-wave {
            0%, 100% { height: 10px; opacity: 0.6; }
            50% { height: 26px; opacity: 1; }
          }
        `}</style>
            </div>
        </div>
    );
};

export default VoiceActivityBox;
