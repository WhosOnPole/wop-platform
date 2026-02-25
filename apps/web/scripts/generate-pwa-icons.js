#!/usr/bin/env node
/**
 * Generates PWA icons (192x192 and 512x512) from seal_white.png for manifest.json.
 * Run: node scripts/generate-pwa-icons.js
 */
const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const publicDir = path.join(__dirname, '../public')
const sourcePath = path.join(publicDir, 'images/seal_white.png')
const iconsDir = path.join(publicDir, 'icons')

const sizes = [192, 512]

async function main() {
  fs.mkdirSync(iconsDir, { recursive: true })

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}.png`)
    await sharp(sourcePath)
      .resize(size, size)
      .png()
      .toFile(outputPath)
    console.log(`Generated ${outputPath}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
