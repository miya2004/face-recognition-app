function clampCrop(sx, sy, sw, sh, vw, vh) {
  const x = Math.max(0, sx);
  const y = Math.max(0, sy);
  const w = Math.min(sw, vw - x);
  const h = Math.min(sh, vh - y);
  return { sx: x, sy: y, sw: w, sh: h };
}

function drawMirroredRegion(video, sx, sy, sw, sh) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, Math.round(sw));
  canvas.height = Math.max(8, Math.round(sh));
  const ctx = canvas.getContext("2d");

  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  return canvas;
}

function cropFromFaceBox(video, faceData, padX, padY) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const bx = faceData.box.x;
  const by = faceData.box.y;
  const bw = faceData.box.width;
  const bh = faceData.box.height;

  return clampCrop(bx - padX, by - padY, bw + padX * 2, bh + padY * 2, vw, vh);
}

function toMirroredCanvasPoint(point, crop) {
  const { sx, sy, sw } = crop;
  return {
    x: sw - (point.x - sx),
    y: point.y - sy
  };
}

function computeFaceCenter(landmarks, crop, canvasW, canvasH) {
  if (!landmarks?.length || landmarks.length < 46 || !crop) {
    return { x: canvasW / 2, y: canvasH / 2 };
  }

  const leftEye = toMirroredCanvasPoint(landmarks[36], crop);
  const rightEye = toMirroredCanvasPoint(landmarks[45], crop);
  const nose = toMirroredCanvasPoint(landmarks[30], crop);

  return {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) * 0.6 + nose.y * 0.4
  };
}

function computeFaceRoll(landmarks, crop) {
  if (!landmarks?.length || landmarks.length < 46 || !crop) {
    return 0;
  }

  const eyeA = toMirroredCanvasPoint(landmarks[36], crop);
  const eyeB = toMirroredCanvasPoint(landmarks[45], crop);
  const leftOnCanvas = eyeA.x <= eyeB.x ? eyeA : eyeB;
  const rightOnCanvas = eyeA.x <= eyeB.x ? eyeB : eyeA;

  return Math.atan2(
    rightOnCanvas.y - leftOnCanvas.y,
    rightOnCanvas.x - leftOnCanvas.x
  );
}

function getFaceFocalPoint(faceData, bw, bh) {
  let cx = faceData.box.x + bw / 2;
  let cy = faceData.box.y + bh / 2;

  if (faceData.landmarks?.length >= 46) {
    const leftEye = faceData.landmarks[36];
    const rightEye = faceData.landmarks[45];
    const nose = faceData.landmarks[30];
    cx = (leftEye.x + rightEye.x) / 2;
    cy = (leftEye.y + rightEye.y) * 0.52 + nose.y * 0.48;
  }

  return { cx, cy };
}

function cropShapedFromFaceBox(video, faceData, options = {}) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const bw = faceData.box.width;
  const bh = faceData.box.height;
  const {
    aspect = 1,
    scaleFactor = 1.82,
    centerBiasY = 0
  } = options;

  const { cx, cy: baseCy } = getFaceFocalPoint(faceData, bw, bh);
  const cy = baseCy + centerBiasY * bh;
  const base = Math.max(bw, bh) * scaleFactor;
  let cropW;
  let cropH;

  if (aspect >= 1) {
    cropW = base;
    cropH = base * aspect;
  } else {
    cropH = base;
    cropW = base / aspect;
  }

  return clampCrop(cx - cropW / 2, cy - cropH / 2, cropW, cropH, vw, vh);
}

function getShapedCropOptions(template) {
  const aspect = template?.maskBounds
    ? template.maskBounds.height / template.maskBounds.width
    : 1;

  return {
    aspect,
    scaleFactor: template?.cropScale ?? 1.82,
    centerBiasY: template?.cropCenterBiasY ?? 0
  };
}

function buildShapedCapture(video, faceData, shapedCrop) {
  const squareCanvas = drawMirroredRegion(
    video,
    shapedCrop.sx,
    shapedCrop.sy,
    shapedCrop.sw,
    shapedCrop.sh
  );

  return {
    squareCanvas,
    faceCenterSquare: computeFaceCenter(
      faceData.landmarks,
      shapedCrop,
      squareCanvas.width,
      squareCanvas.height
    ),
    rollSquare: computeFaceRoll(faceData.landmarks, shapedCrop)
  };
}

export function captureFaceFromVideo(video, faceData, template = null) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || !faceData?.box) {
    return null;
  }

  const bw = faceData.box.width;
  const bh = faceData.box.height;
  const padX = bw * 0.12;
  const padY = bh * 0.18;

  const paddedCrop = cropFromFaceBox(video, faceData, bw * 0.3, bh * 0.35);
  const faceCrop = cropFromFaceBox(video, faceData, padX, padY);
  const shapedCrop = cropShapedFromFaceBox(
    video,
    faceData,
    template ? getShapedCropOptions(template) : { aspect: 1, scaleFactor: 1.82, centerBiasY: 0 }
  );

  const canvas = drawMirroredRegion(
    video,
    paddedCrop.sx,
    paddedCrop.sy,
    paddedCrop.sw,
    paddedCrop.sh
  );
  const faceCanvas = drawMirroredRegion(
    video,
    faceCrop.sx,
    faceCrop.sy,
    faceCrop.sw,
    faceCrop.sh
  );
  const shaped = buildShapedCapture(video, faceData, shapedCrop);

  if (faceCanvas.width < 8 || faceCanvas.height < 8) {
    return null;
  }

  return {
    canvas,
    faceCanvas,
    squareCanvas: shaped.squareCanvas,
    faceCenter: computeFaceCenter(
      faceData.landmarks,
      faceCrop,
      faceCanvas.width,
      faceCanvas.height
    ),
    faceCenterPadded: computeFaceCenter(
      faceData.landmarks,
      paddedCrop,
      canvas.width,
      canvas.height
    ),
    faceCenterSquare: shaped.faceCenterSquare,
    roll: computeFaceRoll(faceData.landmarks, faceCrop),
    rollPadded: computeFaceRoll(faceData.landmarks, paddedCrop),
    rollSquare: shaped.rollSquare
  };
}

export function getFaceCenter(capture, template) {
  if (template?.faceCrop === "square") {
    return capture?.faceCenterSquare;
  }

  if (template?.faceCrop === "detectedFaceOnly") {
    return capture?.faceCenter;
  }

  return capture?.faceCenterPadded ?? capture?.faceCenter;
}

export function getFaceRoll(capture, template) {
  if (template?.faceCrop === "square") {
    return capture?.rollSquare ?? 0;
  }

  if (template?.faceCrop === "detectedFaceOnly") {
    return capture?.roll ?? 0;
  }

  return capture?.rollPadded ?? capture?.roll ?? 0;
}

export function getCaptureSource(capture, template) {
  if (template?.faceCrop === "square" && capture?.squareCanvas) {
    return capture.squareCanvas;
  }

  if (template?.faceCrop === "detectedFaceOnly" && capture?.faceCanvas) {
    return capture.faceCanvas;
  }

  return capture?.canvas || null;
}
