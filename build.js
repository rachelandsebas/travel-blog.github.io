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

// Configure marked to handle local image paths with BASE_URL
const renderer = new marked.Renderer();
renderer.image = function (token) {
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

  // If it's an external URL, leave it alone. Otherwise, prepend BASE_URL/
  const isAbsolute = href && (typeof href === 'string') && (href.startsWith('http://') || href.startsWith('https://'));
  const src = isAbsolute ? href : BASE_URL + '/' + (href ? href.replace(/^\//, '') : '');

  let imgHtml = `<img src="${src}" alt="${text || ''}"`;
  if (title) imgHtml += ` title="${title}"`;
  imgHtml += ` />`;
  return imgHtml;
};
marked.use({ renderer });

// Read and parse all posts
const postsData = [];
const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

for (const file of files) {
  const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  const parsed = matter(content);
  const htmlContent = marked.parse(parsed.content);

  postsData.push({
    ...parsed.data,
    htmlContent,
    slug: file.replace('.md', ''),
  });
}

// Sort by date (reverse chronological)
postsData.sort((a, b) => new Date(b.date) - new Date(a.date));

// Group by language
const postsByLang = {
  en: postsData.filter(p => p.lang === 'en'),
  es: postsData.filter(p => p.lang === 'es'),
};

// Generate Post Pages
function generatePostPages(posts, lang) {
  const langPrefix = lang === 'en' ? '' : `/${lang}`;
  const outDir = path.join(DIST_DIR, lang === 'en' ? 'posts' : `${lang}/posts`);
  ensureDir(outDir);

  const assetPath = lang === 'en' ? '../' : '../../';
  const siteRoot = BASE_URL + (lang === 'en' ? '/' : `/${lang}/`);

  posts.forEach(post => {
    // Find counterpart slug if available (for lang switcher)
    const counterpartLang = lang === 'en' ? 'es' : 'en';
    const counterpartPost = postsByLang[counterpartLang].find(p => p.slug === post.slug || p.counterpart === post.slug);

    const enUrl = lang === 'en' ? '#' : (counterpartPost ? BASE_URL + `/posts/${counterpartPost.slug}.html` : BASE_URL + '/');
    const esUrl = lang === 'es' ? '#' : (counterpartPost ? BASE_URL + `/es/posts/${counterpartPost.slug}.html` : BASE_URL + '/es/');

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
      .replace(/{{ES_URL}}/g, esUrl);

    if (post.cover_image) {
      const imgSrc = post.cover_image.startsWith('http') ? post.cover_image : `${assetPath}${post.cover_image.replace(/^\//, '')}`;
      html = html.replace(/{{COVER_IMAGE}}/g, `<img src="${imgSrc}" alt="${post.title}" class="post-cover">`);
    } else {
      html = html.replace(/{{COVER_IMAGE}}/g, '');
    }

    fs.writeFileSync(path.join(outDir, `${post.slug}.html`), html);
  });
}

generatePostPages(postsByLang.en, 'en');
generatePostPages(postsByLang.es, 'es');

// Generate Home Pages
function generateHomePage(posts, lang) {
  const langPrefix = lang === 'en' ? '' : `/${lang}`;
  const outDir = path.join(DIST_DIR, lang === 'en' ? '' : lang);
  ensureDir(outDir);

  const assetPath = lang === 'en' ? './' : '../';
  const siteRoot = BASE_URL + (lang === 'en' ? '/' : `/${lang}/`);
  const enUrl = BASE_URL + '/';
  const esUrl = BASE_URL + '/es/';
  const heroTitle = lang === 'en' ? 'S&R Travel Blog' : 'S&R Blog Viajero';
  const heroSubtitle = lang === 'en' ? 'Exploring the world, one city at a time.' : 'Explorando el mundo, una ciudad a la vez.';

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

  let postsHtml = '';
  posts.forEach(post => {
    const postUrl = BASE_URL + `${langPrefix}/posts/${post.slug}.html`;
    const imgSrc = post.cover_image && post.cover_image.startsWith('http')
      ? post.cover_image
      : (post.cover_image ? `${assetPath}${post.cover_image.replace(/^\//, '')}` : '');

    const coverImage = imgSrc
      ? `<img src="${imgSrc}" alt="${post.title}" class="post-card-img">`
      : '';

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
    .replace(/{{ASSET_PATH}}/g, assetPath)
    .replace(/{{SITE_ROOT}}/g, siteRoot)
    .replace(/{{EN_ACTIVE}}/g, lang === 'en' ? 'active' : '')
    .replace(/{{ES_ACTIVE}}/g, lang === 'es' ? 'active' : '')
    .replace(/{{EN_URL}}/g, enUrl)
    .replace(/{{ES_URL}}/g, esUrl);

  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

generateHomePage(postsByLang.en, 'en');
generateHomePage(postsByLang.es, 'es');

console.log('Build completed successfully!');
