import { getAuthenticatedUser, type AuthEnv } from '../../_lib/auth';
import { cardJson } from '../../_lib/experience-cards';
import { loadAnswerContext } from '../../_lib/ai/answer-context';
import { planAnswer } from '../../_lib/ai/plan-answer';

type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };
type Followup = { question: string; answer: string };

const normalizeFollowups = (value: unknown): Followup[] =>
  Array.isArray(value)
    ? (value as Array<Record<string, unknown>>)
        .map((item) => ({ question: String(item.question || '').trim(), answer: String(item.answer || '').trim() }))
        .filter((item) => item.question && item.answer)
    : [];

export const onRequestPost: PagesFunction<AiEnv> = async ({ request, env }) => {
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return cardJson({ ok: false, error: '로그인이 필요합니다.' }, 401);

    const body = (await request.json()) as { resumeQuestionId?: unknown; outline?: unknown; companyInfo?: unknown; followups?: unknown };
    const questionId = Number(body.resumeQuestionId);
    if (!Number.isInteger(questionId)) return cardJson({ ok: false, error: '저장된 자소서 문항에서만 AI 작성을 사용할 수 있습니다.' }, 400);

    const outline = String(body.outline || '').trim();
    if (!outline) return cardJson({ ok: false, error: '답변 흐름을 먼저 입력해주세요.' }, 400);
    const companyInfo = String(body.companyInfo || '').trim();
    const followups = normalizeFollowups(body.followups);

    const context = await loadAnswerContext(env, user, questionId);
    if (!context.ok) return cardJson({ ok: false, error: context.error }, context.status);
    const { question, facts, confirmedMetrics } = context.data;

    const plan = await planAnswer(env, {
      companyName: question.company_name || '',
      jobField: question.job_field || '',
      question: question.question_text,
      outline,
      companyInfo: companyInfo || question.company_info || '',
      selectedFacts: facts,
      confirmedMetrics,
      previousFollowups: followups,
    });

    return cardJson({ ok: true, data: plan });
  } catch (error) {
    return cardJson({ ok: false, error: error instanceof Error ? error.message : 'AI 흐름 점검을 완료하지 못했습니다.' }, 500);
  }
};
