import type { AuthEnv } from '../auth';

type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };
export type AnswerPlan = { sufficient: boolean; questions: string[] };

const list = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 6) : [];

export async function planAnswer(env: AiEnv, input: Record<string, unknown>): Promise<AnswerPlan> {
  if (!env.AI_API_KEY || !env.AI_MODEL) throw new Error('AI 기능을 사용하려면 AI_API_KEY와 AI_MODEL 환경변수를 설정해주세요.');
  if (env.AI_PROVIDER && env.AI_PROVIDER !== 'openai-compatible') throw new Error('현재는 AI_PROVIDER=openai-compatible만 지원합니다.');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.AI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You judge whether there is enough information to draft a Korean job-application answer. Return JSON only. Base your judgment on the user outline, selected experience facts, confirmed metrics, previously answered follow-up questions, and any company info. If the outline plus the facts are enough to write a specific, well-supported answer, set sufficient=true and questions=[]. If key details are missing (for example, the outline references a step with no supporting fact, or a motivation-style question has no company info to connect with the user\'s strengths), set sufficient=false and ask up to 4 short, concrete Korean follow-up questions that would fill the gap. Never ask about facts already present in selectedFacts, confirmedMetrics, or previousFollowups.',
        },
        {
          role: 'user',
          content: JSON.stringify({ ...input, outputShape: { sufficient: 'boolean', questions: ['string'] } }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    const providerMessage = errorBody?.error?.message || '제공자 응답을 읽지 못했습니다.';
    throw new Error(`AI 흐름 점검을 완료하지 못했습니다 (${response.status}): ${providerMessage}`);
  }

  const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI 응답이 비어 있습니다.');

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const questions = list(parsed.questions);
    return { sufficient: Boolean(parsed.sufficient) && questions.length === 0, questions };
  } catch {
    throw new Error('AI 응답 형식을 읽지 못했습니다.');
  }
}
