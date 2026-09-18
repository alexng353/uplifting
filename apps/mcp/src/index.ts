import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, readConfig } from "./server";

try {
  const server = createServer(readConfig(process.env));
  await server.connect(new StdioServerTransport());
} catch {
  console.error(
    "Uplifting MCP failed to start. Set UPLIFTING_API_URL to an HTTPS API origin (or HTTP localhost) and UPLIFTING_ACCESS_TOKEN to your current admin access token.",
  );
  process.exitCode = 1;
}
