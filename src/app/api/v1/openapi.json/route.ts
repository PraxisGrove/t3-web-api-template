import { openApiDocument } from "~/server/openapi/document";
import { createRestQuery } from "~/server/rest/endpoint";
import { preflight } from "~/server/security/cors";

export function OPTIONS(request: Request) {
	return preflight(request);
}

export const GET = createRestQuery({
	route: "GET /api/v1/openapi.json",
	handler: async () => ({ body: openApiDocument }),
});
