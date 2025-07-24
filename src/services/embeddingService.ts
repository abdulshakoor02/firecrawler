import { Service } from "typedi";
import {
  getEmbedding,
  processDataWithEmbedings
} from "../repository/openAi/generateEmbeddings";

@Service()
export class EmbeddingService {
  public generateEmbeddings = getEmbedding;
  public producEmbeddings = processDataWithEmbedings;
}
