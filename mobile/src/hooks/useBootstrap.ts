import { useEffect, useState } from "react";
import { applyBootstrapData, fetchBootstrapData } from "../services/bootstrap";
import { detectAndSetNearbyGym } from "../services/geolocation";

interface BootstrapState {
	isBootstrapped: boolean;
	isLoading: boolean;
	error: Error | null;
}

export function useBootstrap() {
	const [state, setState] = useState<BootstrapState>({
		isBootstrapped: false,
		isLoading: true,
		error: null,
	});

	useEffect(() => {
		let cancelled = false;

		async function bootstrap() {
			try {
				const data = await fetchBootstrapData();
				if (cancelled) return;

				await applyBootstrapData(data);
				if (cancelled) return;

				setState({
					isBootstrapped: true,
					isLoading: false,
					error: null,
				});

				// Auto-detect nearby gym (fire-and-forget)
				detectAndSetNearbyGym().catch(() => {});
			} catch (err) {
				if (cancelled) return;

				setState({
					isBootstrapped: false,
					isLoading: false,
					error: err instanceof Error ? err : new Error("Bootstrap failed"),
				});
			}
		}

		bootstrap();

		return () => {
			cancelled = true;
		};
	}, []);

	return state;
}
