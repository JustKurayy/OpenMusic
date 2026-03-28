import { fileURLToPath } from "url";
import path from "path";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, "../.env") });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
    );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function ensureDatabaseSchema(): Promise<void> {
    await pool.query(`
        ALTER TABLE tracks
        ADD COLUMN IF NOT EXISTS track_number integer,
        ADD COLUMN IF NOT EXISTS cover_art text;
    `);
}
