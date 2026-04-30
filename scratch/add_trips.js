const fs = require('fs');
const path = require('path');

const SRC_DIR = '/Users/sebastianregalado/Desktop/Sebas/repos/travel-blog/src';
const POSTS_DIR = path.join(SRC_DIR, 'posts');

const newTrips = [
  { titleEn: "IMO South Africa 2014", titleEs: "IMO Sudáfrica 2014", year: "2014", slug: "imo-south-africa-2014", countryEn: "South Africa", countryEs: "Sudáfrica", date: "2014-07-03" },
  { titleEn: "Cono Sur Uruguay 2014", titleEs: "Cono Sur Uruguay 2014", year: "2014", slug: "cono-sur-uruguay-2014", countryEn: "Uruguay", countryEs: "Uruguay", date: "2014-05-10" },
  { titleEn: "Cono Sur Chile 2015", titleEs: "Cono Sur Chile 2015", year: "2015", slug: "cono-sur-chile-2015", countryEn: "Chile", countryEs: "Chile", date: "2015-05-15" },
  { titleEn: "IMO Thailand 2015", titleEs: "IMO Tailandia 2015", year: "2015", slug: "imo-thailand-2015", countryEn: "Thailand", countryEs: "Tailandia", date: "2015-07-04" },
  { titleEn: "IMO Hong Kong 2016", titleEs: "IMO Hong Kong 2016", year: "2016", slug: "imo-hong-kong-2016", countryEn: "Hong Kong", countryEs: "Hong Kong", date: "2016-07-06" },
  { titleEn: "Ibero Chile 2016", titleEs: "Ibero Chile 2016", year: "2016", slug: "ibero-chile-2016", countryEn: "Chile", countryEs: "Chile", date: "2016-09-20" },
  { titleEn: "IMO Brazil 2017", titleEs: "IMO Brasil 2017", year: "2017", slug: "imo-brazil-2017", countryEn: "Brazil", countryEs: "Brasil", date: "2017-07-12" },
  { titleEn: "Cono Sur Ecuador 2017", titleEs: "Cono Sur Ecuador 2017", year: "2017", slug: "cono-sur-ecuador-2017", countryEn: "Ecuador", countryEs: "Ecuador", date: "2017-05-08" },
  { titleEn: "Cono Sur Brazil 2018", titleEs: "Cono Sur Brazil 2018", year: "2018", slug: "cono-sur-brazil-2018", countryEn: "Brazil", countryEs: "Brasil", date: "2018-05-22" },
  { titleEn: "Cono Sur Bolivia 2019", titleEs: "Cono Sur Bolivia 2019", year: "2019", slug: "cono-sur-bolivia-2019", countryEn: "Bolivia", countryEs: "Bolivia", date: "2019-05-25" },
  { titleEn: "Mexico 2019", titleEs: "México 2019", year: "2019", slug: "mexico-2019", countryEn: "Mexico", countryEs: "México", date: "2019-11-10" }
];

newTrips.forEach(trip => {
  const tripDir = path.join(POSTS_DIR, trip.year, trip.slug);
  const imgDir = path.join(tripDir, 'images');
  
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
    console.log(`Created ${imgDir}`);
  }

  const enMeta = `---
title: "${trip.titleEn}"
date: "${trip.date}"
lang: "en"
country: "${trip.countryEn}"
cover_image: ""
counterpart: "${trip.slug}-es"
---

Trip to ${trip.countryEn} for ${trip.titleEn}.
`;

  const esMeta = `---
title: "${trip.titleEs}"
date: "${trip.date}"
lang: "es"
country: "${trip.countryEs}"
cover_image: ""
counterpart: "${trip.slug}"
---

Viaje a ${trip.countryEs} para ${trip.titleEs}.
`;

  fs.writeFileSync(path.join(tripDir, '_meta-en.md'), enMeta);
  fs.writeFileSync(path.join(tripDir, '_meta-es.md'), esMeta);
  console.log(`  Generated meta for ${trip.slug}`);
});

console.log('All new trips added!');
