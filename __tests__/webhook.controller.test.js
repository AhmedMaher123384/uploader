jest.mock("../src/models/WebhookLog", () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock("../src/services/merchant.service", () => ({
  findMerchantByMerchantId: jest.fn(),
  markMerchantUninstalled: jest.fn(),
  upsertInstalledMerchant: jest.fn()
}));

const WebhookLog = require("../src/models/WebhookLog");
const { findMerchantByMerchantId, upsertInstalledMerchant } = require("../src/services/merchant.service");
const { Buffer } = require("buffer");

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe("webhook.controller", () => {
  beforeEach(() => {
    WebhookLog.findOne.mockReset();
    WebhookLog.create.mockReset();
    findMerchantByMerchantId.mockReset();
    upsertInstalledMerchant.mockReset();

    WebhookLog.create.mockImplementation(async () => ({}));
  });

  test("dedupes by deliveryId and processes app.store.authorize", async () => {
    const { createWebhookController } = require("../src/controllers/webhook.controller");

    const config = {
      salla: { webhookSecret: "secret" }
    };

    const controller = createWebhookController(config);

    WebhookLog.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });

    findMerchantByMerchantId.mockResolvedValue(null);
    upsertInstalledMerchant.mockResolvedValue({ _id: "merchantObjectId", merchantId: "m-1", appStatus: "installed" });

    const rawBody = Buffer.from(
      JSON.stringify({
        event: "app.store.authorize",
        merchant: "m-1",
        data: { access_token: "access", refresh_token: "refresh", expires: Math.floor(Date.now() / 1000) + 3600 }
      }),
      "utf8"
    );

    const req1 = {
      headers: {
        "x-salla-event": "app.store.authorize",
        "x-salla-delivery-id": "d-1",
        "x-salla-security-strategy": "token",
        authorization: "Bearer secret"
      },
      body: rawBody
    };
    const res1 = makeRes();

    await controller.sallaWebhook(req1, res1);

    expect(res1.statusCode).toBe(200);
    expect(res1.body).toEqual({ ok: true });
    expect(upsertInstalledMerchant).toHaveBeenCalledTimes(1);
    expect(WebhookLog.create).toHaveBeenCalledTimes(2);

    WebhookLog.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue({ _id: "processedLog" }) });

    const req2 = { ...req1 };
    const res2 = makeRes();
    await controller.sallaWebhook(req2, res2);

    expect(res2.statusCode).toBe(200);
    expect(res2.body).toEqual({ ok: true });
    expect(WebhookLog.create).toHaveBeenCalledTimes(2);
  });
});
