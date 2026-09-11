import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
	// Seed an empty template database without overwriting user data or
	// bypassing the sequence used by subsequent API inserts.
	if ((await prisma.post.count()) === 0) {
		await prisma.post.create({ data: { name: "Hello from seed" } });
	}
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (error) => {
		console.error(error);
		await prisma.$disconnect();
		process.exit(1);
	});
