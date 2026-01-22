module.exports = [
  `
const renderUploadHero = (dash) => {
  const d = dash && typeof dash === "object" ? dash : {};
  const store = d.store && typeof d.store === "object" ? d.store : {};

  const sanitizeHttpUrl = (raw) => {
    const s0 = String(raw || "").trim();
    if (!s0) return "";
    const s1 = s0.replace(/[\\u0060"'<>]/g, "").trim();
    if (!s1) return "";
    const withProto = s1.indexOf("://") === -1 ? "https://" + s1 : s1;
    let u = null;
    try {
      u = new URL(withProto);
    } catch {
      u = null;
    }
    if (!u) return "";
    const proto = String(u.protocol || "").toLowerCase();
    if (proto !== "http:" && proto !== "https:") return "";
    return u.toString();
  };

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.alignItems = "center";
  wrap.style.justifyContent = "space-between";
  wrap.style.gap = "12px";
  wrap.style.flexWrap = "wrap";
  wrap.style.padding = "14px";
  wrap.style.borderRadius = "16px";
  wrap.style.border = "1px solid rgba(255,255,255,.10)";
  wrap.style.background = "#373737";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "12px";
  left.style.minWidth = "0";

  const avatar = document.createElement("div");
  avatar.style.width = "44px";
  avatar.style.height = "44px";
  avatar.style.borderRadius = "14px";
  avatar.style.overflow = "hidden";
  avatar.style.flex = "0 0 auto";
  avatar.style.border = "1px solid rgba(255,255,255,.18)";
  avatar.style.background = "rgba(255,255,255,.06)";
  avatar.style.display = "grid";
  avatar.style.placeItems = "center";
  avatar.style.color = "#fff";
  avatar.style.fontWeight = "950";

  const logo = String(store.logoUrl || "").trim();
  if (logo) {
    const img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.src = logo;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    avatar.appendChild(img);
  } else {
    const t = document.createElement("div");
    t.style.fontSize = "14px";
    t.textContent = "BA";
    avatar.appendChild(t);
  }

  const meta = document.createElement("div");
  meta.style.display = "flex";
  meta.style.flexDirection = "column";
  meta.style.gap = "4px";
  meta.style.minWidth = "0";

  const hello = document.createElement("div");
  hello.style.fontSize = "17px";
  hello.style.fontWeight = "900";
  hello.style.color = "rgba(255,255,255,.82)";
  hello.textContent = isArabic() ? "أهلاً بك في رفع الملفات" : "Welcome to Upload Center";

  const name = document.createElement("div");
  name.style.fontSize = "22px";
  name.style.fontWeight = "950";
  name.style.color = "#fff";
  name.style.overflow = "hidden";
  name.style.textOverflow = "ellipsis";
  name.style.whiteSpace = "nowrap";
  name.textContent = String(store.name || d.storeName || "") || (isArabic() ? "متجرك" : "Your store");

  const domain = document.createElement("div");
  domain.style.fontSize = "12px";
  domain.style.fontWeight = "900";
  domain.style.color = "rgba(24,181,213,.95)";
  domain.style.overflow = "hidden";
  domain.style.textOverflow = "ellipsis";
  domain.style.whiteSpace = "nowrap";
  domain.style.direction = "ltr";
  domain.textContent = String(store.domain || store.url || "") || "";

  meta.appendChild(hello);
  meta.appendChild(name);

  left.appendChild(avatar);
  left.appendChild(meta);

  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.alignItems = "center";
  right.style.gap = "10px";
  right.style.flexWrap = "wrap";
  right.style.justifyContent = "flex-end";

  const plan = document.createElement("div");
  plan.style.padding = "8px 12px";
  plan.style.borderRadius = "999px";
  plan.style.border = "1px solid rgba(24,181,213,.35)";
  plan.style.background = "rgba(24,181,213,.12)";
  plan.style.color = "#18b5d5";
  plan.style.fontWeight = "950";
  plan.style.fontSize = "12px";
  plan.style.display = "inline-flex";
  plan.style.alignItems = "center";
  plan.style.gap = "8px";

  const planKey = String(d.planKey || "").trim().toLowerCase();
  const planIconClass = planKey === "business" ? "sicon-award-ribbon" : planKey === "pro" ? "sicon-star-o" : "sicon-user";
  const planIcon = document.createElement("i");
  planIcon.className = planIconClass;
  planIcon.setAttribute("aria-hidden", "true");
  planIcon.style.display = "block";
  planIcon.style.fontSize = "14px";
  planIcon.style.lineHeight = "1";
  planIcon.style.color = "currentColor";

  const planTxt = document.createElement("span");
  planTxt.style.whiteSpace = "nowrap";
  planTxt.textContent = (isArabic() ? "" : "Plan: ") + planLabel(d.planKey);

  plan.appendChild(planIcon);
  plan.appendChild(planTxt);

  const visit = document.createElement("a");
  const rawUrl = String(store.url || d.storeUrl || store.domain || "").trim();
  const url = sanitizeHttpUrl(rawUrl);
  visit.href = url || "#";
  visit.target = "_blank";
  visit.rel = "noopener";
  visit.textContent = isArabic() ? "زيارة المتجر" : "Visit store";
  visit.style.display = "inline-flex";
  visit.style.alignItems = "center";
  visit.style.justifyContent = "center";
  visit.style.gap = "8px";
  visit.style.padding = "10px 12px";
  visit.style.borderRadius = "12px";
  visit.style.border = "1px solid rgba(255,255,255,.12)";
  visit.style.background = "#303030";
  visit.style.color = "#fff";
  visit.style.fontSize = "13px";
  visit.style.fontWeight = "950";
  visit.style.textDecoration = "none";
  visit.style.pointerEvents = url ? "auto" : "none";
  visit.style.opacity = url ? "1" : "0.6";
  visit.onclick = (e) => {
    try {
      if (!url) {
        e.preventDefault();
        e.stopPropagation();
      }
    } catch {}
  };

  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↖";
  arrow.style.display = "block";
  arrow.style.fontSize = "14px";
  arrow.style.lineHeight = "1";
  arrow.style.color = "rgba(255,255,255,.80)";
  arrow.style.transform = "translateY(-1px)";
  arrow.style.pointerEvents = "none";
  visit.appendChild(arrow);

  right.appendChild(plan);
  right.appendChild(visit);

  wrap.appendChild(left);
  wrap.appendChild(right);
  return wrap;
};
`,
  `
const statCard = (label, value) => {
  const c = document.createElement("div");
  c.style.border = "1px solid rgba(255,255,255,.10)";
  c.style.borderRadius = "14px";
  c.style.background = "#373737";
  c.style.padding = "12px";
  c.style.display = "flex";
  c.style.flexDirection = "column";
  c.style.gap = "8px";

  const l = document.createElement("div");
  l.style.fontSize = "13px";
  l.style.fontWeight = "900";
  l.style.color = "rgba(255,255,255,.78)";
  l.textContent = String(label || "");

  const v = document.createElement("div");
  v.style.fontSize = "18px";
  v.style.fontWeight = "950";
  v.style.color = "#fff";
  v.textContent = String(value == null ? "" : value);

  c.appendChild(l);
  c.appendChild(v);
  return c;
};
`,
  `
const renderSmartStats = (dash) => {
  const d = dash && typeof dash === "object" ? dash : {};
  const s = d.summary && typeof d.summary === "object" ? d.summary : {};
  const lastAsset = (() => {
    try {
      return d.lastAsset && typeof d.lastAsset === "object" ? d.lastAsset : {};
    } catch {
      return {};
    }
  })();
  const lastUrl = (() => {
    try {
      const direct = String(lastAsset.deliveryUrl || lastAsset.secureUrl || lastAsset.url || "").trim();
      if (direct) return direct;
      if (typeof buildDeliveryUrlFromItem === "function") {
        const u = String(buildDeliveryUrlFromItem(lastAsset) || "").trim();
        if (u) return u;
      }
      return "";
    } catch {
      return "";
    }
  })();
  const lastMeta = String(lastAsset.originalFilename || lastAsset.publicId || "").trim();

  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "10px";

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(3,minmax(0,1fr))";
  grid.style.gap = "10px";
  try {
    const w = Number(window.innerWidth || 0) || 0;
    if (w && w < 560) grid.style.gridTemplateColumns = "repeat(1,minmax(0,1fr))";
  } catch {}

  const totalFiles = Number(s.total || 0) || 0;
  const totalBytes = Number(s.totalBytes || 0) || 0;
  const lastAt = String(s.lastAt || "").trim();
  grid.appendChild(statCard(isArabic() ? "إجمالي الملفات" : "Total files", String(totalFiles)));

  const bytesFromGb = (gb) => Math.floor(Math.max(0, Number(gb || 0)) * 1024 * 1024 * 1024);
  const maxStorageBytesForPlan = () => {
    const k = String(d.planKey || "").trim().toLowerCase();
    if (k === "business") return bytesFromGb(50);
    if (k === "pro") return bytesFromGb(20);
    return bytesFromGb(5);
  };

  const renderStorageCard = () => {
    const maxBytes = maxStorageBytesForPlan();
    const usedBytes = Math.max(0, totalBytes);
    const safeMax = Math.max(1, maxBytes);
    const pct = Math.max(0, Math.min(100, Math.round((usedBytes / safeMax) * 100)));
    const remain = Math.max(0, maxBytes - usedBytes);

    const c = document.createElement("div");
    c.style.border = "1px solid rgba(255,255,255,.10)";
    c.style.borderRadius = "14px";
    c.style.background = "#373737";
    c.style.padding = "12px";
    c.style.display = "flex";
    c.style.flexDirection = "column";
    c.style.gap = "10px";

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "baseline";
    head.style.justifyContent = "space-between";
    head.style.gap = "10px";

    const l = document.createElement("div");
    l.style.fontSize = "12px";
    l.style.fontWeight = "900";
    l.style.color = "rgba(255,255,255,.78)";
    l.textContent = isArabic() ? "الحجم الكلي" : "Total size";

    const chip = document.createElement("div");
    chip.style.border = "1px solid rgba(255,255,255,.12)";
    chip.style.background = "rgba(255,255,255,.06)";
    chip.style.color = "rgba(255,255,255,.82)";
    chip.style.borderRadius = "999px";
    chip.style.padding = "4px 8px";
    chip.style.fontSize = "11px";
    chip.style.fontWeight = "950";
    chip.style.lineHeight = "1";
    chip.textContent = String(pct) + "%";

    head.appendChild(l);
    head.appendChild(chip);

    const bar = document.createElement("div");
    bar.style.height = "10px";
    bar.style.borderRadius = "999px";
    bar.style.background = "rgba(255,255,255,.08)";
    bar.style.border = "1px solid rgba(255,255,255,.10)";
    bar.style.overflow = "hidden";

    const fill = document.createElement("div");
    fill.style.height = "100%";
    fill.style.width = String(pct) + "%";
    fill.style.borderRadius = "999px";
    fill.style.background = "rgba(24,181,213,.92)";
    bar.appendChild(fill);

    const scale = document.createElement("div");
    scale.style.display = "flex";
    scale.style.alignItems = "center";
    scale.style.justifyContent = "space-between";
    scale.style.gap = "10px";

    const used = document.createElement("div");
    used.style.fontSize = "11px";
    used.style.fontWeight = "950";
    used.style.color = "rgba(255,255,255,.72)";
    used.style.whiteSpace = "nowrap";
    used.textContent = fmtBytes(usedBytes);

    const max = document.createElement("div");
    max.style.fontSize = "11px";
    max.style.fontWeight = "950";
    max.style.color = "rgba(255,255,255,.72)";
    max.style.whiteSpace = "nowrap";
    max.textContent = fmtBytes(maxBytes);

    scale.appendChild(used);
    scale.appendChild(max);

    const hint = document.createElement("div");
    hint.style.fontSize = "12px";
    hint.style.fontWeight = "900";
    hint.style.color = "rgba(255,255,255,.65)";
    hint.textContent = isArabic()
      ? ("المتبقي: " + fmtBytes(remain))
      : ("Remaining: " + fmtBytes(remain));

    c.appendChild(head);
    c.appendChild(bar);
    c.appendChild(scale);
    c.appendChild(hint);
    return c;
  };

  const renderLastUploadCard = () => {
    const c = document.createElement("div");
    c.style.border = "1px solid rgba(255,255,255,.10)";
    c.style.borderRadius = "14px";
    c.style.background = "#373737";
    c.style.padding = "12px";
    c.style.display = "flex";
    c.style.flexDirection = "column";
    c.style.gap = "8px";

    const l = document.createElement("div");
    l.style.fontSize = "13px";
    l.style.fontWeight = "900";
    l.style.color = "rgba(255,255,255,.78)";
    l.textContent = isArabic() ? "آخر رفع" : "Last upload";

    const v = document.createElement("div");
    v.style.fontSize = "18px";
    v.style.fontWeight = "950";
    v.style.color = "#fff";
    v.textContent = lastAt ? fmtDateTime(lastAt) : (isArabic() ? "—" : "—");

    c.appendChild(l);
    c.appendChild(v);

    const linkBlock = lastUrl ? renderLinkBlock(lastUrl, { compact: true }) : null;
    if (linkBlock) c.appendChild(linkBlock);

    return c;
  };

  grid.appendChild(renderStorageCard());
  grid.appendChild(renderLastUploadCard());
  wrap.appendChild(grid);
  return wrap;
};
`,
  `
const renderUploadRow = (rec, opts) => {
  const o = opts && typeof opts === "object" ? opts : {};
  const busy = Boolean(o.busy);
  const onRemove = typeof o.onRemove === "function" ? o.onRemove : null;
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.gap = "8px";
  wrap.style.padding = "14px 12px 10px";
  wrap.style.borderRadius = "18px";
  wrap.style.border = "1px solid rgba(24,181,213,.45)";
  wrap.style.boxShadow = "0 0 0 1px rgba(24,181,213,.12) inset";
  wrap.style.background = "#303030";
  wrap.style.position = "relative";
  wrap.onmouseenter = () => {
    try {
      wrap.style.border = "1px solid rgba(24,181,213,.70)";
      wrap.style.boxShadow = "0 0 0 1px rgba(24,181,213,.22) inset";
    } catch {}
  };
  wrap.onmouseleave = () => {
    try {
      wrap.style.border = "1px solid rgba(24,181,213,.45)";
      wrap.style.boxShadow = "0 0 0 1px rgba(24,181,213,.12) inset";
    } catch {}
  };

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.justifyContent = "flex-start";
  row.style.gap = "12px";
  row.style.minWidth = "0";

  const left = document.createElement("div");
  left.style.minWidth = "0";
  left.style.display = "flex";
  left.style.alignItems = "center";
  left.style.gap = "10px";

  const dot = document.createElement("div");
  dot.style.width = "10px";
  dot.style.height = "10px";
  dot.style.borderRadius = "999px";
  dot.style.flex = "0 0 auto";
  dot.style.border = "1px solid rgba(255,255,255,.20)";
  dot.style.background =
    rec.status === "error" || rec.status === "rejected"
      ? "#ef4444"
      : rec.status === "uploading"
        ? "#18b5d5"
        : rec.status === "done"
          ? "#18b5d5"
          : "rgba(255,255,255,.45)";

  const text = document.createElement("div");
  text.style.minWidth = "0";
  text.style.display = "flex";
  text.style.flexDirection = "column";
  text.style.gap = "3px";

  const name = document.createElement("div");
  name.style.fontSize = "12px";
  name.style.fontWeight = "950";
  name.style.color = "#fff";
  name.style.overflow = "hidden";
  name.style.textOverflow = "ellipsis";
  name.style.whiteSpace = "nowrap";
  name.textContent = String(rec.name || "");

  const sub = document.createElement("div");
  sub.style.fontSize = "11px";
  sub.style.fontWeight = "900";
  sub.style.color = rec.status === "error" || rec.status === "rejected" ? "#ef4444" : "rgba(255,255,255,.62)";
  const pct = (() => {
    try {
      const p = Number(rec && rec.progress);
      if (!Number.isFinite(p)) return 0;
      return Math.max(0, Math.min(100, Math.round(p)));
    } catch {
      return 0;
    }
  })();
  sub.textContent =
    rec.status === "uploading"
      ? (isArabic() ? "جاري الرفع " : "Uploading ") + String(pct) + "%"
      : rec.status === "done"
        ? isArabic()
          ? "تم الرفع"
          : "Uploaded"
        : rec.status === "rejected"
          ? (isArabic() ? "مرفوض" : "Rejected")
        : rec.status === "error"
          ? (isArabic() ? "فشل" : "Failed")
          : isArabic()
            ? "في الانتظار"
            : "Queued";

  text.appendChild(name);
  text.appendChild(sub);

  left.appendChild(dot);
  left.appendChild(text);

  const mkIconBtn = (label, tone, iconClass) => {
    const el = document.createElement("button");
    el.type = "button";
    el.setAttribute("aria-label", label);
    el.setAttribute("title", label);
    el.style.width = "30px";
    el.style.height = "30px";
    el.style.borderRadius = "999px";
    el.style.display = "grid";
    el.style.placeItems = "center";
    el.style.textDecoration = "none";
    el.style.border = "1px solid rgba(255,255,255,.12)";
    el.style.background = "rgba(255,255,255,.06)";
    el.style.color = "#fff";
    el.style.cursor = "pointer";
    el.style.padding = "0";
    el.style.margin = "0";
    el.style.lineHeight = "1";
    if (tone === "brand") {
      el.style.border = "1px solid rgba(24,181,213,.35)";
      el.style.background = "rgba(24,181,213,.16)";
      el.style.color = "#18b5d5";
    } else if (tone === "danger") {
      el.style.border = "1px solid rgba(239,68,68,.30)";
      el.style.background = "rgba(239,68,68,.14)";
      el.style.color = "#ef4444";
    }

    const ic = document.createElement("i");
    ic.className = String(iconClass || "");
    ic.setAttribute("aria-hidden", "true");
    ic.style.display = "block";
    ic.style.fontSize = "16px";
    ic.style.lineHeight = "1";
    ic.style.pointerEvents = "none";
    el.appendChild(ic);

    el.onmouseenter = () => {
      try {
        if (el.disabled) return;
        el.style.background = tone === "brand" ? "rgba(24,181,213,.22)" : tone === "danger" ? "rgba(239,68,68,.18)" : "rgba(255,255,255,.09)";
      } catch {}
    };
    el.onmouseleave = () => {
      try {
        el.style.background = tone === "brand" ? "rgba(24,181,213,.16)" : tone === "danger" ? "rgba(239,68,68,.14)" : "rgba(255,255,255,.06)";
      } catch {}
    };
    return el;
  };

  let rm = null;
  if (onRemove) {
    rm = mkIconBtn(isArabic() ? "إزالة" : "Remove", "neutral", "sicon-cancel");
    rm.disabled = busy || rec.status === "uploading";
    rm.style.position = "absolute";
    rm.style.top = "8px";
    if (typeof isRtl === "function" && isRtl()) {
      rm.style.left = "8px";
    } else {
      rm.style.right = "8px";
    }
    rm.style.width = "26px";
    rm.style.height = "26px";
    rm.style.cursor = rm.disabled ? "not-allowed" : "pointer";
    rm.style.opacity = rm.disabled ? "0.55" : "1";
    rm.style.border = "1px solid rgba(255,255,255,.12)";
    rm.style.background = "rgba(255,255,255,.06)";
    rm.style.color = "rgba(255,255,255,.75)";
    try {
      const ic = rm.querySelector("i");
      if (ic) ic.style.fontSize = "14px";
    } catch {}
    rm.onmouseenter = () => {
      try {
        if (rm.disabled) return;
        rm.style.background = "rgba(239,68,68,.14)";
        rm.style.border = "1px solid rgba(239,68,68,.30)";
        rm.style.color = "#ef4444";
      } catch {}
    };
    rm.onmouseleave = () => {
      try {
        rm.style.background = "rgba(255,255,255,.06)";
        rm.style.border = "1px solid rgba(255,255,255,.12)";
        rm.style.color = "rgba(255,255,255,.75)";
      } catch {}
    };
    rm.onclick = () => {
      try {
        if (rm.disabled) return;
        onRemove(String((rec && rec.id) || ""));
      } catch {}
    };
    wrap.appendChild(rm);
  }

  const bottom = document.createElement("div");
  bottom.style.display = "flex";
  bottom.style.alignItems = "center";
  bottom.style.justifyContent = "flex-start";
  bottom.style.gap = "10px";
  bottom.style.flexWrap = "wrap";
  bottom.style.minWidth = "0";
  if (typeof isRtl === "function" && isRtl()) {
    bottom.style.marginRight = "20px";
  } else {
    bottom.style.marginLeft = "20px";
  }

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.alignItems = "center";
  actions.style.gap = "8px";
  actions.style.flex = "0 0 auto";
  actions.style.flexDirection = isArabic() ? "row-reverse" : "row";

  const url = String((rec && rec.url) || "");
  const toPublicUrl = (raw) => {
    const u = String(raw || "");
    if (!u) return "";
    try {
      const x = new URL(u, window.location.origin);
      try {
        x.searchParams.delete("token");
      } catch {}
      try {
        const p = String(x.pathname || "");
        if (p.startsWith("/cdn/")) x.pathname = "/" + p.slice(5);
      } catch {}
      return x.toString();
    } catch {
      return u.replace("/cdn/", "/");
    }
  };
  const publicUrl = url ? toPublicUrl(url) : "";

  if (publicUrl && rec.status === "done") {
    const copy = mkIconBtn(isArabic() ? "نسخ" : "Copy", "brand", "sicon-swap-fill");
    copy.onclick = () => {
      try {
        copyText(publicUrl, () => {});
      } catch {}
    };
    const openBtn = mkIconBtn(isArabic() ? "فتح" : "Open", "neutral", "sicon-share");
    openBtn.onclick = (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();
        window.open(publicUrl, "_blank", "noopener");
      } catch {}
    };
    actions.appendChild(openBtn);
    actions.appendChild(copy);
  }

  const sizeChip = document.createElement("div");
  sizeChip.style.fontSize = "11px";
  sizeChip.style.fontWeight = "950";
  sizeChip.style.color = "rgba(255,255,255,.70)";
  sizeChip.style.border = "1px solid rgba(255,255,255,.10)";
  sizeChip.style.background = "rgba(255,255,255,.06)";
  sizeChip.style.borderRadius = "999px";
  sizeChip.style.padding = "6px 10px";
  sizeChip.style.lineHeight = "1";
  sizeChip.style.whiteSpace = "nowrap";
  const rawSize = rec && rec.size ? fmtBytes(rec.size) : "";
  const sizeTxt = (() => {
    try {
      const s = String(rawSize || "").trim();
      const parts = s.split(" ").filter(Boolean);
      if (parts.length === 2) return parts[1] + " " + parts[0];
      return s;
    } catch {
      return String(rawSize || "");
    }
  })();
  sizeChip.textContent = rec.status === "uploading" ? (String(pct) + "%") : sizeTxt;
  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.alignItems = "center";
  footer.style.justifyContent = "space-between";
  footer.style.gap = "12px";
  footer.style.minWidth = "0";
  footer.style.flexWrap = "nowrap";
  if (typeof isRtl === "function" && isRtl()) {
    footer.style.flexDirection = "row-reverse";
  }

  const leftGroup = document.createElement("div");
  leftGroup.style.display = "flex";
  leftGroup.style.alignItems = "center";
  leftGroup.style.gap = "10px";
  leftGroup.style.flex = "0 0 auto";
  leftGroup.style.flexWrap = "wrap";

  if (actions.childNodes && actions.childNodes.length) leftGroup.appendChild(actions);
  if (sizeChip.textContent) leftGroup.appendChild(sizeChip);

  let link = null;
  if (publicUrl && rec.status === "done") {
    link = document.createElement("a");
    link.href = publicUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.style.display = "block";
    link.style.fontSize = "10px";
    link.style.fontWeight = "900";
    link.style.color = "rgba(255,255,255,.62)";
    link.style.textDecoration = "none";
    link.style.direction = "ltr";
    link.style.whiteSpace = "nowrap";
    link.style.overflow = "hidden";
    link.style.textOverflow = "ellipsis";
    link.style.padding = "0 2px";
    link.style.minWidth = "0";
    link.style.flex = "1 1 auto";
    if (typeof isRtl === "function" && isRtl()) link.style.textAlign = "right";
    link.textContent = publicUrl;
    link.onmouseenter = () => {
      try {
        link.style.color = "rgba(24,181,213,.95)";
        link.style.textDecoration = "underline";
        link.style.textDecorationThickness = "1px";
        link.style.textUnderlineOffset = "2px";
      } catch {}
    };
    link.onmouseleave = () => {
      try {
        link.style.color = "rgba(255,255,255,.62)";
        link.style.textDecoration = "none";
      } catch {}
    };
  }

  row.appendChild(left);
  wrap.appendChild(row);
  if ((link || (leftGroup.childNodes && leftGroup.childNodes.length)) && rec.status !== "uploading") {
    if (link) footer.appendChild(link);
    if (leftGroup.childNodes && leftGroup.childNodes.length) footer.appendChild(leftGroup);
    bottom.appendChild(footer);
  } else if (leftGroup.childNodes && leftGroup.childNodes.length) {
    bottom.appendChild(leftGroup);
  }
  if (bottom.childNodes && bottom.childNodes.length) wrap.appendChild(bottom);

  if (rec.status === "uploading") {
    const bar = document.createElement("div");
    bar.style.height = "6px";
    bar.style.borderRadius = "999px";
    bar.style.background = "rgba(255,255,255,.08)";
    bar.style.border = "1px solid rgba(255,255,255,.10)";
    bar.style.overflow = "hidden";
    bar.style.position = "relative";

    const fill = document.createElement("div");
    fill.style.height = "100%";
    fill.style.width = String(pct) + "%";
    fill.style.borderRadius = "999px";
    fill.style.background = "linear-gradient(90deg, rgba(24,181,213,.35) 0%, rgba(24,181,213,.95) 50%, rgba(255,255,255,.55) 100%)";

    bar.appendChild(fill);
    wrap.appendChild(bar);
  }

  return wrap;
};
`
 ];
