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
  card.style.border = "1px solid rgba(255,255,255,.12)";
  card.style.borderRadius = "16px";
  card.style.background = "#292929";
  card.style.boxShadow = "0 18px 50px rgba(0,0,0,.28)";
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
  title.style.color = "#fff";
  title.style.fontSize = "14px";
  title.style.fontWeight = "950";
  title.textContent = isArabic() ? "منصة التحويل" : "Conversion Platform";

  const hint = document.createElement("div");
  hint.style.color = "rgba(255,255,255,.70)";
  hint.style.fontSize = "12px";
  hint.style.fontWeight = "900";
  hint.style.lineHeight = "1.6";

  const convertIsVideoKind = String(state.convertKind || "image") === "video";
  const videoFmt = String(state.convertFormat || "").trim().toLowerCase();
  hint.textContent = planBlocked
    ? (isArabic() ? "الميزة متاحة في Pro و Business فقط" : "Available in Pro and Business only")
    : convertIsVideoKind
      ? (videoFmt === "webm_local"
          ? (isArabic()
              ? "ارفع فيديو (MP4 أو WebM) وسيتم تحويله محليًا إلى WebM على جهازك بدون رفع للسيرفر"
              : "Upload a video (MP4/WebM) and it will be converted locally to WebM without server upload")
          : (isArabic()
              ? "ارفع فيديو (MP4 أو WebM) واختر الصيغة: MP4 (H.264) للمتاجر أو WebM (VP9) لحجم أصغر"
              : "Upload a video (MP4/WebM) then choose MP4 (H.264) for stores or WebM (VP9) for smaller size"))
      : (isArabic() ? "ارفع صورة، اختر الصيغة والجودة والسرعة ثم حمّل النتيجة فورًا" : "Upload an image, choose format/quality/speed, then download instantly");

  titleWrap.appendChild(title);
  titleWrap.appendChild(hint);

  const kindRow = document.createElement("div");
  kindRow.style.display = "flex";
  kindRow.style.gap = "8px";
  kindRow.style.flexWrap = "wrap";
  kindRow.style.alignItems = "center";
  kindRow.style.padding = "6px";
  kindRow.style.borderRadius = "999px";
  kindRow.style.border = "1px solid rgba(255,255,255,.12)";
  kindRow.style.background = "rgba(2,6,23,.18)";

  const imgKindBtn = pill(isArabic() ? "صور" : "Images", !convertIsVideoKind);
  const vidKindBtn = pill(isArabic() ? "فيديو" : "Videos", convertIsVideoKind);
  imgKindBtn.disabled = Boolean(state.converting) || planBlocked || !onSetKind;
  vidKindBtn.disabled = Boolean(state.converting) || planBlocked || !onSetKind;

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
        convertInput.accept = isVid ? "video/mp4,video/webm" : "image/*";
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
    w.style.border = "1px solid rgba(255,255,255,.10)";
    w.style.borderRadius = "14px";
    w.style.background = "rgba(2,6,23,.18)";
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
    tt.style.color = "#fff";
    tt.style.fontSize = "12px";
    tt.style.fontWeight = "950";
    tt.textContent = String(n) + ". " + String(t || "");

    const ss = document.createElement("div");
    ss.style.color = "rgba(255,255,255,.66)";
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
    l.style.color = "rgba(255,255,255,.82)";
    l.style.fontSize = "12px";
    l.style.fontWeight = "950";
    l.textContent = String(labelText || "");

    const s = document.createElement("select");
    s.disabled = Boolean(disabled);
    s.value = String(value == null ? "" : value);
    s.style.width = "100%";
    s.style.padding = "10px 12px";
    s.style.borderRadius = "12px";
    s.style.border = "1px solid rgba(255,255,255,.14)";
    s.style.background = "rgba(255,255,255,.06)";
    s.style.color = "#fff";
    s.style.fontSize = "12px";
    s.style.fontWeight = "900";
    s.onchange = () => {
      try {
        if (typeof onChange === "function") onChange(String(s.value || ""));
      } catch {}
    };

    const list = Array.isArray(options) ? options : [];
    for (let i = 0; i < list.length; i += 1) {
      const o = list[i] || {};
      const opt = document.createElement("option");
      opt.value = String(o.value == null ? "" : o.value);
      opt.textContent = String(o.label == null ? "" : o.label);
      s.appendChild(opt);
    }

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
  fileName.style.color = "#fff";
  fileName.style.fontSize = "13px";
  fileName.style.fontWeight = "950";
  fileName.style.overflow = "hidden";
  fileName.style.textOverflow = "ellipsis";
  fileName.style.whiteSpace = "nowrap";
  fileName.textContent = state.convertFile ? String(state.convertFile.name || "") : (isArabic() ? "لم يتم اختيار ملف" : "No file selected");

  const fileSize = document.createElement("div");
  fileSize.style.color = "rgba(255,255,255,.66)";
  fileSize.style.fontSize = "12px";
  fileSize.style.fontWeight = "900";
  fileSize.textContent = state.convertFile ? fmtBytes(Number(state.convertFile.size || 0) || 0) : "";

  fileMeta.appendChild(fileName);
  fileMeta.appendChild(fileSize);
  s1.appendChild(fileMeta);

  const dz = renderDropzone({
    disabled: Boolean(state.converting) || planBlocked || !convertInput,
    onPick: () => {
      try {
        if (!convertInput) return;
        try {
          convertInput.accept = convertIsVideo ? "video/mp4,video/webm" : "image/*";
        } catch {}
        convertInput.click();
      } catch {}
    },
    onFiles: (fs) => {
      try {
        const list = Array.isArray(fs) ? fs : [];
        const f = list && list[0] ? list[0] : null;
        if (f && onSetConvertFile) onSetConvertFile(f);
      } catch {}
    }
  });
  s1.appendChild(dz);

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
    qLabel.style.color = "rgba(255,255,255,.82)";
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
      prog.style.border = "1px solid rgba(255,255,255,.10)";
      prog.style.borderRadius = "14px";
      prog.style.background = "rgba(2,6,23,.28)";
      prog.style.overflow = "hidden";
      const bar = document.createElement("div");
      bar.style.height = "10px";
      bar.style.width = Math.max(0, Math.min(100, Number(state.convertProgress || 0) || 0)) + "%";
      bar.style.background = "linear-gradient(90deg,#18b5d5,rgba(24,181,213,.35))";
      bar.style.transition = "width .12s ease";
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
      outTitle.style.color = "#fff";
      outTitle.style.fontSize = "13px";
      outTitle.style.fontWeight = "950";
      outTitle.textContent = isArabic() ? "النتيجة جاهزة" : "Result is ready";

      const outHint = document.createElement("div");
      outHint.style.color = "rgba(255,255,255,.70)";
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
          const ext =
            String(state.convertResultFormat || "").trim() ||
            (state.convertFormat === "mp4"
              ? "mp4"
              : state.convertFormat === "webm"
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
      const isVideoOut = outFmt === "mp4" || outFmt === "webm";

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
        v.style.border = "1px solid rgba(255,255,255,.10)";
        v.style.background = "rgba(2,6,23,.28)";
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
        img.style.border = "1px solid rgba(255,255,255,.10)";
        img.style.background = "rgba(2,6,23,.28)";
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
      isArabic() ? "اختر نوع مناسب للمتاجر أو حجم أخف" : "Pick a store-friendly or smaller format"
    );
    const fmtSelect = mkSelect(
      isArabic() ? "صيغة الناتج" : "Output format",
      String(state.convertFormat || "mp4"),
      [
        { value: "mp4", label: isArabic() ? "MP4 (H.264) — الأفضل للمتاجر" : "MP4 (H.264) — best for stores" },
        { value: "webm", label: isArabic() ? "WebM (VP9) — حجم أخف" : "WebM (VP9) — smaller size" },
        { value: "webm_local", label: isArabic() ? "WebM (سريع) — محلي بدون رفع" : "WebM (fast) — local no upload" }
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
      i.style.border = "1px solid rgba(255,255,255,.14)";
      i.style.background = "rgba(255,255,255,.06)";
      i.style.color = "#fff";
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
