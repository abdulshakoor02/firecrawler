import { Service } from "typedi";
import { pipeline } from '@xenova/transformers'; // For embedding generation

import {
  getEmbedding,
  processDataWithEmbedings
} from "../repository/openAi/generateEmbeddings";

@Service()
export class EmbeddingService {
  private embed: any
  constructor() {
  }
  public semanticEmbeddings = async (text: string) => {
    this.embed = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5') as any;
    const output = await this.embed(text, { pooling: 'mean', normalize: true });
    // The output is typically a tensor; convert it to a plain array
    return Array.from(output.data);
  }
  public generateEmbeddings = getEmbedding;
  public producEmbeddings = processDataWithEmbedings;
}
