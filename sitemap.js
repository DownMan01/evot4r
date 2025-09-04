import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';

const sitemap = new SitemapStream({ hostname: 'https://www.evotar.xyz' });

const pages = [
  '/',
  '/login',
  '/about',
  '/faq',
  '/terms',
  '/privacy',
];

pages.forEach((page) => sitemap.write({ url: page, changefreq: 'daily', priority: 0.8 }));
sitemap.end();

streamToPromise(sitemap).then((data) => {
  createWriteStream('./public/sitemap.xml').write(data.toString());
});
