import 'reflect-metadata';
import { Container } from 'typedi'
import {
  EmbeddingService,
  QdrantService,
  Crawl4aiService,
  OpenaiService,
  ChunkingService,
  OrchestraterService
} from './services'
import type { Product, ProductWithEmbedding } from './models/product';
// const data = demoData[0]?.products

const embedding = Container.get(EmbeddingService)
const qdrant = Container.get(QdrantService)
const crawl = Container.get(Crawl4aiService)
const ai = Container.get(OpenaiService)
const chunk = Container.get(ChunkingService)
const orchestrate = Container.get(OrchestraterService)

const payload = []
payload.push(orchestrate.crawl4aiJob('https://gcc.luluhypermarket.com/en-ae/grocery/', 'lulu'))
payload.push(orchestrate.crawl4aiJob('https://gcc.luluhypermarket.com/en-ae/grocery/', 'lulu'))
Promise.all(payload)
// Process products if needed
// const result = await embedding.producEmbeddings(
//   products,
//   20,
//   'union coop',
// // ) as ProductWithEmbedding;
// // await qdrant.upsertPoints('products', result);

// const data = await fireCrawl.extractProduct(
//   'https://instashop.com/en-ae/client/carrefour-arabian-ranches-2/*',
//   `Perform a deep crawl and imitate 'load more' or 'click next page' actions to load all pages on each page and extract all product data.`) as any
// console.log(data)
// console.log(data?.data?.products.length)
// console.log(data?.data?.products)
