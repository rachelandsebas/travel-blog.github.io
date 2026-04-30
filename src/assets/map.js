// src/assets/map.js
// Minimalist world map that highlights visited countries using GeoJSON outlines.

document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('world-map');
  if (!mapContainer) return;

  // Initialize Leaflet map - no tiles, just the SVG layer
  const map = L.map('world-map', {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 5,
    attributionControl: false,
    zoomControl: true,
    dragging: true,
    scrollWheelZoom: false // Disable scroll zoom to prevent accidental scrolling
  });

  // Load country‑to‑posts mapping
  fetch(`${window.BASE_URL || ''}/data/countries.json`)
    .then(r => r.json())
    .then(countryMap => {
      // Load GeoJSON world borders
      fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
        .then(r => r.json())
        .then(geoData => {
          
          // Style function
          const getStyle = (feature) => {
            const name = feature.properties.ADMIN.toLowerCase();
            const key = name.replace(/\s+/g, '-');
            const isVisited = !!countryMap[key];

            return {
              fillColor: isVisited ? '#ff7f50' : '#f5f5f5', // coral for visited, light grey for others
              weight: 1,
              opacity: 1,
              color: '#999', // border color
              fillOpacity: 1
            };
          };

          const onEachCountry = (feature, layer) => {
            const name = feature.properties.ADMIN;
            const key = name.toLowerCase().replace(/\s+/g, '-');
            
            if (countryMap[key]) {
              layer.on({
                mouseover: (e) => {
                  e.target.setStyle({ fillColor: '#ff6347', weight: 2 });
                },
                mouseout: (e) => {
                  geojson.resetStyle(e.target);
                },
                click: (e) => {
                  showCountryModal(name, countryMap[key]);
                  L.DomEvent.stopPropagation(e); // Prevent map click
                }
              });
              layer.options.cursor = 'pointer';
            }
          };

          const geojson = L.geoJSON(geoData, {
            style: getStyle,
            onEachFeature: onEachCountry
          }).addTo(map);
        })
        .catch(err => console.error('Failed to load GeoJSON:', err));
    })
    .catch(err => console.error('Failed to load country data:', err));

  // Modal handling
  const modal = document.getElementById('country-modal');
  const modalClose = document.getElementById('modal-close');
  const modalCountry = document.getElementById('modal-country');
  const modalPosts = document.getElementById('modal-posts');

  const showCountryModal = (countryName, posts) => {
    modalCountry.textContent = countryName;
    modalPosts.innerHTML = posts.map(p => `<li><a href="${p.url}">${p.title}</a> <small>(${p.date})</small></li>`).join('');
    modal.classList.remove('hidden');
  };

  modalClose.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});
