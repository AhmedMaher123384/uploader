const { loadConfig } = require("./config/env");
const { connectToMongo } = require("./config/db");
const { createApp } = require("./app");

async function bootstrap() {
  const config = loadConfig();

  await connectToMongo(config);
  const app = createApp(config);

  app.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
