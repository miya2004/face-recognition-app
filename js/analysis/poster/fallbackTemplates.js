function createMaskFromSlot(width, height, faceSlot, square = false) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx || !faceSlot) {
    return canvas;
  }

  const cx = faceSlot.x * width;
  const cy = faceSlot.y * height;
  const rx = (faceSlot.width * width) / 2;
  const ry = square ? rx : (faceSlot.height * height) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  if (square) {
    ctx.rect(cx - rx, cy - rx, rx * 2, rx * 2);
  } else {
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  return canvas;
}

function drawBillboardBackground(ctx, width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#070d18");
  sky.addColorStop(1, "#151f35");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#ece2d6";
  ctx.fillRect(width * 0.18, height * 0.12, width * 0.64, height * 0.72);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 4;
  ctx.strokeRect(width * 0.18, height * 0.12, width * 0.64, height * 0.72);

  ctx.fillStyle = "#1d2430";
  ctx.font = `700 ${Math.round(width * 0.034)}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("NIGHT GLOW SERUM", width * 0.5, height * 0.86);
}

function drawSecurityBackground(ctx, width, height) {
  ctx.fillStyle = "#101812";
  ctx.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? "rgba(0,255,120,0.04)" : "rgba(0,0,0,0.15)";
    ctx.fillRect(0, y, width, 4);
  }

  ctx.strokeStyle = "rgba(0,255,120,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(width * 0.04, height * 0.04, width * 0.92, height * 0.92);

  ctx.fillStyle = "rgba(0,255,120,0.85)";
  ctx.font = `700 ${Math.round(width * 0.022)}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText("CAM 04 — LIVE FEED", width * 0.06, height * 0.08);
  ctx.fillText("REC ●", width * 0.06, height * 0.94);
}

function drawSocialMediaBackground(ctx, width, height) {
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#1a1024");
  bg.addColorStop(0.45, "#2a1838");
  bg.addColorStop(1, "#120818");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const avatarSize = width * 0.42;
  const avatarX = (width - avatarSize) / 2;
  const avatarY = height * 0.14;
  ctx.fillStyle = "#3a2a48";
  ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);

  ctx.fillStyle = "#f5eef8";
  ctx.font = `600 ${Math.round(width * 0.045)}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("@your_profile", width * 0.5, avatarY + avatarSize + width * 0.08);
}

function createBackgroundCanvas(template) {
  const canvas = document.createElement("canvas");
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvas;
  }

  if (template.id === "social-media") {
    drawSocialMediaBackground(ctx, template.width, template.height);
  } else if (template.id === "security-cam") {
    drawSecurityBackground(ctx, template.width, template.height);
  } else {
    drawBillboardBackground(ctx, template.width, template.height);
  }

  return canvas;
}

export function applyFallbackAssets(template) {
  template.image = createBackgroundCanvas(template);
  template.maskImage = createMaskFromSlot(
    template.width,
    template.height,
    template.faceSlot,
    template.faceCrop === "square"
  );
  template.width = template.width || template.image.width;
  template.height = template.height || template.image.height;
  template._usingFallback = true;
  return template;
}
