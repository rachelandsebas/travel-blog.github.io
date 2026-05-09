// src/assets/map.js
// Interactive world map with robust country matching and console logging for debugging.

document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('world-map');
  if (!mapContainer) return;

  console.log('Map initialization started...');

  const map = L.map('world-map', {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 5,
    attributionControl: false,
    zoomControl: true,
    dragging: true,
    scrollWheelZoom: false,
    renderer: L.svg() // Explicitly use SVG renderer
  });

  // Load country‑to‑posts mapping (language specific)
  const lang = document.documentElement.lang || 'en';
  
  Promise.all([
    fetch(`${window.BASE_URL || ''}/data/countries-${lang}.json`).then(r => r.json()),
    fetch('https://restcountries.com/v3.1/all?fields=cca2,population').then(r => r.json())
  ])
    .then(([countryMap, popData]) => {
      console.log('Loaded country data and population data');
      
      const ISO_CODES = {
        'south-korea': 'kr',
        'china': 'cn',
        'japan': 'jp',
        'greece': 'gr',
        'chad': 'td',
        'canada': 'ca',
        'united-states-of-america': 'us',
        'ecuador': 'ec',
        'france': 'fr',
        'iceland': 'is',
        'united-kingdom': 'gb',
        'switzerland': 'ch',
        'bolivia': 'bo',
        'brazil': 'br',
        'chile': 'cl',
        'hong-kong': 'hk',
        'mexico': 'mx',
        'south-africa': 'za',
        'thailand': 'th',
        'uruguay': 'uy',
        'spain': 'es',
        'germany': 'de',
        'italy': 'it'
      };

      const updateStats = (countryMap, popData) => {
        const visitedKeys = Object.keys(countryMap);
        const visitedCount = visitedKeys.length;
        const totalCountriesCount = 195; // UN recognized
        
        let visitedPop = 0;
        let totalPop = 0;
        
        const visitedIsoCodes = visitedKeys.map(k => ISO_CODES[k]).filter(Boolean);
        
        popData.forEach(c => {
          const pop = c.population || 0;
          totalPop += pop;
          if (visitedIsoCodes.includes(c.cca2.toLowerCase())) {
            visitedPop += pop;
          }
        });
        
        const countryPct = Math.min(100, Math.round((visitedCount / totalCountriesCount) * 100));
        const popPct = Math.min(100, Math.round((visitedPop / totalPop) * 100));
        
        // Update UI
        const countriesCircle = document.getElementById('countries-progress');
        const countriesPct = document.getElementById('countries-pct');
        const countriesCount = document.getElementById('countries-count');
        const populationCircle = document.getElementById('population-progress');
        const populationPct = document.getElementById('population-pct');
        const populationCount = document.getElementById('population-count');

        if (countriesCircle) countriesCircle.style.strokeDasharray = `${countryPct}, 100`;
        if (countriesPct) countriesPct.textContent = `${countryPct}%`;
        if (countriesCount) countriesCount.textContent = `${visitedCount}/${totalCountriesCount}`;
        
        if (populationCircle) populationCircle.style.strokeDasharray = `${popPct}, 100`;
        if (populationPct) populationPct.textContent = `${popPct}%`;
        if (populationCount) populationCount.textContent = `${popPct}%`;

        // Translate labels
        if (lang === 'es') {
          const l1 = document.getElementById('label-countries-visited');
          const l2 = document.getElementById('label-population-visited');
          if (l1) l1.textContent = 'Países Visitados';
          if (l2) l2.textContent = 'Población Mundial';
        }
      };

      updateStats(countryMap, popData);

      // Load GeoJSON world borders
      fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(r => r.json())
        .then(geoData => {
          console.log('Loaded GeoJSON data');

          const normalization = {
            'corea': 'south-korea',
            'korea': 'south-korea',
            'south-korea': 'south-korea',
            'japón': 'japan',
            'japan': 'japan',
            'españa': 'spain',
            'spain': 'spain',
            'estados-unidos': 'united-states-of-america',
            'usa': 'united-states-of-america',
            'united-states': 'united-states-of-america',
            'united-states-of-america': 'united-states-of-america',
            'reino-unido': 'united-kingdom',
            'uk': 'united-kingdom',
            'united-kingdom': 'united-kingdom',
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
            'south-africa': 'south-africa',
            'sudáfrica': 'south-africa',
            'hong-kong': 'hong-kong',
            'china': 'china',
            'iceland': 'iceland',
            'islandia': 'iceland',
            'switzerland': 'switzerland',
            'suiza': 'switzerland'
          };

          const COUNTRY_CENTERS = {
            'united-states-of-america': [37.0902, -95.7129], // Contiguous US center
            'france': [46.2276, 2.2137], // Mainland France
            'canada': [56.1304, -106.3468],
            'china': [35.8617, 104.1954],
            'russia': [61.5240, 105.3188],
            'united-kingdom': [54.3781, -3.4360]
          };

          const getCountryKey = (feature) => {
            const name = feature.properties.name || feature.properties.ADMIN || feature.id;
            if (!name) return null;
            let key = name.toLowerCase().replace(/\s+/g, '-');
            return normalization[key] || key;
          };

          const style = (feature) => {
            const key = getCountryKey(feature);
            const isVisited = key && countryMap[key];

            return {
              fillColor: isVisited ? '#8FB996' : '#ffffff',
              weight: 0.5,
              opacity: 1,
              color: '#999',
              fillOpacity: 1
            };
          };

          const onEachFeature = (feature, layer) => {
            const name = feature.properties.name || feature.properties.ADMIN || feature.id;
            const key = getCountryKey(feature);

            if (key && countryMap[key]) {
              layer.on({
                mouseover: (e) => {
                  e.target.setStyle({
                    fillColor: '#78a380',
                    weight: 1.5
                  });
                },
                mouseout: (e) => {
                  geojson.resetStyle(e.target);
                },
                click: (e) => {
                  showCountryModal(name, countryMap[key]);
                  L.DomEvent.stopPropagation(e);
                }
              });
              layer.options.cursor = 'pointer';

              // Add flag icon marker at country center
              const iso = ISO_CODES[key];
              if (iso) {
                // Wait for layer to be added to calculate bounds accurately
                setTimeout(() => {
                  const center = COUNTRY_CENTERS[key] || layer.getBounds().getCenter();
                  const flagIcon = L.divIcon({
                    className: 'flag-marker',
                    html: `<div class="flag-marker-inner" style="background-image: url(https://flagcdn.com/${iso}.svg)"></div>`,
                    iconSize: [32, 24],
                    iconAnchor: [16, 12]
                  });
                  const marker = L.marker(center, { icon: flagIcon }).addTo(map);
                  marker.on('click', (e) => {
                    showCountryModal(name, countryMap[key]);
                    L.DomEvent.stopPropagation(e);
                  });
                }, 0);
              }
            }
          };

          const geojson = L.geoJSON(geoData, {
            style: style,
            onEachFeature: onEachFeature
          }).addTo(map);

          console.log('Map layers added.');
        })
        .catch(err => console.error('Failed to load GeoJSON:', err));
    })
    .catch(err => console.error('Failed to load country or population data:', err));

  // Modal handling
  const modal = document.getElementById('country-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCountry = document.getElementById('modal-country');
  const modalPosts = document.getElementById('modal-posts');

  const showCountryModal = (countryName, posts) => {
    if (!modalCountry || !modalPosts || !modal) return;
    modalCountry.textContent = countryName;
    modalPosts.innerHTML = posts.map(p => `<li><a href="${p.url}">${p.title}</a> <small>(${p.date})</small></li>`).join('');
    modal.classList.remove('hidden');
  };

  if (modalClose) {
    modalClose.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
});
