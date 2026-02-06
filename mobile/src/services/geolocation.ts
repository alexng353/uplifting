import { Geolocation } from "@capacitor/geolocation";
import { getGyms, setCurrentGymId } from "./local-storage";

export const GYM_PROXIMITY_THRESHOLD_METERS = 300;

interface Coordinates {
	latitude: number;
	longitude: number;
}

export async function getCurrentPosition(): Promise<Coordinates | null> {
	try {
		const position = await Geolocation.getCurrentPosition({
			enableHighAccuracy: true,
			timeout: 10000,
		});
		return {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude,
		};
	} catch {
		return null;
	}
}

export function haversineDistance(a: Coordinates, b: Coordinates): number {
	const R = 6371000; // Earth radius in meters
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(b.latitude - a.latitude);
	const dLon = toRad(b.longitude - a.longitude);
	const sinDLat = Math.sin(dLat / 2);
	const sinDLon = Math.sin(dLon / 2);
	const h =
		sinDLat * sinDLat +
		Math.cos(toRad(a.latitude)) *
			Math.cos(toRad(b.latitude)) *
			sinDLon *
			sinDLon;
	return 2 * R * Math.asin(Math.sqrt(h));
}

export async function detectAndSetNearbyGym() {
	const position = await getCurrentPosition();
	if (!position) return null;

	const gyms = await getGyms();
	let nearestGym: { id: string; distance: number } | null = null;

	for (const gym of gyms) {
		if (gym.latitude == null || gym.longitude == null) continue;
		const distance = haversineDistance(position, {
			latitude: gym.latitude,
			longitude: gym.longitude,
		});
		if (
			distance <= GYM_PROXIMITY_THRESHOLD_METERS &&
			(!nearestGym || distance < nearestGym.distance)
		) {
			nearestGym = { id: gym.id, distance };
		}
	}

	if (nearestGym) {
		await setCurrentGymId(nearestGym.id);
		return nearestGym.id;
	}

	return null;
}
