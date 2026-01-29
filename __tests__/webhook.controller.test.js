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
const { hmacSha256Hex } = require("../src/utils/hash");
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

  test("accepts signature strategy via x-salla-signature", async () => {
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

    const sig = hmacSha256Hex("secret", rawBody);
    const req = {
      headers: {
        "x-salla-event": "app.store.authorize",
        "x-salla-delivery-id": "d-sign-1",
        "x-salla-signature": sig
      },
      body: rawBody
    };
    const res = makeRes();

    await controller.sallaWebhook(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(upsertInstalledMerchant).toHaveBeenCalledTimes(1);
  });

  test("updates merchant plan on app.subscription.expired", async () => {
    const { createWebhookController } = require("../src/controllers/webhook.controller");

    const config = {
      salla: { webhookSecret: "secret" }
    };

    const controller = createWebhookController(config);

    WebhookLog.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });

    const merchant = {
      _id: "merchantObjectId",
      merchantId: "m-1",
      appStatus: "installed",
      planKey: "pro",
      planUpdatedAt: null,
      planMeta: null,
      save: jest.fn().mockResolvedValue({})
    };
    findMerchantByMerchantId.mockResolvedValue(merchant);

    const rawBody = Buffer.from(
      JSON.stringify({
        event: "app.subscription.expired",
        merchant: "m-1",
        data: {
          subscription: {
            id: "sub-1",
            status: "expired",
            current_period_end: Math.floor(Date.now() / 1000) - 10
          }
        }
      }),
      "utf8"
    );

    const req = {
      headers: {
        "x-salla-event": "app.subscription.expired",
        "x-salla-delivery-id": "d-sub-1",
        "x-salla-security-strategy": "token",
        authorization: "Bearer secret"
      },
      body: rawBody
    };
    const res = makeRes();

    await controller.sallaWebhook(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(findMerchantByMerchantId).toHaveBeenCalledTimes(1);
    expect(merchant.planKey).toBe("basic");
    expect(merchant.planUpdatedAt).toBeInstanceOf(Date);
    expect(merchant.planMeta).toBeTruthy();
    expect(merchant.planMeta.subscription).toBeTruthy();
    expect(merchant.planMeta.subscription.event).toBe("app.subscription.expired");
    expect(merchant.save).toHaveBeenCalledTimes(1);
  });

  test("parses Salla subscription payload shape and upgrades plan", async () => {
    const { createWebhookController } = require("../src/controllers/webhook.controller");

    const config = {
      salla: { webhookSecret: "secret" }
    };

    const controller = createWebhookController(config);

    WebhookLog.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });

    const merchant = {
      _id: "merchantObjectId",
      merchantId: "m-2",
      appStatus: "installed",
      planKey: "basic",
      planUpdatedAt: null,
      planMeta: null,
      save: jest.fn().mockResolvedValue({})
    };
    findMerchantByMerchantId.mockResolvedValue(merchant);

    const rawBody = Buffer.from(
      JSON.stringify({
        event: "app.subscription.started",
        merchant: "m-2",
        created_at: "2026-01-28 12:31:25",
        data: {
          subscription_id: 1510766049,
          plan_name: "Pro",
          start_date: "2026-01-01",
          end_date: "2026-02-01",
          status: "active"
        }
      }),
      "utf8"
    );

    const req = {
      headers: {
        "x-salla-event": "app.subscription.started",
        "x-salla-delivery-id": "d-sub-2",
        "x-salla-security-strategy": "token",
        authorization: "Bearer secret"
      },
      body: rawBody
    };
    const res = makeRes();

    await controller.sallaWebhook(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(merchant.planKey).toBe("pro");
    expect(merchant.planUpdatedAt).toBeInstanceOf(Date);
    expect(merchant.planMeta.subscription.subscriptionId).toBe("1510766049");
    expect(merchant.planMeta.subscription.currentPeriodEnd).toBeInstanceOf(Date);
    expect(merchant.planMeta.subscription.event).toBe("app.subscription.started");
    expect(merchant.save).toHaveBeenCalledTimes(1);
  });

  test("updates merchant plan on app.trial.expired", async () => {
    const { createWebhookController } = require("../src/controllers/webhook.controller");

    const config = {
      salla: { webhookSecret: "secret" }
    };

    const controller = createWebhookController(config);

    WebhookLog.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });

    const merchant = {
      _id: "merchantObjectId",
      merchantId: "m-3",
      appStatus: "installed",
      planKey: "business",
      planUpdatedAt: null,
      planMeta: null,
      save: jest.fn().mockResolvedValue({})
    };
    findMerchantByMerchantId.mockResolvedValue(merchant);

    const rawBody = Buffer.from(
      JSON.stringify({
        event: "app.trial.expired",
        merchant: "m-3",
        data: {
          subscription: {
            id: "trial-1",
            status: "expired",
            current_period_end: Math.floor(Date.now() / 1000) - 10
          }
        }
      }),
      "utf8"
    );

    const req = {
      headers: {
        "x-salla-event": "app.trial.expired",
        "x-salla-delivery-id": "d-trial-1",
        "x-salla-security-strategy": "token",
        authorization: "Bearer secret"
      },
      body: rawBody
    };
    const res = makeRes();

    await controller.sallaWebhook(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(findMerchantByMerchantId).toHaveBeenCalledTimes(1);
    expect(merchant.planKey).toBe("basic");
    expect(merchant.planUpdatedAt).toBeInstanceOf(Date);
    expect(merchant.planMeta).toBeTruthy();
    expect(merchant.planMeta.subscription).toBeTruthy();
    expect(merchant.planMeta.subscription.event).toBe("app.trial.expired");
    expect(merchant.save).toHaveBeenCalledTimes(1);
  });
});
