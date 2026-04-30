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
    scrollWheelZoom: false
  });

  // Load country‑to‑posts mapping
  fetch(`${window.BASE_URL || ''}/data/countries.json`)
    .then(r => r.json())
    .then(countryMap => {
      console.log('Loaded country data:', countryMap);

      // Load GeoJSON world borders
      // We'll use a slightly different source that is very common for Leaflet
      fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
        .then(r => r.json())
        .then(geoData => {
          console.log('Loaded GeoJSON data');
          
          const getCountryKey = (feature) => {
            // Try different common property names
            const name = feature.properties.name || feature.properties.ADMIN || feature.id;
            if (!name) return null;
            return name.toLowerCase().replace(/\s+/g, '-');
          };

          const style = (feature) => {
            const key = getCountryKey(feature);
            const isVisited = key && countryMap[key];
            
            return {
              fillColor: isVisited ? '#ff7f50' : '#ffffff', // White for land, coral for visited
              weight: 0.5,
              opacity: 1,
              color: '#999', // border
              fillOpacity: 1
            };
          };

          const onEachFeature = (feature, layer) => {
            const name = feature.properties.name || feature.properties.ADMIN || feature.id;
            const key = getCountryKey(feature);
            
            if (key && countryMap[key]) {
              console.log('Matched visited country:', name);
              layer.on({
                mouseover: (e) => {
                  e.target.setStyle({ fillColor: '#ff6347', weight: 1.5 });
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
