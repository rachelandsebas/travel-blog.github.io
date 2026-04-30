const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SRC_DIR = '/Users/sebastianregalado/Desktop/Sebas/repos/travel-blog/src';
const POSTS_DIR = path.join(SRC_DIR, 'posts');

const years = fs.readdirSync(POSTS_DIR).filter(f => fs.statSync(path.join(POSTS_DIR, f)).isDirectory());

years.forEach(year => {
  const yearDir = path.join(POSTS_DIR, year);
  const trips = fs.readdirSync(yearDir).filter(f => fs.statSync(path.join(yearDir, f)).isDirectory());
  
  trips.forEach(slug => {
    const tripDir = path.join(yearDir, slug);
    const imgDir = path.join(tripDir, 'images');
    
    if (!fs.existsSync(imgDir)) return;

    const images = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f));
    if (images.length === 0) return;

    const firstImage = `images/${images[0]}`;
    console.log(`Processing trip: ${slug} (found ${images.length} images)`);

    const files = fs.readdirSync(tripDir).filter(f => f.endsWith('.md'));

    files.forEach(file => {
      const filePath = path.join(tripDir, file);
      let { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
      let changed = false;

      // Update cover_image if empty
      if (!data.cover_image || data.cover_image === "") {
        data.cover_image = firstImage;
        changed = true;
        console.log(`  Updated cover_image for ${file}`);
      }

      // If it's a post (not a meta file) and content is minimal/placeholder, add the image
      if (!file.startsWith('_meta-')) {
        const isPlaceholder = content.trim() === "Post coming soon!" || content.trim() === "¡Publicación próximamente!" || content.trim().startsWith("Post about") || content.trim().startsWith("¡Publicación sobre");
        
        if (isPlaceholder && !content.includes('![')) {
          content += `\n\n![${data.title || 'Trip image'}](${firstImage})\n`;
          changed = true;
          console.log(`  Added image to content of ${file}`);
        }
      }

      if (changed) {
        fs.writeFileSync(filePath, matter.stringify(content, data));
      }
    });
  });
});

console.log('Finished populating images.');
