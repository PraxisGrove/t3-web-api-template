import "server-only";

export const openApiDocument = {
	openapi: "3.1.0",
	info: {
		title: "T3 Web API",
		version: "0.1.0",
		description:
			"Versioned REST API for mobile clients and third-party integrations.",
	},
	servers: [
		{
			url: "/api/v1",
			description: "Current origin",
		},
	],
	tags: [
		{
			name: "Posts",
			description:
				"Example REST resource backed by Prisma and shared services.",
		},
	],
	paths: {
		"/posts": {
			get: {
				tags: ["Posts"],
				summary: "List recent posts",
				operationId: "listRecentPosts",
				responses: {
					"200": {
						description: "Recent posts",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ListPostsResponse",
								},
							},
						},
					},
					"429": {
						description: "Too many requests",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
			post: {
				tags: ["Posts"],
				summary: "Create a post",
				operationId: "createPost",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: {
								$ref: "#/components/schemas/CreatePostInput",
							},
						},
					},
				},
				responses: {
					"201": {
						description: "Created post",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/PostResponse",
								},
							},
						},
					},
					"400": {
						description: "Invalid request body",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					"429": {
						description: "Too many requests",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
	},
	components: {
		schemas: {
			CreatePostInput: {
				type: "object",
				required: ["name"],
				additionalProperties: false,
				properties: {
					name: {
						type: "string",
						minLength: 1,
						maxLength: 120,
					},
				},
			},
			Post: {
				type: "object",
				required: ["id", "name", "createdAt", "updatedAt"],
				properties: {
					id: {
						type: "integer",
						format: "int32",
					},
					name: {
						type: "string",
					},
					createdAt: {
						type: "string",
						format: "date-time",
					},
					updatedAt: {
						type: "string",
						format: "date-time",
					},
				},
			},
			PostResponse: {
				type: "object",
				required: ["data"],
				properties: {
					data: {
						$ref: "#/components/schemas/Post",
					},
				},
			},
			ListPostsResponse: {
				type: "object",
				required: ["data", "meta"],
				properties: {
					data: {
						type: "array",
						items: {
							$ref: "#/components/schemas/Post",
						},
					},
					meta: {
						type: "object",
						required: ["count"],
						properties: {
							count: {
								type: "integer",
								minimum: 0,
							},
						},
					},
				},
			},
			ErrorResponse: {
				type: "object",
				required: ["error"],
				properties: {
					error: {
						type: "object",
						required: ["code", "message"],
						properties: {
							code: {
								type: "string",
								enum: ["invalid_request", "rate_limited", "internal_error"],
							},
							message: {
								type: "string",
							},
							details: {
								description: "Machine-readable details for clients.",
							},
						},
					},
				},
			},
		},
	},
} as const;
