module.exports = [
  `
const renderConversionPlatform = (opts) => {
  const o = opts && typeof opts === "object" ? opts : {};
  const state = o.state && typeof o.state === "object" ? o.state : {};
  const planBlocked = Boolean(o.planBlocked);
  const maxFiles = Number(o.maxFiles || 0) || 0;
  const convertInput = o.convertInput || null;
  const onRender = typeof o.onRender === "function" ? o.onRender : null;
  const onRunConvert = typeof o.onRunConvert === "function" ? o.onRunConvert : null;
  const onUploadItem = typeof o.onUploadItem === "function" ? o.onUploadItem : null;
  const onOpenFiles = typeof o.onOpenFiles === "function" ? o.onOpenFiles : null;
  const onSetConvertFiles = typeof o.onSetConvertFiles === "function" ? o.onSetConvertFiles : null;
  const onSetKind = typeof o.onSetKind === "function" ? o.onSetKind : null;
  const onReset = typeof o.onReset === "function" ? o.onReset : null;

  const wireDragOnlyRange = (range, opts2) => {
    const o2 = opts2 && typeof opts2 === "object" ? opts2 : {};
    const min = Number(o2.min);
    const max = Number(o2.max);
    const step = Number(o2.step) || 1;
    const onValue = typeof o2.onValue === "function" ? o2.onValue : null;
    const shouldBlock = typeof o2.shouldBlock === "function" ? o2.shouldBlock : () => false;
    const thumbPx = Number(o2.thumbPx || 22) || 22;

    const clamp = (x) => Math.max(min, Math.min(max, x));
    const snap = (x) => {
      const v = clamp(x);
      const s = step > 0 ? step : 1;
      return Math.round((v - min) / s) * s + min;
    };
    const readVal = () => {
      const v = Number(range.value);
      return Number.isFinite(v) ? v : min;
    };
    const writeVal = (v) => {
      const vv = snap(v);
      range.value = String(vv);
      try {
        if (onValue) onValue(vv);
      } catch {}
    };
    const thumbX = (rect) => {
      const v = readVal();
      const frac = max > min ? (v - min) / (max - min) : 0;
      const inset = thumbPx / 2;
      const usable = Math.max(1, rect.width - inset * 2);
      return rect.left + inset + frac * usable;
    };

    const onDown = (e) => {
      try {
        if (shouldBlock()) return;
        try {
          e.preventDefault();
        } catch {}
        const rect = range.getBoundingClientRect();
        const tx = thumbX(rect);
        const dx = Math.abs(Number(e.clientX || 0) - tx);
        if (dx > thumbPx * 0.95) return;

        const inset = thumbPx / 2;
        const move = (clientX) => {
          try {
            if (shouldBlock()) return;
            const r = range.getBoundingClientRect();
            const usable = Math.max(1, r.width - inset * 2);
            const x = Math.max(r.left + inset, Math.min(r.right - inset, Number(clientX || 0)));
            const frac = usable > 0 ? (x - (r.left + inset)) / usable : 0;
            const v = min + frac * (max - min);
            writeVal(v);
          } catch {}
        };

        if (typeof PointerEvent !== "undefined" && e.pointerId != null) {
          try {
            range.setPointerCapture(e.pointerId);
          } catch {}
          const onMove = (ev) => move(ev.clientX);
          const onUp = () => {
            try {
              window.removeEventListener("pointermove", onMove);
            } catch {}
            try {
              window.removeEventListener("pointerup", onUp);
            } catch {}
          };
          try {
            window.addEventListener("pointermove", onMove, { passive: true });
          } catch {}
          try {
            window.addEventListener("pointerup", onUp, { passive: true });
          } catch {}
          return;
        }

        const onMove = (ev) => move(ev.clientX);
        const onUp = () => {
          try {
            window.removeEventListener("mousemove", onMove);
          } catch {}
          try {
            window.removeEventListener("mouseup", onUp);
          } catch {}
        };
        try {
          window.addEventListener("mousemove", onMove, { passive: true });
        } catch {}
        try {
          window.addEventListener("mouseup", onUp, { passive: true });
        } catch {}
      } catch {}
    };

    try {
      range.style.touchAction = "none";
    } catch {}
    try {
      if (typeof PointerEvent !== "undefined") range.addEventListener("pointerdown", onDown);
      else range.addEventListener("mousedown", onDown);
    } catch {}
    range.addEventListener("click", (e) => {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    });
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

  const titleWrap = document.createElement("div");
  titleWrap.style.display = "flex";
  titleWrap.style.flexDirection = "column";
  titleWrap.style.gap = "6px";
  titleWrap.style.minWidth = "0";

  const title = document.createElement("div");
  title.style.color = "rgba(255,255,255,.95)";
  title.style.fontSize = "14px";
  title.style.fontWeight = "950";
  title.textContent = isArabic() ? "منصة التحويل" : "Conversion Platform";

  const convertIsVideoKind = String(state.convertKind || "image") === "video";
  const hintWrap = document.createElement("div");
  hintWrap.style.display = "flex";
  hintWrap.style.flexDirection = "column";
  hintWrap.style.gap = "2px";


  const hint1 = document.createElement("div");
  hint1.style.color = "rgba(255,255,255,.65)";
  hint1.style.fontSize = "12px";
  hint1.style.fontWeight = "900";
  hint1.style.lineHeight = "1.6";

  const hint2 = document.createElement("div");
  hint2.style.color = "rgba(255,255,255,.50)";
  hint2.style.fontSize = "12px";
  hint2.style.fontWeight = "900";
  hint2.style.lineHeight = "1.6";

  if (planBlocked) {
    hint1.textContent = isArabic() ? "الميزة متاحة في Pro و Business فقط" : "Available in Pro and Business only";
    hint2.textContent = "";
  } else if (convertIsVideoKind) {
    hint1.textContent = isArabic()
      ? "صيغ الإدخال المدعومة: MP4 / WebM / MOV / AVI / M4V / MKV / 3GP"
      : "Supported input formats: MP4 / WebM / MOV / AVI / M4V / MKV / 3GP";
    hint2.textContent = "";
  } else {
    hint1.textContent = isArabic()
      ? "ارفع صور، اختر الصيغة والمقاس والجودة ثم حمّل النتيجة فورًا"
      : "Upload images, choose format/size/quality, then download instantly";
    hint2.textContent = "";
  }

  titleWrap.appendChild(title);
  hintWrap.appendChild(hint1);
  if (hint2.textContent) hintWrap.appendChild(hint2);
  titleWrap.appendChild(hintWrap);

  const kindRow = document.createElement("div");
  kindRow.style.display = "flex";
  kindRow.style.gap = "10px";
  kindRow.style.flexWrap = "wrap";
  kindRow.style.alignItems = "center";
  kindRow.style.marginTop = "2px";

  const kindBtn = (label, active) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(label || "");
    b.style.display = "inline-flex";
    b.style.alignItems = "center";
    b.style.justifyContent = "center";
    b.style.gap = "8px";
    b.style.padding = "10px 14px";
    b.style.borderRadius = "14px";
    b.style.fontSize = "13px";
    b.style.fontWeight = "950";
    b.style.lineHeight = "1";
    b.style.userSelect = "none";
    b.style.webkitUserSelect = "none";
    b.style.cursor = "pointer";
    b.style.border = active ? "1px solid rgba(24,181,213,.55)" : "1px solid rgba(255,255,255,.12)";
    b.style.background = active ? "#18b5d5" : "#373737";
    b.style.color = active ? "#303030" : "rgba(255,255,255,.92)";
    return b;
  };

  const imgKindBtn = kindBtn(isArabic() ? "صور" : "Images", !convertIsVideoKind);
  const vidKindBtn = kindBtn(isArabic() ? "فيديو" : "Videos", convertIsVideoKind);
  imgKindBtn.disabled = Boolean(state.converting) || planBlocked || !onSetKind;
  vidKindBtn.disabled = Boolean(state.converting) || planBlocked || !onSetKind;
  imgKindBtn.style.opacity = imgKindBtn.disabled ? "0.55" : "1";
  vidKindBtn.style.opacity = vidKindBtn.disabled ? "0.55" : "1";
  imgKindBtn.style.cursor = imgKindBtn.disabled ? "not-allowed" : "pointer";
  vidKindBtn.style.cursor = vidKindBtn.disabled ? "not-allowed" : "pointer";

  imgKindBtn.onclick = () => {
    try {
      if (imgKindBtn.disabled) return;
      onSetKind("image");
    } catch {}
  };
  vidKindBtn.onclick = () => {
    try {
      if (vidKindBtn.disabled) return;
      onSetKind("video");
    } catch {}
  };
  kindRow.appendChild(imgKindBtn);
  kindRow.appendChild(vidKindBtn);
  titleWrap.appendChild(kindRow);

  const pickBtn = btnGhost(isArabic() ? "اختيار ملفات" : "Pick files");
  pickBtn.disabled = Boolean(state.converting) || planBlocked || !convertInput;
  pickBtn.onclick = () => {
    try {
      if (pickBtn.disabled) return;
      const isVid = String(state.convertKind || "image") === "video";
      try {
        convertInput.accept = isVid ? "video/*,.mp4,.webm,.mov,.avi,.m4v,.mkv,.3gp,.3gpp,.3g2" : "image/*";
      } catch {}
      convertInput.click();
    } catch {}
  };

  head.appendChild(titleWrap);
  head.appendChild(pickBtn);
  card.appendChild(head);

  const stepWrap = document.createElement("div");
  stepWrap.style.display = "flex";
  stepWrap.style.flexDirection = "column";
  stepWrap.style.gap = "10px";

  const mkStep = (n, t, sub) => {
    const w = document.createElement("div");
    w.style.border = "1px solid rgba(255,255,255,.08)";
    w.style.borderRadius = "14px";
    w.style.background = "#373737";
    w.style.padding = "12px";
    w.style.display = "flex";
    w.style.flexDirection = "column";
    w.style.gap = "10px";

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "4px";
    left.style.minWidth = "0";

    const tt = document.createElement("div");
    tt.style.color = "rgba(255,255,255,.95)";
    tt.style.fontSize = "12px";
    tt.style.fontWeight = "950";
    tt.textContent = String(n) + ". " + String(t || "");

    const ss = document.createElement("div");
    ss.style.color = "rgba(255,255,255,.55)";
    ss.style.fontSize = "12px";
    ss.style.fontWeight = "900";
    ss.style.lineHeight = "1.6";
    ss.textContent = String(sub || "");

    left.appendChild(tt);
    if (ss.textContent) left.appendChild(ss);
    w.appendChild(left);
    return w;
  };

  const mkSelect = (labelText, value, options, disabled, onChange) => {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "8px";

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
    s.style.background = "#373737";
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
      const o = list[i] || {};
      const opt = document.createElement("option");
      opt.value = String(o.value == null ? "" : o.value);
      opt.textContent = String(o.label == null ? "" : o.label);
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

  const convertIsVideo = String(state.convertKind || "image") === "video";

  const s1 = mkStep(
    1,
    isArabic() ? "اختيار الملفات" : "Select files",
    (Array.isArray(state.convertFiles) && state.convertFiles.length) ? "" : (isArabic() ? "اختَر ملفات لبدء التحويل" : "Pick files to start")
  );

  const fileMeta = document.createElement("div");
  fileMeta.style.display = "flex";
  fileMeta.style.flexDirection = "column";
  fileMeta.style.gap = "4px";
  fileMeta.style.minWidth = "0";

  const fileName = document.createElement("div");
  fileName.style.color = "rgba(255,255,255,.95)";
  fileName.style.fontSize = "13px";
  fileName.style.fontWeight = "950";
  fileName.style.overflow = "hidden";
  fileName.style.textOverflow = "ellipsis";
  fileName.style.whiteSpace = "nowrap";
  const selectedFiles = Array.isArray(state.convertFiles) ? state.convertFiles : [];
  const selectedCount = selectedFiles.length;
  const firstName = selectedCount ? String((selectedFiles[0] && selectedFiles[0].name) || "") : "";
  fileName.textContent = selectedCount
    ? (firstName || (isArabic() ? "ملف" : "File")) + (selectedCount > 1 ? " (+" + String(selectedCount - 1) + ")" : "")
    : (isArabic() ? "لم يتم اختيار ملفات" : "No files selected");

  const fileSize = document.createElement("div");
  fileSize.style.color = "rgba(255,255,255,.55)";
  fileSize.style.fontSize = "12px";
  fileSize.style.fontWeight = "900";
  const totalBytes = (() => {
    try {
      let sum = 0;
      for (let i = 0; i < selectedFiles.length; i += 1) sum += Number((selectedFiles[i] && selectedFiles[i].size) || 0) || 0;
      return sum;
    } catch {
      return 0;
    }
  })();
  fileSize.textContent =
    selectedCount
      ? (fmtBytes(totalBytes) + (maxFiles ? (isArabic() ? " · الحد " : " · max ") + String(maxFiles) : ""))
      : "";

  fileMeta.appendChild(fileName);
  fileMeta.appendChild(fileSize);
  s1.appendChild(fileMeta);

  // الدروب زون بتصميم مطابق للصورة
  const dzWrap = document.createElement("div");
  dzWrap.style.border = "1px dashed rgba(255,255,255,.12)";
  dzWrap.style.borderRadius = "12px";
  dzWrap.style.background = "#373737";
  dzWrap.style.padding = "32px 20px";
  dzWrap.style.display = "flex";
  dzWrap.style.flexDirection = "column";
  dzWrap.style.alignItems = "center";
  dzWrap.style.justifyContent = "center";
  dzWrap.style.gap = "10px";
  dzWrap.style.cursor = Boolean(state.converting) || planBlocked || !convertInput ? "not-allowed" : "pointer";
  dzWrap.style.opacity = Boolean(state.converting) || planBlocked ? "0.5" : "1";

  const dzIcon = document.createElement("div");
  dzIcon.style.color = "rgba(255,255,255,.40)";
  dzIcon.style.fontSize = "32px";
  dzIcon.style.lineHeight = "1";
  dzIcon.textContent = "📁";

  const dzText = document.createElement("div");
  dzText.style.color = "rgba(255,255,255,.70)";
  dzText.style.fontSize = "13px";
  dzText.style.fontWeight = "900";
  dzText.style.textAlign = "center";
  dzText.textContent = isArabic() ? "اسحب الملفات هنا أو اضغط للاختيار" : "Drag files here or click to select";

  const dzHint = document.createElement("div");
  dzHint.style.color = "rgba(255,255,255,.45)";
  dzHint.style.fontSize = "11px";
  dzHint.style.fontWeight = "900";
  dzHint.style.textAlign = "center";
  dzHint.textContent = isArabic() ? "الصيغ المدعومة حسب نوع الملف" : "Supported formats vary by file type";

  dzWrap.appendChild(dzIcon);
  dzWrap.appendChild(dzText);
  dzWrap.appendChild(dzHint);

  dzWrap.onclick = () => {
    try {
      if (Boolean(state.converting) || planBlocked || !convertInput) return;
      const isVid = String(state.convertKind || "image") === "video";
      try {
        convertInput.accept = isVid ? "video/*,.mp4,.webm,.mov,.avi,.m4v,.mkv,.3gp,.3gpp,.3g2" : "image/*";
      } catch {}
      convertInput.click();
    } catch {}
  };

  dzWrap.ondragover = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      if (!Boolean(state.converting) && !planBlocked) {
        dzWrap.style.borderColor = "rgba(24,181,213,.5)";
        dzWrap.style.background = "#373737";
      }
    } catch {}
  };

  dzWrap.ondragleave = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      dzWrap.style.borderColor = "rgba(255,255,255,.12)";
      dzWrap.style.background = "#373737";
    } catch {}
  };

  dzWrap.ondrop = (e) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      dzWrap.style.borderColor = "rgba(255,255,255,.12)";
      dzWrap.style.background = "#373737";
      if (Boolean(state.converting) || planBlocked) return;
      const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
      if (files.length > 0 && onSetConvertFiles) onSetConvertFiles(files);
    } catch {}
  };

  s1.appendChild(dzWrap);

  const buildQualityStep = (n) => {
    const s = mkStep(n, isArabic() ? "تحديد الجودة" : "Adjust quality", isArabic() ? "توازن بين الحجم والجودة" : "Balance quality vs size");

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
    const qDefault = convertIsVideo ? 78 : state.convertFormat === "avif" ? 55 : state.convertFormat === "png" ? 90 : 82;
    const qNum = state.convertQuality ? Number(state.convertQuality) : qDefault;
    const clampQ = (x) => Math.max(1, Math.min(100, Math.round(Number(x) || qDefault)));
    qVal.textContent = String(clampQ(qNum));

    qHead.appendChild(qLabel);
    qHead.appendChild(qVal);

    const range = document.createElement("input");
    range.type = "range";
    range.min = "40";
    range.max = "95";
    range.step = "1";
    range.value = String(qVal.textContent || qDefault);
    range.disabled = Boolean(state.converting) || planBlocked;
    range.oninput = () => {
      try {
        state.convertQuality = String(range.value || "");
        qVal.textContent = String(clampQ(range.value));
      } catch {}
    };
    range.onchange = () => {
      try {
        state.convertQuality = String(range.value || "");
        qVal.textContent = String(clampQ(range.value));
        if (onRender) onRender();
      } catch {}
    };
    try {
      range.style.width = "100%";
    } catch {}

    qWrap.appendChild(qHead);
    qWrap.appendChild(range);
    s.appendChild(qWrap);
    try {
      wireDragOnlyRange(range, {
        min: 40,
        max: 95,
        step: 1,
        shouldBlock: () => Boolean(state.converting) || planBlocked,
        thumbPx: 22,
        onValue: (v) => {
          try {
            state.convertQuality = String(v);
            qVal.textContent = String(clampQ(v));
          } catch {}
        }
      });
    } catch {}
    return s;
  };

  const buildConvertStep = (n) => {
    const s = mkStep(n, isArabic() ? "التحويل والتحميل" : "Convert & download", isArabic() ? "ابدأ التحويل ثم حمّل النتائج" : "Run conversion, then download results");

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";

    const convertBtn = btnPrimary(isArabic() ? "تحويل الآن" : "Convert now");
    const hasFiles = Array.isArray(state.convertFiles) && state.convertFiles.length;
    convertBtn.disabled = Boolean(state.converting) || planBlocked || !hasFiles || !onRunConvert;
    convertBtn.onclick = () => {
      try {
        if (convertBtn.disabled) return;
        onRunConvert();
      } catch {}
    };

    const resetBtn = btnGhost(isArabic() ? "تفريغ" : "Reset");
    resetBtn.disabled = Boolean(state.converting) || planBlocked || !onReset;
    resetBtn.onclick = () => {
      try {
        if (resetBtn.disabled) return;
        onReset();
      } catch {}
    };

    actions.appendChild(convertBtn);
    actions.appendChild(resetBtn);
    s.appendChild(actions);

    if (state.converting || Number(state.convertOverallProgress || 0) > 0) {
      const prog = document.createElement("div");
      prog.style.border = "1px solid rgba(255,255,255,.08)";
      prog.style.borderRadius = "14px";
      prog.style.background = "#373737";
      prog.style.overflow = "hidden";
      const bar = document.createElement("div");
      bar.style.height = "10px";
      bar.style.width = Math.max(0, Math.min(100, Number(state.convertOverallProgress || 0) || 0)) + "%";
      bar.style.background = "#18b5d5";
      prog.appendChild(bar);
      s.appendChild(prog);
    }

    if (state.convertError) {
      s.appendChild(renderError(state.convertError));
    }

    const items = Array.isArray(state.convertItems) ? state.convertItems : [];
    if (items.length) {
      const list = document.createElement("div");
      list.style.display = "flex";
      list.style.flexDirection = "column";
      list.style.gap = "10px";

      const mkRow = (it) => {
        const wrap = document.createElement("div");
        wrap.style.border = "1px solid rgba(255,255,255,.08)";
        wrap.style.borderRadius = "14px";
        wrap.style.background = "#303030";
        wrap.style.padding = "12px";
        wrap.style.display = "flex";
        wrap.style.flexDirection = "column";
        wrap.style.gap = "10px";

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

        const name = document.createElement("div");
        name.style.color = "#fff";
        name.style.fontSize = "12px";
        name.style.fontWeight = "950";
        name.style.overflow = "hidden";
        name.style.textOverflow = "ellipsis";
        name.style.whiteSpace = "nowrap";
        name.textContent = String((it && it.name) || "");

        const sub = document.createElement("div");
        sub.style.color = (it && (it.error || it.uploadError)) ? "#ef4444" : "rgba(255,255,255,.62)";
        sub.style.fontSize = "12px";
        sub.style.fontWeight = "900";

        const status = String((it && it.status) || "");
        const pct = Math.max(0, Math.min(100, Math.round(Number((it && it.progress) || 0) || 0)));
        const outFmt = String((it && it.outFormat) || "").trim().toUpperCase();
        const outBytes = Number((it && it.outBytes) || 0) || 0;
        const msg =
          status === "running"
            ? (isArabic() ? "جاري التحويل " : "Converting ") + String(pct) + "%"
            : status === "queued"
              ? (isArabic() ? "في الانتظار" : "Queued")
              : status === "done"
                ? (outFmt ? outFmt + " · " : "") + fmtBytes(outBytes)
                : status === "error"
                  ? String((it && it.error) || (isArabic() ? "فشل التحويل" : "Conversion failed"))
                  : "";

        sub.textContent = msg;
        left.appendChild(name);
        if (sub.textContent) left.appendChild(sub);

        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.alignItems = "center";
        right.style.gap = "10px";
        right.style.flexWrap = "wrap";
        right.style.flex = "0 0 auto";

        const resUrl = String((it && it.resultUrl) || "");
        if (resUrl && status === "done") {
          const dl = btnPrimary(isArabic() ? "تحميل" : "Download");
          dl.onclick = () => {
            try {
              const a = document.createElement("a");
              const raw = String((it && it.name) || "converted");
              let baseName = raw;
              const dot = baseName.lastIndexOf(".");
              if (dot > 0) baseName = baseName.slice(0, dot);
              baseName = baseName.slice(0, 120) || "converted";
              const rf = String((it && it.outFormat) || "").trim().toLowerCase();
              const fmt = String(state.convertFormat || "").trim().toLowerCase();
              const ext =
                (rf ? rf : "") ||
                (fmt === "mp4"
                  ? "mp4"
                  : fmt === "mov"
                    ? "mov"
                    : fmt === "webm" || fmt === "webm_local"
                      ? "webm"
                      : fmt === "avif"
                        ? "avif"
                        : fmt === "webp"
                          ? "webp"
                          : fmt === "jpeg"
                            ? "jpeg"
                            : fmt === "png"
                              ? "png"
                              : "webp");
              a.href = resUrl;
              a.download = baseName + "." + ext;
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch {}
          };
          right.appendChild(dl);

          const uploadedUrl = String((it && it.uploadUrl) || "");
          const upLabel = (it && it.uploading)
            ? (isArabic() ? "جاري الرفع…" : "Uploading…")
            : uploadedUrl
              ? (isArabic() ? "تم الرفع" : "Uploaded")
              : (isArabic() ? "رفع على المنصة" : "Upload to platform");

          const up = btnGhost(upLabel);
          up.disabled = Boolean(it && it.uploading) || Boolean(uploadedUrl) || !onUploadItem;
          up.style.opacity = up.disabled ? "0.7" : "1";
          up.style.cursor = up.disabled ? "not-allowed" : "pointer";
          up.onclick = () => {
            try {
              if (up.disabled) return;
              onUploadItem(String((it && it.id) || ""));
            } catch {}
          };
          right.appendChild(up);

          if (uploadedUrl) {
            const openFilesBtn = btnGhost(isArabic() ? "فتح في ملفاتي" : "Open in My files");
            openFilesBtn.disabled = !onOpenFiles;
            openFilesBtn.style.opacity = openFilesBtn.disabled ? "0.7" : "1";
            openFilesBtn.style.cursor = openFilesBtn.disabled ? "not-allowed" : "pointer";
            openFilesBtn.onclick = () => {
              try {
                if (openFilesBtn.disabled) return;
                onOpenFiles();
              } catch {}
            };
            right.appendChild(openFilesBtn);

            const openLinkBtn = btnPrimary(isArabic() ? "فتح الرابط" : "Open link");
            openLinkBtn.style.padding = "10px 12px";
            openLinkBtn.onclick = () => {
              try {
                const u = String(uploadedUrl || "").trim();
                if (!u) return;
                window.open(u, "_blank", "noopener,noreferrer");
              } catch {}
            };
            right.appendChild(openLinkBtn);
          }
        }

        top.appendChild(left);
        if (right.childNodes && right.childNodes.length) top.appendChild(right);
        wrap.appendChild(top);

        const upErr = String((it && it.uploadError) || "");
        if (upErr) wrap.appendChild(renderError(upErr));

        return wrap;
      };

      for (let i = 0; i < items.length; i += 1) {
        const row = mkRow(items[i] || {});
        if (row) list.appendChild(row);
      }
      s.appendChild(list);
    }
    return s;
  };

  stepWrap.appendChild(s1);
  if (convertIsVideo) {
    const s2 = mkStep(
      2,
      isArabic() ? "إعدادات الفيديو" : "Video settings",
      ""
    );
    const fmtSelect = mkSelect(
      isArabic() ? "صيغة الناتج" : "Output format",
      String(state.convertFormat || "mp4"),
      [
        { value: "mp4", label: isArabic() ? "MP4 (H.264) " : "MP4 (H.264) " },
        { value: "webm", label: isArabic() ? "WebM (VP9)" : "WebM (VP9)" },
        { value: "webm_local", label: isArabic() ? "WebM " : "WebM " },
        { value: "mov", label: isArabic() ? "MOV" : "MOV " },
      ],
      Boolean(state.converting) || planBlocked,
      (v) => {
        try {
          state.convertFormat = String(v || "mp4");
          if (onRender) onRender();
        } catch {}
      }
    );
    s2.appendChild(fmtSelect);
    stepWrap.appendChild(s2);
    stepWrap.appendChild(buildQualityStep(3));
    stepWrap.appendChild(buildConvertStep(4));
  } else {
    const s2 = mkStep(
      2,
      isArabic() ? "اختيار الصيغة" : "Choose output format",
      isArabic() ? "قائمة مرتبة للاستخدامات الشائعة" : "A clean list for common use-cases"
    );

    let fmtValue = String(state.convertFormat || "webp");
    if (fmtValue === "auto") fmtValue = "webp";
    const fmtSelect = mkSelect(
      isArabic() ? "الصيغة" : "Format",
      fmtValue,
      [
        { value: "avif", label: "AVIF" },
        { value: "webp", label: "WebP" },
        { value: "jpeg", label: "JPEG" },
        { value: "png", label: "PNG" }
      ],
      Boolean(state.converting) || planBlocked,
      (v) => {
        try {
          state.convertFormat = String(v || "webp");
          if (onRender) onRender();
        } catch {}
      }
    );
    s2.appendChild(fmtSelect);

    const s3 = mkStep(3, isArabic() ? "المقاس" : "Resize", isArabic() ? "اختر مقاس جاهز" : "Pick a preset size");

    const presetOptions = [
      { value: "original", label: isArabic() ? "الأصل (بدون تغيير)" : "Original (no resize)" },
      { value: "square", label: isArabic() ? "مربع — 1080×1080" : "Square — 1080×1080" },
      { value: "story", label: isArabic() ? "ستوري — 1080×1920" : "Story — 1080×1920" },
      { value: "banner", label: isArabic() ? "بانر — 1920×1080" : "Banner — 1920×1080" },
      { value: "thumb", label: isArabic() ? "مصغرة — 512×512" : "Thumb — 512×512" }
    ];

    const presetSelectValue = String(state.convertPreset || "original") || "original";

    const presetSelect = mkSelect(
      isArabic() ? "مقاس جاهز" : "Preset size",
      presetSelectValue,
      presetOptions,
      Boolean(state.converting) || planBlocked,
      (v) => {
        try {
          const next = String(v || "original") || "original";
          state.convertPreset = next;
          state.convertError = "";
          if (onRender) onRender();
        } catch {}
      }
    );
    s3.appendChild(presetSelect);

    stepWrap.appendChild(s2);
    stepWrap.appendChild(s3);
    stepWrap.appendChild(buildQualityStep(4));
    stepWrap.appendChild(buildConvertStep(5));
  }

  card.appendChild(stepWrap);
  return card;
};
`
];
