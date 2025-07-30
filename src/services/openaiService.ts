import { Service } from "typedi";
import OpenAI from "openai";
import { config } from "../../config";
import { getEmbedding } from "../repository/openAi/generateEmbeddings";
import { getTextOfJSDocComment } from "typescript";

@Service()
export class OpenaiService {
  public openai: OpenAI;
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl
    });
  }

  public async chat(prompt: string) {
    try {
      const history = [{ role: 'system', content: 'You are a Kimi,an AI assitant provided by Moonshot AI.' }] as any
      history.push({ role: 'user', content: prompt })
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: history,
        max_tokens: 4096
      })

      return response
    } catch (error) {
      console.error(error)
    }
  }

  public async parse(prompt: string) {
    try {
      const history = [{ role: 'system', content: 'You are a Kimi,an AI assitant provided by Moonshot AI.' }] as any
      history.push({
        role: 'system', content: `
please output your data in following json format:
{
"name":"products name",
"price":"products price",
"description":"products description"
}
`
      })
      history.push({ role: 'user', content: prompt })
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: history,
        response_format: { type: 'json_object' },
        max_tokens: 4096
      })

      return JSON.parse(response?.choices?.[0]?.message?.content as any).products;
    } catch (error) {
      console.error(error)
    }
  }

  public async extractProducts(prompt: string) {
    try {
      const history = [{ role: 'system', content: 'You are a Kimi,an AI assitant provided by Moonshot AI.' }] as any
      history.push({
        role: 'user', content: `
Extract only product names from the query
Example:
Input: "I want to buy apple and banana"
Output:["apple","banana"]
Now process this query: "${prompt}"
and response only with product array
`
      })
      // history.push({ role: 'user', content: prompt })
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: history,
        // response_format: { type: 'json_object' },
        max_tokens: 4096
      })

      return JSON.parse(response?.choices?.[0]?.message?.content as any);
    } catch (error) {
      console.error(error)
    }
  }
}
