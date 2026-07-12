export interface HermesRunResult {
  runId: string;
  status: "completed";
  output: string;
}

interface HermesRunState {
  run_id: string;
  status: string;
  output?: string;
  error?: string;
}

interface HermesRunsClientOptions {
  baseUrl: string;
  apiKey: string;
  fetchFn?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  pollIntervalMs?: number;
  maxRunMs?: number;
  now?: () => number;
}

export class HermesRunsClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly pollIntervalMs: number;
  private readonly maxRunMs: number;
  private readonly now: () => number;

  constructor(options: HermesRunsClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetchFn = options.fetchFn ?? fetch;
    this.sleep =
      options.sleep ??
      ((milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.pollIntervalMs = options.pollIntervalMs ?? 2_000;
    this.maxRunMs = options.maxRunMs ?? 15 * 60 * 1_000;
    this.now = options.now ?? Date.now;
  }

  async run(input: string, sessionId: string): Promise<HermesRunResult> {
    const created = await this.request("/v1/runs", {
      method: "POST",
      body: JSON.stringify({ input, session_id: sessionId }),
    });
    const deadline = this.now() + this.maxRunMs;

    while (true) {
      if (this.now() > deadline) {
        await this.request(`/v1/runs/${created.run_id}/stop`, { method: "POST" });
        throw new Error(`Hermes run timed out after ${this.maxRunMs}ms`);
      }
      const state = await this.request(`/v1/runs/${created.run_id}`);
      if (state.status === "completed") {
        return {
          runId: state.run_id,
          status: "completed",
          output: state.output ?? "",
        };
      }
      if (state.status === "failed" || state.status === "cancelled") {
        throw new Error(state.error ?? `Hermes run ${state.status}`);
      }
      await this.sleep(this.pollIntervalMs);
    }
  }

  private async request(path: string, init: RequestInit = {}): Promise<HermesRunState> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`Hermes API returned HTTP ${response.status}`);
    }
    return (await response.json()) as HermesRunState;
  }
}
