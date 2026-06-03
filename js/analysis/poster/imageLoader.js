import { getTemplateImageUrl, getTemplateMaskUrl } from "./templates.js";
import { analyzeMaskBounds } from "./maskUtils.js";
import { applyFallbackAssets } from "./fallbackTemplates.js";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

async function loadTemplateAsset(template) {
  const imageUrl = getTemplateImageUrl(template);
  const maskUrl = getTemplateMaskUrl(template);

  try {
    if (imageUrl && !template.image) {
      template.image = await loadImage(imageUrl);
      template.width = template.width || template.image.naturalWidth;
      template.height = template.height || template.image.naturalHeight;
    }

    if (maskUrl && !template.maskImage) {
      template.maskImage = await loadImage(maskUrl);
      template.maskBounds = analyzeMaskBounds(template.maskImage);
    }
  } catch (error) {
    console.warn("Using fallback poster assets:", error.message);
    applyFallbackAssets(template);
  }

  if (!template.image || !template.maskImage) {
    applyFallbackAssets(template);
  }
}

export async function preloadTemplates(templates) {
  await Promise.all(templates.map((template) => loadTemplateAsset(template)));
  return templates;
}
