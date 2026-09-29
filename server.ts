import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Helper: safe fetch without logging sensitive headers
async function safeFetch(url: string, options: RequestInit): Promise<globalThis.Response> {
  return fetch(url, options);
}

// 1. Connection Validation endpoint
app.post('/api/ai/validate', async (req: Request, res: Response): Promise<void> => {
  const { provider, apiKey, baseUrl } = req.body;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    res.status(400).json({ valid: false, error: 'API Key is empty or missing' });
    return;
  }

  const cleanKey = apiKey.trim();

  try {
    switch (provider) {
      case 'gemini': {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
        const response = await safeFetch(url, { method: 'GET' });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Validation failed`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.models || [])
          .map((m: any) => m.name.replace('models/', ''))
          .filter((name: string) => name.includes('gemini'));
        res.json({ valid: true, models: models.slice(0, 15) });
        return;
      }

      case 'openai': {
        const url = 'https://api.openai.com/v1/models';
        const response = await safeFetch(url, {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Invalid OpenAI API key`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        res.json({ valid: true });
        return;
      }

      case 'openrouter': {
        const url = 'https://openrouter.ai/api/v1/auth/key';
        const response = await safeFetch(url, {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Invalid OpenRouter key`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        const data: any = await response.json();
        res.json({ valid: true, data: data?.data });
        return;
      }

      case 'groq': {
        const url = 'https://api.groq.com/openai/v1/models';
        const response = await safeFetch(url, {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Invalid Groq API key`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || []).map((m: any) => m.id);
        res.json({ valid: true, models });
        return;
      }

      case 'anthropic': {
        // Test with minimal count request
        const url = 'https://api.anthropic.com/v1/messages';
        const response = await safeFetch(url, {
          method: 'POST',
          headers: {
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }]
          })
        });
        if (response.status === 401) {
          res.status(200).json({ valid: false, error: 'Invalid Anthropic API key' });
          return;
        }
        // status 200 or even 400 (if credit limit or model access) shows key is authenticated
        if (!response.ok && response.status !== 400 && response.status !== 429) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Anthropic error`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        res.json({ valid: true });
        return;
      }

      case 'mistral': {
        const response = await safeFetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.message || `HTTP ${response.status}: Invalid Mistral API key`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        res.json({ valid: true });
        return;
      }

      case 'deepseek': {
        const response = await safeFetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Invalid DeepSeek API key`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        res.json({ valid: true });
        return;
      }

      case 'xai': {
        const response = await safeFetch('https://api.x.ai/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Invalid xAI API key`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        res.json({ valid: true });
        return;
      }

      case 'cerebras': {
        const response = await safeFetch('https://api.cerebras.ai/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Invalid Cerebras API key`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        res.json({ valid: true });
        return;
      }

      case 'github': {
        const response = await safeFetch('https://models.inference.ai.azure.com/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Invalid GitHub Token`;
          res.status(200).json({ valid: false, error: errMsg });
          return;
        }
        res.json({ valid: true });
        return;
      }

      case 'custom': {
        const targetUrl = (baseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '') + '/models';
        const response = await safeFetch(targetUrl, {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          res.status(200).json({ valid: false, error: `Failed to connect to ${targetUrl} (Status ${response.status})` });
          return;
        }
        res.json({ valid: true });
        return;
      }

      default: {
        res.json({ valid: true, message: 'Provider configured' });
        return;
      }
    }
  } catch (err: any) {
    res.status(200).json({ valid: false, error: err.message || 'Connection test failed. Network or URL unreachable.' });
  }
});

// 2. OpenRouter Live Models Catalog (Public API without requiring key)
app.get('/api/ai/openrouter-models', async (_req: Request, res: Response): Promise<void> => {
  try {
    const response = await safeFetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'HTTP-Referer': 'https://auradev.workspace',
        'X-Title': 'AURA DEV'
      }
    });
    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch OpenRouter models' });
      return;
    }
    const data: any = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch OpenRouter models' });
  }
});

// 2b. Dynamic Model Fetcher for any provider
app.post('/api/ai/fetch-models', async (req: Request, res: Response): Promise<void> => {
  const { provider, apiKey, baseUrl } = req.body;
  const cleanKey = (apiKey || '').trim();

  try {
    switch (provider) {
      case 'gemini': {
        const keyToUse = cleanKey || process.env.GEMINI_API_KEY || '';
        if (!keyToUse) {
          res.status(400).json({ error: 'Gemini API Key is required to query live models' });
          return;
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${keyToUse}`;
        const response = await safeFetch(url, { method: 'GET' });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Failed to fetch Gemini models`;
          res.status(response.status).json({ error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.models || [])
          .filter((m: any) => (m.supportedGenerationMethods || []).includes('generateContent') || m.name.includes('gemini'))
          .map((m: any) => {
            const id = m.name.replace('models/', '');
            const descLower = (m.description || '').toLowerCase();
            const isDeprecated = descLower.includes('deprecated') || descLower.includes('discontinued') || id.includes('deprecated');
            const isShutdown = descLower.includes('shutdown') || descLower.includes('retired');
            const isPreview = id.includes('preview') || id.includes('exp') || descLower.includes('preview') || descLower.includes('experimental');

            let status: 'Active' | 'Preview' | 'Deprecated' | 'Shutdown' = 'Active';
            if (isShutdown) status = 'Shutdown';
            else if (isDeprecated) status = 'Deprecated';
            else if (isPreview) status = 'Preview';

            return {
              id,
              name: m.displayName || id,
              provider: 'gemini',
              status,
              contextLength: m.inputTokenLimit || 1048576,
              inputTokenLimit: m.inputTokenLimit,
              outputTokenLimit: m.outputTokenLimit,
              supportsText: true,
              supportsImage: id.includes('gemini') || descLower.includes('multimodal'),
              supportsCode: true,
              description: m.description || `Google Gemini formal model (${id})`
            };
          });

        res.json({ models });
        return;
      }

      case 'openai': {
        if (!cleanKey) {
          res.status(400).json({ error: 'OpenAI API key is required to query live models' });
          return;
        }
        const response = await safeFetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Failed to fetch OpenAI models`;
          res.status(response.status).json({ error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || [])
          .filter((m: any) =>
            m.id.startsWith('gpt-') ||
            m.id.startsWith('o1') ||
            m.id.startsWith('o3') ||
            m.id.startsWith('chatgpt-')
          )
          .sort((a: any, b: any) => (b.created || 0) - (a.created || 0))
          .map((m: any) => {
            const id = m.id;
            const isPreview = id.includes('preview') || id.includes('preview-');
            const isDeprecated = id.includes('0301') || id.includes('0613') || id.includes('deprecated');

            let status: 'Active' | 'Preview' | 'Deprecated' | 'Shutdown' = 'Active';
            if (isDeprecated) status = 'Deprecated';
            else if (isPreview) status = 'Preview';

            let contextLength = 128000;
            if (id.includes('o1') || id.includes('o3')) contextLength = 200000;

            return {
              id,
              name: id,
              provider: 'openai',
              status,
              contextLength,
              supportsText: true,
              supportsImage: id.includes('4o') || id.includes('vision'),
              supportsCode: true,
              description: `OpenAI formal model (${id})`
            };
          });

        res.json({ models });
        return;
      }

      case 'groq': {
        if (!cleanKey) {
          res.status(400).json({ error: 'Groq API key is required to query live models' });
          return;
        }
        const response = await safeFetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Failed to fetch Groq models`;
          res.status(response.status).json({ error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || []).map((m: any) => {
          const id = m.id;
          let status: 'Active' | 'Preview' | 'Deprecated' | 'Shutdown' = 'Active';
          if (m.active === false) status = 'Deprecated';
          else if (id.includes('preview')) status = 'Preview';

          return {
            id,
            name: id,
            provider: 'groq',
            status,
            contextLength: m.context_window || 128000,
            supportsText: true,
            supportsImage: id.includes('vision'),
            supportsCode: true,
            description: `Groq LPU ultra-fast model (${id})`
          };
        });

        res.json({ models });
        return;
      }

      case 'anthropic': {
        if (!cleanKey) {
          res.status(400).json({ error: 'Anthropic API key is required' });
          return;
        }
        const response = await safeFetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01'
          }
        });
        if (response.ok) {
          const data: any = await response.json();
          const models = (data.data || []).map((m: any) => ({
            id: m.id,
            name: m.display_name || m.id,
            provider: 'anthropic',
            status: m.id.includes('preview') ? 'Preview' : 'Active',
            contextLength: 200000,
            supportsText: true,
            supportsImage: true,
            supportsCode: true,
            description: `Anthropic Claude formal model (${m.id})`
          }));
          res.json({ models });
          return;
        }

        // If Anthropic models API is not yet enabled for the key, return formal catalog
        const defaultAnthropic = [
          { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', status: 'Active', contextLength: 200000 },
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', status: 'Active', contextLength: 200000 },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', status: 'Active', contextLength: 200000 },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', status: 'Active', contextLength: 200000 }
        ].map((m) => ({
          ...m,
          provider: 'anthropic',
          supportsText: true,
          supportsImage: true,
          supportsCode: true,
          description: `Anthropic formal model (${m.id})`
        }));
        res.json({ models: defaultAnthropic });
        return;
      }

      case 'openrouter': {
        const response = await safeFetch('https://openrouter.ai/api/v1/models', {
          headers: {
            'HTTP-Referer': 'https://auradev.workspace',
            'X-Title': 'AURA DEV'
          }
        });
        if (!response.ok) {
          res.status(response.status).json({ error: 'Failed to fetch OpenRouter models' });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || []).slice(0, 150).map((m: any) => {
          const id = m.id;
          const desc = (m.description || '').toLowerCase();
          let status: 'Active' | 'Preview' | 'Deprecated' | 'Shutdown' = 'Active';
          if (desc.includes('deprecated') || id.includes('deprecated')) status = 'Deprecated';
          else if (id.includes('preview') || id.includes(':free')) status = 'Preview';

          const promptUSD = parseFloat(m.pricing?.prompt || '0') * 1_000_000;
          const compUSD = parseFloat(m.pricing?.completion || '0') * 1_000_000;

          return {
            id,
            name: m.name || id,
            provider: 'openrouter',
            status,
            contextLength: m.context_length || 128000,
            promptPricePerM: Number(promptUSD.toFixed(4)),
            completionPricePerM: Number(compUSD.toFixed(4)),
            supportsText: true,
            supportsImage: m.architecture?.modality?.includes('image') || desc.includes('vision'),
            supportsCode: true,
            description: m.description ? m.description.slice(0, 140) + '...' : `OpenRouter model (${id})`
          };
        });

        res.json({ models });
        return;
      }

      case 'mistral': {
        if (!cleanKey) {
          res.status(400).json({ error: 'Mistral API key is required to query live models' });
          return;
        }
        const response = await safeFetch('https://api.mistral.ai/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.message || `HTTP ${response.status}: Failed to fetch Mistral models`;
          res.status(response.status).json({ error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || []).map((m: any) => {
          const id = m.id;
          const isDeprecated = m.deprecated || id.includes('deprecated');
          let status: 'Active' | 'Preview' | 'Deprecated' | 'Shutdown' = 'Active';
          if (isDeprecated) status = 'Deprecated';
          else if (id.includes('preview')) status = 'Preview';

          return {
            id,
            name: m.name || id,
            provider: 'mistral',
            status,
            contextLength: m.max_context_length || 128000,
            supportsText: true,
            supportsImage: !!(m.capabilities?.vision || id.includes('pixtral')),
            supportsCode: true,
            description: m.description || `Mistral formal model (${id})`
          };
        });
        res.json({ models });
        return;
      }

      case 'deepseek': {
        if (!cleanKey) {
          res.status(400).json({ error: 'DeepSeek API key is required to query live models' });
          return;
        }
        const response = await safeFetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Failed to fetch DeepSeek models`;
          res.status(response.status).json({ error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || []).map((m: any) => {
          const id = m.id;
          return {
            id,
            name: id === 'deepseek-chat' ? 'DeepSeek V3' : id === 'deepseek-reasoner' ? 'DeepSeek R1' : id,
            provider: 'deepseek',
            status: 'Active' as const,
            contextLength: 128000,
            supportsText: true,
            supportsImage: false,
            supportsCode: true,
            promptPricePerM: id === 'deepseek-reasoner' ? 0.55 : 0.14,
            completionPricePerM: id === 'deepseek-reasoner' ? 2.19 : 0.28,
            description: `DeepSeek formal model (${id})`
          };
        });
        res.json({ models });
        return;
      }

      case 'xai': {
        if (!cleanKey) {
          res.status(400).json({ error: 'xAI API key is required to query live models' });
          return;
        }
        const response = await safeFetch('https://api.x.ai/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Failed to fetch xAI models`;
          res.status(response.status).json({ error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || []).map((m: any) => {
          const id = m.id;
          return {
            id,
            name: id,
            provider: 'xai',
            status: id.includes('preview') ? 'Preview' as const : 'Active' as const,
            contextLength: 131072,
            supportsText: true,
            supportsImage: id.includes('vision') || id.includes('grok-2'),
            supportsCode: true,
            description: `xAI Grok formal model (${id})`
          };
        });
        res.json({ models });
        return;
      }

      case 'cerebras': {
        if (!cleanKey) {
          res.status(400).json({ error: 'Cerebras API key is required to query live models' });
          return;
        }
        const response = await safeFetch('https://api.cerebras.ai/v1/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Failed to fetch Cerebras models`;
          res.status(response.status).json({ error: errMsg });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || []).map((m: any) => {
          const id = m.id;
          return {
            id,
            name: id,
            provider: 'cerebras',
            status: 'Active' as const,
            contextLength: 128000,
            supportsText: true,
            supportsImage: false,
            supportsCode: true,
            description: `Cerebras ultra-fast wafer-scale model (${id})`
          };
        });
        res.json({ models });
        return;
      }

      case 'github': {
        if (!cleanKey) {
          res.status(400).json({ error: 'GitHub Personal Access Token is required' });
          return;
        }
        const response = await safeFetch('https://models.inference.ai.azure.com/models', {
          headers: { Authorization: `Bearer ${cleanKey}` }
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = (errData as any)?.error?.message || `HTTP ${response.status}: Failed to fetch GitHub models`;
          res.status(response.status).json({ error: errMsg });
          return;
        }
        const data: any = await response.json();
        const rawList = Array.isArray(data) ? data : data.data || [];
        const models = rawList.map((m: any) => {
          const id = m.name || m.id;
          return {
            id,
            name: m.friendly_name || id,
            provider: 'github',
            status: 'Active' as const,
            contextLength: 128000,
            supportsText: true,
            supportsImage: true,
            supportsCode: true,
            description: m.summary || `GitHub Models catalog (${id})`
          };
        });
        res.json({ models });
        return;
      }

      case 'custom': {
        const targetUrl = (baseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '') + '/models';
        const headers: Record<string, string> = {};
        if (cleanKey) headers['Authorization'] = `Bearer ${cleanKey}`;
        const response = await safeFetch(targetUrl, { headers });
        if (!response.ok) {
          res.status(response.status).json({ error: `Failed to fetch models from ${targetUrl}` });
          return;
        }
        const data: any = await response.json();
        const models = (data.data || data.models || []).map((m: any) => {
          const id = m.id || m.name;
          return {
            id,
            name: id,
            provider: 'custom',
            status: 'Active' as const,
            contextLength: 128000,
            supportsText: true,
            supportsImage: false,
            supportsCode: true,
            description: `Custom model from ${targetUrl}`
          };
        });
        res.json({ models });
        return;
      }

      default: {
        res.status(400).json({ error: `Unsupported provider for model query: ${provider}` });
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error querying models from provider' });
  }
});

// 3. Streaming Chat Completion SSE Proxy
app.post('/api/ai/stream', async (req: Request, res: Response): Promise<void> => {
  const { provider, model, messages, apiKey, baseUrl, temperature = 0.7, maxTokens = 4096 } = req.body;

  if (!apiKey || typeof apiKey !== 'string') {
    res.status(400).json({ error: 'Missing or invalid API key' });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const cleanKey = apiKey.trim();

  try {
    if (provider === 'gemini') {
      const geminiModel = model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?key=${cleanKey}&alt=sse`;

      // Transform OpenAI-like messages to Gemini format
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const body = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      };

      const upstream = await safeFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!upstream.ok) {
        const errJson = await upstream.json().catch(() => ({}));
        const errMsg = (errJson as any)?.error?.message || `Gemini error HTTP ${upstream.status}`;
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      }

      if (!upstream.body) {
        res.write(`data: ${JSON.stringify({ error: 'No response body received' })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (rawData === '[DONE]') {
              res.write(`data: [DONE]\n\n`);
              continue;
            }
            try {
              const parsed = JSON.parse(rawData);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    if (provider === 'anthropic') {
      const anthropicModel = model || 'claude-3-5-sonnet-20241022';
      const systemMsg = messages.find((m: any) => m.role === 'system');
      const nonSystemMessages = messages
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

      const body: any = {
        model: anthropicModel,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        messages: nonSystemMessages
      };
      if (systemMsg) {
        body.system = systemMsg.content;
      }

      const upstream = await safeFetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!upstream.ok) {
        const errJson = await upstream.json().catch(() => ({}));
        const errMsg = (errJson as any)?.error?.message || `Anthropic error HTTP ${upstream.status}`;
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      }

      if (!upstream.body) {
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            try {
              const parsed = JSON.parse(rawData);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                res.write(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`);
              }
            } catch {
              // Ignore
            }
          }
        }
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    // Default OpenAI-compatible SSE (OpenAI, Groq, OpenRouter, Mistral, Cerebras, xAI, DeepSeek, Custom)
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`
    };

    if (provider === 'groq') {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (provider === 'openrouter') {
      endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      headers['HTTP-Referer'] = 'https://auradev.workspace';
      headers['X-Title'] = 'AURA DEV';
    } else if (provider === 'custom') {
      endpoint = (baseUrl || 'http://localhost:11434/v1').replace(/\/+$/, '') + '/chat/completions';
    } else if (provider === 'deepseek') {
      endpoint = 'https://api.deepseek.com/v1/chat/completions';
    } else if (provider === 'xai') {
      endpoint = 'https://api.x.ai/v1/chat/completions';
    } else if (provider === 'mistral') {
      endpoint = 'https://api.mistral.ai/v1/chat/completions';
    } else if (provider === 'cerebras') {
      endpoint = 'https://api.cerebras.ai/v1/chat/completions';
    } else if (provider === 'github') {
      endpoint = 'https://models.inference.ai.azure.com/chat/completions';
    }

    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    };

    const upstream = await safeFetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      const errJson = await upstream.json().catch(() => ({}));
      const errMsg = (errJson as any)?.error?.message || `${provider} error HTTP ${upstream.status}`;
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    if (!upstream.body) {
      res.write(`data: [DONE]\n\n`);
      res.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const rawData = line.slice(6).trim();
          if (rawData === '[DONE]') {
            res.write(`data: [DONE]\n\n`);
            continue;
          }
          try {
            const parsed = JSON.parse(rawData);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {
            // Ignore parse errors on malformed chunks
          }
        }
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message || 'Stream processing error' })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  }
});

// Mount Vite or Static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AURA DEV] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AURA DEV] Server failed to start:', err);
  process.exit(1);
});
