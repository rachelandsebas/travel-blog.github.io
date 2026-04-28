const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const BASE_URL = process.env.BASE_URL || '';

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

// Configure marked to handle local image paths with BASE_URL
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
  const src = isAbsolute ? href : BASE_URL + '/' + (href ? href.replace(/^\//, '') : '');
  
  let imgHtml = `<img src="${src}" alt="${text || ''}"`;
  if (title) imgHtml += ` title="${title}"`;
  imgHtml += ` />`;
  return imgHtml;
};
marked.use({ renderer });

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

    // Process Meta files
    const processMeta = (lang) => {
      const metaFile = path.join(tripDir, `_meta-${lang}.md`);
      if (fs.existsSync(metaFile)) {
        const content = fs.readFileSync(metaFile, 'utf-8');
        const parsed = matter(content);
        tripsByLang[lang].push({
          ...parsed.data,
          slug: tripSlug,
          year: yearStr,
          htmlContent: marked.parse(parsed.content)
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
      const htmlContent = marked.parse(parsed.content);
      
      const postData = {
        ...parsed.data,
        htmlContent,
        slug: file.replace('.md', ''),
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
    const imgSrc = trip.cover_image && trip.cover_image.startsWith('http') 
      ? trip.cover_image 
      : (trip.cover_image ? `${BASE_URL}/assets/${trip.cover_image.replace(/^assets\//, '')}` : '');
      
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
    const counterpartPost = postsByLang[counterpartLang].find(p => p.slug === post.slug || p.counterpart === post.slug);
    
    const enUrl = lang === 'en' ? '#' : (counterpartPost ? BASE_URL + `/posts/${counterpartPost.slug}.html` : BASE_URL + '/');
    const esUrl = lang === 'es' ? '#' : (counterpartPost ? BASE_URL + `/es/posts/${counterpartPost.slug}.html` : BASE_URL + '/es/');

    const siteRoot = BASE_URL + (lang === 'en' ? '/' : `/${lang}/`);

    let html = postTemplate
      .replace(/{{LANG}}/g, lang)
      .replace(/{{TITLE}}/g, post.title)
      .replace(/{{EXCERPT}}/g, post.excerpt || '')
      .replace(/{{DATE}}/g, post.date)
      .replace(/{{COUNTRY}}/g, post.country || 'Global')
      .replace(/{{THEME}}/g, post.theme || 'default')
      .replace(/{{CONTENT}}/g, post.htmlContent)
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
      const imgSrc = post.cover_image.startsWith('http') ? post.cover_image : `${BASE_URL}/${post.cover_image.replace(/^\//, '')}`;
      html = html.replace(/{{COVER_IMAGE}}/g, `<img src="${imgSrc}" alt="${post.title}" class="post-cover">`);
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

    // Get posts for this trip
    const tripPosts = postsByLang[lang].filter(p => p.tripSlug === trip.slug);
    let postsHtml = '';
    
    tripPosts.forEach(post => {
      const postUrl = BASE_URL + `${langPrefix}/posts/${post.slug}.html`;
      const imgSrc = post.cover_image && post.cover_image.startsWith('http') 
        ? post.cover_image 
        : (post.cover_image ? `${BASE_URL}/${post.cover_image.replace(/^\//, '')}` : '');

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
      : (post.cover_image ? `${BASE_URL}/${post.cover_image.replace(/^\//, '')}` : '');

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

console.log('Build completed successfully!');
