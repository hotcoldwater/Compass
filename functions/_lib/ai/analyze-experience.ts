import type { AuthEnv } from '../auth';

type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };

export type NextQuestion = { done: boolean; question: string };
export type SynthesizedNote = { rawNote: string };

function assertConfigured(env: AiEnv) {
  if (!env.AI_API_KEY || !env.AI_MODEL) throw new Error('AI 기능을 사용하려면 AI_API_KEY와 AI_MODEL 환경변수를 설정해주세요.');
  if (env.AI_PROVIDER && env.AI_PROVIDER !== 'openai-compatible') throw new Error('현재는 AI_PROVIDER=openai-compatible만 지원합니다.');
}

async function callChat(env: AiEnv, system: string, userContent: Record<string, unknown>, errorLabel: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.AI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(userContent) },
      ],
    }),
  });
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    const providerMessage = errorBody?.error?.message || '제공자 응답을 읽지 못했습니다.';
    throw new Error(`${errorLabel} (${response.status}): ${providerMessage}`);
  }
  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 응답이 비어 있습니다.');
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error('AI 응답 형식을 읽지 못했습니다.');
  }
}

export async function nextAnalysisQuestion(env: AiEnv, input: Record<string, unknown>): Promise<NextQuestion> {
  assertConfigured(env);
  const parsed = await callChat(
    env,
    'You help a Korean job-seeker enrich a recorded experience note by asking one clarifying question at a time. Return JSON only. Look at rawNote, category, organization, title, and qaHistory (questions already asked, each with the user\'s answer, or answer=null if the user skipped it). Ask about concrete missing details that would make the experience more specific and useful for later job-application answers: quantifiable results, the user\'s individual role versus the team\'s, obstacles faced, decisions made, tools or methods used, what changed afterward. Never repeat a question already in qaHistory, including skipped ones. Ask exactly ONE short, concrete Korean question per turn. If the note is already detailed enough, or qaHistory already has 5 or more entries, or you cannot think of a genuinely new useful question, set done=true and question=\'\'. Otherwise set done=false and question=\'<one Korean question>\'.',
    { ...input, outputShape: { done: 'boolean', question: 'string' } },
    'AI 분석 질문을 생성하지 못했습니다'
  );
  const question = String(parsed.question || '').trim();
  const done = Boolean(parsed.done) || !question;
  return { done, question: done ? '' : question };
}

export async function synthesizeExperienceNote(env: AiEnv, input: Record<string, unknown>): Promise<SynthesizedNote> {
  assertConfigured(env);
  const parsed = await callChat(
    env,
    'You rewrite a Korean job-experience note to be richer and more specific, using ONLY facts from the original rawNote and the answered qaHistory pairs supplied by the user. Never invent numbers, outcomes, dates, or any claim not present in the input. Weave the new answers naturally into the note in first person, keeping every fact from the original rawNote. Return JSON only with a single field rawNote containing the rewritten Korean text (paragraphs separated by line breaks are fine).',
    { ...input, outputShape: { rawNote: 'string' } },
    'AI가 경험 내용을 보강하지 못했습니다'
  );
  return { rawNote: String(parsed.rawNote || '').trim() };
}
