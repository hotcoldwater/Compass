import type { AuthEnv } from '../auth';

type FactField = 'title' | 'summary' | 'situation' | 'task' | 'actions' | 'result' | 'learning';
export type StructureSuggestion = {
  [key in FactField]: key extends 'actions' ? Array<{ text: string; sourceSentence: string }> : string;
} & { missingInformationQuestions: string[]; unsupportedClaims: string[] };
type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };
const empty = (): StructureSuggestion => ({ title: '', summary: '', situation: '', task: '', actions: [], result: '', learning: '', missingInformationQuestions: [], unsupportedClaims: [] });
const list = (value: unknown) => Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5) : [];

function normalize(value: unknown): StructureSuggestion {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const text = (key: string) => String(raw[key] || '').trim().slice(0, 2000);
  const actions = Array.isArray(raw.actions) ? raw.actions.map((item) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return { text: String(row.text || '').trim().slice(0, 1000), sourceSentence: String(row.sourceSentence || '').trim().slice(0, 1000) };
  }).filter((item) => item.text && item.sourceSentence).slice(0, 8) : [];
  return { title: text('title'), summary: text('summary'), situation: text('situation'), task: text('task'), actions, result: text('result'), learning: text('learning'), missingInformationQuestions: list(raw.missingInformationQuestions), unsupportedClaims: list(raw.unsupportedClaims) };
}

export async function suggestExperienceStructure(env: AiEnv, input: { rawNote: string; category: string; organization: string; existingFacts: Record<string, unknown> }) {
  if (!env.AI_API_KEY || !env.AI_MODEL) throw new Error('AI 기능을 사용하려면 AI_API_KEY와 AI_MODEL 환경변수를 설정해주세요.');
  if (env.AI_PROVIDER && env.AI_PROVIDER !== 'openai-compatible') throw new Error('현재는 AI_PROVIDER=openai-compatible만 지원합니다.');
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${env.AI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: env.AI_MODEL, response_format: { type: 'json_object' }, messages: [
    { role: 'system', content: 'You structure a Korean job-application experience note. Return JSON only. Never invent facts, numbers, employers, outcomes, or individual contributions. Use only facts from rawNote and existingFacts. If a field has no evidence, return an empty string. Each action must include an exact or near-exact sourceSentence from rawNote. Put missing details as questions, not claims.' },
    { role: 'user', content: JSON.stringify({ category: input.category, organization: input.organization, rawNote: input.rawNote, existingFacts: input.existingFacts, outputShape: { title: 'string', summary: 'string', situation: 'string', task: 'string', actions: [{ text: 'string', sourceSentence: 'string' }], result: 'string', learning: 'string', missingInformationQuestions: ['string'], unsupportedClaims: ['string'] } }) },
  ] }) });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    const providerMessage = errorBody?.error?.message || '제공자 응답을 읽지 못했습니다.';
    throw new Error(`AI 제안을 생성하지 못했습니다 (${response.status}): ${providerMessage}`);
  }
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 응답이 비어 있습니다.');
  try { return normalize(JSON.parse(content)); } catch { return empty(); }
}
