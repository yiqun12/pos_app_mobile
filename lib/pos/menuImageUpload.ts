import type { ImagePickerAsset } from "expo-image-picker";

export const MENU_IMAGE_UPLOAD_URL =
  "https://hello-world-twilight-art-645c.eatify12.workers.dev/";

type CloudflareImageUploadResponse = {
  success?: boolean;
  result?: {
    variants?: string[];
  };
  errors?: unknown;
};

export function getPickedImageFileName(
  asset: Pick<ImagePickerAsset, "uri" | "fileName">
): string {
  if (asset.fileName) return asset.fileName;
  const lastSegment = asset.uri.split("/").filter(Boolean).at(-1);
  return lastSegment || `menu-image-${Date.now()}.jpg`;
}

export function getPickedImageMimeType(
  asset: Pick<ImagePickerAsset, "uri" | "mimeType">
): string {
  if (asset.mimeType) return asset.mimeType;
  const lowerUri = asset.uri.toLowerCase();
  if (lowerUri.endsWith(".png")) return "image/png";
  if (lowerUri.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export function getCloudflareImageVariant(
  response: CloudflareImageUploadResponse
): string {
  if (!response.success) {
    throw new Error("Menu image upload failed.");
  }
  const variant = response.result?.variants?.[0];
  if (!variant) {
    throw new Error("Menu image upload did not return a variant URL.");
  }
  return variant;
}

export async function uploadMenuImage(asset: ImagePickerAsset): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: getPickedImageFileName(asset),
    type: getPickedImageMimeType(asset),
  } as unknown as Blob);

  const response = await fetch(MENU_IMAGE_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Menu image upload failed with status ${response.status}.`);
  }

  const data = (await response.json()) as CloudflareImageUploadResponse;
  return getCloudflareImageVariant(data);
}
