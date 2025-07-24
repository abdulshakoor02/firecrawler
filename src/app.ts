import 'reflect-metadata';
import demoData from './lulu.json'
import { Container } from 'typedi'
import {
  EmbeddingService,
  QdrantService,
  FirecrawlService,
  Crawl4aiService,
  OpenaiService,
  ChunkingService
} from './services'
import type { Product, ProductWithEmbedding } from './models/product';
// const data = demoData[0]?.products

const fireCrawl = Container.get(FirecrawlService)
const embedding = Container.get(EmbeddingService)
const qdrant = Container.get(QdrantService)
const crawl = Container.get(Crawl4aiService)
const ai = Container.get(OpenaiService)
const chunk = Container.get(ChunkingService)
// const model = await ai.openai.models.list()
// console.log(model)
const data = await crawl.deepCrawlAndExtract(
  'https://www.carrefouruae.com/mafuae/en/c/F11600000',
  {
    name: 'string',
    price: 'number',
    description: 'string'
  },
  `Extract all product data from this page.`, 'openai/moonshot-v1-128k') as any;
console.log(data?.results?.[0]?.html?.length)
console.log(data?.results?.[0]?.markdown?.raw_markdown?.length)
const chunked = chunk.chunkStringByCharCount(
  data?.results?.[0]?.markdown?.raw_markdown as string,
  6000
)
chunked.forEach(async (val) => {

  const parsedData = await ai.parse(`
Convert the following content into a JSON array of product objects 
${val}
`);
  const res = JSON.parse(parsedData?.choices?.[0]?.message?.content as any)
  // console.log(res)
  console.log(`total products ${res.products.length}`)
})
// const parsedData = await ai.parse(`
// Convert the following content into a JSON array of product objects 
// ${data?.results?.[0]?.markdown?.raw_markdown}
// `);
// console.log(parsedData)
// console.log(parsedData?.choices?.[0]?.message?.content)
// console.log(JSON.parse(parsedData?.choices?.[0]?.message?.content as any))
// const result = await embedding.producEmbeddings(
//   data as unknown as Product[],
//   20,
//   'lulu'
// ) as ProductWithEmbedding;
// await qdrant.upsertPoints('products', result);
// const vectors = await embedding.generateEmbeddings('toothpaste');
// const test = await qdrant.queryPoints('products', vectors as any, 50)
// console.log(test?.points)
// const data = await fireCrawl.extractProduct(
//   'https://instashop.com/en-ae/client/carrefour-arabian-ranches-2/*',
//   `Perform a deep crawl and imitate 'load more' or 'click next page' actions to load all pages on each page and extract all product data.`) as any
// console.log(data)
// console.log(data?.data?.products.length)
// console.log(data?.data?.products)
