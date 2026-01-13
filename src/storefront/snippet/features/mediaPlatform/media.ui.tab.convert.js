module.exports = [
  `
const renderConversionPlatform = (opts) => {
  const o = opts && typeof opts === "object" ? opts : {};
  const state = o.state && typeof o.state === "object" ? o.state : {};
  const planBlocked = Boolean(o.planBlocked);
  const convertInput = o.convertInput || null;
  const onRender = typeof o.onRender === "function" ? o.onRender : null;
  const onRunConvert = typeof o.onRunConvert === "function" ? o.onRunConvert : null;
  const onSetConvertFile = typeof o.onSetConvertFile === "function" ? o.onSetConvertFile : null;
  const onSetKind = typeof o.onSetKind === "function" ? o.onSetKind : null;
  const onReset = typeof o.onReset === "function" ? o.onReset : null;

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
      ? "ارفع صورة، اختر الصيغة والجودة والسرعة ثم حمّل النتيجة فورًا"
      : "Upload an image, choose format/quality/speed, then download instantly";
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

  const pickBtn = btnGhost(isArabic() ? "اختيار ملف" : "Pick file");
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
    isArabic() ? "اختيار الملف" : "Select file",
    state.convertFile ? "" : (isArabic() ? "اختَر ملفًا واحدًا لبدء التحويل" : "Pick a single file to start")
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
  fileName.textContent = state.convertFile ? String(state.convertFile.name || "") : (isArabic() ? "لم يتم اختيار ملف" : "No file selected");

  const fileSize = document.createElement("div");
  fileSize.style.color = "rgba(255,255,255,.55)";
  fileSize.style.fontSize = "12px";
  fileSize.style.fontWeight = "900";
  fileSize.textContent = state.convertFile ? fmtBytes(Number(state.convertFile.size || 0) || 0) : "";

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
  dzText.textContent = isArabic() ? "اسحب الملف هنا أو اضغط للاختيار" : "Drag file here or click to select";

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
      const files = e.dataTransfer?.files;
      if (files && files.length > 0 && onSetConvertFile) {
        onSetConvertFile(files[0]);
      }
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
    qVal.textContent = String(Math.max(1, Math.min(100, Math.round(Number(qNum) || qDefault))));

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
        if (onRender) onRender();
      } catch {}
    };
    try {
      range.style.width = "100%";
    } catch {}

    qWrap.appendChild(qHead);
    qWrap.appendChild(range);
    s.appendChild(qWrap);
    return s;
  };

  const buildSpeedStep = (n) => {
    const s = mkStep(n, isArabic() ? "اختيار السرعة" : "Choose speed", isArabic() ? "الأسرع أو أصغر حجم" : "Fastest or smallest output");

    const speedRow = document.createElement("div");
    speedRow.style.display = "flex";
    speedRow.style.gap = "8px";
    speedRow.style.flexWrap = "wrap";
    speedRow.style.alignItems = "center";

    const spFast = pill(isArabic() ? "سريع" : "Fast", state.convertSpeed === "fast");
    const spBal = pill(isArabic() ? "متوازن" : "Balanced", state.convertSpeed === "balanced");
    const spSmall = pill(isArabic() ? "أصغر حجم" : "Smallest", state.convertSpeed === "small");
    spFast.disabled = Boolean(state.converting) || planBlocked;
    spBal.disabled = Boolean(state.converting) || planBlocked;
    spSmall.disabled = Boolean(state.converting) || planBlocked;
    spFast.onclick = () => {
      try {
        if (spFast.disabled) return;
        state.convertSpeed = "fast";
        if (onRender) onRender();
      } catch {}
    };
    spBal.onclick = () => {
      try {
        if (spBal.disabled) return;
        state.convertSpeed = "balanced";
        if (onRender) onRender();
      } catch {}
    };
    spSmall.onclick = () => {
      try {
        if (spSmall.disabled) return;
        state.convertSpeed = "small";
        if (onRender) onRender();
      } catch {}
    };
    speedRow.appendChild(spFast);
    speedRow.appendChild(spBal);
    speedRow.appendChild(spSmall);
    s.appendChild(speedRow);
    return s;
  };

  const buildConvertStep = (n) => {
    const s = mkStep(n, isArabic() ? "التحويل والتحميل" : "Convert & download", isArabic() ? "ابدأ التحويل ثم حمّل النتيجة" : "Run conversion, then download result");

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";

    const convertBtn = btnPrimary(isArabic() ? "تحويل الآن" : "Convert now");
    convertBtn.disabled = Boolean(state.converting) || planBlocked || !state.convertFile || !onRunConvert;
    convertBtn.onclick = () => {
      try {
        if (convertBtn.disabled) return;
        onRunConvert(state.convertFile);
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

    if (state.converting) {
      const prog = document.createElement("div");
      prog.style.border = "1px solid rgba(255,255,255,.08)";
      prog.style.borderRadius = "14px";
      prog.style.background = "#373737";
      prog.style.overflow = "hidden";
      const bar = document.createElement("div");
      bar.style.height = "10px";
      bar.style.width = Math.max(0, Math.min(100, Number(state.convertProgress || 0) || 0)) + "%";
      bar.style.background = "#18b5d5";
      prog.appendChild(bar);
      s.appendChild(prog);
    }

    if (state.convertError) {
      s.appendChild(renderError(state.convertError));
    }

    if (state.convertResultUrl) {
      const outWrap = document.createElement("div");
      outWrap.style.display = "flex";
      outWrap.style.flexDirection = "column";
      outWrap.style.gap = "10px";

      const outMeta = document.createElement("div");
      outMeta.style.display = "flex";
      outMeta.style.alignItems = "center";
      outMeta.style.justifyContent = "space-between";
      outMeta.style.gap = "10px";
      outMeta.style.flexWrap = "wrap";

      const outLeft = document.createElement("div");
      outLeft.style.display = "flex";
      outLeft.style.flexDirection = "column";
      outLeft.style.gap = "4px";

      const outTitle = document.createElement("div");
      outTitle.style.color = "rgba(255,255,255,.95)";
      outTitle.style.fontSize = "13px";
      outTitle.style.fontWeight = "950";
      outTitle.textContent = isArabic() ? "النتيجة جاهزة" : "Result is ready";

      const outHint = document.createElement("div");
      outHint.style.color = "rgba(255,255,255,.60)";
      outHint.style.fontSize = "12px";
      outHint.style.fontWeight = "900";
      const fmt = String(state.convertResultFormat || state.convertFormat || "").toUpperCase();
      outHint.textContent = (fmt ? fmt + " · " : "") + fmtBytes(state.convertResultBytes || 0);

      outLeft.appendChild(outTitle);
      outLeft.appendChild(outHint);

      const dl = btnPrimary(isArabic() ? "تحميل" : "Download");
      dl.onclick = () => {
        try {
          const a = document.createElement("a");
          const raw = state.convertFile ? String(state.convertFile.name || "") : "converted";
          let baseName = raw;
          const dot = baseName.lastIndexOf(".");
          if (dot > 0) baseName = baseName.slice(0, dot);
          baseName = baseName.slice(0, 120) || "converted";
          const rf = String(state.convertResultFormat || "").trim().toLowerCase();
          const ext =
            (rf ? rf : "") ||
            (state.convertFormat === "mp4"
              ? "mp4"
              : state.convertFormat === "mov"
                ? "mov"
              : state.convertFormat === "webm"
                ? "webm"
                : state.convertFormat === "webm_local"
                  ? "webm"
                  : state.convertFormat === "avif"
                    ? "avif"
                    : state.convertFormat === "webp"
                      ? "webp"
                      : state.convertFormat === "jpeg"
                      ? "jpeg"
                      : state.convertFormat === "png"
                        ? "png"
                        : "webp");
          a.href = state.convertResultUrl;
          a.download = baseName + "." + ext;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } catch {}
      };

      outMeta.appendChild(outLeft);
      outMeta.appendChild(dl);

      const outFmt = String(state.convertResultFormat || state.convertFormat || "").trim().toLowerCase();
      const isVideoOut = outFmt === "mp4" || outFmt === "webm" || outFmt === "webm_local" || outFmt === "mov";

      let preview = null;
      if (isVideoOut) {
        const v = document.createElement("video");
        v.controls = true;
        v.playsInline = true;
        v.preload = "metadata";
        v.src = state.convertResultUrl;
        v.style.width = "100%";
        v.style.maxHeight = "260px";
        v.style.objectFit = "contain";
        v.style.borderRadius = "14px";
        v.style.border = "1px solid rgba(255,255,255,.08)";
        v.style.background = "#373737";
        preview = v;
      } else {
        const img = document.createElement("img");
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.src = state.convertResultUrl;
        img.style.width = "100%";
        img.style.maxHeight = "260px";
        img.style.objectFit = "contain";
        img.style.borderRadius = "14px";
        img.style.border = "1px solid rgba(255,255,255,.08)";
        img.style.background = "#373737";
        preview = img;
      }

      outWrap.appendChild(outMeta);
      if (preview) outWrap.appendChild(preview);
      s.appendChild(outWrap);
    }
    return s;
  };

  stepWrap.appendChild(s1);
  if (convertIsVideo) {
    const s2 = mkStep(
      2,
      isArabic() ? "إعدادات الفيديو" : "Video settings",
      isArabic() ? "اختَر الصيغة المناسبة: MP4 للمتاجر، WebM لحجم أقل، MOV للـ QuickTime" : "Pick the right format: MP4 for stores, WebM smaller, MOV for QuickTime"
    );
    const fmtSelect = mkSelect(
      isArabic() ? "صيغة الناتج" : "Output format",
      String(state.convertFormat || "mp4"),
      [
        { value: "mp4", label: isArabic() ? "MP4 (H.264) — مناسب للمتاجر" : "MP4 (H.264) — store-friendly" },
        { value: "webm", label: isArabic() ? "WebM (VP9/VP8) — حجم أقل غالبًا" : "WebM (VP9/VP8) — usually smaller" },
        { value: "webm_local", label: isArabic() ? "WebM (سريع) — أولوية للسرعة" : "WebM (fast) — prioritize speed" },
        { value: "mov", label: isArabic() ? "MOV — للـ QuickTime (حسب دعم المتصفح)" : "MOV — for QuickTime (browser dependent)" },
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
    stepWrap.appendChild(buildSpeedStep(4));
    stepWrap.appendChild(buildConvertStep(5));
  } else {
    const s2 = mkStep(
      2,
      isArabic() ? "اختيار الصيغة" : "Choose output format",
      isArabic() ? "قائمة مرتبة للاستخدامات الشائعة" : "A clean list for common use-cases"
    );
    const fmtSelect = mkSelect(
      isArabic() ? "الصيغة" : "Format",
      state.convertFormat,
      [
        { value: "auto", label: isArabic() ? "تلقائي (Auto)" : "Auto" },
        { value: "avif", label: "AVIF" },
        { value: "webp", label: "WebP" },
        { value: "jpeg", label: "JPEG" },
        { value: "png", label: "PNG" }
      ],
      Boolean(state.converting) || planBlocked,
      (v) => {
        try {
          state.convertFormat = v;
          if (onRender) onRender();
        } catch {}
      }
    );
    s2.appendChild(fmtSelect);

    const s3 = mkStep(3, isArabic() ? "المقاس والقص" : "Resize & crop", isArabic() ? "اختر مقاس جاهز أو اكتب مقاس مخصص" : "Pick a preset size or set a custom size");

    const presetOptions = [
      { value: "original", label: isArabic() ? "الأصل (بدون تغيير)" : "Original (no resize)" },
      { value: "", label: isArabic() ? "مخصص (اكتب المقاس)" : "Custom (type size)" },
      { value: "square", label: isArabic() ? "مربع — 1080×1080" : "Square — 1080×1080" },
      { value: "story", label: isArabic() ? "ستوري — 1080×1920" : "Story — 1080×1920" },
      { value: "banner", label: isArabic() ? "بانر — 1920×1080" : "Banner — 1920×1080" },
      { value: "thumb", label: isArabic() ? "مصغرة — 512×512" : "Thumb — 512×512" }
    ];

    const presetSelectValue =
      String(state.convertPreset || "") === ""
        ? state.convertWidth || state.convertHeight
          ? ""
          : "original"
        : String(state.convertPreset || "");

    const presetSelect = mkSelect(
      isArabic() ? "مقاس جاهز" : "Preset size",
      presetSelectValue,
      presetOptions,
      Boolean(state.converting) || planBlocked,
      (v) => {
        try {
          const next = String(v || "");
          state.convertPreset = next;
          state.convertError = "";
          if (next === "original") {
            state.convertWidth = "";
            state.convertHeight = "";
            state.convertMode = "fit";
            state.convertPosition = "center";
          } else if (next === "square") {
            state.convertWidth = "1080";
            state.convertHeight = "1080";
            state.convertMode = "cover";
            if (!state.convertPosition) state.convertPosition = "center";
          } else if (next === "story") {
            state.convertWidth = "1080";
            state.convertHeight = "1920";
            state.convertMode = "cover";
            if (!state.convertPosition) state.convertPosition = "center";
          } else if (next === "banner") {
            state.convertWidth = "1920";
            state.convertHeight = "1080";
            state.convertMode = "cover";
            if (!state.convertPosition) state.convertPosition = "center";
          } else if (next === "thumb") {
            state.convertWidth = "512";
            state.convertHeight = "512";
            state.convertMode = "cover";
            if (!state.convertPosition) state.convertPosition = "center";
          }
          if (onRender) onRender();
        } catch {}
      }
    );
    s3.appendChild(presetSelect);

    const custom = document.createElement("div");
    custom.style.display = "flex";
    custom.style.flexWrap = "wrap";
    custom.style.alignItems = "center";
    custom.style.gap = "10px";

    const mkNum = (ph, val, onVal) => {
      const i = document.createElement("input");
      i.type = "number";
      i.min = "1";
      i.max = "6000";
      i.inputMode = "numeric";
      i.placeholder = String(ph || "");
      i.value = String(val || "");
      i.disabled = Boolean(state.converting) || planBlocked;
      i.style.width = "min(140px,48%)";
      i.style.padding = "10px 12px";
      i.style.borderRadius = "12px";
      i.style.border = "1px solid rgba(255,255,255,.08)";
      i.style.background = "#373737";
      i.style.color = "rgba(255,255,255,.90)";
      i.style.fontSize = "12px";
      i.style.fontWeight = "900";
      i.oninput = () => {
        try {
          state.convertPreset = "";
          onVal(String(i.value || ""));
          if (onRender) onRender();
        } catch {}
      };
      return i;
    };

    const wIn = mkNum(isArabic() ? "العرض (px)" : "Width (px)", state.convertWidth, (v) => (state.convertWidth = v));
    const hIn = mkNum(isArabic() ? "الارتفاع (px)" : "Height (px)", state.convertHeight, (v) => (state.convertHeight = v));
    custom.appendChild(wIn);
    custom.appendChild(hIn);

    s3.appendChild(custom);

    const modeSelect = mkSelect(
      isArabic() ? "طريقة القص" : "Resize mode",
      String(state.convertMode || "fit") === "cover" ? "cover" : "fit",
      [
        { value: "fit", label: isArabic() ? "احتواء (بدون قص)" : "Fit (no crop)" },
        { value: "cover", label: isArabic() ? "قص (Cover)" : "Crop (cover)" }
      ],
      Boolean(state.converting) || planBlocked,
      (v) => {
        try {
          state.convertMode = String(v || "fit");
          if (!state.convertPosition) state.convertPosition = "center";
          if (onRender) onRender();
        } catch {}
      }
    );
    s3.appendChild(modeSelect);

    if (String(state.convertMode || "") === "cover") {
      const posSelect = mkSelect(
        isArabic() ? "موضع القص" : "Crop position",
        String(state.convertPosition || "center"),
        [
          { value: "center", label: isArabic() ? "منتصف" : "Center" },
          { value: "attention", label: isArabic() ? "تركيز" : "Attention" },
          { value: "entropy", label: isArabic() ? "ذكاء" : "Entropy" }
        ],
        Boolean(state.converting) || planBlocked,
        (v) => {
          try {
            state.convertPosition = String(v || "center");
            if (onRender) onRender();
          } catch {}
        }
      );
      s3.appendChild(posSelect);
    }

    stepWrap.appendChild(s2);
    stepWrap.appendChild(s3);
    stepWrap.appendChild(buildQualityStep(4));
    stepWrap.appendChild(buildSpeedStep(5));
    stepWrap.appendChild(buildConvertStep(6));
  }

  card.appendChild(stepWrap);
  return card;
};
`
];
