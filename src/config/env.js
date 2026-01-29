const dotenv = require("dotenv");

/**
 * Loads environment variables from `.env` (if present) and returns typed config.
 * @returns {import("../types").AppConfig}
 */
function loadConfig() {
  dotenv.config();

  return {
    port: Number(process.env.PORT || 3000),
    mongodbUri: process.env.MONGODB_URI,
    mongodbDbName: process.env.MONGODB_DB_NAME || "bundles_app",
    media: {
      folderPrefix: process.env.MEDIA_FOLDER_PREFIX || "malak_uploader"
    },
    r2: {
      endpoint: process.env.R2_ENDPOINT,
      bucket: process.env.R2_BUCKET,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    },
    salla: {
      apiBaseUrl: process.env.SALLA_API_BASE_URL || "https://api.salla.dev",
      oauthAuthorizeUrl: process.env.SALLA_OAUTH_AUTHORIZE_URL || "https://accounts.salla.sa/oauth2/authorize",
      oauthTokenUrl: process.env.SALLA_OAUTH_TOKEN_URL || "https://accounts.salla.sa/oauth2/token",
      oauthUserInfoUrl: process.env.SALLA_OAUTH_USER_INFO_URL || "https://accounts.salla.sa/oauth2/user/info",
      clientId: process.env.SALLA_CLIENT_ID,
      clientSecret: process.env.SALLA_CLIENT_SECRET,
      redirectUri: process.env.SALLA_REDIRECT_URI || process.env.SALLA_WEBHOOK_URI,
      webhookSecret: process.env.SALLA_WEBHOOK_SECRET,
      appId: process.env.SALLA_APP_ID
    },
    security: {
      tokenRefreshSkewSeconds: Number(process.env.TOKEN_REFRESH_SKEW_SECONDS || 30),
      rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
      rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120),
      mediaAdminKey: process.env.MEDIA_ADMIN_KEY
    }
  };
}

module.exports = {
  loadConfig
};
