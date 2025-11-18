const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/icon.svg');
  const publicDir = path.join(__dirname, '../public');

  // SVG 파일 읽기
  const svgBuffer = fs.readFileSync(svgPath);

  // 생성할 아이콘 크기들
  const sizes = [192, 512];

  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);

    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated ${outputPath}`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
