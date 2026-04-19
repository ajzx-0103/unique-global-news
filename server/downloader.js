import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

export async function downloadImage(imageUrl, articleTitle) {
  if (!imageUrl) return null;
  
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      },
      timeout: 15000
    });
    
    if (!response.ok) {
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = getExtension(contentType);
    
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex');
    const filename = `${hash}${ext}`;
    const filepath = path.join(imagesDir, filename);
    const localPath = `/images/${filename}`;
    
    if (fs.existsSync(filepath)) {
      return localPath;
    }
    
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`  Downloaded: ${filename}`);
    
    return localPath;
  } catch (error) {
    return null;
  }
}

export async function downloadImagesBatch(items) {
  const results = [];
  for (const { url, title } of items) {
    const localPath = await downloadImage(url, title);
    results.push({ url, localPath });
    await sleep(300);
  }
  return results;
}

function getExtension(contentType) {
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  };
  return map[contentType] || '.jpg';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { imagesDir };
