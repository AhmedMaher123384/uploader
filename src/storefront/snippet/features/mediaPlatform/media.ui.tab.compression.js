module.exports = [
  `
const renderCompressionPlatform = (opts) => {
  const o = opts && typeof opts === "object" ? opts : {};
  const state = o.state && typeof o.state === "object" ? o.state : {};
  const maxFiles = Number(o.maxFiles || 0) || 0;
  const compressInput = o.compressInput || null;
  const onRender = typeof o.onRender === "function" ? o.onRender : null;
  const onPick = typeof o.onPick === "function" ? o.onPick : null;
  const onSetFiles = typeof o.onSetFiles === "function" ? o.onSetFiles : null;
  const onRunCompress = typeof o.onRunCompress === "function" ? o.onRunCompress : null;
  const onReset = typeof o.onReset === "function" ? o.onReset : null;
  const busy = Boolean(state.compressRunning);

  const mkStep = (n, titleText, subText) => {
    const box = document.createElement("div");
    box.style.border = "1px solid rgba(255,255,255,.08)";
    box.style.borderRadius = "14px";
    box.style.background = "#373737";
    box.style.padding = "12px";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.gap = "10px";

    const head = document.createElement("div");
    head.style.display = "flex";
    head.style.alignItems = "flex-start";
    head.style.justifyContent = "space-between";
    head.style.gap = "10px";
    head.style.flexWrap = "wrap";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "4px";
    left.style.minWidth = "0";

    const t = document.createElement("div");
    t.style.display = "flex";
    t.style.alignItems = "center";
    t.style.gap = "8px";

    const num = document.createElement("div");
    num.textContent = String(n || "");
    num.style.flex = "0 0 auto";
    num.style.minWidth = "26px";
    num.style.height = "26px";
    num.style.display = "grid";
    num.style.placeItems = "center";
    num.style.borderRadius = "10px";
    num.style.border = "1px solid rgba(24,181,213,.28)";
    num.style.background = "rgba(24,181,213,.10)";
    num.style.color = "#18b5d5";
    num.style.fontWeight = "950";
    num.style.fontSize = "12px";

    const title = document.createElement("div");
    title.style.color = "rgba(255,255,255,.95)";
    title.style.fontSize = "13px";
    title.style.fontWeight = "950";
    title.textContent = String(titleText || "");

    t.appendChild(num);
    t.appendChild(title);

    left.appendChild(t);

    if (subText) {
      const sub = document.createElement("div");
      sub.style.color = "rgba(255,255,255,.55)";
      sub.style.fontSize = "12px";
      sub.style.fontWeight = "900";
      sub.style.lineHeight = "1.6";
      sub.textContent = String(subText || "");
      left.appendChild(sub);
    }

    head.appendChild(left);
    box.appendChild(head);
    return box;
  };

  const mkSelect = (labelText, value, options, disabled, onChange) => {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "6px";

    const l = document.createElement("div");
    l.style.color = "rgba(255,255,255,.75)";
    l.style.fontSize = "12px";
    l.style.fontWeight = "950";
    l.textContent = String(labelText || "");

    const s = document.createElement("select");
    s.disabled = Boolean(disabled);
    s.style.width = "100%";
    s.style.padding = "10px 12px";
    s.style.borderRadius = "12px";
    s.style.border = "1px solid rgba(255,255,255,.08)";
    s.style.background = "#303030";
    s.style.color = "rgba(255,255,255,.90)";
    s.style.fontSize = "12px";
    s.style.fontWeight = "900";
    s.onchange = () => {
      try {
        if (typeof onChange === "function") onChange(String(s.value || ""));
      } catch {}
    };

    const list = Array.isArray(options) ? options : [];
    const desired = String(value == null ? "" : value);
    for (let i = 0; i < list.length; i += 1) {
      const o2 = list[i] || {};
      const opt = document.createElement("option");
      opt.value = String(o2.value == null ? "" : o2.value);
      opt.textContent = String(o2.label == null ? "" : o2.label);
      if (opt.value === desired) opt.selected = true;
      s.appendChild(opt);
    }
    try {
      s.value = desired;
    } catch {}

    wrap.appendChild(l);
    wrap.appendChild(s);
    return wrap;
  };

  const card = document.createElement("div");
  card.style.border = "1px solid rgba(255,255,255,.08)";
  card.style.borderRadius = "16px";
  card.style.background = "#303030";
  card.style.padding = "14px";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.gap = "12px";

  const head = document.createElement("div");
  head.style.display = "flex";
  head.style.alignItems = "flex-start";
  head.style.justifyContent = "space-between";
  head.style.gap = "10px";
  head.style.flexWrap = "wrap";

  const titleWrap = document.createElement("div");
  titleWrap.style.display = "flex";
  titleWrap.style.flexDirection = "column";
  titleWrap.style.gap = "6px";
  titleWrap.style.minWidth = "0";

  const title = document.createElement("div");
  title.style.color = "rgba(255,255,255,.95)";
  title.style.fontSize = "14px";
  title.style.fontWeight = "950";
  title.textContent = isArabic() ? "منصة ضغط الصور" : "Image Compression Platform";

  const hint = document.createElement("div");
  hint.style.color = "rgba(255,255,255,.55)";
  hint.style.fontSize = "12px";
  hint.style.fontWeight = "900";
  hint.style.lineHeight = "1.6";
  const limText = maxFiles ? String(maxFiles) : "—";
  hint.textContent = isArabic()
    ? "الحد الأقصى للصور في المرة الواحدة: " + limText
    : "Max images per batch: " + limText;

  titleWrap.appendChild(title);
  titleWrap.appendChild(hint);

  const pickBtn = btnGhost(isArabic() ? "اختيار صور" : "Pick images");
  pickBtn.style.color = "#fff";
  pickBtn.disabled = busy || !compressInput;
  pickBtn.style.opacity = pickBtn.disabled ? "0.65" : "1";
  pickBtn.style.cursor = pickBtn.disabled ? "not-allowed" : "pointer";
  pickBtn.onclick = () => {
    try {
      if (pickBtn.disabled) return;
      if (onPick) onPick();
      else compressInput.click();
    } catch {}
  };

  head.appendChild(titleWrap);
  head.appendChild(pickBtn);
  card.appendChild(head);

  const stepWrap = document.createElement("div");
  stepWrap.style.display = "flex";
  stepWrap.style.flexDirection = "column";
  stepWrap.style.gap = "10px";

  const s1 = mkStep(
    1,
    isArabic() ? "اختيار الصور" : "Select images",
    isArabic() ? "اسحب صورك هنا أو اخترها من الجهاز" : "Drop images here or choose from device"
  );

  const selected = Array.isArray(state.compressFiles) ? state.compressFiles : [];
  const selMeta = document.createElement("div");
  selMeta.style.display = "flex";
  selMeta.style.flexDirection = "column";
  selMeta.style.gap = "6px";

  const selLine = document.createElement("div");
  selLine.style.color = "rgba(255,255,255,.85)";
  selLine.style.fontSize = "12px";
  selLine.style.fontWeight = "950";
  selLine.textContent = selected.length
    ? (isArabic() ? "تم اختيار " : "Selected ") + String(selected.length) + (isArabic() ? " صورة" : " images")
    : (isArabic() ? "لم يتم اختيار صور" : "No images selected");
  selMeta.appendChild(selLine);

  if (selected.length) {
    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "8px";
    list.style.maxHeight = "160px";
    list.style.overflow = "auto";
    list.style.padding = "2px";
    list.style.borderRadius = "12px";
    list.style.border = "1px solid rgba(24,181,213,.35)";
    list.style.background = "rgba(24,181,213,.12)";
    list.style.direction = isArabic() ? "rtl" : "ltr";

    for (let i = 0; i < selected.length; i += 1) {
      const f = selected[i];
      if (!f) continue;

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.gap = "10px";
      row.style.padding = "8px 10px";
      row.style.borderRadius = "10px";
      row.style.background = "rgba(255,255,255,.06)";

      const name = document.createElement("div");
      name.style.color = "#fff";
      name.style.fontSize = "12px";
      name.style.fontWeight = "950";
      name.style.minWidth = "0";
      name.style.flex = "1 1 auto";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";
      name.style.whiteSpace = "nowrap";
      name.style.textAlign = "right";
      name.textContent = String(f.name || "");

      const size = document.createElement("div");
      size.style.color = "rgba(255,255,255,.88)";
      size.style.fontSize = "12px";
      size.style.fontWeight = "900";
      size.style.flex = "0 0 auto";
      size.style.direction = "ltr";
      size.style.textAlign = "left";
      size.textContent = fmtBytes(Number(f.size || 0) || 0);

      row.appendChild(name);
      row.appendChild(size);
      list.appendChild(row);
    }

    selMeta.appendChild(list);
  }

  s1.appendChild(selMeta);

  const dz = renderDropzone({
    disabled: busy || !compressInput,
    onPick: () => {
      try {
        if (onPick) onPick();
        else compressInput.click();
      } catch {}
    },
    onFiles: (fs) => {
      try {
        if (!onSetFiles) return;
        onSetFiles(fs);
      } catch {}
    }
  });
  if (dz) {
    try {
      dz.ondrop = (e) => {
        try {
          e.preventDefault();
          e.stopPropagation();
          dz.style.borderColor = "rgba(255,255,255,.12)";
          dz.style.background = "#373737";
          if (busy || !compressInput) return;
          const files = e.dataTransfer?.files;
          if (files && files.length > 0 && onSetFiles) onSetFiles(Array.from(files));
        } catch {}
      };
    } catch {}
    s1.appendChild(dz);
  }

  if (state.compressError) s1.appendChild(renderError(state.compressError));
  stepWrap.appendChild(s1);

  const s2 = mkStep(
    2,
    isArabic() ? "إعدادات الضغط" : "Compression settings",
    isArabic() ? "اختر الجودة فقط" : "Pick quality only"
  );

  const qWrap = document.createElement("div");
  qWrap.style.display = "flex";
  qWrap.style.flexDirection = "column";
  qWrap.style.gap = "8px";

  const qHead = document.createElement("div");
  qHead.style.display = "flex";
  qHead.style.alignItems = "center";
  qHead.style.justifyContent = "space-between";
  qHead.style.gap = "10px";

  const qLabel = document.createElement("div");
  qLabel.style.color = "rgba(255,255,255,.75)";
  qLabel.style.fontSize = "12px";
  qLabel.style.fontWeight = "950";
  qLabel.textContent = isArabic() ? "الجودة" : "Quality";

  const qVal = document.createElement("div");
  qVal.style.color = "#18b5d5";
  qVal.style.fontSize = "12px";
  qVal.style.fontWeight = "950";
  const first = selected && selected[0] ? selected[0] : null;
  const mime = String((first && first.type) || "").trim().toLowerCase();
  const qDefault = mime === "image/png" ? 90 : 82;
  const qNum = state.compressQuality ? Number(state.compressQuality) : qDefault;
  qVal.textContent = String(Math.max(1, Math.min(92, Math.round(Number(qNum) || qDefault))));

  qHead.appendChild(qLabel);
  qHead.appendChild(qVal);

  const range = document.createElement("input");
  range.type = "range";
  range.min = "1";
  range.max = "92";
  range.step = "1";
  range.value = String(qVal.textContent || qDefault);
  range.disabled = busy;
  range.oninput = () => {
    try {
      state.compressQuality = String(range.value || "");
      qVal.textContent = String(Math.max(1, Math.min(92, Math.round(Number(range.value) || qDefault))));
    } catch {}
  };
  range.onchange = () => {
    try {
      state.compressQuality = String(range.value || "");
      qVal.textContent = String(Math.max(1, Math.min(92, Math.round(Number(range.value) || qDefault))));
      if (onRender) onRender();
    } catch {}
  };
  try {
    range.style.width = "100%";
  } catch {}

  qWrap.appendChild(qHead);
  qWrap.appendChild(range);
  s2.appendChild(qWrap);

  stepWrap.appendChild(s2);

  const s3 = mkStep(3, isArabic() ? "الضغط والنتائج" : "Compress & results", isArabic() ? "ابدأ الضغط ثم حمّل النتيجة أو ارفعها" : "Compress, then download or upload");

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "10px";
  actions.style.flexWrap = "wrap";

  const runBtn = btnPrimary(isArabic() ? "ضغط الآن" : "Compress now");
  runBtn.disabled = busy || !selected.length || !onRunCompress;
  runBtn.style.opacity = runBtn.disabled ? "0.65" : "1";
  runBtn.style.cursor = runBtn.disabled ? "not-allowed" : "pointer";
  runBtn.onclick = () => {
    try {
      if (runBtn.disabled) return;
      onRunCompress();
    } catch {}
  };

  const resetBtn = btnGhost(isArabic() ? "تفريغ" : "Reset");
  resetBtn.disabled = busy || !onReset;
  resetBtn.style.opacity = resetBtn.disabled ? "0.65" : "1";
  resetBtn.style.cursor = resetBtn.disabled ? "not-allowed" : "pointer";
  resetBtn.onclick = () => {
    try {
      if (resetBtn.disabled) return;
      onReset();
    } catch {}
  };

  actions.appendChild(runBtn);
  actions.appendChild(resetBtn);
  s3.appendChild(actions);

  const items = Array.isArray(state.compressItems) ? state.compressItems : [];
  if (items.length) {
    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "10px";

    const mkBadge = (label, tone) => {
      const b = document.createElement("div");
      b.textContent = String(label || "");
      b.style.padding = "6px 10px";
      b.style.borderRadius = "999px";
      b.style.fontSize = "11px";
      b.style.fontWeight = "950";
      b.style.border = "1px solid rgba(255,255,255,.12)";
      b.style.background = "#303030";
      b.style.color = "rgba(255,255,255,.85)";
      if (tone === "ok") {
        b.style.border = "1px solid rgba(24,181,213,.35)";
        b.style.background = "rgba(24,181,213,.10)";
        b.style.color = "#18b5d5";
      } else if (tone === "err") {
        b.style.border = "1px solid rgba(239,68,68,.35)";
        b.style.background = "rgba(239,68,68,.10)";
        b.style.color = "#fecaca";
      }
      return b;
    };

    const mkRow = (it) => {
      const box = document.createElement("div");
      box.style.border = "1px solid rgba(24,181,213,.25)";
      box.style.borderRadius = "14px";
      box.style.background = "#373737";
      box.style.padding = "12px";
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.gap = "10px";

      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.alignItems = "flex-start";
      top.style.justifyContent = "space-between";
      top.style.gap = "10px";
      top.style.flexWrap = "wrap";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.gap = "4px";
      left.style.minWidth = "0";

      const name = document.createElement("div");
      name.style.fontSize = "12px";
      name.style.fontWeight = "950";
      name.style.color = "#fff";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";
      name.style.whiteSpace = "nowrap";
      name.textContent = String((it && it.name) || "");

      const meta = document.createElement("div");
      meta.style.fontSize = "12px";
      meta.style.fontWeight = "900";
      meta.style.color = "rgba(255,255,255,.65)";
      const inB = Number((it && it.inBytes) || 0) || 0;
      const outB = Number((it && it.outBytes) || 0) || 0;
      const ratio = inB > 0 && outB > 0 ? Math.max(0, Math.min(100, Math.round((1 - outB / inB) * 100))) : 0;
      const fmt2 = String((it && it.outFormat) || "").trim();
      meta.textContent =
        outB && fmt2
          ? (fmtBytes(inB) + " → " + fmtBytes(outB) + " • -" + String(ratio) + "% • " + fmt2.toUpperCase())
          : fmtBytes(inB);

      left.appendChild(name);
      left.appendChild(meta);

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.alignItems = "center";
      right.style.gap = "8px";
      right.style.flexWrap = "wrap";
      right.style.flex = "0 0 auto";

      const st = String((it && it.status) || "queued");
      const badge =
        st === "done"
          ? mkBadge(isArabic() ? "تم" : "Done", "ok")
          : st === "error"
            ? mkBadge(isArabic() ? "خطأ" : "Error", "err")
            : st === "compressing"
              ? mkBadge(isArabic() ? "جاري الضغط" : "Compressing", "neutral")
              : mkBadge(isArabic() ? "قائمة" : "Queued", "neutral");

      right.appendChild(badge);

      top.appendChild(left);
      top.appendChild(right);
      box.appendChild(top);

      if (st === "compressing") {
        const prog = document.createElement("div");
        prog.style.border = "1px solid rgba(255,255,255,.08)";
        prog.style.borderRadius = "14px";
        prog.style.background = "#303030";
        prog.style.overflow = "hidden";
        const bar = document.createElement("div");
        bar.style.height = "10px";
        bar.style.width = Math.max(0, Math.min(100, Number((it && it.progress) || 0) || 0)) + "%";
        bar.style.background = "#18b5d5";
        prog.appendChild(bar);
        box.appendChild(prog);
      }

      if (st === "error") {
        const e = document.createElement("div");
        e.style.fontSize = "12px";
        e.style.fontWeight = "900";
        e.style.color = "#ef4444";
        e.style.lineHeight = "1.6";
        e.textContent = String((it && it.error) || "");
        box.appendChild(e);
      }

      if (st === "done" && it && it.resultUrl) {
        const act = document.createElement("div");
        act.style.display = "flex";
        act.style.gap = "10px";
        act.style.flexWrap = "wrap";

        const dl = btnGhost(isArabic() ? "تحميل" : "Download");
        dl.onclick = () => {
          try {
            const a = document.createElement("a");
            a.href = String(it.resultUrl || "");
            const raw = String((it && it.name) || "compressed");
            let base = raw;
            const dot = base.lastIndexOf(".");
            if (dot > 0) base = base.slice(0, dot);
            base = base.slice(0, 120) || "compressed";
            const ext = String((it && it.outFormat) || "").trim().toLowerCase() || "webp";
            a.download = base + "." + ext;
            document.body.appendChild(a);
            a.click();
            a.remove();
          } catch {}
        };

        act.appendChild(dl);

        box.appendChild(act);
      }

      return box;
    };

    for (let i = 0; i < items.length; i += 1) {
      list.appendChild(mkRow(items[i] || {}));
    }

    s3.appendChild(list);
  }

  stepWrap.appendChild(s3);
  card.appendChild(stepWrap);
  return card;
};
`
];
