import { Service, Container } from "typedi";
import type { Product, ProductWithEmbedding } from '../models';
import type {
  Crawl4aiService as Crawl4aiype,
  ChunkingService as ChunkType,
  QdrantService as QdrantType,
  OpenaiService as OpenAiType,
  EmbeddingService as EmbeddingType
} from "./";
import {
  Crawl4aiService,
  ChunkingService,
  QdrantService,
  OpenaiService,
  EmbeddingService
} from "./";

@Service()
export class OrchestraterService {
  private crawl: Crawl4aiype
  private chunk: ChunkType
  private qdrant: QdrantType
  private ai: OpenAiType
  private embedding: EmbeddingType
  constructor() {
    this.crawl = Container.get(Crawl4aiService)
    this.chunk = Container.get(ChunkingService)
    this.qdrant = Container.get(QdrantService)
    this.ai = Container.get(OpenaiService)
    this.embedding = Container.get(EmbeddingService)
  }

  public async crawl4aiJob(
    url: string,
    source: string
  ) {
    const data = await this.crawl.deepCrawlAndExtract(url) as any;
    console.log(data?.results?.[0]?.html?.length)
    console.log(data?.results?.[0]?.markdown?.raw_markdown?.length)
    const chunked = this.chunk.chunkStringByCharCount(
      data?.results?.[0]?.markdown?.raw_markdown as string,
      6000
    )
    chunked.forEach(async (val) => {

      const parsedData = await this.ai.parse(`
Convert the following content into a JSON array of product objects 
${val}
`);
      const res = JSON.parse(parsedData?.choices?.[0]?.message?.content as any)
      console.log(res.products)
      console.log(`total products ${res.products.length}`)
      const result = await this.embedding.producEmbeddings(
        res.products as unknown as Product[],
        20,
        source,
      ) as ProductWithEmbedding;
      await this.qdrant.upsertPoints('products', result);
    })
  }
}
