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
  const onDownloadAll = typeof o.onDownloadAll === "function" ? o.onDownloadAll : null;
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

  if (selected.length) {
    const selLine = document.createElement("div");
    selLine.style.color = "rgba(255,255,255,.85)";
    selLine.style.fontSize = "12px";
    selLine.style.fontWeight = "950";
    selLine.textContent = (isArabic() ? "تم اختيار " : "Selected ") + String(selected.length) + (isArabic() ? " صورة" : " images");
    selMeta.appendChild(selLine);

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

      const rm = document.createElement("button");
      rm.type = "button";
      rm.setAttribute("aria-label", isArabic() ? "إزالة" : "Remove");
      rm.setAttribute("title", isArabic() ? "إزالة" : "Remove");
      rm.disabled = busy;
      rm.style.width = "26px";
      rm.style.height = "26px";
      rm.style.borderRadius = "999px";
      rm.style.border = "1px solid rgba(255,255,255,.12)";
      rm.style.background = "rgba(0,0,0,.14)";
      rm.style.color = "rgba(255,255,255,.92)";
      rm.style.display = "grid";
      rm.style.placeItems = "center";
      rm.style.cursor = rm.disabled ? "not-allowed" : "pointer";
      rm.style.opacity = rm.disabled ? "0.55" : "1";
      rm.style.fontSize = "16px";
      rm.style.fontWeight = "950";
      rm.style.lineHeight = "1";
      rm.textContent = "×";
      rm.onmouseenter = () => {
        try {
          if (rm.disabled) return;
          rm.style.borderColor = "rgba(239,68,68,.45)";
          rm.style.background = "rgba(239,68,68,.16)";
        } catch {}
      };
      rm.onmouseleave = () => {
        try {
          rm.style.borderColor = "rgba(255,255,255,.12)";
          rm.style.background = "rgba(0,0,0,.14)";
        } catch {}
      };
      rm.onclick = () => {
        try {
          if (rm.disabled) return;
          const next = selected.filter((_, j) => j !== i);
          if (onSetFiles) {
            onSetFiles(next);
            return;
          }
          state.compressFiles = next;
          state.compressItems = [];
          state.compressError = "";
          state.compressOverallProgress = 0;
          state.compressUploadingAny = false;
          state.compressDownloadingAll = false;
          if (onRender) onRender();
        } catch {}
      };

      const name = document.createElement("div");
      name.style.color = "#fff";
      name.style.fontSize = "12px";
      name.style.fontWeight = "950";
      name.style.minWidth = "0";
      name.style.flex = "1 1 auto";
      name.style.overflow = "hidden";
      name.style.textOverflow = "ellipsis";
      name.style.whiteSpace = "nowrap";
      name.style.textAlign = isArabic() ? "right" : "left";
      name.textContent = String(f.name || "");

      const size = document.createElement("div");
      size.style.color = "rgba(255,255,255,.88)";
      size.style.fontSize = "12px";
      size.style.fontWeight = "900";
      size.style.flex = "0 0 auto";
      size.style.direction = "ltr";
      size.style.textAlign = "left";
      size.textContent = fmtBytes(Number(f.size || 0) || 0);

      if (isArabic()) {
        row.appendChild(name);
        row.appendChild(size);
        row.appendChild(rm);
      } else {
        row.appendChild(rm);
        row.appendChild(name);
        row.appendChild(size);
      }
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
  const maxQuality = 80;
  const qDefault = Math.min(maxQuality, mime === "image/png" ? 90 : 82);
  const clampQ = (x) => Math.max(1, Math.min(maxQuality, Math.round(Number(x) || qDefault)));
  const qNum = state.compressQuality ? Number(state.compressQuality) : qDefault;
  qVal.textContent = String(clampQ(qNum));

  qHead.appendChild(qLabel);
  qHead.appendChild(qVal);

  const range = document.createElement("input");
  range.type = "range";
  range.min = "1";
  range.max = "80";
  range.step = "1";
  range.value = String(qVal.textContent || qDefault);
  range.disabled = busy;
  range.oninput = () => {
    try {
      state.compressQuality = String(range.value || "");
      qVal.textContent = String(clampQ(range.value));
    } catch {}
  };
  range.onchange = () => {
    try {
      state.compressQuality = String(range.value || "");
      qVal.textContent = String(clampQ(range.value));
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

  const items = Array.isArray(state.compressItems) ? state.compressItems : [];
  const doneItems = items.filter((x) => x && String(x.status || "") === "done" && x.resultUrl);
  const doneCount = doneItems.length;

  let dlAllBtn = null;
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

  if (doneCount > 1) {
    const dlAllLabel = Boolean(state.compressDownloadingAll)
      ? (isArabic() ? "جاري تجهيز الملف…" : "Preparing…")
      : (isArabic() ? "تحميل الكل" : "Download all");
    const dlAll = btnPrimary(dlAllLabel);
    dlAll.disabled = busy || !onDownloadAll || Boolean(state.compressDownloadingAll);
    dlAll.style.opacity = dlAll.disabled ? "0.65" : "1";
    dlAll.style.cursor = dlAll.disabled ? "not-allowed" : "pointer";
    dlAll.onclick = () => {
      try {
        if (dlAll.disabled) return;
        onDownloadAll();
      } catch {}
    };
    dlAllBtn = dlAll;
  }

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

  if (items.length) {
    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "10px";

    const mkRow = (it) => {
      const box = document.createElement("div");
      box.style.border = "1px solid rgba(255,255,255,.08)";
      box.style.borderRadius = "14px";
      box.style.background = "#303030";
      box.style.padding = "12px";
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.gap = "10px";

      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.alignItems = "center";
      top.style.justifyContent = "space-between";
      top.style.gap = "10px";
      top.style.flexWrap = "wrap";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.gap = "4px";
      left.style.minWidth = "0";

      const st = String((it && it.status) || "queued");
      const rawName = String((it && it.name) || "");
      const outFmt2 = String((it && it.outFormat) || "").trim().toLowerCase();
      const shownName = (() => {
        if (st !== "done") return rawName;
        let baseName = rawName;
        const dot = baseName.lastIndexOf(".");
        if (dot > 0) baseName = baseName.slice(0, dot);
        baseName = baseName.slice(0, 120) || (isArabic() ? "ملف" : "file");
        return outFmt2 ? baseName + "." + outFmt2 : rawName;
      })();

      const nameRow = document.createElement("div");
      nameRow.style.display = "flex";
      nameRow.style.alignItems = "center";
      nameRow.style.gap = "8px";
      nameRow.style.minWidth = "0";

      const nameText = document.createElement("div");
      nameText.style.fontSize = "12px";
      nameText.style.fontWeight = "950";
      nameText.style.color = "#fff";
      nameText.style.overflow = "hidden";
      nameText.style.textOverflow = "ellipsis";
      nameText.style.whiteSpace = "nowrap";
      nameText.style.minWidth = "0";
      nameText.style.flex = "1 1 auto";
      nameText.textContent = shownName;

      let editBtn = null;

      if (st === "done" && it && it.resultUrl) {
        editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "✎";
        editBtn.setAttribute("aria-label", isArabic() ? "تعديل اسم الملف" : "Edit file name");
        editBtn.title = isArabic() ? "تعديل اسم الملف" : "Edit file name";
        editBtn.style.flex = "0 0 auto";
        editBtn.style.border = "1px solid rgba(255,255,255,.12)";
        editBtn.style.borderRadius = "10px";
        editBtn.style.background = "#303030";
        editBtn.style.color = "rgba(255,255,255,.85)";
        editBtn.style.padding = "6px 10px";
        editBtn.style.fontSize = "12px";
        editBtn.style.fontWeight = "950";
        editBtn.style.cursor = "pointer";
        editBtn.onclick = () => {
          try {
            const cur = String((it && it.name) || "");
            let base = cur;
            let ext = "";
            const dot = cur.lastIndexOf(".");
            if (dot > 0) {
              base = cur.slice(0, dot);
              ext = cur.slice(dot + 1).trim();
            }
            base = String(base || "").trim();

            const input = document.createElement("input");
            input.type = "text";
            input.value = base;
            input.dir = "auto";
            input.style.width = "100%";
            input.style.flex = "1 1 auto";
            input.style.minWidth = "0";
            input.style.padding = "6px 10px";
            input.style.borderRadius = "10px";
            input.style.border = "1px solid rgba(255,255,255,.12)";
            input.style.background = "#303030";
            input.style.color = "#fff";
            input.style.fontSize = "12px";
            input.style.fontWeight = "950";
            input.style.outline = "none";

            let done = false;
            const save = () => {
              if (done) return;
              done = true;
              try {
                let nextBase = String(input.value || "").trim();
                if (!nextBase) nextBase = base || (isArabic() ? "ملف" : "file");
                const next = ext ? nextBase + "." + ext : nextBase;
                it.name = next;
              } catch {}
              try {
                if (onRender) onRender();
              } catch {}
            };
            const cancel = () => {
              if (done) return;
              done = true;
              try {
                if (onRender) onRender();
              } catch {}
            };

            input.onkeydown = (e) => {
              try {
                const k = String((e && e.key) || "");
                if (k === "Enter") {
                  e.preventDefault();
                  save();
                } else if (k === "Escape") {
                  e.preventDefault();
                  cancel();
                }
              } catch {}
            };
            input.onblur = () => {
              try {
                save();
              } catch {}
            };

            nameRow.replaceChild(input, nameText);
            editBtn.disabled = true;
            editBtn.style.opacity = "0.6";
            editBtn.style.cursor = "not-allowed";
            setTimeout(() => {
              try {
                input.focus();
                input.select();
              } catch {}
            }, 0);
          } catch {}
        };
      }

      if (isArabic()) {
        if (editBtn) nameRow.appendChild(editBtn);
        nameRow.appendChild(nameText);
      } else {
        nameRow.appendChild(nameText);
        if (editBtn) nameRow.appendChild(editBtn);
      }

      const sub = document.createElement("div");
      sub.style.fontSize = "12px";
      sub.style.fontWeight = "900";
      sub.style.lineHeight = "1.5";
      sub.style.display = "flex";
      sub.style.flexDirection = "column";
      sub.style.gap = "2px";
      sub.style.color = "rgba(255,255,255,.62)";
      const inB = Number((it && it.inBytes) || 0) || 0;
      const outB = Number((it && it.outBytes) || 0) || 0;
      const ratio = inB > 0 && outB > 0 ? Math.max(0, Math.min(100, Math.round((1 - outB / inB) * 100))) : 0;
      const fmt2 = String((it && it.outFormat) || "").trim();
      const pct = Math.max(0, Math.min(100, Math.round(Number((it && it.progress) || 0) || 0)));

      if (st === "compressing") {
        sub.textContent = (isArabic() ? "جاري الضغط " : "Compressing ") + String(pct) + "%";
      } else if (st === "queued") {
        sub.textContent = isArabic() ? "في الانتظار" : "Queued";
      } else if (st === "error") {
        sub.style.color = "#ef4444";
        sub.textContent = String((it && it.error) || (isArabic() ? "فشل الضغط" : "Compression failed"));
      } else if (st === "done") {
        if (outB && fmt2) {
          const line = document.createElement("div");
          line.style.display = "flex";
          line.style.alignItems = "center";
          line.style.justifyContent = "flex-start";
          line.style.flexWrap = "wrap";
          line.style.gap = "8px";

          const sizes = document.createElement("span");
          sizes.style.direction = "ltr";
          sizes.style.color = "rgba(255,255,255,.78)";
          sizes.textContent = fmtBytes(inB) + " → " + fmtBytes(outB);

          const sep1 = document.createElement("span");
          sep1.textContent = "|";
          sep1.style.opacity = "0.6";

          const saved = document.createElement("span");
          saved.style.direction = isArabic() ? "rtl" : "ltr";
          saved.style.color = "rgba(255,255,255,.62)";
          saved.textContent = (isArabic() ? "التوفير " : "Saved ") + String(ratio) + "%";

          const sep2 = document.createElement("span");
          sep2.textContent = "•";
          sep2.style.opacity = "0.6";

          const fmt = document.createElement("span");
          fmt.style.direction = "ltr";
          fmt.style.color = "rgba(255,255,255,.72)";
          fmt.textContent = String(fmt2 || "").toUpperCase();

          line.appendChild(sizes);
          line.appendChild(sep1);
          line.appendChild(saved);
          line.appendChild(sep2);
          line.appendChild(fmt);
          sub.appendChild(line);
        } else {
          sub.textContent = fmtBytes(inB);
        }
      }

      left.appendChild(nameRow);
      if (sub.textContent || (sub.childNodes && sub.childNodes.length)) left.appendChild(sub);

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.alignItems = "center";
      right.style.gap = "8px";
      right.style.flexWrap = "wrap";
      right.style.flex = "0 0 auto";
      const resUrl = String((it && it.resultUrl) || "");
      if (resUrl && st === "done") {
        const dl = btnPrimary(isArabic() ? "تحميل" : "Download");
        dl.onclick = () => {
          try {
            const a = document.createElement("a");
            a.href = resUrl;
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
        right.appendChild(dl);
      }

      top.appendChild(left);
      if (right.childNodes && right.childNodes.length) top.appendChild(right);
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

      return box;
    };

    for (let i = 0; i < items.length; i += 1) {
      list.appendChild(mkRow(items[i] || {}));
    }

    s3.appendChild(list);

    if (dlAllBtn) {
      const bulk = document.createElement("div");
      bulk.style.display = "flex";
      bulk.style.gap = "10px";
      bulk.style.flexWrap = "wrap";
      bulk.appendChild(dlAllBtn);
      s3.appendChild(bulk);
    }
  }

  stepWrap.appendChild(s3);
  card.appendChild(stepWrap);
  return card;
};
`
];
