const mediaLogicParts = require("./media.logic");

function buildStylesJs({ cssBase, cssPickers, cssTraditional }) {
  const css = [cssBase, cssPickers, cssTraditional].filter(Boolean).join("\n");
  const payload = JSON.stringify(String(css || ""));
  return `
const ensureStyles = (() => {
  const STYLE_ID = "bundle-app-snippet-styles";
  return () => {
    try {
      if (document.getElementById(STYLE_ID)) return;
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.type = "text/css";
      el.textContent = ${payload};
      const head = document.head || document.documentElement || document.body;
      if (head && head.appendChild) head.appendChild(el);
    } catch {}
  };
})();
`;
}

module.exports = function mountMediaPlatform(context) {
  const parts = context.parts;
  const merchantId = context.merchantId;
  const token = context.token;
  const cssBase = context.cssBase;
  const cssPickers = context.cssPickers;
  const cssTraditional = context.cssTraditional;

  parts.push(buildStylesJs({ cssBase, cssPickers, cssTraditional }));

  for (let i = 0; i < mediaLogicParts.length; i += 1) {
    if (i === 3) {
      parts.push(`let merchantId=${JSON.stringify(merchantId)};`);
      parts.push(`let token=${JSON.stringify(token)};`);
      parts.push('let scriptSrc=(document.currentScript&&document.currentScript.src)||"";');
      parts.push(
        'if(!scriptSrc){try{const ss=document.getElementsByTagName("script");for(let si=0;si<ss.length;si+=1){const s=ss[si];const src=(s&&s.src)||"";if(!src)continue;if(src.indexOf("/api/storefront/snippet.js")!==-1&&src.indexOf("merchantId="+encodeURIComponent(merchantId))!==-1){scriptSrc=src;break}}}catch(e){}}'
      );
      parts.push('try{if(typeof ensureStyles==="function")ensureStyles()}catch(e){}');
    }
    parts.push(mediaLogicParts[i]);
  }
};
