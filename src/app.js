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

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
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

  app.get("/sandbox/modal-test", (_req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res.end(`<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sandbox Modal Test</title>
    <style>
      :root {
        --bg: #0b1220;
        --panel: #0f172a;
        --text: #e5e7eb;
        --muted: rgba(229, 231, 235, 0.75);
        --brand: #18b5d5;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans Arabic", "Noto Sans", sans-serif;
        background: radial-gradient(1200px 800px at 10% 10%, rgba(24,181,213,.12), transparent 60%),
          radial-gradient(900px 700px at 90% 20%, rgba(56,189,248,.10), transparent 55%),
          var(--bg);
        color: var(--text);
        min-height: 100vh;
      }
      .page {
        max-width: 980px;
        margin: 0 auto;
        padding: 28px 16px 60px;
      }
      .card {
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(15,23,42,.55);
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 18px 50px rgba(0,0,0,.35);
        backdrop-filter: blur(10px);
      }
      .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
      .btn {
        appearance: none;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(2,6,23,.35);
        color: var(--text);
        padding: 10px 12px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 900;
        letter-spacing: .2px;
        transition: transform .12s ease, filter .12s ease, border-color .12s ease, background .12s ease;
      }
      .btn:hover { filter: brightness(1.05); border-color: rgba(24,181,213,.35); }
      .btn:active { transform: translateY(1px); }
      .btn-primary { background: rgba(24,181,213,.16); border-color: rgba(24,181,213,.45); }
      .btn-ghost { background: transparent; }
      .hint { color: var(--muted); font-size: 13px; font-weight: 800; line-height: 1.6; margin-top: 10px; }
      .input {
        width: min(420px, 100%);
        height: 40px;
        padding: 0 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(2,6,23,.35);
        color: var(--text);
        font-weight: 850;
        outline: none;
      }
      .input::placeholder { color: rgba(229,231,235,.55); font-weight: 800; }

      .angel-cc_modal {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: none;
      }
      .angel-cc_modal.is-open { display: block; }
      .angel-cc_overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.55);
      }
      .angel-cc_panel {
        position: absolute;
        inset-inline: 0;
        bottom: 0;
        width: min(720px, 100%);
        margin: 0 auto;
        background: var(--panel);
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 18px 18px 0 0;
        box-shadow: 0 24px 80px rgba(0,0,0,.55);
        transform: translateY(24px);
        opacity: 0;
        transition: transform .22s ease, opacity .22s ease;
      }
      .angel-cc_modal.is-open .angel-cc_panel {
        transform: translateY(0);
        opacity: 1;
      }
      .angel-cc_content { padding: 14px; }
      .angel-cc_section { display: flex; flex-direction: column; gap: 12px; }
      .angel-cc_head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .angel-cc_title { font-weight: 950; font-size: 15px; }
      .angel-cc_viewsBar { display: flex; flex-wrap: wrap; gap: 8px; }
      .angel-cc_view {
        display: none;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 14px;
        padding: 14px;
        background: rgba(2,6,23,.25);
        min-height: 120px;
      }
      .angel-cc_view.is-active { display: block; }
      .angel-cc_kv { font-size: 13px; color: var(--muted); font-weight: 850; line-height: 1.7; }
      .angel-cc_badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid rgba(24,181,213,.35);
        background: rgba(24,181,213,.12);
        color: var(--text);
        font-size: 12px;
        font-weight: 950;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="card">
        <div class="row">
          <button type="button" class="btn btn-primary" data-open-modal>فتح المودال</button>
          <button type="button" class="btn btn-ghost" data-close-modal>إغلاق</button>
          <span class="angel-cc_badge" data-badge></span>
        </div>
        <div class="row" style="margin-top: 10px">
          <input class="input" data-merchant-id placeholder="merchantId (مثال: 123456) أو اتركها sandbox" />
          <button type="button" class="btn" data-set-mode="sandbox">Sandbox</button>
          <button type="button" class="btn btn-primary" data-set-mode="live">Live</button>
          <button type="button" class="btn btn-primary" data-apply>تطبيق</button>
        </div>
        <div class="hint">
          Sandbox: بدون API calls. Live: داتا حقيقية (merchantId لازم يكون متجر متسطّب عليه التطبيق).
        </div>
        <div class="row" style="margin-top: 12px">
          <button type="button" class="btn" data-set-view="announcements">announcements</button>
          <button type="button" class="btn" data-set-view="updates">updates</button>
          <button type="button" class="btn btn-primary" data-set-view="upload">upload</button>
        </div>
      </div>
    </div>

    <div class="angel-cc_modal" aria-hidden="true">
      <div class="angel-cc_overlay" data-close-modal></div>
      <div class="angel-cc_panel" role="dialog" aria-modal="true">
        <div class="angel-cc_content">
          <div class="angel-cc_section">
            <div class="angel-cc_head">
              <div class="angel-cc_title">Sandbox Modal</div>
              <button type="button" class="btn btn-ghost" data-close-modal>إغلاق</button>
            </div>
            <div class="angel-cc_viewsBar">
              <button type="button" class="btn" data-set-view="announcements">announcements</button>
              <button type="button" class="btn" data-set-view="updates">updates</button>
              <button type="button" class="btn btn-primary" data-set-view="upload">upload</button>
            </div>

            <div class="angel-cc_view is-active" data-view="announcements">
              <div class="angel-cc_kv">Announcements view (Placeholder)</div>
            </div>
            <div class="angel-cc_view" data-view="updates">
              <div class="angel-cc_kv">Updates view (Placeholder)</div>
            </div>
            <div class="angel-cc_view" data-view="upload"></div>
          </div>
        </div>
      </div>
    </div>

    <script>
      (function () {
        var params = new URLSearchParams(window.location.search || "");
        var mode = String(params.get("mode") || "sandbox").trim().toLowerCase();
        var merchantId = String(params.get("merchantId") || "").trim();
        var isLive = mode === "live";
        if (!merchantId) merchantId = isLive ? "" : "sandbox";

        window.__APP_MODE__ = isLive ? "modal" : "sandbox";

        var badge = document.querySelector("[data-badge]");
        if (badge) badge.textContent = "window.__APP_MODE__ = '" + String(window.__APP_MODE__) + "'";

        var input = document.querySelector("[data-merchant-id]");
        if (input) input.value = merchantId;

        var selectedMode = isLive ? "live" : "sandbox";
        window.__SANDBOX_SELECTED_MODE__ = selectedMode;

        var injectSnippet = function () {
          var mid = String((input && input.value) || merchantId || "").trim();
          if (!mid) return;
          var s = document.createElement("script");
          s.src = "/api/storefront/snippet.js?merchantId=" + encodeURIComponent(mid);
          document.body.appendChild(s);
        };
        injectSnippet();

        var modal = document.querySelector(".angel-cc_modal");
        var views = Array.prototype.slice.call(document.querySelectorAll(".angel-cc_view"));

        function setOpen(open) {
          if (!modal) return;
          if (open) {
            modal.classList.add("is-open");
            modal.setAttribute("aria-hidden", "false");
          } else {
            modal.classList.remove("is-open");
            modal.setAttribute("aria-hidden", "true");
          }
        }

        function setView(name) {
          var n = String(name || "").trim();
          for (var i = 0; i < views.length; i += 1) {
            var v = views[i];
            var key = v && v.getAttribute ? v.getAttribute("data-view") : "";
            if (String(key) === n) v.classList.add("is-active");
            else v.classList.remove("is-active");
          }
        }

        document.addEventListener("click", function (e) {
          var t = e && e.target ? e.target : null;
          if (!t) return;

          if (t && t.hasAttribute && t.hasAttribute("data-open-modal")) {
            setOpen(true);
            return;
          }
          if (t && t.hasAttribute && t.hasAttribute("data-close-modal")) {
            setOpen(false);
            return;
          }
          if (t && t.getAttribute) {
            var v = t.getAttribute("data-set-view");
            if (v) setView(v);
          }
        });

        setOpen(false);
        setView("announcements");
      })();
    </script>
    <script>
      (function () {
        var input = document.querySelector("[data-merchant-id]");
        var params = new URLSearchParams(window.location.search || "");
        var mode = String(params.get("mode") || "sandbox").trim().toLowerCase();
        var isLive = mode === "live";

        function apply(nextMode) {
          var mid = String((input && input.value) || "").trim();
          var p = new URLSearchParams(window.location.search || "");
          p.set("mode", nextMode);
          if (mid) p.set("merchantId", mid);
          else p.delete("merchantId");
          window.location.search = p.toString();
        }

        document.addEventListener("click", function (e) {
          var t = e && e.target ? e.target : null;
          if (!t) return;
          if (t && t.hasAttribute && t.hasAttribute("data-set-mode")) {
            var m = String(t.getAttribute("data-set-mode") || "").trim().toLowerCase();
            window.__SANDBOX_SELECTED_MODE__ = m === "live" ? "live" : "sandbox";
            return;
          }
          if (t && t.hasAttribute && t.hasAttribute("data-apply")) {
            apply(window.__SANDBOX_SELECTED_MODE__ === "live" ? "live" : "sandbox");
          }
        });
      })();
    </script>
  </body>
</html>`);
  });

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
  const apiRouter = createApiRouter(config);
  app.use("/api", apiRouter);

  app.get("/cdn/:code", (req, res, next) => {
    try {
      const code = String(req.params.code || "");
      const qIndex = String(req.originalUrl || "").indexOf("?");
      const qs = qIndex >= 0 ? String(req.originalUrl || "").slice(qIndex) : "";
      req.url = `/p/${encodeURIComponent(code)}${qs}`;
      return apiRouter.handle(req, res, next);
    } catch (e) {
      return next(e);
    }
  });

  app.get("/m/:code", (req, res, next) => {
    try {
      const code = String(req.params.code || "");
      const qIndex = String(req.originalUrl || "").indexOf("?");
      const qs = qIndex >= 0 ? String(req.originalUrl || "").slice(qIndex) : "";
      req.url = `/p/${encodeURIComponent(code)}${qs}`;
      return apiRouter.handle(req, res, next);
    } catch (e) {
      return next(e);
    }
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
