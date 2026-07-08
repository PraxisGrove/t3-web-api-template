import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
	await prisma.post.upsert({
		where: {
			id: 1,
		},
		update: {
			name: "Hello from seed",
		},
		create: {
			id: 1,
			name: "Hello from seed",
		},
	});
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
