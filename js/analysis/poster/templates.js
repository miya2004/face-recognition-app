export const POSTER_TEMPLATES = [
  {
    id: "social-media",
    title: "Social media post",
    width: 941,
    height: 1672,
    imageUrl: "./assets/templates/social-media.png",
    maskUrl: "./assets/templates/social-media-mask.png",
    faceSlot: {
      x: 0.5,
      y: 0.28,
      width: 0.42,
      height: 0.42
    },
    faceCrop: "shaped",
    cropScale: 2.18,
    cropCenterBiasY: -0.1,
    faceBleed: 1.12,
    faceScale: 1.24,
    maskBoundsScale: 1.08,
    levelFaceRoll: false,
    maskFeather: 0,
    faceCenterAdjust: { x: 0, y: 0.018 },
    faceAnchorAdjust: { x: 0, y: -0.04 },
    faceFilter: {
      brightness: 1.05,
      contrast: 0.95,
      saturate: 1.05,
      blur: 0.2
    },
    faceOverlay: "rgba(255, 248, 240, 0.06)"
  },
  {
    id: "billboard-ad",
    title: "Billboard advertisement",
    width: 1448,
    height: 1086,
    imageUrl: "./assets/templates/urban_night_advertising_for_skincare_serum.png",
    maskUrl: "./assets/templates/billboard-ad-mask.png",
    faceSlot: {
      x: 0.56,
      y: 0.525,
      width: 0.245,
      height: 0.42
    },
    faceCrop: "padded",
    faceBleed: 1.18,
    faceScale: 1.1,
    maskFeather: 0,
    faceCenterAdjust: { x: 0.01, y: 0.022 },
    faceFilter: {
      brightness: 1.1,
      contrast: 0.9,
      saturate: 0.9,
      blur: 0.3
    },
    faceOverlay: "rgba(245, 225, 210, 0.08)"
  },
  {
    id: "id-badge",
    title: "ID badge",
    width: 941,
    height: 1672,
    imageUrl: "./assets/templates/id.png",
    maskUrl: "./assets/templates/id-mask.png",
    faceSlot: {
      x: 0.5,
      y: 0.38,
      width: 0.36,
      height: 0.28
    },
    faceCrop: "shaped",
    cropScale: 1.92,
    cropCenterBiasY: 0.1,
    faceBleed: 1.04,
    faceScale: 1.1,
    levelFaceRoll: false,
    maskFeather: 0,
    faceCenterAdjust: { x: 0, y: 0 },
    faceFilter: {
      brightness: 1.02,
      contrast: 0.98,
      saturate: 0.95,
      blur: 0.15
    },
    faceOverlay: "rgba(240, 245, 250, 0.04)"
  },
  {
    id: "security-cam",
    title: "Security camera feed",
    width: 1448,
    height: 1086,
    imageUrl: "./assets/templates/security.png?v=2",
    maskUrl: "./assets/templates/security-mask.png?v=2",
    faceSlot: {
      x: 0.495,
      y: 0.254,
      width: 0.062,
      height: 0.108
    },
    faceCrop: "detectedFaceOnly",
    faceBleed: 1.28,
    faceScale: 1.2,
    maskFeather: 0,
    faceCenterAdjust: { x: 0, y: 0.016 },
    faceFilter: {
      brightness: 0.88,
      contrast: 1.1,
      saturate: 0.55,
      blur: 0.8
    },
    faceOverlay: "rgba(120, 160, 170, 0.08)"
  },
  {
    id: "news",
    title: "News article",
    width: 1122,
    height: 1402,
    imageUrl: "./assets/templates/news.png",
    maskUrl: "./assets/templates/news-mask.png",
    faceSlot: {
      x: 0.313,
      y: 0.495,
      width: 0.382,
      height: 0.27
    },
    faceCrop: "shaped",
    cropScale: 1.92,
    cropCenterBiasY: 0.1,
    faceBleed: 1.04,
    faceScale: 1.1,
    levelFaceRoll: false,
    maskFeather: 0,
    faceCenterAdjust: { x: 0, y: 0 },
    faceFilter: {
      brightness: 0.98,
      contrast: 1.02,
      saturate: 0.88,
      blur: 0.2
    },
    faceOverlay: "rgba(220, 215, 205, 0.05)"
  },
  {
    id: "review",
    title: "Customer review",
    width: 1122,
    height: 1402,
    imageUrl: "./assets/templates/review.png",
    maskUrl: "./assets/templates/review-mask.png",
    faceSlot: {
      x: 0.155,
      y: 0.316,
      width: 0.193,
      height: 0.178
    },
    faceCrop: "shaped",
    cropScale: 2.08,
    cropCenterBiasY: -0.08,
    faceBleed: 1.1,
    faceScale: 1.2,
    maskBoundsScale: 1.06,
    levelFaceRoll: false,
    maskFeather: 0,
    faceCenterAdjust: { x: 0, y: 0.012 },
    faceAnchorAdjust: { x: 0, y: -0.035 },
    faceFilter: {
      brightness: 1.04,
      contrast: 0.96,
      saturate: 1.02,
      blur: 0.15
    },
    faceOverlay: "rgba(255, 250, 242, 0.05)"
  }
];

export function getTemplateImageUrl(template) {
  return template.imageUrl || null;
}

export function getTemplateMaskUrl(template) {
  return template.maskUrl || null;
}
