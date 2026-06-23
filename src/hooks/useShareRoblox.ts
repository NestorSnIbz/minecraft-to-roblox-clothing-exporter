import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';
import { checkRateLimit, RateLimitError } from '../lib/rateLimit';

export function useShareRoblox() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  const share = async (
    shirtCanvas: HTMLCanvasElement | null,
    pantsCanvas: HTMLCanvasElement | null,
    previewCanvas: HTMLCanvasElement | null,
    skinSrc: string,
    armType: 'classic' | 'slim',
    creatorName?: string,
    description?: string
  ) => {
    setLoading(true);
    setError(null);
    setShareUrl(null);
    setMinutesLeft(null);

    try {
      if (!shirtCanvas || !pantsCanvas) {
        throw new Error('Shirt and Pants templates must be generated first.');
      }

      await checkRateLimit('roblox');

      const slug = nanoid(10);

      // 1. Convert templates and original skin to blobs
      const shirtBlob = await canvasToBlob(shirtCanvas);
      const pantsBlob = await canvasToBlob(pantsCanvas);
      const skinBlob = await dataUrlToBlob(skinSrc);

      // 1b. Upload Skin
      const { error: skinUploadErr } = await supabase.storage
        .from('conversions')
        .upload(`roblox/${slug}/skin.png`, skinBlob, {
          contentType: 'image/png'
        });
      if (skinUploadErr) throw skinUploadErr;

      // 2. Upload Shirt
      const { error: shirtUploadErr } = await supabase.storage
        .from('conversions')
        .upload(`roblox/${slug}/shirt.png`, shirtBlob, {
          contentType: 'image/png'
        });
      if (shirtUploadErr) throw shirtUploadErr;

      // 3. Upload Pants
      const { error: pantsUploadErr } = await supabase.storage
        .from('conversions')
        .upload(`roblox/${slug}/pants.png`, pantsBlob, {
          contentType: 'image/png'
        });
      if (pantsUploadErr) throw pantsUploadErr;

      // 4. Upload Preview Screenshot (Optional, fallback 1x1 if not available)
      let previewUrl = '';
      try {
        const previewBlob = await getPreviewBlob(previewCanvas);
        const { error: previewUploadErr } = await supabase.storage
          .from('conversions')
          .upload(`roblox/${slug}/preview.png`, previewBlob, {
            contentType: 'image/png'
          });
        if (!previewUploadErr) {
          const { data } = supabase.storage
            .from('conversions')
            .getPublicUrl(`roblox/${slug}/preview.png`);
          previewUrl = data.publicUrl;
        }
      } catch (e) {
        console.warn('Optional 3D preview upload failed:', e);
      }

      // 5. Get public URLs for Skin, Shirt, and Pants
      const { data: skinUrlData } = supabase.storage.from('conversions').getPublicUrl(`roblox/${slug}/skin.png`);
      const { data: shirtUrlData } = supabase.storage.from('conversions').getPublicUrl(`roblox/${slug}/shirt.png`);
      const { data: pantsUrlData } = supabase.storage.from('conversions').getPublicUrl(`roblox/${slug}/pants.png`);

      // 6. Insert metadata row to shares_roblox table
      const mappedArmType = armType === 'slim' ? 'alex' : 'steve';
      const { error: dbErr } = await supabase
        .from('shares_roblox')
        .insert({
          slug,
          skin_url: skinUrlData.publicUrl,
          shirt_url: shirtUrlData.publicUrl,
          pants_url: pantsUrlData.publicUrl,
          preview_url: previewUrl || null,
          arm_type: mappedArmType,
          creator_name: creatorName || null,
          description: description || null
        });
      if (dbErr) throw dbErr;

      const generatedUrl = `${window.location.origin}/share/roblox/${slug}`;
      setShareUrl(generatedUrl);
      return generatedUrl;
    } catch (err: unknown) {
      console.error('Error during Roblox share:', err);
      if (err instanceof RateLimitError) {
        setMinutesLeft(err.minutesLeft);
        setError(err.message);
      } else {
        const errMsg = err instanceof Error ? err.message : 'An unexpected error occurred while sharing.';
        setError(errMsg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { shareUrl, loading, error, minutesLeft, share };
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  if (dataUrl.startsWith('data:')) {
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const isBase64 = parts[0].indexOf('base64') >= 0;
      const dataStr = parts[1];

      if (isBase64) {
        const bstr = atob(dataStr);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      } else {
        const decoded = decodeURIComponent(dataStr);
        return new Blob([decoded], { type: mime });
      }
    } catch (e) {
      console.warn('Failed to parse data URL synchronously, falling back to fetch:', e);
    }
  }

  const res = await fetch(dataUrl);
  return await res.blob();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to capture canvas image'));
    }, 'image/png');
  });
}

async function getPreviewBlob(previewCanvas: HTMLCanvasElement | null): Promise<Blob> {
  if (previewCanvas) {
    try {
      return await canvasToBlob(previewCanvas);
    } catch (e) {
      console.warn('Failed to convert preview canvas to blob:', e);
    }
  }
  // Programmatic 1x1 transparent canvas fallback to satisfy DB not null constraint if needed
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
