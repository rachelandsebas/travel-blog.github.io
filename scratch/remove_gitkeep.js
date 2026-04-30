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
    
    if (fs.existsSync(imgDir)) {
      const gitkeepPath = path.join(imgDir, '.gitkeep');
      if (fs.existsSync(gitkeepPath)) {
        fs.unlinkSync(gitkeepPath);
        console.log(`Deleted .gitkeep from ${year}/${slug}/images`);
      }
    }
  });
});

console.log('Finished removing all .gitkeep files.');
