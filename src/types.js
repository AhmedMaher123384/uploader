/**
 * @typedef {Object} AppConfig
 * @property {number} port
 * @property {string|undefined} mongodbUri
 * @property {string} mongodbDbName
 * @property {{
 *   folderPrefix: string
 * }} media
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
 *   webhookSecret: string|undefined,
 *   appId: string|undefined
 * }} salla
 * @property {{
 *   tokenRefreshSkewSeconds: number,
 *   rateLimitWindowMs: number,
 *   rateLimitMaxRequests: number,
 *   mediaAdminKey: string|undefined
 * }} security
 */

module.exports = {};
