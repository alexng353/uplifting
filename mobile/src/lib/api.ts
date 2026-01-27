import { getAccessToken } from "../services/auth-storage";
import { client } from "./api-openapi-gen/client.gen";
import { env } from "./env";

client.setConfig({
	baseUrl: env.VITE_API_URL,
});

client.interceptors.request.use(async (request, _options) => {
	const token = await getAccessToken();
	request.headers.set("Authorization", `Bearer ${token}`);
	return request;
});

export * as api from "./api-openapi-gen/sdk.gen";
