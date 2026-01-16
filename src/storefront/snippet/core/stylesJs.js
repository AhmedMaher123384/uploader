function buildStylesJs({ cssBase, cssPickers, cssTraditional, cssIcomoon }) {
  const base = JSON.stringify(String(cssBase || ""));
  const pickers = JSON.stringify(String(cssPickers || ""));
  const traditional = JSON.stringify(String(cssTraditional || ""));
  const icomoon = JSON.stringify(String(cssIcomoon || ""));
  return [
    `var __bundleAppCssBase=${base};`,
    `var __bundleAppCssPickers=${pickers};`,
    `var __bundleAppCssTraditional=${traditional};`,
    `var __bundleAppCssIcomoon=${icomoon};`,
    'function __bundleAppInjectStyle(id,css){try{if(!css)return;if(document.getElementById(id))return;var s=document.createElement("style");s.id=id;s.textContent=String(css||"");document.head.appendChild(s)}catch(e){}}',
    'function ensurePickerStyles(){try{ensureStyles()}catch(e){}}',
    'function ensureStyles(){__bundleAppInjectStyle("bundle-app-style",__bundleAppCssBase);__bundleAppInjectStyle("bundle-app-icomoon-style",__bundleAppCssIcomoon)}',
    'function ensureTraditionalStyles(){try{ensureStyles()}catch(e){}}'
  ].join("");
}

module.exports = { buildStylesJs };
