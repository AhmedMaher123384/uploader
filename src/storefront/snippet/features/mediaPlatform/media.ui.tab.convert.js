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
  const onUploadAll = typeof o.onUploadAll === "function" ? o.onUploadAll : null;
  const onDownloadAll = typeof o.onDownloadAll === "function" ? o.onDownloadAll : null;
  const onOpenFiles = typeof o.onOpenFiles === "function" ? o.onOpenFiles : null;
  const onSetConvertFiles = typeof o.onSetConvertFiles === "function" ? o.onSetConvertFiles : null;
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
  pickBtn.style.color = "#fff";
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
    l.style.fontSize = "11px";
    l.style.fontWeight = "950";
    l.textContent = String(labelText || "");

    const box = document.createElement("div");
    box.style.position = "relative";
    box.style.width = "100%";

    const s = document.createElement("select");
    s.disabled = Boolean(disabled);
    s.style.width = "100%";
    s.style.padding = "9px 28px 9px 10px";
    s.style.borderRadius = "12px";
    s.style.border = "1px solid rgba(255,255,255,.08)";
    s.style.background = "#373737";
    s.style.color = "rgba(255,255,255,.90)";
    s.style.fontSize = "11px";
    s.style.fontWeight = "900";
    s.style.appearance = "none";
    s.style.webkitAppearance = "none";
    s.style.mozAppearance = "none";
    s.onchange = () => {
      try {
        if (typeof onChange === "function") onChange(String(s.value || ""));
      } catch {}
    };

    const arrow = document.createElement("div");
    arrow.textContent = "▾";
    arrow.style.position = "absolute";
    arrow.style.right = "10px";
    arrow.style.top = "50%";
    arrow.style.transform = "translateY(-50%)";
    arrow.style.pointerEvents = "none";
    arrow.style.color = "rgba(255,255,255,.75)";
    arrow.style.fontSize = "11px";
    arrow.style.fontWeight = "950";
    arrow.style.lineHeight = "1";

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
    box.appendChild(s);
    box.appendChild(arrow);
    wrap.appendChild(box);
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

  const selectedFiles = Array.isArray(state.convertFiles) ? state.convertFiles : [];
  const selectedCount = selectedFiles.length;

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
  fileSize.textContent = selectedCount
    ? (
        (isArabic()
          ? ("تم اختيار " + String(selectedCount) + (selectedCount === 1 ? " ملف" : " ملفات"))
          : ("Selected " + String(selectedCount) + (selectedCount === 1 ? " file" : " files"))) +
        " — " +
        (isArabic() ? "إجمالي الحجم: " : "Total size: ") +
        fmtBytes(totalBytes)
      )
    : "";

  const limitLine = document.createElement("div");
  limitLine.style.color = "rgba(255,255,255,.55)";
  limitLine.style.fontSize = "12px";
  limitLine.style.fontWeight = "900";
  limitLine.textContent = maxFiles
    ? (isArabic() ? ("الحد الأقصى: " + String(maxFiles) + " ملفات") : ("Max: " + String(maxFiles) + " files"))
    : "";

  if (fileSize.textContent) fileMeta.appendChild(fileSize);
  if (limitLine.textContent) fileMeta.appendChild(limitLine);
  s1.appendChild(fileMeta);

  if (selectedFiles.length) {
    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "6px";
    list.style.maxHeight = "160px";
    list.style.overflow = "auto";
    list.style.padding = "2px";
    list.style.borderRadius = "12px";
    list.style.border = "1px solid rgba(24,181,213,.35)";
    list.style.background = "rgba(24,181,213,.12)";
    list.style.direction = isArabic() ? "rtl" : "ltr";

    for (let i = 0; i < selectedFiles.length; i += 1) {
      const f = selectedFiles[i];
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

      const right = document.createElement("div");
      right.style.display = "flex";
      right.style.alignItems = "center";
      right.style.gap = "10px";
      right.style.flexWrap = "wrap";
      right.style.flex = "0 0 auto";
      right.style.direction = "ltr";

      const fileFormats = Array.isArray(state.convertFileFormats) ? state.convertFileFormats : [];
      const fileFormatsCustom = Array.isArray(state.convertFileFormatCustom) ? state.convertFileFormatCustom : [];
      const fallbackFmt = convertIsVideo ? String(state.convertFormat || "mp4") : String(state.convertFormat || "webp");
      const fmtValue = String(fileFormats[i] || fallbackFmt || "").trim();

      const showPerFileFormat = selectedFiles.length > 1;

      const fmt = document.createElement("select");
      fmt.disabled = Boolean(state.converting) || planBlocked;
      fmt.style.padding = "4px 18px 4px 6px";
      fmt.style.borderRadius = "10px";
      fmt.style.border = "1px solid rgba(255,255,255,.10)";
      fmt.style.background = "#303030";
      fmt.style.color = "rgba(255,255,255,.92)";
      fmt.style.fontSize = "9px";
      fmt.style.fontWeight = "950";
      fmt.style.cursor = fmt.disabled ? "not-allowed" : "pointer";
      fmt.style.opacity = fmt.disabled ? "0.7" : "1";
      fmt.style.appearance = "none";
      fmt.style.webkitAppearance = "none";
      fmt.style.mozAppearance = "none";
      fmt.title = isArabic() ? "صيغة الإخراج" : "Output format";
      const opts = convertIsVideo
        ? [
            { value: "mp4", label: "MP4" },
            { value: "webm", label: "WebM (VP9)" },
            { value: "webm_local", label: "WebM" },
            { value: "mov", label: "MOV" },
          ]
        : [
            { value: "avif", label: "AVIF" },
            { value: "webp", label: "WebP" },
            { value: "jpeg", label: "JPEG" },
            { value: "png", label: "PNG" }
          ];
      for (let j = 0; j < opts.length; j += 1) {
        const o2 = opts[j] || {};
        const opt = document.createElement("option");
        opt.value = String(o2.value || "");
        opt.textContent = String(o2.label || "");
        if (opt.value === fmtValue) opt.selected = true;
        fmt.appendChild(opt);
      }
      try {
        fmt.value = fmtValue;
      } catch {}
      fmt.onchange = () => {
        try {
          if (!Array.isArray(state.convertFileFormats)) state.convertFileFormats = [];
          if (!Array.isArray(state.convertFileFormatCustom)) state.convertFileFormatCustom = [];
          state.convertFileFormats[i] = String(fmt.value || "");
          state.convertFileFormatCustom[i] = true;
          for (let k = 0; k < selectedFiles.length; k += 1) {
            if (state.convertFileFormats[k] == null) state.convertFileFormats[k] = fallbackFmt;
            if (state.convertFileFormatCustom[k] == null) state.convertFileFormatCustom[k] = Boolean(fileFormatsCustom[k]);
          }
          const uniq = new Set();
          for (let k = 0; k < selectedFiles.length; k += 1) uniq.add(String(state.convertFileFormats[k] || fallbackFmt));
          if (uniq.size === 1) {
            const only = String(Array.from(uniq)[0] || fallbackFmt);
            state.convertFormat = only;
            state.convertFileFormatCustom = selectedFiles.map(() => false);
          }
          if (onRender) onRender();
        } catch {}
      };

      if (showPerFileFormat) {
        const fmtWrap = document.createElement("div");
        fmtWrap.style.position = "relative";
        fmtWrap.style.display = "inline-block";

        const arrow = document.createElement("div");
        arrow.textContent = "▾";
        arrow.style.position = "absolute";
        arrow.style.right = "7px";
        arrow.style.top = "50%";
        arrow.style.transform = "translateY(-50%)";
        arrow.style.pointerEvents = "none";
        arrow.style.color = "rgba(255,255,255,.70)";
        arrow.style.fontSize = "9px";
        arrow.style.fontWeight = "950";
        arrow.style.lineHeight = "1";

        fmtWrap.appendChild(fmt);
        fmtWrap.appendChild(arrow);
        right.appendChild(fmtWrap);
      }
      right.appendChild(size);

      row.appendChild(name);
      row.appendChild(right);
      list.appendChild(row);
    }

    s1.appendChild(list);
  }

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
    const clampQ = (x) => Math.max(1, Math.min(92, Math.round(Number(x) || qDefault)));
    qVal.textContent = String(clampQ(qNum));

    qHead.appendChild(qLabel);
    qHead.appendChild(qVal);

    const range = document.createElement("input");
    range.type = "range";
    range.min = "1";
    range.max = "92";
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
    return s;
  };

  const buildConvertStep = (n) => {
    const s = mkStep(n, isArabic() ? "التحويل والتحميل" : "Convert & download", isArabic() ? "ابدأ التحويل ثم حمّل النتائج" : "Run conversion, then download results");

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";

    const items = Array.isArray(state.convertItems) ? state.convertItems : [];
    const doneItems = items.filter((x) => x && String(x.status || "") === "done" && x.resultUrl);
    const doneCount = doneItems.length;

    const convertBtn = btnPrimary(isArabic() ? "تحويل الآن" : "Convert now");
    const hasFiles = Array.isArray(state.convertFiles) && state.convertFiles.length;
    convertBtn.disabled = Boolean(state.converting) || planBlocked || !hasFiles || !onRunConvert;
    convertBtn.onclick = () => {
      try {
        if (convertBtn.disabled) return;
        onRunConvert();
      } catch {}
    };

    actions.appendChild(convertBtn);

    const bulkActions = document.createElement("div");
    bulkActions.style.display = "flex";
    bulkActions.style.gap = "10px";
    bulkActions.style.flexWrap = "wrap";

    if (doneCount > 1) {
      const dlAllLabel = Boolean(state.convertDownloadingAll)
        ? (isArabic() ? "جاري تجهيز الملف…" : "Preparing…")
        : (isArabic() ? "تحميل الكل" : "Download all");
      const dlAll = btnPrimary(dlAllLabel);
      dlAll.disabled = Boolean(state.converting) || planBlocked || !onDownloadAll || Boolean(state.convertDownloadingAll);
      dlAll.style.opacity = dlAll.disabled ? "0.65" : "1";
      dlAll.style.cursor = dlAll.disabled ? "not-allowed" : "pointer";
      dlAll.onclick = () => {
        try {
          if (dlAll.disabled) return;
          onDownloadAll();
        } catch {}
      };
      bulkActions.appendChild(dlAll);

      const anyCanUpload = doneItems.some((x) => x && !x.uploadUrl && !x.uploading);
      const upAllLabel = Boolean(state.convertUploadingAll)
        ? (isArabic() ? "جاري الرفع…" : "Uploading…")
        : (isArabic() ? "رفع الكل على المنصه" : "Upload all to platform");
      const upAll = btnPrimary(upAllLabel);
      upAll.disabled = Boolean(state.converting) || planBlocked || !onUploadAll || Boolean(state.convertUploadingAll) || !anyCanUpload;
      upAll.style.opacity = upAll.disabled ? "0.65" : "1";
      upAll.style.cursor = upAll.disabled ? "not-allowed" : "pointer";
      upAll.onclick = () => {
        try {
          if (upAll.disabled) return;
          onUploadAll();
        } catch {}
      };
      bulkActions.appendChild(upAll);
    }

    const resetBtn = btnGhost(isArabic() ? "تفريغ" : "Reset");
    resetBtn.disabled = Boolean(state.converting) || planBlocked || !onReset;
    resetBtn.onclick = () => {
      try {
        if (resetBtn.disabled) return;
        onReset();
      } catch {}
    };

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

      const status = String((it && it.status) || "");
      const resUrl = String((it && it.resultUrl) || "");
      const rawName = String((it && it.name) || "");
      const rf = String((it && it.outFormat) || "").trim().toLowerCase();
      const tf = String((it && it.targetFormat) || state.convertFormat || "").trim().toLowerCase();
      const outExt =
        (rf ? rf : "") ||
        (tf === "mp4"
          ? "mp4"
          : tf === "mov"
            ? "mov"
            : tf === "webm" || tf === "webm_local"
              ? "webm"
              : tf === "avif"
                ? "avif"
                : tf === "webp"
                  ? "webp"
                  : tf === "jpeg"
                    ? "jpeg"
                    : tf === "png"
                      ? "png"
                      : "");
      const shownName = (() => {
        if (status !== "done") return rawName;
        let baseName = rawName;
        const dot = baseName.lastIndexOf(".");
        if (dot > 0) baseName = baseName.slice(0, dot);
        baseName = baseName.slice(0, 120) || (isArabic() ? "ملف" : "file");
        return outExt ? (baseName + "." + outExt) : rawName;
      })();

      const nameRow = document.createElement("div");
      nameRow.style.display = "flex";
      nameRow.style.alignItems = "center";
      nameRow.style.gap = "8px";
      nameRow.style.minWidth = "0";
      nameRow.style.flex = "1 1 auto";

      const nameText = document.createElement("div");
      nameText.style.color = "#fff";
      nameText.style.fontSize = "12px";
      nameText.style.fontWeight = "950";
      nameText.style.overflow = "hidden";
      nameText.style.textOverflow = "ellipsis";
      nameText.style.whiteSpace = "nowrap";
      nameText.style.minWidth = "0";
      nameText.style.flex = "1 1 auto";
      nameText.textContent = shownName;

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "✎";
      editBtn.setAttribute("aria-label", isArabic() ? "تعديل اسم الملف" : "Edit file name");
      editBtn.title = isArabic() ? "تعديل اسم الملف" : "Edit file name";
      editBtn.style.flex = "0 0 auto";
      editBtn.style.border = "1px solid rgba(255,255,255,.12)";
      editBtn.style.borderRadius = "10px";
      editBtn.style.background = "#373737";
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
          input.style.background = "#373737";
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

      if (isArabic()) {
        if (status === "done" && resUrl) nameRow.appendChild(editBtn);
        nameRow.appendChild(nameText);
      } else {
        nameRow.appendChild(nameText);
        if (status === "done" && resUrl) nameRow.appendChild(editBtn);
      }

      const sub = document.createElement("div");
      sub.style.color = (it && (it.error || it.uploadError)) ? "#ef4444" : "rgba(255,255,255,.62)";
      sub.style.fontSize = "12px";
      sub.style.fontWeight = "900";

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
        left.appendChild(nameRow);
        if (sub.textContent) left.appendChild(sub);

        const right = document.createElement("div");
        right.style.display = "flex";
        right.style.alignItems = "center";
        right.style.gap = "10px";
        right.style.flexWrap = "wrap";
        right.style.flex = "0 0 auto";

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
              const fmt = String((it && it.targetFormat) || state.convertFormat || "").trim().toLowerCase();
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
      if (bulkActions.childNodes && bulkActions.childNodes.length) s.appendChild(bulkActions);
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
    const hasCustom = Array.isArray(state.convertFileFormatCustom) ? state.convertFileFormatCustom.some(Boolean) : false;
    const fmtSelect = mkSelect(
      isArabic() ? "صيغة الناتج (افتراضي)" : "Output format (default)",
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
          const next = String(v || "mp4");
          state.convertFormat = next;
          const fs = Array.isArray(state.convertFiles) ? state.convertFiles : [];
          if (!Array.isArray(state.convertFileFormats) || state.convertFileFormats.length !== fs.length) {
            state.convertFileFormats = fs.map(() => next);
          }
          if (!Array.isArray(state.convertFileFormatCustom) || state.convertFileFormatCustom.length !== fs.length) {
            state.convertFileFormatCustom = fs.map(() => false);
          }
          for (let i = 0; i < fs.length; i += 1) {
            if (!state.convertFileFormatCustom[i]) state.convertFileFormats[i] = next;
          }
          if (onRender) onRender();
        } catch {}
      }
    );
    s2.appendChild(fmtSelect);
    const note = document.createElement("div");
    note.style.color = "rgba(255,255,255,.55)";
    note.style.fontSize = "11px";
    note.style.fontWeight = "900";
    note.style.lineHeight = "1.6";
    note.textContent = hasCustom
      ? (isArabic() ? "بعض الملفات لها صيغة مختلفة من القائمة بالأعلى." : "Some files use custom formats from the list above.")
      : (isArabic() ? "تنطبق على كل الملفات (ويمكن تخصيص كل ملف من القائمة بالأعلى)." : "Applies to all files (you can customize per file from the list above).");
    s2.appendChild(note);
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
    const hasCustom = Array.isArray(state.convertFileFormatCustom) ? state.convertFileFormatCustom.some(Boolean) : false;
    const fmtSelect = mkSelect(
      isArabic() ? "الصيغة (افتراضي)" : "Format (default)",
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
          const next = String(v || "webp");
          state.convertFormat = next;
          const fs = Array.isArray(state.convertFiles) ? state.convertFiles : [];
          if (!Array.isArray(state.convertFileFormats) || state.convertFileFormats.length !== fs.length) {
            state.convertFileFormats = fs.map(() => next);
          }
          if (!Array.isArray(state.convertFileFormatCustom) || state.convertFileFormatCustom.length !== fs.length) {
            state.convertFileFormatCustom = fs.map(() => false);
          }
          for (let i = 0; i < fs.length; i += 1) {
            if (!state.convertFileFormatCustom[i]) state.convertFileFormats[i] = next;
          }
          if (onRender) onRender();
        } catch {}
      }
    );
    s2.appendChild(fmtSelect);
    const note = document.createElement("div");
    note.style.color = "rgba(255,255,255,.55)";
    note.style.fontSize = "11px";
    note.style.fontWeight = "900";
    note.style.lineHeight = "1.6";
    note.textContent = hasCustom
      ? (isArabic() ? "بعض الملفات لها صيغة مختلفة من القائمة بالأعلى." : "Some files use custom formats from the list above.")
      : (isArabic() ? "تنطبق على كل الملفات (ويمكن تخصيص كل ملف من القائمة بالأعلى)." : "Applies to all files (you can customize per file from the list above).");
    s2.appendChild(note);

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
