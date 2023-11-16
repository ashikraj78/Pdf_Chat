import type {Config} from "drizzle-kit"
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const file = {
  driver: "pg",
  schema: "./src/lib/db/schema.ts",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;


export default file;





