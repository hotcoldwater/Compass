import type { AuthEnv } from '../auth';

type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };
export type AnswerGeneration = { answer: string; usedFacts: string[]; unsupportedClaims: string[]; warnings: string[] };
const cleanList = (value: unknown) => Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 12) : [];

export async function generateAnswer(env: AiEnv, input: Record<string, unknown>): Promise<AnswerGeneration> {
  if (!env.AI_API_KEY || !env.AI_MODEL) throw new Error('AI 기능을 사용하려면 AI_API_KEY와 AI_MODEL 환경변수를 설정해주세요.');
  if (env.AI_PROVIDER && env.AI_PROVIDER !== 'openai-compatible') throw new Error('현재는 AI_PROVIDER=openai-compatible만 지원합니다.');
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${env.AI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: env.AI_MODEL, response_format: { type: 'json_object' }, messages: [
    { role: 'system', content: 'Write a Korean job-application answer. Return JSON only. Use ONLY the selected facts, confirmedMetrics, and additionalDetails (follow-up question/answer pairs) supplied by the user. Never invent or change numbers, achievements, company facts, dates, roles, or individual contribution. Do not make team outcomes sound like individual outcomes. If an outline is supplied, follow its flow and structure rather than inventing a different structure. If companyInfo is supplied, connect it with the user\'s strengths and experience where relevant, especially for motivation-style questions — but never invent claims about the company beyond what companyInfo states. If facts are insufficient, write conservatively and add a warning, but still write as fully as the facts allow. The limit field states the maximum length (limit.type is chars or bytes, limit.value is the number); always write to fill at least 90% of that maximum — never stop at a short paragraph just because the facts are sparse. Reach the target length by adding legitimate depth grounded in the given facts: concrete detail already implied by them, the reasoning or decision-making process, obstacles and how they were handled, and the significance of the result — never by inventing new facts, numbers, or claims. If limit.type is none, still write a thorough, complete answer (roughly 700–1000 Korean characters) rather than a short summary. If instructions.mode is "expand", you are given previousAnswer: rewrite and elaborate it using the same facts to get much closer to the target length; do not shorten it or drop any fact it already contains. Do not overwrite any existing answer; you are creating a proposed new version.' },
    { role: 'user', content: JSON.stringify({ ...input, outputShape: { answer: 'string', usedFacts: ['fact id or exact fact'], unsupportedClaims: ['string'], warnings: ['string'] } }) },
  ] }) });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    const providerMessage = errorBody?.error?.message || '제공자 응답을 읽지 못했습니다.';
    throw new Error(`AI 자소서 초안을 생성하지 못했습니다 (${response.status}): ${providerMessage}`);
  }
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> }; const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 응답이 비어 있습니다.');
  try { const parsed = JSON.parse(content) as Record<string, unknown>; return { answer: String(parsed.answer || '').trim(), usedFacts: cleanList(parsed.usedFacts), unsupportedClaims: cleanList(parsed.unsupportedClaims), warnings: cleanList(parsed.warnings) }; } catch { throw new Error('AI 응답 형식을 읽지 못했습니다.'); }
}
