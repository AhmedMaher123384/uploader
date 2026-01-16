const fs = require("fs");
const path = require("path");

let cached = null;
let cachedSig = "";

function readSnippetCss() {
  const basePath = path.join(__dirname, "styles", "base.css");
  const icoWoffPath = path.join(__dirname, "..", "..", "..", "..", "icomoon-v1.0 3", "fonts", "icomoon.woff");
  const icoTtfPath = path.join(__dirname, "..", "..", "..", "..", "icomoon-v1.0 3", "fonts", "icomoon.ttf");

  let baseM = 0;
  if (fs.existsSync(basePath)) baseM = Number(fs.statSync(basePath).mtimeMs || 0);

  let icoWoffM = 0;
  if (fs.existsSync(icoWoffPath)) icoWoffM = Number(fs.statSync(icoWoffPath).mtimeMs || 0);

  let icoTtfM = 0;
  if (fs.existsSync(icoTtfPath)) icoTtfM = Number(fs.statSync(icoTtfPath).mtimeMs || 0);

  const sig = [baseM, icoWoffM, icoTtfM].join("|");
  if (cached && cachedSig === sig) return cached;

  const cssBase = fs.readFileSync(basePath, "utf8");
  const cssPickers = "";
  const cssTraditional = "";
  let cssIcomoon = "";
  try {
    if (icoWoffM && icoTtfM) {
      const woffB64 = fs.readFileSync(icoWoffPath).toString("base64");
      const ttfB64 = fs.readFileSync(icoTtfPath).toString("base64");
      cssIcomoon = [
        "@font-face{font-family:'bundle-app-icomoon';src:url(data:font/woff;base64,",
        woffB64,
        ") format('woff'),url(data:font/ttf;base64,",
        ttfB64,
        ") format('truetype');font-weight:normal;font-style:normal;font-display:block}",
        ".bundle-app-bottomsheet .bundle-app-ico{font-family:'bundle-app-icomoon' !important;speak:never;font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;display:inline-block}",
        ".bundle-app-bottomsheet .bundle-app-ico.sicon-back:before{content:\"\\\\e95f\"}",
        ".bundle-app-bottomsheet .bundle-app-ico.sicon-cancel:before{content:\"\\\\ea47\"}"
      ].join("");
    }
  } catch {
    cssIcomoon = "";
  }

  cached = { cssBase, cssPickers, cssTraditional, cssIcomoon };
  cachedSig = sig;
  return cached;
}

module.exports = { readSnippetCss };
