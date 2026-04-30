const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SRC_DIR = '/Users/sebastianregalado/Desktop/Sebas/repos/travel-blog/src';
const POSTS_DIR = path.join(SRC_DIR, 'posts');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const years = fs.readdirSync(POSTS_DIR).filter(f => fs.statSync(path.join(POSTS_DIR, f)).isDirectory());

years.forEach(year => {
  const yearDir = path.join(POSTS_DIR, year);
  const trips = fs.readdirSync(yearDir).filter(f => fs.statSync(path.join(yearDir, f)).isDirectory());
  
  trips.forEach(slug => {
    const tripDir = path.join(yearDir, slug);
    const files = fs.readdirSync(tripDir);
    
    const postFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('_meta-'));
    
    if (postFiles.length === 0) {
      console.log(`Creating placeholder posts for ${slug}...`);
      
      // Read metadata from _meta-en.md
      const metaPathEn = path.join(tripDir, '_meta-en.md');
      const metaPathEs = path.join(tripDir, '_meta-es.md');
      
      if (!fs.existsSync(metaPathEn)) return;
      
      const metaEn = matter(fs.readFileSync(metaPathEn, 'utf-8')).data;
      const metaEs = fs.existsSync(metaPathEs) ? matter(fs.readFileSync(metaPathEs, 'utf-8')).data : metaEn;

      const enContent = `---
title: "${metaEn.title}"
date: "${metaEn.date}"
lang: "en"
country: "${metaEn.country || ''}"
theme: "default"
excerpt: "Highlights and stories from our trip to ${metaEn.country || 'this destination'}."
cover_image: ""
counterpart: "main-es"
---

Post coming soon!
`;

      const esContent = `---
title: "${metaEs.title}"
date: "${metaEs.date}"
lang: "es"
country: "${metaEs.country || ''}"
theme: "default"
excerpt: "Momentos destacados e historias de nuestro viaje a ${metaEs.country || 'este destino'}."
cover_image: ""
counterpart: "main-en"
---

¡Publicación próximamente!
`;

      fs.writeFileSync(path.join(tripDir, 'main-en.md'), enContent);
      fs.writeFileSync(path.join(tripDir, 'main-es.md'), esContent);
    }
  });
});

console.log('Placeholder posts generated!');
