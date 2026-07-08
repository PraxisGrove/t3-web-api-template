import { NextResponse } from "next/server";

import { openApiDocument } from "~/server/openapi/document";
import { preflight, withCors } from "~/server/security/cors";

export function OPTIONS(request: Request) {
	return preflight(request);
}

export function GET(request: Request) {
	return withCors(request, NextResponse.json(openApiDocument));
}
