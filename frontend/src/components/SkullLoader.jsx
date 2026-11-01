import PropTypes from 'prop-types';

// Full-page route-level dark skeleton while lazy pages load
export function RouteSkeleton() {
	return (
		<div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col justify-between">
			<div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
				{/* Top nav skeleton */}
				<div className="flex items-center justify-between pb-6 border-b border-white/5">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10" />
						<div className="h-6 w-32 rounded-lg bg-white/15" />
					</div>
					<div className="flex items-center gap-3">
						<div className="hidden sm:block h-8 w-24 rounded-full bg-white/5 border border-white/10" />
						<div className="hidden sm:block h-8 w-24 rounded-full bg-white/5 border border-white/10" />
						<div className="h-9 w-28 rounded-full bg-cyan-500/20 border border-cyan-500/30" />
					</div>
				</div>

				{/* Hero content skeleton */}
				<div className="grid lg:grid-cols-12 gap-8 items-center py-6">
					<div className="lg:col-span-7 space-y-4">
						<div className="h-10 sm:h-14 w-4/5 rounded-2xl bg-white/15" />
						<div className="h-10 sm:h-14 w-3/5 rounded-2xl bg-white/15" />
						<div className="h-4 w-full rounded-lg bg-white/10 pt-2" />
						<div className="h-4 w-4/5 rounded-lg bg-white/10" />
						<div className="flex gap-4 pt-4">
							<div className="h-12 w-36 rounded-xl bg-gradient-to-r from-ganga-600/40 to-cyan-600/40 border border-cyan-400/20" />
							<div className="h-12 w-36 rounded-xl bg-white/5 border border-white/10" />
						</div>
					</div>
					<div className="lg:col-span-5 flex justify-center">
						<div className="w-72 h-80 sm:w-80 sm:h-96 rounded-3xl bg-surface-900/80 border border-white/10 p-6 flex flex-col justify-center items-center space-y-4">
							<div className="w-32 h-32 rounded-full bg-white/10 animate-pulse" />
							<div className="h-4 w-36 rounded-md bg-white/15" />
							<div className="h-3 w-48 rounded-md bg-white/10" />
						</div>
					</div>
				</div>

				{/* Bento cards skeleton */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="h-32 rounded-2xl bg-surface-900/60 border border-white/8 p-4 space-y-3">
							<div className="w-8 h-8 rounded-lg bg-white/10" />
							<div className="h-4 w-24 rounded-md bg-white/15" />
							<div className="h-3 w-full rounded-md bg-white/10" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// Card/content skeleton with configurable text lines
export function CardSkeleton({ lines = 3 }) {
	return (
		<div className="rounded-2xl bg-surface-900/80 border border-white/10 p-6 shadow-xl space-y-3 animate-pulse">
			<div className="h-5 w-40 rounded-lg bg-white/15" />
			{Array.from({ length: lines }).map((_, i) => (
				<div key={i} className="h-4 w-full rounded-md bg-white/10" />
			))}
		</div>
	);
}

CardSkeleton.propTypes = {
	lines: PropTypes.number,
};

// Gallery skeleton placeholders
export function GallerySkeleton({ items = 3, height = 200 }) {
	return (
		<div className="flex flex-wrap justify-center gap-6">
			{Array.from({ length: items }).map((_, i) => (
				<div key={i} className="w-[320px] max-w-full space-y-3">
					<div style={{ height }} className="rounded-2xl bg-surface-900/80 border border-white/10 animate-pulse" />
					<div className="h-4 w-3/5 rounded-md bg-white/10" />
				</div>
			))}
		</div>
	);
}

GallerySkeleton.propTypes = {
	items: PropTypes.number,
	height: PropTypes.number,
};

export default RouteSkeleton;
