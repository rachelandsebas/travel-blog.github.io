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
    const metaPathEn = path.join(tripDir, '_meta-en.md');
    
    if (!fs.existsSync(metaPathEn)) return;
    
    const tripMeta = matter(fs.readFileSync(metaPathEn, 'utf-8')).data;
    const tripCountry = tripMeta.country;
    
    if (!tripCountry) return;

    const postFiles = fs.readdirSync(tripDir).filter(f => f.endsWith('.md') && !f.startsWith('_meta-'));
    
    postFiles.forEach(postFile => {
      const postPath = path.join(tripDir, postFile);
      let post = matter(fs.readFileSync(postPath, 'utf-8'));
      
      if (!post.data.country || post.data.country === "" || (Array.isArray(post.data.country) && post.data.country.length === 0)) {
        post.data.country = tripCountry;
        fs.writeFileSync(postPath, matter.stringify(post.content, post.data));
        console.log(`Updated country for post: ${slug}/${postFile} -> ${tripCountry}`);
      }
    });
  });
});

console.log('Post country metadata synced!');
