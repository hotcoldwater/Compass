import { neon } from '@neondatabase/serverless';
import { getAuthenticatedUser, type AuthEnv } from '../../_lib/auth';
import { cardJson, ensureExperienceCardTables } from '../../_lib/experience-cards';
import { nextAnalysisQuestion } from '../../_lib/ai/analyze-experience';

type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };
type QaItem = { question: string; answer: string | null };

const normalizeQa = (value: unknown): QaItem[] =>
  Array.isArray(value)
    ? (value as Array<Record<string, unknown>>)
        .map((item) => ({
          question: String(item.question || '').trim(),
          answer: item.answer === null || item.answer === undefined ? null : String(item.answer).trim() || null,
        }))
        .filter((item) => item.question)
    : [];

export const onRequestPost: PagesFunction<AiEnv> = async ({ request, env }) => {
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return cardJson({ ok: false, error: '로그인이 필요합니다.' }, 401);

    const body = (await request.json()) as { experienceCardId?: unknown; qaHistory?: unknown };
    const cardId = Number(body.experienceCardId);
    if (!Number.isInteger(cardId)) return cardJson({ ok: false, error: '먼저 경험을 저장한 뒤 AI 분석을 사용할 수 있습니다.' }, 400);

    await ensureExperienceCardTables(env);
    const sql = neon(env.DATABASE_URL);
    const cards = await sql`SELECT raw_note, category, organization, title FROM experience_cards WHERE id=${cardId} AND user_id=${user.id} LIMIT 1`;
    if (!cards.length) return cardJson({ ok: false, error: '경험을 찾을 수 없습니다.' }, 404);
    const card = cards[0] as { raw_note: string; category: string; organization: string | null; title: string };

    const qaHistory = normalizeQa(body.qaHistory);
    const result = await nextAnalysisQuestion(env, {
      rawNote: card.raw_note,
      category: card.category,
      organization: card.organization || '',
      title: card.title,
      qaHistory,
    });

    return cardJson({ ok: true, data: result });
  } catch (error) {
    return cardJson({ ok: false, error: error instanceof Error ? error.message : 'AI 분석 질문을 생성하지 못했습니다.' }, 500);
  }
};
