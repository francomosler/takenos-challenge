// Need to keep this to prevent issues with tests that cannot be modified
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";
import { PrismaClient } from "@prisma";

const connectionString = 'file:./dev.db';

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };

