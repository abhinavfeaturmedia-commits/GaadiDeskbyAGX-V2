const fs = require('fs');
const path = require('path');

const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const logoPath = path.join(__dirname, '..', 'gaadidesk_logo.png');

if (fs.existsSync(resDir) && fs.existsSync(logoPath)) {
  const targets = [
    'mipmap-hdpi/ic_launcher.png',
    'mipmap-hdpi/ic_launcher_round.png',
    'mipmap-hdpi/ic_launcher_foreground.png',
    'mipmap-mdpi/ic_launcher.png',
    'mipmap-mdpi/ic_launcher_round.png',
    'mipmap-mdpi/ic_launcher_foreground.png',
    'mipmap-xhdpi/ic_launcher.png',
    'mipmap-xhdpi/ic_launcher_round.png',
    'mipmap-xhdpi/ic_launcher_foreground.png',
    'mipmap-xxhdpi/ic_launcher.png',
    'mipmap-xxhdpi/ic_launcher_round.png',
    'mipmap-xxhdpi/ic_launcher_foreground.png',
    'mipmap-xxxhdpi/ic_launcher.png',
    'mipmap-xxxhdpi/ic_launcher_round.png',
    'mipmap-xxxhdpi/ic_launcher_foreground.png',
    'drawable/splash.png',
    'drawable-port-hdpi/splash.png',
    'drawable-port-mdpi/splash.png',
    'drawable-port-xhdpi/splash.png',
    'drawable-port-xxhdpi/splash.png',
    'drawable-port-xxxhdpi/splash.png',
    'drawable-land-hdpi/splash.png',
    'drawable-land-mdpi/splash.png',
    'drawable-land-xhdpi/splash.png',
    'drawable-land-xxhdpi/splash.png',
    'drawable-land-xxxhdpi/splash.png'
  ];

  targets.forEach(rel => {
    const dest = path.join(resDir, rel);
    const destDir = path.dirname(dest);
    if (fs.existsSync(destDir)) {
      fs.copyFileSync(logoPath, dest);
      console.log('Updated:', rel);
    }
  });
  console.log('Android resources updated successfully!');
} else {
  console.log('Android res directory or logo not found, skipping Android icon copy.');
}
