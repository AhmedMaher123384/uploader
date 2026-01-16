const mediaLogicParts = require("./media.logic");

function buildStylesJs({ cssBase, cssPickers, cssTraditional }) {
  const css = [cssBase, cssPickers, cssTraditional].filter(Boolean).join("\n");
  return `(function(){try{const g=(()=>{try{return globalThis}catch{return window}})()||window;const STYLE_ID="bundle-app-snippet-styles";const css=${JSON.stringify(
    css
  )};if(!g.ensureStyles){g.ensureStyles=function ensureStyles(){try{if(!css)return;const d=document;if(!d||!d.head)return;if(d.getElementById(STYLE_ID))return;const st=d.createElement("style");st.id=STYLE_ID;st.type="text/css";st.appendChild(d.createTextNode(css));d.head.appendChild(st)}catch(e){}}}}catch(e){}})();`;
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
