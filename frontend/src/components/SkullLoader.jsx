import PropTypes from 'prop-types';
import { Skeleton } from '@mantine/core';

// Full-page route-level skeleton while lazy pages load
export function RouteSkeleton() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-100">
			<div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
				<Skeleton height={28} width="40%" radius="md" />
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="rounded-2xl bg-white/70 p-4 shadow">
						<Skeleton height={18} mt={4} radius="sm" />
						<Skeleton height={18} mt={10} radius="sm" />
						<Skeleton height={18} mt={10} radius="sm" />
					</div>
					<div className="rounded-2xl bg-white/70 p-4 shadow">
						<Skeleton height={18} mt={4} radius="sm" />
						<Skeleton height={18} mt={10} radius="sm" />
						<Skeleton height={18} mt={10} radius="sm" />
					</div>
				</div>
				<Skeleton height={320} radius="lg" />
			</div>
		</div>
	);
}

// Card/content skeleton with configurable text lines
export function CardSkeleton({ lines = 3 }) {
	return (
		<div className="rounded-2xl bg-white/90 p-6 shadow">
			<Skeleton height={22} width="45%" radius="sm" />
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton key={i} height={16} mt={12} radius="sm" />
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
				<div key={i} className="w-[320px] max-w-full">
					<Skeleton height={height} radius="md" />
					<Skeleton height={14} width="60%" mt={8} radius="sm" />
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
