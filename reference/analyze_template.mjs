// Analyze Roblox template images to extract exact pixel coordinates of colored regions
import sharp from 'sharp';

async function analyzeTemplate(filePath, label) {
  const { data, info } = await sharp(filePath)
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  console.log(`\n=== ${label} ===`);
  console.log(`Dimensions: ${info.width}x${info.height}, channels: ${info.channels}`);
  
  // Define the colors we're looking for (RGB)
  const colors = {
    red:    { r: [200,255], g: [0,80],   b: [0,80]   }, // Front
    green:  { r: [0,80],   g: [150,255], b: [0,80]   }, // Right side / specific
    blue:   { r: [0,80],   g: [0,80],    b: [180,255] }, // Back
    yellow: { r: [200,255], g: [200,255], b: [0,80]   }, // Left / side
    cyan:   { r: [0,120],  g: [200,255], b: [200,255] }, // Up
    white:  { r: [240,255], g: [240,255], b: [240,255] }, // Down (white-ish)
  };
  
  // For each color, find bounding box of all matching pixels
  const regions = {};
  
  for (const [colorName, range] of Object.entries(colors)) {
    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
    let pixelCount = 0;
    
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * info.channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = info.channels === 4 ? data[idx + 3] : 255;
        
        if (a < 128) continue; // Skip transparent
        
        if (r >= range.r[0] && r <= range.r[1] &&
            g >= range.g[0] && g <= range.g[1] &&
            b >= range.b[0] && b <= range.b[1]) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          pixelCount++;
        }
      }
    }
    
    if (pixelCount > 0) {
      regions[colorName] = {
        x: minX, y: minY,
        w: maxX - minX + 1,
        h: maxY - minY + 1,
        pixels: pixelCount
      };
    }
  }
  
  console.log('\nColor regions found:');
  for (const [name, r] of Object.entries(regions)) {
    console.log(`  ${name}: x=${r.x}, y=${r.y}, w=${r.w}, h=${r.h} (${r.pixels} px)`);
  }
  
  // Now let's find ALL non-gray, non-transparent rectangular regions
  // by scanning for contiguous colored blocks
  console.log('\n--- Scanning for all distinct colored rectangles ---');
  
  // Create a mask of "colored" (not gray, not transparent) pixels
  const isColored = new Uint8Array(info.width * info.height);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = info.channels === 4 ? data[idx + 3] : 255;
      
      if (a < 128) continue;
      
      // Check if it's gray (r≈g≈b) or very light gray (background)
      const maxDiff = Math.max(Math.abs(r-g), Math.abs(r-b), Math.abs(g-b));
      const avg = (r + g + b) / 3;
      
      // If significant color difference and not too dark/light gray
      if (maxDiff > 30 || (avg < 50) || (avg > 245 && maxDiff < 10)) {
        // It's colored (not the gray background)
        if (maxDiff > 30) {
          isColored[y * info.width + x] = 1;
        }
      }
    }
  }
  
  // Flood fill to find connected components
  const visited = new Uint8Array(info.width * info.height);
  const rectangles = [];
  
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (isColored[y * info.width + x] && !visited[y * info.width + x]) {
        // BFS to find connected component
        let minX = x, minY = y, maxX = x, maxY = y;
        const queue = [[x, y]];
        visited[y * info.width + x] = 1;
        let count = 0;
        
        // Get the color of the first pixel
        const startIdx = (y * info.width + x) * info.channels;
        const startR = data[startIdx];
        const startG = data[startIdx + 1];
        const startB = data[startIdx + 2];
        
        while (queue.length > 0) {
          const [cx, cy] = queue.shift();
          count++;
          minX = Math.min(minX, cx);
          minY = Math.min(minY, cy);
          maxX = Math.max(maxX, cx);
          maxY = Math.max(maxY, cy);
          
          // Check 4 neighbors
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < info.width && ny >= 0 && ny < info.height) {
              const nIdx = ny * info.width + nx;
              if (isColored[nIdx] && !visited[nIdx]) {
                // Check if same general color
                const pIdx = (ny * info.width + nx) * info.channels;
                const pr = data[pIdx];
                const pg = data[pIdx + 1];
                const pb = data[pIdx + 2];
                if (Math.abs(pr - startR) < 60 && Math.abs(pg - startG) < 60 && Math.abs(pb - startB) < 60) {
                  visited[nIdx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }
        }
        
        if (count > 100) { // Only significant regions
          const w = maxX - minX + 1;
          const h = maxY - minY + 1;
          rectangles.push({
            x: minX, y: minY, w, h,
            pixels: count,
            color: `rgb(${startR},${startG},${startB})`,
            colorName: identifyColor(startR, startG, startB)
          });
        }
      }
    }
  }
  
  rectangles.sort((a, b) => a.y - b.y || a.x - b.x);
  
  console.log('\nDetected rectangles:');
  for (const r of rectangles) {
    console.log(`  ${r.colorName.padEnd(8)} x=${String(r.x).padStart(3)}, y=${String(r.y).padStart(3)}, w=${String(r.w).padStart(3)}, h=${String(r.h).padStart(3)} | ${r.color} | ${r.pixels}px`);
  }
}

function identifyColor(r, g, b) {
  if (r > 180 && g < 100 && b < 100) return 'RED';
  if (r < 100 && g > 150 && b < 100) return 'GREEN';
  if (r < 100 && g < 100 && b > 150) return 'BLUE';
  if (r > 180 && g > 180 && b < 100) return 'YELLOW';
  if (r < 120 && g > 180 && b > 180) return 'CYAN';
  if (r > 200 && g > 200 && b > 200) return 'WHITE';
  return `rgb(${r},${g},${b})`;
}

await analyzeTemplate('reference/shirt_template.png', 'SHIRT TEMPLATE');
await analyzeTemplate('reference/pants_template.png', 'PANTS TEMPLATE');
