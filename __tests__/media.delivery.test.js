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

function issueStorefrontTokenForTest(merchantId, secret) {
  const payload = JSON.stringify({
    merchantId: String(merchantId || "").trim(),
    iat: Date.now(),
    nonce: "testnonce"
  });
  const payloadB64 = Buffer.from(payload, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const sig = require("crypto").createHmac("sha256", String(secret || "")).update(payloadB64).digest("hex");
  return `${payloadB64}.${sig}`;
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

  it("يسلّم الطلب بدون token لو referer صحيح", async () => {
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

    const res = await request(app)
      .get(`/api/m/123/${leaf}`)
      .set("referer", "https://myshop.com/p/1")
      .buffer(true)
      .parse(binaryParser);
    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body.toString("utf8")).toBe("abc");
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

  it("يرفض الطلب لو مفيش referer ولا origin حتى مع token صحيح", async () => {
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

    const res = await request(app).get(`/api/m/123/${leaf}?token=${encodeURIComponent(token)}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual(expect.objectContaining({ message: "Forbidden", code: "FORBIDDEN" }));
  });

  it("يسمح بالتحميل لو origin تبع دومين المتجر (بدون referer)", async () => {
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
      .set("origin", "https://myshop.com")
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body.toString("utf8")).toBe("abc");
  });

  it("ميقبلش أي متجر تاني على نفس دومين سلة العام (salla.sa)", async () => {
    const merchant = {
      merchantId: "123",
      appStatus: "installed",
      updatedAt: new Date(),
      storeDomain: "salla.sa",
      storeUrl: "https://shop123.salla.sa",
      accessToken: "tok",
      tokenExpiresAt: new Date(Date.now() + 60_000),
      save: jest.fn()
    };

    findMerchantByMerchantId.mockResolvedValue(merchant);
    getStoreInfo.mockResolvedValue({ data: { store: { id: 123, domain: "salla.sa", url: "https://shop123.salla.sa" } } });

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

    const resBad = await request(app).get(`/api/m/123/${leaf}?token=${encodeURIComponent(token)}`).set("referer", "https://shop999.salla.sa/p/1");
    expect(resBad.status).toBe(403);
    expect(resBad.body).toEqual(expect.objectContaining({ message: "Forbidden", code: "FORBIDDEN" }));

    const resOk = await request(app)
      .get(`/api/m/123/${leaf}?token=${encodeURIComponent(token)}`)
      .set("referer", "https://shop123.salla.sa/p/1")
      .buffer(true)
      .parse(binaryParser);

    expect(resOk.status).toBe(200);
    expect(resOk.headers.location).toBeUndefined();
    expect(resOk.headers["content-type"]).toBe("image/png");
    expect(resOk.body.toString("utf8")).toBe("abc");
  });

  it("يستخدم placeholder للصورة لو المتجر غير مثبت وتم ضبط Placeholder Image", async () => {
    const merchant = {
      merchantId: "123",
      appStatus: "uninstalled",
      updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      storeDomain: "myshop.com",
      storeUrl: "https://myshop.com",
      mediaPlaceholderImageAssetId: "ph1"
    };

    findMerchantByMerchantId.mockResolvedValue(merchant);

    const leaf = "abcdef";
    const asset = {
      storeId: "123",
      publicId: `bundle_app/123/${leaf}`,
      deletedAt: null,
      resourceType: "image",
      secureUrl: "https://res.cloudinary.com/x/image/upload/v1/bundle_app/123/abcdef.png"
    };
    const placeholder = {
      _id: "ph1",
      storeId: "123",
      publicId: `bundle_app/123/phimg`,
      deletedAt: null,
      resourceType: "image",
      secureUrl: "https://res.cloudinary.com/x/image/upload/v1/bundle_app/123/phimg.png"
    };

    MediaAsset.findOne.mockImplementation((q) => ({
      lean: jest.fn().mockResolvedValue(q && String(q._id || "") === "ph1" ? placeholder : asset)
    }));

    axios.get.mockResolvedValue({
      status: 200,
      headers: { "content-type": "image/png", "content-length": "2" },
      data: Readable.from(Buffer.from("ph"))
    });

    const app = createApp(makeConfig());
    const token = issueStorefrontTokenForTest("123", "secret");
    const res = await request(app)
      .get(`/api/m/123/${leaf}?token=${encodeURIComponent(token)}`)
      .set("referer", "https://myshop.com/p/1")
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body.toString("utf8")).toBe("ph");
  });

  it("يستخدم placeholder للفيديو لو المتجر غير مثبت وتم ضبط Placeholder Video", async () => {
    const merchant = {
      merchantId: "123",
      appStatus: "uninstalled",
      updatedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      storeDomain: "myshop.com",
      storeUrl: "https://myshop.com",
      mediaPlaceholderVideoAssetId: "vph1"
    };

    findMerchantByMerchantId.mockResolvedValue(merchant);

    const leaf = "vvv111";
    const asset = {
      storeId: "123",
      publicId: `bundle_app/123/${leaf}`,
      deletedAt: null,
      resourceType: "video",
      secureUrl: "https://res.cloudinary.com/x/video/upload/v1/bundle_app/123/vvv111.mp4"
    };
    const placeholder = {
      _id: "vph1",
      storeId: "123",
      publicId: `bundle_app/123/vph`,
      deletedAt: null,
      resourceType: "video",
      secureUrl: "https://res.cloudinary.com/x/video/upload/v1/bundle_app/123/vph.mp4"
    };

    MediaAsset.findOne.mockImplementation((q) => ({
      lean: jest.fn().mockResolvedValue(q && String(q._id || "") === "vph1" ? placeholder : asset)
    }));

    axios.get.mockResolvedValue({
      status: 200,
      headers: { "content-type": "video/mp4", "content-length": "4" },
      data: Readable.from(Buffer.from("vph!"))
    });

    const app = createApp(makeConfig());
    const token = issueStorefrontTokenForTest("123", "secret");
    const res = await request(app)
      .get(`/api/m/123/${leaf}?token=${encodeURIComponent(token)}`)
      .set("referer", "https://myshop.com/p/1")
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("video/mp4");
    expect(res.body.toString("utf8")).toBe("vph!");
  });
});

describe("GET /m/:code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("يسلّم الطلب بدون token لو referer صحيح", async () => {
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
    const code = "abcdEF12";
    const asset = {
      storeId: "123",
      shortCode: code,
      publicId: `bundle_app/123/abcdef`,
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

    const res = await request(app).get(`/m/${code}`).set("referer", "https://myshop.com/p/1").buffer(true).parse(binaryParser);
    expect(res.status).toBe(200);
    expect(res.headers.location).toBeUndefined();
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body.toString("utf8")).toBe("abc");
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
    const code = "abcdEF12";
    const asset = {
      storeId: "123",
      shortCode: code,
      publicId: `bundle_app/123/abcdef`,
      deletedAt: null,
      resourceType: "image",
      secureUrl: "https://res.cloudinary.com/x/image/upload/v1/bundle_app/123/abcdef.png"
    };

    MediaAsset.findOne.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(asset)
    }));

    const res = await request(app).get(`/m/${code}`).set("referer", "https://evil.com/x");
    expect(res.status).toBe(403);
  });

  it("يحذف token عبر redirect ويثبت session cookie بـ Path=/", async () => {
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
    const code = "abcdEF12";
    const asset = {
      storeId: "123",
      shortCode: code,
      publicId: `bundle_app/123/abcdef`,
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

    const token = issueStorefrontTokenForTest("123", "secret");

    const r0 = await request(app)
      .get(`/m/${code}?token=${encodeURIComponent(token)}`)
      .set("referer", "https://myshop.com/p/1")
      .set("accept", "text/html")
      .set("user-agent", "jest")
      .redirects(0);

    expect(r0.status).toBe(302);
    expect(r0.headers.location).toBe(`/m/${code}`);
    expect(Array.isArray(r0.headers["set-cookie"])).toBe(true);
    expect(String(r0.headers["set-cookie"][0] || "")).toContain("Path=/");

    const cookieHeader = String(r0.headers["set-cookie"][0] || "").split(";")[0];

    const r1 = await request(app)
      .get(`/m/${code}`)
      .set("cookie", cookieHeader)
      .set("user-agent", "jest")
      .buffer(true)
      .parse(binaryParser);

    expect(r1.status).toBe(200);
    expect(r1.headers.location).toBeUndefined();
    expect(r1.body.toString("utf8")).toBe("abc");
  });
});

describe("GET /api/media/watermark/:storeId.png", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("يرجع لوجو افتراضي حتى لو المتجر غير موجود", async () => {
    findMerchantByMerchantId.mockResolvedValue(null);

    const app = createApp(makeConfig());
    const res = await request(app).get("/api/media/watermark/123.png?w=360").buffer(true).parse(binaryParser);

    expect(res.status).toBe(200);
    expect(["image/png", "image/svg+xml; charset=utf-8", "image/svg+xml"]).toContain(String(res.headers["content-type"] || ""));
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("يرجع لوجو مخصص للمتجر لو تم ضبطه", async () => {
    const merchant = {
      merchantId: "123",
      mediaWatermarkLogoAssetId: "logo1"
    };
    findMerchantByMerchantId.mockResolvedValue(merchant);

    const logoAsset = {
      _id: "logo1",
      storeId: "123",
      deletedAt: null,
      resourceType: "image",
      secureUrl: "https://example.invalid/logo.png"
    };

    MediaAsset.findOne.mockImplementation((q) => ({
      lean: jest.fn().mockResolvedValue(q && String(q._id || "") === "logo1" ? logoAsset : null)
    }));

    const oneByOnePng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X9kQAAAABJRU5ErkJggg==",
      "base64"
    );

    axios.get.mockResolvedValue({
      status: 200,
      headers: { "content-type": "image/png", "content-length": String(oneByOnePng.length) },
      data: oneByOnePng
    });

    const app = createApp(makeConfig());
    const res = await request(app).get("/api/media/watermark/123.png?w=360").buffer(true).parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.body.length).toBeGreaterThan(0);
  });
});
