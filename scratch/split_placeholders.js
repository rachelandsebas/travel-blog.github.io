const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const SRC_DIR = '/Users/sebastianregalado/Desktop/Sebas/repos/travel-blog/src';
const POSTS_DIR = path.join(SRC_DIR, 'posts');

const cityToCountry = {
  'ndjamena': 'Chad',
  'yamena': 'Chad',
  'greece': 'Greece',
  'grecia': 'Greece',
  'baltimore': 'USA',
  'knoxville': 'USA',
  'halifax': 'Canada',
  'toronto': 'Canada',
  'montreal': 'Canada',
  'vancouver': 'Canada',
  'banff': 'Canada',
  'guayaquil': 'Ecuador',
  'ecuador': 'Ecuador',
  'galapagos': 'Ecuador',
  'thailand': 'Thailand',
  'tailandia': 'Thailand',
  'uruguay': 'Uruguay',
  'chile': 'Chile',
  'brazil': 'Brazil',
  'brasil': 'Brazil',
  'bolivia': 'Bolivia',
  'mexico': 'Mexico',
  'méxico': 'Mexico',
  'south africa': 'South Africa',
  'sudáfrica': 'South Africa'
};

function getCountriesFromTitle(title) {
  const normalized = title.toLowerCase();
  const found = new Set();
  Object.keys(cityToCountry).forEach(key => {
    if (normalized.includes(key)) {
      const val = cityToCountry[key];
      if (Array.isArray(val)) val.forEach(v => found.add(v));
      else found.add(val);
    }
  });
  return Array.from(found);
}

const years = fs.readdirSync(POSTS_DIR).filter(f => fs.statSync(path.join(POSTS_DIR, f)).isDirectory());

years.forEach(year => {
  const yearDir = path.join(POSTS_DIR, year);
  const trips = fs.readdirSync(yearDir).filter(f => fs.statSync(path.join(yearDir, f)).isDirectory());
  
  trips.forEach(slug => {
    const tripDir = path.join(yearDir, slug);
    const metaPathEn = path.join(tripDir, '_meta-en.md');
    const metaPathEs = path.join(tripDir, '_meta-es.md');
    
    if (!fs.existsSync(metaPathEn)) return;
    
    let fileEn = matter(fs.readFileSync(metaPathEn, 'utf-8'));
    let fileEs = fs.existsSync(metaPathEs) ? matter(fs.readFileSync(metaPathEs, 'utf-8')) : { data: {}, content: '' };

    const countries = getCountriesFromTitle(fileEn.data.title);
    
    // Fix missing country in _meta
    if (!fileEn.data.country && countries.length > 0) {
      fileEn.data.country = countries.length === 1 ? countries[0] : countries;
      fs.writeFileSync(metaPathEn, matter.stringify(fileEn.content, fileEn.data));
      
      if (fs.existsSync(metaPathEs)) {
        fileEs.data.country = fileEn.data.country;
        fs.writeFileSync(metaPathEs, matter.stringify(fileEs.content, fileEs.data));
      }
      console.log(`Updated meta for ${slug} with countries: ${countries.join(', ')}`);
    }

    const postFiles = fs.readdirSync(tripDir).filter(f => f.endsWith('.md') && !f.startsWith('_meta-'));
    
    // If we have placeholders (like main-en.md) but need to split them
    if (postFiles.length === 1 && postFiles[0] === 'main-en.md') {
       // We'll replace the single placeholder with multiple ones if needed
    }

    if (countries.length > 1 && (postFiles.length === 0 || (postFiles.length <= 2 && postFiles.includes('main-en.md')))) {
      // Remove old generic placeholders
      if (fs.existsSync(path.join(tripDir, 'main-en.md'))) fs.unlinkSync(path.join(tripDir, 'main-en.md'));
      if (fs.existsSync(path.join(tripDir, 'main-es.md'))) fs.unlinkSync(path.join(tripDir, 'main-es.md'));

      countries.forEach(country => {
        const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
        
        const enPost = `---
title: "${country} - ${fileEn.data.title}"
date: "${fileEn.data.date}"
lang: "en"
country: "${country}"
theme: "default"
excerpt: "Highlights from ${country} during our ${fileEn.data.title} trip."
cover_image: ""
counterpart: "${countrySlug}-es"
---

Post about ${country} coming soon!
`;
        const esPost = `---
title: "${country} - ${fileEs.data.title}"
date: "${fileEs.data.date}"
lang: "es"
country: "${country}"
theme: "default"
excerpt: "Lo mejor de ${country} durante nuestro viaje ${fileEs.data.title}."
cover_image: ""
counterpart: "${countrySlug}"
---

¡Publicación sobre ${country} próximamente!
`;
        fs.writeFileSync(path.join(tripDir, `${countrySlug}-en.md`), enPost);
        fs.writeFileSync(path.join(tripDir, `${countrySlug}-es.md`), esPost);
        console.log(`  Created split posts for ${country} in ${slug}`);
      });
    }
  });
});

console.log('Split placeholders generated!');
