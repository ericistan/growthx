import { randomUUID } from "node:crypto";
import { LinkupClient, type SourcedAnswer } from "linkup-sdk";
import { EvidenceSchema, type Evidence } from "../contracts.js";

interface LinkupSearchClient {
  search(params: {
    query: string;
    depth: "deep";
    outputType: "sourcedAnswer";
  }): Promise<SourcedAnswer>;
}

interface ResearchInput {
  company: string;
  category: string;
  targetUrl: string;
}

export function createLinkupClient(apiKey: string): LinkupSearchClient {
  return new LinkupClient({ apiKey });
}

export async function researchLandingPageEvidence(
  client: LinkupSearchClient,
  input: ResearchInput,
): Promise<Evidence[]> {
  const response = await client.search({
    query: [
      `Research ${input.company} and its ${input.category} competitors.`,
      `Find evidence about buyer expectations, landing-page structure, trust signals, and conversion messaging.`,
      `Target page: ${input.targetUrl}. Return only claims supported by sources.`,
    ].join(" "),
    depth: "deep",
    outputType: "sourcedAnswer",
  });

  const retrievedAt = new Date().toISOString();
  return response.sources.map((source) => {
    const normalizedSnippet = source.snippet.replace(/\s+/g, " ").trim();
    const firstSentence = normalizedSnippet.match(/^(.{1,280}?[.!?])(?:\s|$)/)?.[1];
    const claim = firstSentence ?? normalizedSnippet.slice(0, 280);
    return EvidenceSchema.parse({
      id: `evidence-${randomUUID()}`,
      claim,
      sourceUrl: source.url,
      sourceTitle: source.name,
      excerpt: source.snippet,
      retrievedAt,
    });
  });
}
