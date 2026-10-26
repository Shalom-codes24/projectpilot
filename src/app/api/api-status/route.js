import { getKeysStatus } from "../../../lib/gemini";

export async function GET(request) {
  const clientKey = request.headers.get("x-gemini-api-key");
  const status = getKeysStatus(clientKey);
  return Response.json(status);
}
