import sharp from 'sharp';

async function main() {
  const image = sharp('./.agents/extracted_texture.png');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const faces = [
    { key: 'right', startX: 48, startY: 8 },
    { key: 'left', startX: 32, startY: 8 },
    { key: 'top', startX: 40, startY: 0 },
    { key: 'bottom', startX: 48, startY: 0 },
    { key: 'front', startX: 40, startY: 8 },
    { key: 'back', startX: 56, startY: 8 },
  ];

  for (const face of faces) {
    console.log(`\n--- Face: ${face.key.toUpperCase()} ---`);
    for (let row = 0; row < 8; row++) {
      let line = '';
      for (let col = 0; col < 8; col++) {
        const px = face.startX + col;
        const py = face.startY + row;
        const idx = (py * info.width + px) * info.channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = info.channels === 4 ? data[idx + 3] : 255;
        
        if (alpha > 10) {
          line += ` [${col}:${r},${g},${b}]`;
        } else {
          line += ` [${col}:trans]`;
        }
      }
      console.log(`Row ${row}:${line}`);
    }
  }
}

main().catch(console.error);
