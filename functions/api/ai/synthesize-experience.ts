import { neon } from '@neondatabase/serverless';
import { getAuthenticatedUser, type AuthEnv } from '../../_lib/auth';
import { cardJson, ensureExperienceCardTables } from '../../_lib/experience-cards';
import { synthesizeExperienceNote } from '../../_lib/ai/analyze-experience';

type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };
type QaItem = { question: string; answer: string };

const normalizeQa = (value: unknown): QaItem[] =>
  Array.isArray(value)
    ? (value as Array<Record<string, unknown>>)
        .map((item) => ({ question: String(item.question || '').trim(), answer: String(item.answer || '').trim() }))
        .filter((item) => item.question && item.answer)
    : [];

export const onRequestPost: PagesFunction<AiEnv> = async ({ request, env }) => {
  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) return cardJson({ ok: false, error: '로그인이 필요합니다.' }, 401);

    const body = (await request.json()) as { experienceCardId?: unknown; qaHistory?: unknown };
    const cardId = Number(body.experienceCardId);
    if (!Number.isInteger(cardId)) return cardJson({ ok: false, error: '먼저 경험을 저장한 뒤 AI 분석을 사용할 수 있습니다.' }, 400);

    const qaHistory = normalizeQa(body.qaHistory);
    if (!qaHistory.length) return cardJson({ ok: false, error: '답변한 질문이 없어 경험을 보강하지 못했습니다.' }, 400);

    await ensureExperienceCardTables(env);
    const sql = neon(env.DATABASE_URL);
    const cards = await sql`SELECT raw_note FROM experience_cards WHERE id=${cardId} AND user_id=${user.id} LIMIT 1`;
    if (!cards.length) return cardJson({ ok: false, error: '경험을 찾을 수 없습니다.' }, 404);
    const rawNote = (cards[0] as { raw_note: string }).raw_note;

    const synthesized = await synthesizeExperienceNote(env, { rawNote, qaHistory });
    if (!synthesized.rawNote) return cardJson({ ok: false, error: 'AI가 경험 내용을 보강하지 못했습니다.' }, 500);

    await sql`UPDATE experience_cards SET raw_note=${synthesized.rawNote}, updated_at=NOW() WHERE id=${cardId} AND user_id=${user.id}`;

    return cardJson({ ok: true, data: { raw_note: synthesized.rawNote } });
  } catch (error) {
    return cardJson({ ok: false, error: error instanceof Error ? error.message : '경험 내용을 보강하지 못했습니다.' }, 500);
  }
};
