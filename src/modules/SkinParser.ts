/**
 * SkinParser.ts
 * Module to load and validate Minecraft PNG skins.
 */

export interface SkinValidationResult {
  isValid: boolean;
  errorKey?: string;
  errorParams?: Record<string, string | number>;
  image?: HTMLImageElement;
}

/**
 * Validates and loads a Minecraft skin PNG file.
 * Checks that it is a valid image, PNG format, and is exactly 64x64 pixels.
 * 
 * @param file The uploaded file
 * @returns Promise resolving to a SkinValidationResult
 */
export function validateAndLoadSkin(file: File): Promise<SkinValidationResult> {
  return new Promise((resolve) => {
    // 1. Validate file type
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      resolve({
        isValid: false,
        errorKey: 'err_not_png',
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // 2. Validate dimensions
        if (img.width !== 64 || img.height !== 64) {
          resolve({
            isValid: false,
            errorKey: 'err_invalid_resolution',
            errorParams: { width: img.width, height: img.height },
          });
          return;
        }

        resolve({
          isValid: true,
          image: img,
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          errorKey: 'err_invalid_image',
        });
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        errorKey: 'err_read_error',
      });
    };

    reader.readAsDataURL(file);
  });
}
