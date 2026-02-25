// Base interface for all tool components
export interface ToolProps {
  selectedImages: string[];
  onImagesChange: (images: string[]) => void;
}

export interface ToolState {
  isProcessing: boolean;
  progress: number;
  processedImages: string[];
  error: string | null;
}