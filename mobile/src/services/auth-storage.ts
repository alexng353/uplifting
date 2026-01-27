import { SecureStorage } from "@aparajita/capacitor-secure-storage";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export async function saveTokens(
	accessToken: string,
	refreshToken?: string,
): Promise<void> {
	try {
		await SecureStorage.set(TOKEN_KEY, accessToken);

		if (refreshToken) {
			await SecureStorage.set(REFRESH_TOKEN_KEY, refreshToken);
		}
	} catch (e) {
		console.error("Secure storage save failed", e);
		throw e;
	}
}

export async function getAccessToken(): Promise<string | null> {
	try {
		const value = await SecureStorage.get(TOKEN_KEY);
		return typeof value === "string" ? value : null;
	} catch {
		return null;
	}
}

export async function getRefreshToken(): Promise<string | null> {
	try {
		const value = await SecureStorage.get(REFRESH_TOKEN_KEY);
		return typeof value === "string" ? value : null;
	} catch {
		return null;
	}
}

export async function clearTokens(): Promise<void> {
	await SecureStorage.remove(TOKEN_KEY);
	await SecureStorage.remove(REFRESH_TOKEN_KEY);
}
