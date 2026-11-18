/** Cliente HTTP para o endpoint padrão /run do Google ADK. Sem segredos no navegador. */
const baseUrl = (import.meta.env.VITE_ADK_API_URL ?? '').replace(/\/+$/, '');
const appName = import.meta.env.VITE_ADK_APP_NAME ?? '';

export const adkConfigured = Boolean(baseUrl && appName);

type AdkPart = { text?: string; thought?: boolean };
type AdkEvent = {
  author?: string;
  content?: { role?: string; parts?: AdkPart[] };
  isFinalResponse?: boolean;
};

async function check(response: Response, action: string) {
  if (response.ok) return;
  const details = (await response.text()).slice(0, 350);
  throw new Error(`${action}: HTTP ${response.status}${details ? ` — ${details}` : ''}`);
}

export async function createSession(userId: string, sessionId: string): Promise<void> {
  if (!adkConfigured) throw new Error('Configure VITE_ADK_API_URL e VITE_ADK_APP_NAME no .env');
  const path = `/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  // Uma sessão existente também é válida em chamadas repetidas, dependendo do deploy.
  if (response.status === 409) return;
  await check(response, 'Criação da sessão');
}

export async function askAgent(message: string, userId: string, sessionId: string): Promise<string> {
  if (!adkConfigured) throw new Error('Endpoint ADK não configurado');
  const response = await fetch(`${baseUrl}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appName, userId, sessionId,
      newMessage: { role: 'user', parts: [{ text: message }] },
      streaming: false,
    }),
  });
  await check(response, 'Execução do agente');
  const events: unknown = await response.json();
  if (!Array.isArray(events)) throw new Error('O endpoint /run não retornou uma lista de eventos ADK');
  const typedEvents = events as AdkEvent[];
  // Preferir a última resposta final do agente; ignorar pensamentos internos.
  const finalEvents = typedEvents.filter(event => event.isFinalResponse);
  const candidates = finalEvents.length ? finalEvents : typedEvents.filter(event => event.content?.role === 'model');
  const text = candidates.flatMap(event => event.content?.parts ?? [])
    .filter(part => !part.thought && typeof part.text === 'string')
    .map(part => part.text!.trim()).filter(Boolean);
  if (!text.length) throw new Error('O agente respondeu sem conteúdo textual visível');
  return text.join('\n\n');
}
