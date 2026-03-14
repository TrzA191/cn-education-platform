import dotenv from "dotenv";
import app from "./app";
import { runMigrations } from "./lib/migrate";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function start() {

  await runMigrations();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

}

start();