const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const { createApiRouter } = require("./routes");
const { createWebhookRouter } = require("./routes/webhook.routes");
const { notFound } = require("./middlewares/notFound.middleware");
const { errorHandler } = require("./middlewares/error.middleware");
const { createRateLimiter } = require("./middlewares/rateLimit.middleware");

/**
 * Builds the Express app.
 * @param {import("./types").AppConfig} config
 */
function createApp(config) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(morgan("combined"));

  app.get("/", (_req, res) => {
    return res.json({
      ok: true,
      name: "bundles-app-backend",
      health: "/health",
      oauthInstall: "/api/oauth/salla/install",
      oauthCallback: "/api/oauth/salla/callback",
      webhook: "/api/webhooks/salla",
      endpoints: {
        products: { list: "GET /api/products" },
        media: {
          list: "GET /api/media/assets",
          uploadSignature: "POST /api/media/signature",
          remove: "DELETE /api/media/assets/:id",
          storefrontSnippet: "GET /api/storefront/snippet.js"
        },
        publicMedia: {
          listStores: "GET /api/public/media/stores",
          listStoreMedia: "GET /api/public/media/stores/:storeId/assets"
        }
      }
    });
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use(
    "/api",
    createRateLimiter({
      windowMs: config.security.rateLimitWindowMs,
      maxRequests: config.security.rateLimitMaxRequests,
      keyPrefix: "api:"
    })
  );

  app.use("/api/webhooks", createWebhookRouter(config));

  app.use(express.json({ limit: "1mb" }));
  app.use("/api", createApiRouter(config));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
