import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from 'vite-jsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), jsconfigPaths()],
	build: {
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					three: ['three', '@react-three/fiber', '@react-three/drei'],
					motion: ['framer-motion'],
					mantine: ['@mantine/core', '@mantine/hooks', '@mantine/modals'],
					markdown: ['react-markdown', 'remark-gfm'],
				},
			},
		},
		chunkSizeWarningLimit: 1200,
	},
	// Enable Vitest config co-located with Vite
	test: {
		environment: 'jsdom',
		globals: true,
	},
});
