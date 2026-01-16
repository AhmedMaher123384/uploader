const fs = require("fs");
const path = require("path");

let cached = null;
let cachedSig = "";

function readSnippetCss() {
  const basePath = path.join(__dirname, "styles", "base.css");
  const pickersPath = path.join(__dirname, "styles", "pickers.css");

  let baseM = 0;
  if (fs.existsSync(basePath)) baseM = Number(fs.statSync(basePath).mtimeMs || 0);

  let pickersM = 0;
  if (fs.existsSync(pickersPath)) pickersM = Number(fs.statSync(pickersPath).mtimeMs || 0);

  const sig = `${String(baseM)}:${String(pickersM)}`;
  if (cached && cachedSig === sig) return cached;

  const cssBase = fs.readFileSync(basePath, "utf8");
  const cssPickers = fs.existsSync(pickersPath) ? fs.readFileSync(pickersPath, "utf8") : "";
  const cssTraditional = "";

  cached = { cssBase, cssPickers, cssTraditional };
  cachedSig = sig;
  return cached;
}

function buildStylesJs({ cssBase, cssPickers, cssTraditional } = {}) {
  const css =
    [String(cssBase || ""), String(cssPickers || ""), String(cssTraditional || "")]
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n") + "\n";

  const cssJson = JSON.stringify(css);

  return (
    `var __bundleAppSnippetCss=${cssJson};\n` +
    `function ensureStyles(){\n` +
    `  try{\n` +
    `    var css=String(__bundleAppSnippetCss||"");\n` +
    `    if(!css) return;\n` +
    `    var d=document;\n` +
    `    if(!d) return;\n` +
    `    var id="bundleapp-snippet-styles";\n` +
    `    var el=d.getElementById(id);\n` +
    `    if(el&&String(el.tagName||"").toUpperCase()==="STYLE") return;\n` +
    `    el=d.createElement("style");\n` +
    `    el.id=id;\n` +
    `    el.type="text/css";\n` +
    `    el.appendChild(d.createTextNode(css));\n` +
    `    (d.head||d.getElementsByTagName("head")[0]||d.documentElement).appendChild(el);\n` +
    `  }catch(e){}\n` +
    `}\n` +
    `try{ensureStyles()}catch(e){}\n`
  );
}

module.exports = { readSnippetCss, buildStylesJs };
