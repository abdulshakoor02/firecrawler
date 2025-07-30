import 'reflect-metadata';
import scheduler from 'node-schedule'
import { Container } from 'typedi'
import {
  OrchestraterService,
  CrawleeService,
  EmbeddingService,
  QdrantService,
  OpenaiService
} from './services'
import { string } from 'zod';

const orchestrate = Container.get(OrchestraterService)
const crawlee = Container.get(CrawleeService)
const qdrant = Container.get(QdrantService)
const embed = Container.get(EmbeddingService)
const ai = Container.get(OpenaiService)

// Schedule a job to run every Monday at 16: 31(4: 31 PM)
const job = scheduler.scheduleJob('31 16 * * 1', async () => {
  console.log('[app.ts] Starting Lulu crawling...');
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
});

