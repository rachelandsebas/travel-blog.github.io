const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const BASE_URL = process.env.BASE_URL || '';

const ISO_CODES = {
  'south korea': 'kr',
  'korea': 'kr',
  'south-korea': 'kr',
  'japan': 'jp',
  'japón': 'jp',
  'spain': 'es',
  'españa': 'es',
  'united states of america': 'us',
  'usa': 'us',
  'united states': 'us',
  'united-states-of-america': 'us',
  'united kingdom': 'gb',
  'uk': 'gb',
  'united-kingdom': 'gb',
  'reino unido': 'gb',
  'germany': 'de',
  'alemania': 'de',
  'france': 'fr',
  'francia': 'fr',
  'italy': 'it',
  'italia': 'it',
  'canada': 'ca',
  'canadá': 'ca',
  'mexico': 'mx',
  'méxico': 'mx',
  'brazil': 'br',
  'brasil': 'br',
  'chad': 'td',
  'greece': 'gr',
  'grecia': 'gr',
  'ecuador': 'ec',
  'bolivia': 'bo',
  'thailand': 'th',
  'tailandia': 'th',
  'uruguay': 'uy',
  'chile': 'cl',
  'south africa': 'za',
  'sudáfrica': 'za',
  'south-africa': 'za',
  'hong kong': 'hk',
  'hong-kong': 'hk',
  'china': 'cn',
  'iceland': 'is',
  'islandia': 'is',
  'switzerland': 'ch',
  'suiza': 'ch'
};

function getFlagHtml(countryName, isLarge = false) {
  if (!countryName) return '';
  const countries = Array.isArray(countryName) ? countryName : [countryName];
  return countries.map(c => {
    const code = ISO_CODES[c.toLowerCase()];
    if (code) {
      const size = isLarge ? 'w80' : 'w40';
      return `<img src="https://flagcdn.com/${size}/${code}.png" class="title-flag" alt="${c} flag">`;
    }
    return '';
  }).filter(h => h !== '').join(' ');
}

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const POSTS_DIR = path.join(SRC_DIR, 'posts');
const TEMPLATES_DIR = path.join(SRC_DIR, 'templates');

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Clear dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
ensureDir(DIST_DIR);

// Copy assets
const assetsDist = path.join(DIST_DIR, 'assets');
ensureDir(assetsDist);
fs.cpSync(path.join(SRC_DIR, 'assets'), assetsDist, { recursive: true });

// Read templates
const homeTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'home.html'), 'utf-8');
const postTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'post.html'), 'utf-8');
const tripTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'trip.html'), 'utf-8');

// Function to get a marked renderer for a specific trip
function getMarkedRenderer(tripSlug, assetPath) {
  const renderer = new marked.Renderer();
  renderer.image = function(token) {
    let href, title, text;
    if (typeof token === 'object' && token !== null && 'href' in token) {
      href = token.href;
      title = token.title;
      text = token.text;
    } else {
      href = arguments[0];
      title = arguments[1];
      text = arguments[2];
    }

    const isAbsolute = href && (typeof href === 'string') && (href.startsWith('http://') || href.startsWith('https://'));
    let src = isAbsolute ? href : BASE_URL + '/' + (href ? href.replace(/^\//, '') : '');
    
    // Support trip-local images (e.g. ![Alt](images/photo.jpg))
    if (!isAbsolute && href && href.startsWith('images/')) {
      src = `${assetPath}assets/images/trips/${tripSlug}/${href.replace('images/', '')}`;
    }
    
    let imgHtml = `<img src="${src}" alt="${text || ''}"`;
    if (title) imgHtml += ` title="${title}"`;
    imgHtml += ` />`;
    
    return `
      <div class="image-wrapper">
        ${imgHtml}
        ${text ? `<div class="image-caption">${text}</div>` : ''}
      </div>
    `;
  };
  return renderer;
}

// State
const tripsByLang = { en: [], es: [] };
const postsByLang = { en: [], es: [] };

// Read and parse all years and trips
const yearFolders = fs.readdirSync(POSTS_DIR).filter(f => fs.statSync(path.join(POSTS_DIR, f)).isDirectory());

for (const yearStr of yearFolders) {
  const yearDir = path.join(POSTS_DIR, yearStr);
  const tripFolders = fs.readdirSync(yearDir).filter(f => fs.statSync(path.join(yearDir, f)).isDirectory());
  
  for (const tripSlug of tripFolders) {
    const tripDir = path.join(yearDir, tripSlug);
    const files = fs.readdirSync(tripDir);

    // Copy trip images to dist
    const tripImagesSrc = path.join(tripDir, 'images');
    if (fs.existsSync(tripImagesSrc)) {
      const tripImagesDist = path.join(DIST_DIR, 'assets/images/trips', tripSlug);
      ensureDir(tripImagesDist);
      fs.cpSync(tripImagesSrc, tripImagesDist, { recursive: true });
    }

    // Process Meta files
    const processMeta = (lang) => {
      const metaFile = path.join(tripDir, `_meta-${lang}.md`);
      if (fs.existsSync(metaFile)) {
        const content = fs.readFileSync(metaFile, 'utf-8');
        const parsed = matter(content);
        const assetPath = lang === 'en' ? './' : '../'; // For home page context
        const renderer = getMarkedRenderer(tripSlug, assetPath);
        
        // Auto-assign cover image if missing
        let coverImage = parsed.data.cover_image;
        if (!coverImage || coverImage === "") {
          const imgDir = path.join(tripDir, 'images');
          if (fs.existsSync(imgDir)) {
            const images = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f));
            if (images.length > 0) {
              coverImage = `images/${images[0]}`;
            }
          }
        }

        tripsByLang[lang].push({
          ...parsed.data,
          cover_image: coverImage,
          slug: tripSlug,
          year: yearStr,
          htmlContent: marked.parse(parsed.content, { renderer })
        });
      }
    };
    processMeta('en');
    processMeta('es');

    // Process Posts
    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('_meta-')) continue;
      
      const content = fs.readFileSync(path.join(tripDir, file), 'utf-8');
      const parsed = matter(content);
      
      // Generate a unique slug by prepending tripSlug to filename
      const fileSlug = file.replace('.md', '');
      const uniqueSlug = `${tripSlug}-${fileSlug}`;

      // Auto-assign cover image if missing and trip has images
      let coverImage = parsed.data.cover_image;
      let rawContent = parsed.content;

      const imgDir = path.join(tripDir, 'images');
      if (fs.existsSync(imgDir)) {
        const images = fs.readdirSync(imgDir).filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f));
        if (images.length > 0) {
          const firstImage = `images/${images[0]}`;
          if (!coverImage || coverImage === "") {
            coverImage = firstImage;
          }
          // Dynamically inject image into placeholder posts if missing
          const isPlaceholder = rawContent.trim() === "Post coming soon!" || rawContent.trim() === "¡Publicación próximamente!" || rawContent.trim().startsWith("Post about") || rawContent.trim().startsWith("¡Publicación sobre");
          if (isPlaceholder && !rawContent.includes('![')) {
            rawContent += `\n\n![${parsed.data.title || 'Trip image'}](${firstImage})\n`;
          }
        }
      }
      
      const postData = {
        ...parsed.data,
        cover_image: coverImage,
        rawContent: rawContent,
        slug: uniqueSlug,
        fileSlug: fileSlug, // Keep original filename slug for counterpart matching
        tripSlug: tripSlug,
        year: yearStr
      };
      
      if (parsed.data.lang === 'en') postsByLang.en.push(postData);
      if (parsed.data.lang === 'es') postsByLang.es.push(postData);
    }
  }
}

// Sort posts by date (descending)
postsByLang.en.sort((a, b) => new Date(b.date) - new Date(a.date));
postsByLang.es.sort((a, b) => new Date(b.date) - new Date(a.date));

// Sort trips by date (descending for menu, ascending for timeline)
tripsByLang.en.sort((a, b) => new Date(b.date) - new Date(a.date));
tripsByLang.es.sort((a, b) => new Date(b.date) - new Date(a.date));

// Helper: Generate Burger Menu
function getBurgerMenuHtml(lang, currentPath) {
  const trips = tripsByLang[lang];
  const title = lang === 'en' ? 'My Trips' : 'Mis Viajes';
  
  const groupedTrips = {};
  trips.forEach(trip => {
    if (!groupedTrips[trip.year]) {
      groupedTrips[trip.year] = [];
    }
    groupedTrips[trip.year].push(trip);
  });

  const years = Object.keys(groupedTrips).sort((a, b) => b - a);

  let menuItems = '';
  years.forEach(year => {
    menuItems += `<details class="burger-menu-year" open><summary>${year}</summary><ul>`;
    groupedTrips[year].forEach(trip => {
      const tripUrl = BASE_URL + (lang === 'en' ? `/trips/${trip.slug}/index.html` : `/es/trips/${trip.slug}/index.html`);
      menuItems += `<li><a href="${tripUrl}">${trip.title}</a></li>`;
    });
    menuItems += `</ul></details>`;
  });

  return `
    <div class="burger-menu-overlay" id="burger-menu-overlay"></div>
    <div class="burger-menu" id="burger-menu">
      <button class="burger-menu-close" id="burger-menu-close">&times;</button>
      <h2>${title}</h2>
      <div class="burger-menu-list">
        ${menuItems}
      </div>
    </div>
  `;
}

// Helper: Generate Timeline
function getTimelineHtml(lang) {
  // Timeline requires ascending order
  const trips = [...tripsByLang[lang]].sort((a, b) => new Date(a.date) - new Date(b.date));
  let items = '';
  
  trips.forEach(trip => {
    const tripUrl = BASE_URL + (lang === 'en' ? `/trips/${trip.slug}/index.html` : `/es/trips/${trip.slug}/index.html`);
    
    let imgSrc = '';
    if (trip.cover_image) {
      if (trip.cover_image.startsWith('http')) {
        imgSrc = trip.cover_image;
      } else if (trip.cover_image.startsWith('images/')) {
        imgSrc = `${BASE_URL}/assets/images/trips/${trip.slug}/${trip.cover_image.replace('images/', '')}`;
      } else {
        imgSrc = `${BASE_URL}/assets/${trip.cover_image.replace(/^assets\//, '')}`;
      }
    }
      
    items += `
      <a href="${tripUrl}" class="timeline-item">
        <div class="timeline-circle" style="background-image: url('${imgSrc}')"></div>
        <div class="timeline-title">${trip.title}</div>
        <div class="timeline-date">${trip.date}</div>
      </a>
    `;
  });

  const sectionTitle = lang === 'en' ? 'Journey Timeline' : 'Línea de Tiempo del Viaje';
  return `
    <section class="timeline">
      <h2>${sectionTitle}</h2>
      <div class="timeline-wrapper">
        <button class="timeline-nav timeline-nav-left" id="timeline-prev" aria-label="Previous trips">&#10094;</button>
        <div class="timeline-container" id="timeline-container">
          ${items}
        </div>
        <button class="timeline-nav timeline-nav-right" id="timeline-next" aria-label="Next trips">&#10095;</button>
      </div>
    </section>
  `;
}

// Generate Post Pages
function generatePostPages(lang) {
  const posts = postsByLang[lang];
  const langPrefix = lang === 'en' ? '' : `/${lang}`;
  const assetPath = lang === 'en' ? '../' : '../../'; // Relative to post in /posts/

    posts.forEach(post => {
    const outDir = path.join(DIST_DIR, lang === 'en' ? 'posts' : `${lang}/posts`);
    ensureDir(outDir);

    const counterpartLang = lang === 'en' ? 'es' : 'en';
    // Find counterpart post in the same trip
    const counterpartPost = postsByLang[counterpartLang].find(p => 
      p.tripSlug === post.tripSlug && 
      (p.fileSlug === post.counterpart || p.counterpart === post.fileSlug || (p.fileSlug === 'main-es' && post.fileSlug === 'main-en') || (p.fileSlug === 'main-en' && post.fileSlug === 'main-es'))
    );
    
    const enUrl = lang === 'en' ? '#' : (counterpartPost ? BASE_URL + `/posts/${counterpartPost.slug}.html` : BASE_URL + '/');
    const esUrl = lang === 'es' ? '#' : (counterpartPost ? BASE_URL + `/es/posts/${counterpartPost.slug}.html` : BASE_URL + '/es/');

    const siteRoot = BASE_URL + (lang === 'en' ? '/' : `/${lang}/`);

    const renderer = getMarkedRenderer(post.tripSlug, assetPath);
    
    // Support custom carousel syntax: ::: carousel ... :::
    let processedContent = post.rawContent.replace(/::: carousel\s*([\s\S]*?)\n:::/g, '<div class="carousel">\n\n$1\n\n</div>');
    
    const htmlContent = marked.parse(processedContent, { renderer });

    let html = postTemplate
      .replace(/{{LANG}}/g, lang)
      .replace(/{{TITLE}}/g, post.title)
      .replace(/{{EXCERPT}}/g, post.excerpt || '')
      .replace(/{{DATE}}/g, post.date)
      .replace(/{{COUNTRY}}/g, post.country || 'Global')
      .replace(/{{THEME}}/g, post.theme || 'default')
      .replace(/{{CONTENT}}/g, htmlContent)
      .replace(/{{TITLE_FLAGS}}/g, getFlagHtml(post.country))
      .replace(/{{ASSET_PATH}}/g, assetPath)
      .replace(/{{SITE_ROOT}}/g, siteRoot)
      .replace(/{{EN_ACTIVE}}/g, lang === 'en' ? 'active' : '')
      .replace(/{{ES_ACTIVE}}/g, lang === 'es' ? 'active' : '')
      .replace(/{{EN_URL}}/g, enUrl)
      .replace(/{{ES_URL}}/g, esUrl)
      .replace(/{{BURGER_MENU}}/g, getBurgerMenuHtml(lang));

    // Back to Trip link
    const trip = tripsByLang[lang].find(t => t.slug === post.tripSlug);
    if (trip) {
      const tripUrl = BASE_URL + (lang === 'en' ? `/trips/${trip.slug}/index.html` : `/es/trips/${trip.slug}/index.html`);
      const backText = lang === 'en' ? `&larr; Back to ${trip.title}` : `&larr; Volver a ${trip.title}`;
      html = html.replace(/{{BACK_TO_TRIP}}/g, `<div class="back-to-trip"><a href="${tripUrl}">${backText}</a></div>`);
    } else {
      html = html.replace(/{{BACK_TO_TRIP}}/g, '');
    }

    if (post.cover_image) {
      let imgSrc = '';
      if (post.cover_image.startsWith('http')) {
        imgSrc = post.cover_image;
      } else if (post.cover_image.startsWith('images/')) {
        imgSrc = `${assetPath}assets/images/trips/${post.tripSlug}/${post.cover_image.replace('images/', '')}`;
      } else {
        imgSrc = `${BASE_URL}/${post.cover_image.replace(/^\//, '')}`;
      }
      html = html.replace(/{{COVER_IMAGE}}/g, `<div class="image-wrapper cover-wrapper"><img src="${imgSrc}" alt="${post.title}" class="post-cover"><div class="image-caption">${post.title}</div></div>`);
    } else {
      html = html.replace(/{{COVER_IMAGE}}/g, '');
    }

    fs.writeFileSync(path.join(outDir, `${post.slug}.html`), html);
  });
}

// Generate Trip Home Pages
function generateTripPages(lang) {
  const trips = tripsByLang[lang];
  const langPrefix = lang === 'en' ? '' : `/${lang}`;
  const assetPath = lang === 'en' ? '../../' : '../../../';

  trips.forEach(trip => {
    const outDir = path.join(DIST_DIR, lang === 'en' ? `trips/${trip.slug}` : `${lang}/trips/${trip.slug}`);
    ensureDir(outDir);

    const counterpartLang = lang === 'en' ? 'es' : 'en';
    const counterpartTrip = tripsByLang[counterpartLang].find(t => t.slug === trip.slug || t.counterpart === trip.slug);
    
    const enUrl = lang === 'en' ? '#' : (counterpartTrip ? BASE_URL + `/trips/${counterpartTrip.slug}/index.html` : BASE_URL + '/');
    const esUrl = lang === 'es' ? '#' : (counterpartTrip ? BASE_URL + `/es/trips/${counterpartTrip.slug}/index.html` : BASE_URL + '/es/');
    const siteRoot = BASE_URL + (lang === 'en' ? '/' : `/${lang}/`);

    // Get posts for this trip and sort chronologically (oldest first)
    const tripPosts = postsByLang[lang]
      .filter(p => p.tripSlug === trip.slug)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    let postsHtml = '';
    
    tripPosts.forEach(post => {
      const postUrl = BASE_URL + `${langPrefix}/posts/${post.slug}.html`;
      let imgSrc = '';
      if (post.cover_image) {
        if (post.cover_image.startsWith('http')) {
          imgSrc = post.cover_image;
        } else if (post.cover_image.startsWith('images/')) {
          imgSrc = `${assetPath}assets/images/trips/${post.tripSlug}/${post.cover_image.replace('images/', '')}`;
        } else {
          imgSrc = `${BASE_URL}/${post.cover_image.replace(/^\//, '')}`;
        }
      }

      const coverImage = imgSrc ? `<img src="${imgSrc}" alt="${post.title}" class="post-card-img">` : '';

      postsHtml += `
        <a href="${postUrl}" class="post-card theme-${post.theme || 'default'}">
          ${coverImage}
          <div class="post-card-content">
            <div class="post-meta">
              <span>${post.date}</span>
              <span class="country-tag">${post.country || 'Global'}</span>
            </div>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-excerpt">${post.excerpt || ''}</p>
          </div>
        </a>
      `;
    });

    let html = tripTemplate
      .replace(/{{LANG}}/g, lang)
      .replace(/{{TRIP_TITLE}}/g, trip.title)
      .replace(/{{TRIP_DATE}}/g, trip.date)
      .replace(/{{TRIP_FLAGS}}/g, Array.from(new Set(tripPosts.map(p => p.country))).map(c => getFlagHtml(c, true)).join(' '))
      .replace(/{{POSTS}}/g, postsHtml)
      .replace(/{{ASSET_PATH}}/g, assetPath)
      .replace(/{{SITE_ROOT}}/g, siteRoot)
      .replace(/{{EN_ACTIVE}}/g, lang === 'en' ? 'active' : '')
      .replace(/{{ES_ACTIVE}}/g, lang === 'es' ? 'active' : '')
      .replace(/{{EN_URL}}/g, enUrl)
      .replace(/{{ES_URL}}/g, esUrl)
      .replace(/{{BURGER_MENU}}/g, getBurgerMenuHtml(lang));

    fs.writeFileSync(path.join(outDir, 'index.html'), html);
  });
}

// Generate Main Home Pages
function generateHomePage(lang) {
  const langPrefix = lang === 'en' ? '' : `/${lang}`;
  const outDir = path.join(DIST_DIR, lang === 'en' ? '' : lang);
  ensureDir(outDir);

  const assetPath = lang === 'en' ? './' : '../';
  const siteRoot = BASE_URL + (lang === 'en' ? '/' : `/${lang}/`);
  const enUrl = BASE_URL + '/';
  const esUrl = BASE_URL + '/es/';
  const heroTitle = lang === 'en' ? 'S&R Travel Blog' : 'S&R Blog Viajero';
  const heroSubtitle = lang === 'en' ? 'Exploring the world, one city at a time.' : 'Explorando el mundo, una ciudad a la vez.';

  // Itinerary Section
  const itineraryPath = path.join(SRC_DIR, `itinerary-${lang}.md`);
  let itinerarySectionHtml = '';
  if (fs.existsSync(itineraryPath)) {
    const itineraryMd = fs.readFileSync(itineraryPath, 'utf-8');
    let itineraryContent = marked.parse(itineraryMd);
    itineraryContent = itineraryContent.replace(/<h2[^>]*>(.*?)<\/h2>/i, '<h2><span class="itinerary-icon">✈️</span> $1</h2>');
    itinerarySectionHtml = `
      <section class="itinerary">
        <div class="itinerary-content">
          ${itineraryContent}
        </div>
      </section>
    `;
  }

  // 4 Most Recent Posts Globally
  const recentPosts = postsByLang[lang].slice(0, 4);
  let postsHtml = '';
  recentPosts.forEach(post => {
    const postUrl = BASE_URL + `${langPrefix}/posts/${post.slug}.html`;
        const imgSrc = post.cover_image && post.cover_image.startsWith('http')
          ? post.cover_image
          : (post.cover_image && post.cover_image.startsWith('images/')
            ? `${BASE_URL}/assets/images/trips/${post.tripSlug}/${post.cover_image.replace('images/', '')}`
            : (post.cover_image ? `${BASE_URL}/${post.cover_image.replace(/^\//, '')}` : ''));

    const coverImage = imgSrc ? `<img src="${imgSrc}" alt="${post.title}" class="post-card-img">` : '';

    postsHtml += `
      <a href="${postUrl}" class="post-card theme-${post.theme || 'default'}">
        ${coverImage}
        <div class="post-card-content">
          <div class="post-meta">
            <span>${post.date}</span>
            <span class="country-tag">${post.country || 'Global'}</span>
          </div>
          <h2 class="post-title">${post.title}</h2>
          <p class="post-excerpt">${post.excerpt || ''}</p>
        </div>
      </a>
    `;
  });

  let html = homeTemplate
    .replace(/{{LANG}}/g, lang)
    .replace(/{{HERO_TITLE}}/g, heroTitle)
    .replace(/{{HERO_SUBTITLE}}/g, heroSubtitle)
    .replace(/{{ITINERARY_SECTION}}/g, itinerarySectionHtml)
    .replace(/{{POSTS}}/g, postsHtml)
    .replace(/{{TIMELINE_SECTION}}/g, getTimelineHtml(lang))
    .replace(/{{ASSET_PATH}}/g, assetPath)
    .replace(/{{SITE_ROOT}}/g, siteRoot)
    .replace(/{{BASE_URL_JS}}/g, BASE_URL)
    .replace(/{{EN_ACTIVE}}/g, lang === 'en' ? 'active' : '')
    .replace(/{{ES_ACTIVE}}/g, lang === 'es' ? 'active' : '')
    .replace(/{{EN_URL}}/g, enUrl)
    .replace(/{{ES_URL}}/g, esUrl)
    .replace(/{{BURGER_MENU}}/g, getBurgerMenuHtml(lang));

  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

generatePostPages('en');
generatePostPages('es');
generateTripPages('en');
generateTripPages('es');
generateHomePage('en');
generateHomePage('es');

// Generate JSON files of countries -> posts for the map (one per language)
function generateCountryData() {
  const normalization = {
    'corea': 'south korea',
    'korea': 'south korea',
    'south korea': 'south korea',
    'japón': 'japan',
    'japan': 'japan',
    'españa': 'spain',
    'spain': 'spain',
    'estados unidos': 'united states of america',
    'usa': 'united states of america',
    'united states': 'united states of america',
    'united states of america': 'united states of america',
    'reino unido': 'united kingdom',
    'uk': 'united kingdom',
    'united kingdom': 'united kingdom',
    'alemania': 'germany',
    'germany': 'germany',
    'francia': 'france',
    'france': 'france',
    'italia': 'italy',
    'italy': 'italy',
    'canadá': 'canada',
    'canada': 'canada',
    'méxico': 'mexico',
    'mexico': 'mexico',
    'brasil': 'brazil',
    'brazil': 'brazil',
    'chad': 'chad',
    'grecia': 'greece',
    'greece': 'greece',
    'ecuador': 'ecuador',
    'bolivia': 'bolivia',
    'thailand': 'thailand',
    'tailandia': 'thailand',
    'uruguay': 'uruguay',
    'chile': 'chile',
    'south africa': 'south africa',
    'sudáfrica': 'south africa',
    'hong kong': 'hong kong',
    'china': 'china',
    'iceland': 'iceland',
    'islandia': 'iceland',
    'switzerland': 'switzerland',
    'suiza': 'switzerland'
  };

  ['en', 'es'].forEach(lang => {
    const countryMap = {};
    const langPosts = postsByLang[lang] || [];
    
    langPosts.forEach(p => {
      if (!p.country) return;
      const countries = Array.isArray(p.country) ? p.country : [p.country];
      countries.forEach(c => {
        let name = c.toLowerCase();
        if (normalization[name]) name = normalization[name];
        const key = name.replace(/\s+/g, '-');
        
        if (!countryMap[key]) countryMap[key] = [];
        countryMap[key].push({
          title: p.title,
          url: `${BASE_URL}${lang === 'en' ? '/' : '/' + lang + '/'}posts/${p.slug}.html`,
          date: p.date
        });
      });
    });

    // Sort each country's posts newest first
    Object.values(countryMap).forEach(arr => arr.sort((a, b) => new Date(b.date) - new Date(a.date)));
    
    const dataDir = path.join(DIST_DIR, 'data');
    ensureDir(dataDir);
    fs.writeFileSync(path.join(dataDir, `countries-${lang}.json`), JSON.stringify(countryMap, null, 2));
  });
}

generateCountryData();

console.log('Build completed successfully!');
