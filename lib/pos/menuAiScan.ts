export const GOOGLE_CLOUD_VISION_API_KEY_ENV = "EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY";

export const SAMPLE_MENU_ASSET_NAME = "sample-menu.png";

export function getSampleMenuAssetMetadata(): {
  fileName: string;
  mimeType: string;
} {
  return {
    fileName: "menu.png",
    mimeType: "image/png",
  };
}

export function buildGenerateJsonPayload(input: {
  base64Image: string;
  ocrScan: string;
  languageMode?: "other" | "en";
  generateImages?: boolean;
}): {
  url: string;
  ocr_scan: string;
  LanMode: string;
  imgBool: string;
} {
  return {
    url: input.base64Image,
    ocr_scan: input.ocrScan,
    LanMode: input.languageMode ?? "other",
    imgBool: input.generateImages ? "yes" : "no",
  };
}

type VisionTextAnnotation = {
  description?: string;
};

type VisionResponse = {
  responses?: Array<{
    textAnnotations?: VisionTextAnnotation[];
  }>;
};

export function extractDetectedTextFromVisionResponse(response: unknown): string {
  const visionResponse = response as VisionResponse;
  return visionResponse.responses?.[0]?.textAnnotations?.[0]?.description ?? "";
}

export function normalizeOcrScan(text: string): string {
  return text.replace(/[\s\r\n]+/g, " ").trim();
}

export function getGoogleCloudVisionApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY?.trim();
  if (!key) {
    throw new Error(`Missing ${GOOGLE_CLOUD_VISION_API_KEY_ENV}.`);
  }
  return key;
}

export function buildVisionAnnotateUrl(apiKey = getGoogleCloudVisionApiKey()): string {
  return `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;
}

export async function extractMenuTextFromImageBase64(base64Image: string): Promise<string> {
  const response = await fetch(
    buildVisionAnnotateUrl(),
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(`Vision OCR failed with status ${response.status}`);
  }

  const data = await response.json();
  return normalizeOcrScan(extractDetectedTextFromVisionResponse(data));
}
