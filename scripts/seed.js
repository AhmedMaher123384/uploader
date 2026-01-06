const mongoose = require("mongoose");
const { loadConfig } = require("../src/config/env");
const { connectToMongo } = require("../src/config/db");
const Merchant = require("../src/models/Merchant");

/**
 * Reads CLI args:
 * - `--uri` or `--mongodb-uri`
 * - `--db` or `--db-name`
 * @param {string[]} argv
 * @returns {{ uri?: string, dbName?: string }}
 */
function readSeedArgs(argv) {
  const getValue = (key) => {
    const idx = argv.indexOf(key);
    if (idx === -1) return undefined;
    const val = argv[idx + 1];
    if (!val || val.startsWith("--")) return undefined;
    return val;
  };

  return {
    uri: getValue("--uri") || getValue("--mongodb-uri"),
    dbName: getValue("--db") || getValue("--db-name")
  };
}

/**
 * Seeds a demo merchant for local testing.
 */
async function seed() {
  const args = readSeedArgs(process.argv);
  if (!process.env.MONGODB_URI && args.uri) process.env.MONGODB_URI = args.uri;
  if (!process.env.MONGODB_DB_NAME && args.dbName) process.env.MONGODB_DB_NAME = args.dbName;

  const config = loadConfig();
  await connectToMongo(config);

  await Merchant.deleteMany({});

  const merchant = await Merchant.create({
    merchantId: "123456",
    accessToken: "demo_access_token",
    refreshToken: "demo_refresh_token",
    tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000)
  });

  console.log("Seed completed:", { merchantId: merchant.merchantId });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
