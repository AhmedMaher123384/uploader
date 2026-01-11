jest.mock("../src/services/merchant.service", () => ({
  findMerchantByMerchantId: jest.fn(),
  findMerchantByAccessToken: jest.fn(),
  upsertInstalledMerchant: jest.fn()
}));

jest.mock("../src/services/sallaApi.service", () => ({
  getStoreInfo: jest.fn(),
  listProducts: jest.fn(),
  getProductById: jest.fn(),
  getProductVariant: jest.fn()
}));

jest.mock("../src/services/sallaOAuth.service", () => ({
  refreshAccessToken: jest.fn()
}));

jest.mock("../src/models/MediaAsset", () => ({
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  aggregate: jest.fn(),
  findOneAndUpdate: jest.fn()
}));

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  create: jest.fn(() => ({ get: jest.fn(), post: jest.fn() }))
}));

const request = require("supertest");
const { Readable } = require("stream");
const { Buffer } = require("buffer");

const axios = require("axios");
const MediaAsset = require("../src/models/MediaAsset");
const { getStoreInfo } = require("../src/services/sallaApi.service");
const { findMerchantByMerchantId } = require("../src/services/merchant.service");
const { createApp } = require("../src/app");

function binaryParser(res, cb) {
  const chunks = [];
  res.on("data", (c) => chunks.push(c));
  res.on("end", () => cb(null, Buffer.concat(chunks)));
}

function makeConfig() {
  return {
    port: 0,
    mongodbUri: undefined,
    mongodbDbName: "test",
    cloudinary: { cloudName: "x", apiKey: "y", apiSecret: "z", folderPrefix: "bundle_app" },
    salla: {
      apiBaseUrl: "https://example.invalid",
      oauthAuthorizeUrl: "https://example.invalid",
      oauthTokenUrl: "https://example.invalid",
      oauthUserInfoUrl: "https://example.invalid",
      clientId: "cid",
      clientSecret: "secret",
      redirectUri: "https://example.invalid",
      webhookSecret: "whsec"
    },
    security: {
      tokenRefreshSkewSeconds: 0,
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 120,
      mediaAdminKey: "adminkey"
    }
  };
}

describe("GET /api/m/:storeId/:leaf", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("رفض الطلب بدون token", async () => {
    const merchant = {
      merchantId: "123",
      appStatus: "installed",
      updatedAt: new Date(),
      storeDomain: "myshop.com",
      storeUrl: "https://myshop.com",
      accessToken: "tok",
      tokenExpiresAt: new Date(Date.now() + 60_000),
      save: jest.fn()
    };

    findMerchantByMerchantId.mockResolvedValue(merchant);
    getStoreInfo.mockResolvedValue({ data: { store: { id: 123, domain: "myshop.com", url: "https://myshop.com" } } });

    const app = createApp(makeConfig());
    const res = await request(app).get("/api/m/123/abcdef").set("referer", "https://myshop.com/p/1");
    expect(res.status).toBe(401);
  });

  it("رفض الطلب لو referer/origin مش تبع دومين المتجر", async () => {
    const merchant = {
      merchantId: "123",
      appStatus: "installed",
      updatedAt: new Date(),
      storeDomain: "myshop.com",
      storeUrl: "https://myshop.com",
      accessToken: "tok",
      tokenExpiresAt: new Date(Date.now() + 60_000),
      save: jest.fn()
    };

    findMerchantByMerchantId.mockResolvedValue(merchant);
    getStoreInfo.mockResolvedValue({ data: { store: { id: 123, domain: "myshop.com", url: "https://myshop.com" } } });

    const app = createApp(makeConfig());
    const js = await request(app).get("/api/storefront/snippet.js?merchantId=123");
    expect(js.status).toBe(200);
    const m = String(js.text || "").match(/let token=("([^"\\\\]|\\\\.)*"|'([^'\\\\]|\\\\.)*');/);
    expect(m).toBeTruthy();
    const token = JSON.parse(m[1]);

    const res = await request(app).get(`/api/m/123/abcdef?token=${encodeURIComponent(token)}`).set("referer", "https://evil.com/x");
    expect(res.status).toBe(403);
  });

  it("يسلّم الميديا بالـ proxy بدون redirect لما token+referer صحيحين", async () => {
    const merchant = {
      merchantId: "123",
      appStatus: "installed",
      updatedAt: new Date(),
      storeDomain: "myshop.com",
      storeUrl: "https://myshop.com",
      accessToken: "tok",
      tokenExpiresAt: new Date(Date.now() + 60_000),
      save: jest.fn()
    };

    findMerchantByMerchantId.mockResolvedValue(merchant);
    getStoreInfo.mockResolvedValue({ data: { store: { id: 123, domain: "myshop.com", url: "https://myshop.com" } } });

    const leaf = "abcdef";
    const asset = {
      storeId: "123",
      publicId: `bundle_app/123/${leaf}`,
      deletedAt: null,
      resourceType: "image",
      secureUrl: "https://res.cloudinary.com/x/image/upload/v1/bundle_app/123/abcdef.png"
    };

    MediaAsset.findOne.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(asset)
    }));

    axios.get.mockResolvedValue({
      status: 200,
      headers: { "content-type": "image/png", "content-length": "3" },
      data: Readable.from(Buffer.from("abc"))
    });

    const app = createApp(makeConfig());
    const js = await request(app).get("/api/storefront/snippet.js?merchantId=123");
    const m = String(js.text || "").match(/let token=("([^"\\\\]|\\\\.)*"|'([^'\\\\]|\\\\.)*');/);
    const token = JSON.parse(m[1]);

    const res = await request(app)
      .get(`/api/m/123/${leaf}?token=${encodeURIComponent(token)}`)
      .set("referer", "https://myshop.com/p/1")
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body.toString("utf8")).toBe("abc");
  });
});
