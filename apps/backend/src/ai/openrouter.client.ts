import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export interface OpenRouterTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface OpenRouterChatOptions {
  model?: string;
  messages: OpenRouterMessage[];
  tools?: OpenRouterTool[];
  tool_choice?: 'auto' | 'none';
  max_tokens?: number;
  temperature?: number;
}

export interface OpenRouterChatResponse {
  content: string;
  model: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  finish_reason?: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

@Injectable()
export class OpenRouterClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly defaultModel: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('OPENROUTER_BASE_URL') ??
      'https://openrouter.ai/api/v1';
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    this.defaultModel =
      this.configService.get<string>('OPENROUTER_MODEL') ?? 'z-ai/glm-5';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async chat(options: OpenRouterChatOptions): Promise<OpenRouterChatResponse> {
    const {
      messages,
      model = this.defaultModel,
      tools,
      tool_choice = 'auto',
      max_tokens = 1024,
      temperature = 0.7,
    } = options;

    if (!this.apiKey) {
      throw new Error(
        'OpenRouter is not configured. Set OPENROUTER_API_KEY in the backend environment.',
      );
    }

    const url = `${this.baseUrl.replace(/\/$/, '')}/chat/completions`;
    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens,
      temperature,
    };
    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = tool_choice;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer':
          this.configService.get<string>('FRONTEND_ORIGIN_PROD') ??
          'https://gotrippin.app',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `OpenRouter API error ${response.status}: ${text.slice(0, 500)}`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: Array<{
            id: string;
            type: 'function';
            function: { name: string; arguments: string };
          }>;
        };
        finish_reason?: string;
      }>;
      model?: string;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const choice = data.choices?.[0];
    const msg = choice?.message;
    const content = msg?.content ?? '';
    const tool_calls = msg?.tool_calls;

    return {
      content,
      model: data.model ?? model,
      tool_calls,
      finish_reason: choice?.finish_reason,
      usage: data.usage,
    };
  }
}
