const fs = require('fs');
const path = require('path');

const SRC_DIR = '/Users/sebastianregalado/Desktop/Sebas/repos/travel-blog/src';
const POSTS_DIR = path.join(SRC_DIR, 'posts');

const years = fs.readdirSync(POSTS_DIR).filter(f => fs.statSync(path.join(POSTS_DIR, f)).isDirectory());

years.forEach(year => {
  const yearDir = path.join(POSTS_DIR, year);
  const trips = fs.readdirSync(yearDir).filter(f => fs.statSync(path.join(yearDir, f)).isDirectory());
  
  trips.forEach(slug => {
    const tripDir = path.join(yearDir, slug);
    const imgDir = path.join(tripDir, 'images');
    
    if (!fs.existsSync(imgDir)) {
      fs.mkdirSync(imgDir, { recursive: true });
      console.log(`Created images folder for ${year}/${slug}`);
    }
  });
});

console.log('Finished checking all trip image folders.');
