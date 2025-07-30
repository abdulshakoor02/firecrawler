import { pipeline } from '@xenova/transformers'; // For embedding generation
import { v4 as uuidv4 } from 'uuid';
import type { Product, ProductWithEmbedding } from '../../models/product'

let embedder: any;
async function initializeEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
}

export async function getEmbedding(text: string) {
  if (!embedder) {
    await initializeEmbedder();
  }
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  // The output is typically a tensor; convert it to a plain array
  return Array.from(output.data);
}

export async function processDataWithEmbedings(
  data: Product[],
  chunkSize: number,
  source: string
): Promise<ProductWithEmbedding | undefined> {
  try {
    let processedProducts: ProductWithEmbedding[] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const embeddings = await Promise.all(chunk.map(async (product: Product) => {
        const embedding = await getEmbedding(product.name);
        return {
          payload: { ...product, source: source },
          vectors: embedding,
          id: uuidv4(),
        } as ProductWithEmbedding
      }));
      embeddings.forEach((embedding: ProductWithEmbedding) => {
        processedProducts.push(embedding)
      })
    }

    return processedProducts as unknown as ProductWithEmbedding;
  } catch (error) {
    console.error(error)
    return undefined;
  }
}


