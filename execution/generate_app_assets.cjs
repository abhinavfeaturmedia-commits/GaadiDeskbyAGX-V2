const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateAssets() {
  const rootDir = path.join(__dirname, '..');
  const sourceLogo = path.join(rootDir, 'gaadidesk_logo.png');
  const resDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(sourceLogo)) {
    console.error('Source logo gaadidesk_logo.png not found!');
    process.exit(1);
  }

  console.log('--- Generating GaadiDesk App Icons & Splash Assets ---');

  // Load source image
  const image = sharp(sourceLogo);
  const metadata = await image.metadata();

  // Dark brand background color matching the app (#0B0F19 / rgb(11, 15, 25))
  const brandBg = { r: 11, g: 15, b: 25, alpha: 1 };
  const brandBgHex = '#0B0F19';

  // 1. Crop out the inner dark card from source (removing outer white border)
  // Non-white bounding box was found to be from x:26, y:24 to w:1201, h:1204
  const croppedCardBuffer = await sharp(sourceLogo)
    .extract({ left: 30, top: 30, width: 1194, height: 1194 })
    .toBuffer();

  // 2. Extract emblem specifically (the car + circular meter)
  // Emblem bounding box roughly top: 100, left: 160, width: 880, height: 700
  const emblemBuffer = await sharp(croppedCardBuffer)
    .extract({ left: 150, top: 80, width: 894, height: 700 })
    .toBuffer();

  // 3. Create a clean padded Emblem for Adaptive Icon Foregrounds
  // Android Adaptive Icon foreground requires 108dp with a 66dp safe center circle (~61% scale)
  const createForeground = async (size) => {
    // Emblem size inside the canvas (approx 58% of canvas to be completely safe in circle/squircle)
    const emblemTargetSize = Math.round(size * 0.58);
    const resizedEmblem = await sharp(emblemBuffer)
      .resize(emblemTargetSize, emblemTargetSize, { fit: 'inside' })
      .toBuffer();

    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resizedEmblem, gravity: 'center' }])
      .png()
      .toBuffer();
  };

  // 4. Create Legacy Icons (Square with rounded corners or Circle on dark brand background)
  const createLegacyIcon = async (size, isRound = false) => {
    const emblemTargetSize = Math.round(size * (isRound ? 0.62 : 0.68));
    const resizedEmblem = await sharp(emblemBuffer)
      .resize(emblemTargetSize, emblemTargetSize, { fit: 'inside' })
      .toBuffer();

    // Base icon on brandBg
    let icon = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: brandBg
      }
    }).composite([{ input: resizedEmblem, gravity: 'center' }]);

    if (isRound) {
      // Apply circular mask for round icons
      const radius = size / 2;
      const circleSvg = Buffer.from(
        `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="#fff"/></svg>`
      );
      icon = sharp(await icon.png().toBuffer())
        .composite([{ input: circleSvg, blend: 'dest-in' }]);
    } else {
      // Rounded squircle mask for legacy square icons
      const r = Math.round(size * 0.22);
      const roundedSvg = Buffer.from(
        `<svg width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`
      );
      icon = sharp(await icon.png().toBuffer())
        .composite([{ input: roundedSvg, blend: 'dest-in' }]);
    }

    return icon.png().toBuffer();
  };

  // 5. Create Crisp Splash Logo for Android layer-list (Transparent or Dark background, uncompressed full logo)
  const splashLogoBuffer = await sharp(croppedCardBuffer)
    .resize(512, 512, { fit: 'inside' })
    .png()
    .toBuffer();

  // Create density-specific splash screens with centered logo on brand background
  const createSplashScreen = async (width, height) => {
    const logoSize = Math.min(Math.round(Math.min(width, height) * 0.55), 400);
    const resizedLogo = await sharp(croppedCardBuffer)
      .resize(logoSize, logoSize, { fit: 'inside' })
      .toBuffer();

    return sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: brandBg
      }
    })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .png()
      .toBuffer();
  };

  // Generate Mipmap densities
  const densities = [
    { name: 'mdpi', iconSize: 48, fgSize: 108, splashW: 320, splashH: 480 },
    { name: 'hdpi', iconSize: 72, fgSize: 162, splashW: 480, splashH: 800 },
    { name: 'xhdpi', iconSize: 96, fgSize: 216, splashW: 720, splashH: 1280 },
    { name: 'xxhdpi', iconSize: 144, fgSize: 324, splashW: 960, splashH: 1600 },
    { name: 'xxxhdpi', iconSize: 192, fgSize: 432, splashW: 1280, splashH: 1920 }
  ];

  for (const d of densities) {
    const mipmapPath = path.join(resDir, `mipmap-${d.name}`);
    if (fs.existsSync(mipmapPath)) {
      // 1. ic_launcher.png
      const iconBuf = await createLegacyIcon(d.iconSize, false);
      fs.writeFileSync(path.join(mipmapPath, 'ic_launcher.png'), iconBuf);

      // 2. ic_launcher_round.png
      const iconRoundBuf = await createLegacyIcon(d.iconSize, true);
      fs.writeFileSync(path.join(mipmapPath, 'ic_launcher_round.png'), iconRoundBuf);

      // 3. ic_launcher_foreground.png
      const fgBuf = await createForeground(d.fgSize);
      fs.writeFileSync(path.join(mipmapPath, 'ic_launcher_foreground.png'), fgBuf);

      console.log(`[Mipmap] Updated mipmap-${d.name} icons.`);
    }

    // Portrait Splash
    const portDir = path.join(resDir, `drawable-port-${d.name}`);
    if (fs.existsSync(portDir)) {
      const portSplash = await createSplashScreen(d.splashW, d.splashH);
      fs.writeFileSync(path.join(portDir, 'splash.png'), portSplash);
      console.log(`[Splash] Updated drawable-port-${d.name}/splash.png`);
    }

    // Landscape Splash
    const landDir = path.join(resDir, `drawable-land-${d.name}`);
    if (fs.existsSync(landDir)) {
      const landSplash = await createSplashScreen(d.splashH, d.splashW);
      fs.writeFileSync(path.join(landDir, 'splash.png'), landSplash);
      console.log(`[Splash] Updated drawable-land-${d.name}/splash.png`);
    }
  }

  // Generate main drawable splash assets
  const mainDrawableDir = path.join(resDir, 'drawable');
  if (fs.existsSync(mainDrawableDir)) {
    fs.writeFileSync(path.join(mainDrawableDir, 'splash_logo.png'), splashLogoBuffer);
    console.log('[Splash] Updated drawable/splash_logo.png');
  }

  // Update public web assets
  if (fs.existsSync(publicDir)) {
    const favicon = await createLegacyIcon(64, false);
    const appleIcon = await createLegacyIcon(180, false);
    fs.writeFileSync(path.join(publicDir, 'favicon.png'), favicon);
    fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
    console.log('[Web] Updated public favicon and apple touch icons');
  }

  console.log('--- Asset Generation Complete Successfully! ---');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
