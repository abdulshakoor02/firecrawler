import 'reflect-metadata';
import scheduler from 'node-schedule'
import { Container } from 'typedi'
import {
  OrchestraterService,
  CrawleeService
} from './services'

const orchestrate = Container.get(OrchestraterService)
const crawlee = Container.get(CrawleeService)

// await crawlee.deepCrawlAndConvertToMarkdown(
//   'https://gcc.luluhypermarket.com/en-ae/',
//   500, // maxRequestsPerCrawl
//   2,  // maxDepth
// );

// Run crawlers sequentially to avoid storage conflicts
// Schedule a job to run at 16:31 (4:31 PM)
const job = scheduler.scheduleJob('31 16 * * *', async () => {
  await crawlee.deepCrawlWithPaginationAndInteraction(
    'https://gcc.luluhypermarket.com/en-ae/grocery-food-cupboard',
    300, // maxPages
    'lulu',
    'page'
  )

  console.log('[app.ts] Lulu crawling completed, starting Carrefour...');

  await crawlee.deepCrawlWithPaginationAndInteraction(
    'https://www.carrefouruae.com/mafuae/en/c/F11600000',
    300, // maxPages
    'carrefour',
    'currentPage'
  )

  console.log('[app.ts] Carrefour crawling completed, starting Union Coop...');

  await crawlee.deepCrawlWithPaginationAndInteraction(
    'https://www.unioncoop.ae/fresh-food/fruits-vegetables.html',
    300, // maxPages
    'union coop',
    'page'
  )

  console.log('[app.ts] All crawling operations completed successfully!');
  // await crawlee.deepCrawlWithPaginationAndInteraction(
  //   'https://www.unioncoop.ae/fresh-food/fruits-vegetables.html',
  //   300, // maxPages
  //   'union coop',
  //   'page'
  // )

});


// payload.push(orchestrate.crawl4aiJob('https://gcc.luluhypermarket.com/en-ae/grocery/', 'lulu'))
// payload.push(orchestrate.crawl4aiJob('https://gcc.luluhypermarket.com/en-ae/grocery/', 'lulu'))
// Promise.all(payload)
