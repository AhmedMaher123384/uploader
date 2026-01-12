/**
 * @typedef {Object} AppConfig
 * @property {number} port
 * @property {string|undefined} mongodbUri
 * @property {string} mongodbDbName
 * @property {{
 *   cloudName: string|undefined,
 *   apiKey: string|undefined,
 *   apiSecret: string|undefined,
 *   folderPrefix: string
 * }} cloudinary
 * @property {{
 *   endpoint: string|undefined,
 *   bucket: string|undefined,
 *   accessKeyId: string|undefined,
 *   secretAccessKey: string|undefined
 * }} r2
 * @property {{
 *   apiBaseUrl: string,
 *   oauthAuthorizeUrl: string,
 *   oauthTokenUrl: string,
 *   oauthUserInfoUrl: string,
 *   clientId: string|undefined,
 *   clientSecret: string|undefined,
 *   redirectUri: string|undefined,
 *   webhookSecret: string|undefined
 * }} salla
 * @property {{
 *   tokenRefreshSkewSeconds: number,
 *   rateLimitWindowMs: number,
 *   rateLimitMaxRequests: number,
 *   mediaAdminKey: string|undefined
 * }} security
 */

module.exports = {};
