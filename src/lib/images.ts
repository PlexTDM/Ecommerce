const IMAGE_SIZE_PATH = /\/ex\/\d+\.\d+\//;
const IP_PATH = /\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\//;
const PEXELS_HOST = "images.pexels.com";

export interface ImageVariant {
  /** Intrinsic width in CSS pixels (used as the `srcSet` width descriptor). */
  width: number;
  /** CDN size token such as `"256.256"`. */
  size: string;
}

const isPexelsUrl = (url: string): boolean => {
  try {
    return new URL(url).hostname === PEXELS_HOST;
  } catch {
    return false;
  }
};

const pexelsAt = (url: string, size: string): string => {
  const [rawWidth, rawHeight] = size.split(".");
  const width = Number.parseInt(rawWidth ?? "", 10);
  const height = Number.parseInt(rawHeight ?? "", 10);

  if (!Number.isFinite(width) || width <= 0) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("auto", "compress");
    parsed.searchParams.set("cs", "tinysrgb");
    parsed.searchParams.set("fit", "crop");
    parsed.searchParams.set("w", String(width));

    if (Number.isFinite(height) && height > 0) {
      parsed.searchParams.set("h", String(height));
    }

    return parsed.toString();
  } catch {
    return url;
  }
};

/**
 * Resize a CDN image by replacing its `/ex/<size>/` path segment. This keeps
 * the historical behaviour of stripping a trailing IP-like segment as well.
 */
export const getFullImage = (url: string, size: string): string =>
  url.replace(IP_PATH, "/").replace(IMAGE_SIZE_PATH, `/ex/${size}/`);

/**
 * Resize an Otakumode CDN image (or a Pexels photo) to the given size token.
 * Unknown URLs and data URIs are returned unchanged.
 */
export const imageAt = (url: string, size: string): string => {
  if (!url) return "";

  if (IMAGE_SIZE_PATH.test(url)) {
    return getFullImage(url, size);
  }

  if (isPexelsUrl(url)) {
    return pexelsAt(url, size);
  }

  return url;
};

/**
 * Build a `srcSet` string for the given width/size variants. When the URL
 * cannot be resized (data URI, local asset, unknown host) the candidates would
 * all be identical, so an empty string is returned instead.
 */
export const imageSrcSet = (url: string, variants: readonly ImageVariant[]): string => {
  if (!url || variants.length === 0) return "";

  const candidates = variants.map(({ width, size }) => {
    const candidateWidth = Math.max(1, Math.trunc(width));
    return `${imageAt(url, size)} ${candidateWidth}w`;
  });

  const uniqueUrls = new Set(variants.map(({ size }) => imageAt(url, size)));

  return uniqueUrls.size > 1 ? candidates.join(", ") : "";
};
