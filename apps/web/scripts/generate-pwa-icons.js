#!/usr/bin/env node
/**
 * Generates PWA icons (192x192 and 512x512) from seal_color.png on white background.
 * Run: node scripts/generate-pwa-icons.js
 */
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const publicDir = path.join(__dirname, '../public')
const sourcePath = path.join(publicDir, 'images/seal_color.png')
const iconsDir = path.join(publicDir, 'icons')

const sizes = [192, 512]

async function main() {
  fs.mkdirSync(iconsDir, { recursive: true })

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}.png`)
    const iconSize = Math.floor(size * 0.75)
    const padding = Math.round((size - iconSize) / 2)

    const icon = await sharp(sourcePath)
      .resize(iconSize, iconSize)
      .png()
      .toBuffer()

    const whiteBg = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    await sharp(whiteBg)
      .composite([{ input: icon, left: padding, top: padding }])
      .png()
      .toFile(outputPath)
    console.log(`Generated ${outputPath}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
