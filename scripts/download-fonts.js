const https = require('https');
const fs = require('fs');
const path = require('path');

const fonts = [
  {
    name: 'Inter-Regular.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2'
  },
  {
    name: 'Inter-Medium.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7.woff2'
  },
  {
    name: 'Inter-SemiBold.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2pL7.woff2'
  },
  {
    name: 'Inter-Bold.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1pL7.woff2'
  }
];

const fontsDir = path.join(__dirname, '../public/fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Download each font
fonts.forEach(font => {
  const filePath = path.join(fontsDir, font.name);
  const file = fs.createWriteStream(filePath);

  https.get(font.url, response => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${font.name}`);
    });
  }).on('error', err => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${font.name}:`, err.message);
  });
}); 