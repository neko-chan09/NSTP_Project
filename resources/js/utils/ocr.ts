// src/utils/ocr.ts
import Tesseract from "tesseract.js";

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface OCRProgress {
  status: "loading" | "recognizing" | "done" | "error";
  progress: number;
  message?: string;
}

/**
 * Fetch image as blob URL for OCR
 */
const fetchImageAsBlob = async (imageUrl: string): Promise<string> => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("nstp_token");

  const response = await fetch(imageUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Image file not found on server");
    } else if (response.status === 401) {
      throw new Error("Authentication failed. Please login again.");
    } else if (response.status === 403) {
      throw new Error("You do not have permission to access this file.");
    }
    throw new Error(
      `Failed to fetch image: ${response.status} - ${response.statusText}`,
    );
  }

  const blob = await response.blob();

  // Check if it's actually an image
  if (!blob.type.startsWith("image/")) {
    throw new Error("The file is not a valid image.");
  }

  return URL.createObjectURL(blob);
};

/**
 * Extract text from an image using Tesseract.js
 */
export const extractTextFromImage = async (
  imageUrl: string,
  onProgress?: (progress: OCRProgress) => void,
): Promise<OCRResult | null> => {
  let blobUrl: string | null = null;

  try {
    onProgress?.({
      status: "loading",
      progress: 5,
      message: "Loading image...",
    });

    // Fetch image as blob and create object URL
    blobUrl = await fetchImageAsBlob(imageUrl);

    onProgress?.({
      status: "loading",
      progress: 15,
      message: "Loading OCR engine...",
    });

    // Create a worker with proper configuration
    const worker = await Tesseract.createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const progress = m.progress || 0;
          const totalProgress = 20 + progress * 80;
          onProgress?.({
            status: "recognizing",
            progress: totalProgress,
            message: `Recognizing text... ${Math.round(progress * 100)}%`,
          });
        } else if (m.status === "loading tesseract core") {
          onProgress?.({
            status: "loading",
            progress: 20,
            message: "Loading OCR engine...",
          });
        } else if (m.status === "initializing tesseract") {
          onProgress?.({
            status: "loading",
            progress: 25,
            message: "Initializing OCR...",
          });
        } else if (m.status === "loading language traineddata") {
          onProgress?.({
            status: "loading",
            progress: 30,
            message: "Loading language data...",
          });
        }
      },
    });

    onProgress?.({
      status: "loading",
      progress: 35,
      message: "Preparing image for OCR...",
    });

    // Recognize the image
    const result = await worker.recognize(blobUrl);

    // Clean up worker
    await worker.terminate();

    // Clean up blob URL
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }

    // Extract data
    const data = result.data;
    const extractedText = data?.text || "";
    const confidence = data?.confidence || 0;

    // Handle words
   let words: OCRResult["words"] = [];
const dataAny = data as any;
if (dataAny?.words && Array.isArray(dataAny.words)) {
  words = dataAny.words.map((word: any) => ({
        text: word.text || "",
        confidence: word.confidence || 0,
        bbox: word.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
      }));
    }

    // Check if we got any text
    if (!extractedText || extractedText.trim().length === 0) {
      onProgress?.({
        status: "error",
        progress: 0,
        message:
          "No text could be extracted. The image may not contain readable text.",
      });
      return null;
    }

    onProgress?.({
      status: "done",
      progress: 100,
      message: `OCR complete with ${Math.round(confidence)}% confidence`,
    });

    return {
      text: extractedText,
      confidence: confidence,
      words: words,
    };
  } catch (error) {
    console.error("OCR Error:", error);

    // Clean up blob URL
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }

    let errorMessage = "Failed to process image";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    onProgress?.({
      status: "error",
      progress: 0,
      message: errorMessage,
    });
    return null;
  }
};

/**
 * Check if a file is an image that supports OCR
 */
export const isImageFile = (file: File): boolean => {
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
  ];
  return imageTypes.includes(file.type);
};

/**
 * Check if a filename is an image
 */
export const isImageFileName = (filename: string): boolean => {
  const extensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "bmp",
    "tiff",
    "tif",
  ];
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return extensions.includes(ext);
};

/**
 * Format OCR text for display
 */
export const formatOCRText = (
  text: string,
  maxLength: number = 500,
): string => {
  if (!text) return "";
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength) + "...";
};

/**
 * Get OCR confidence level badge
 */
export const getConfidenceBadge = (
  confidence: number,
): { label: string; color: string } => {
  if (confidence >= 90) return { label: "High", color: "bg-emerald-500" };
  if (confidence >= 70) return { label: "Medium", color: "bg-amber-500" };
  return { label: "Low", color: "bg-red-500" };
};

/**
 * Clean OCR text
 */
export const cleanOCRText = (text: string): string => {
  if (!text) return "";
  return text.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
};

/**
 * Extract keywords from OCR text
 */
export const extractKeywords = (
  text: string,
  minLength: number = 4,
): string[] => {
  if (!text) return [];
  const words = text.split(/\s+/);
  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z0-9]/g, "");
    if (clean.length >= minLength && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase());
      keywords.push(clean);
    }
  }

  return keywords.slice(0, 20);
};
