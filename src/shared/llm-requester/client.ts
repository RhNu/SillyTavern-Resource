import {
  LlmCapabilitiesSchema,
  LlmGenerateResponseSchema,
  LlmModelsResponseSchema,
  type LlmCapabilities,
  type LlmGenerateRequest,
  type LlmGenerateResponse,
  type LlmModelsRequest,
  type LlmModelsResponse,
} from './contract';

const BASE_URL = '/api/plugins/llm-requester/v1';

function requestHeaders(): Record<string, string> {
  return SillyTavern.getRequestHeaders() as Record<string, string>;
}

async function readError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string; issues?: Array<{ path: string; message: string }> };
      requestId?: string;
    };
    const issues = payload.error?.issues?.map(issue => `${issue.path}: ${issue.message}`).join('；');
    return new Error(
      [payload.error?.code, payload.error?.message, issues, payload.requestId && `request=${payload.requestId}`]
        .filter(Boolean)
        .join(' · ') || `LLM 请求失败 (${response.status})`,
    );
  } catch {
    return new Error(`LLM 请求失败 (${response.status})`);
  }
}

export class LlmRequesterClient {
  async capabilities(signal?: AbortSignal): Promise<LlmCapabilities> {
    const response = await fetch(`${BASE_URL}/capabilities`, { headers: requestHeaders(), signal });
    if (!response.ok) throw await readError(response);
    return LlmCapabilitiesSchema.parse(await response.json());
  }

  async generate(request: LlmGenerateRequest, signal?: AbortSignal): Promise<LlmGenerateResponse> {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { ...requestHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
    if (!response.ok) throw await readError(response);
    return LlmGenerateResponseSchema.parse(await response.json());
  }

  async models(request: LlmModelsRequest, signal?: AbortSignal): Promise<LlmModelsResponse> {
    const response = await fetch(`${BASE_URL}/models`, {
      method: 'POST',
      headers: { ...requestHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
    if (!response.ok) throw await readError(response);
    return LlmModelsResponseSchema.parse(await response.json());
  }
}
