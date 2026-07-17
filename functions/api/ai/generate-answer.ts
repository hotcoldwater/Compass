import { neon } from '@neondatabase/serverless';
import { getAuthenticatedUser, type AuthEnv } from '../../_lib/auth';
import { cardJson, ensureExperienceCardTables } from '../../_lib/experience-cards';
import { generateAnswer } from '../../_lib/ai/generate-answer';

type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };
const bytes = (value: string) => new TextEncoder().encode(value).length;
export const onRequestPost: PagesFunction<AiEnv> = async ({ request, env }) => {
  try {
    const user = await getAuthenticatedUser(request, env); if (!user) return cardJson({ ok: false, error: '로그인이 필요합니다.' }, 401);
    const questionId = Number((await request.json() as { resumeQuestionId?: unknown }).resumeQuestionId); if (!Number.isInteger(questionId)) return cardJson({ ok: false, error: '저장된 자소서 문항에서만 AI 작성을 사용할 수 있습니다.' }, 400);
    await ensureExperienceCardTables(env); const sql = neon(env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS resume_answer_versions (id SERIAL PRIMARY KEY, resume_question_id INTEGER NOT NULL REFERENCES resume_questions(id) ON DELETE CASCADE, version_number INTEGER NOT NULL, content TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'manual', generation_metadata JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (resume_question_id, version_number))`;
    const questions = await sql`SELECT q.id, q.question_text, q.limit_type, q.limit_value, r.company_name, r.job_field FROM resume_questions q INNER JOIN resumes r ON r.id=q.resume_id WHERE q.id=${questionId} AND r.user_id=${user.id} LIMIT 1`;
    if (!questions.length) return cardJson({ ok: false, error: '문항을 찾을 수 없습니다.' }, 404);
    const question = questions[0] as { question_text: string; limit_type: 'chars'|'bytes'|'none'; limit_value: number|null; company_name: string|null; job_field: string|null };
    const links = await sql`SELECT l.experience_card_id, l.story_angle_id, l.is_primary, c.title, c.situation, c.task, c.actions, c.result, c.learning, s.title AS story_title, s.core_message, s.situation AS story_situation, s.challenge, s.action AS story_action, s.result AS story_result, s.learning AS story_learning FROM resume_question_experience_links l INNER JOIN experience_cards c ON c.id=l.experience_card_id LEFT JOIN experience_story_angles s ON s.id=l.story_angle_id WHERE l.resume_question_id=${questionId} AND c.user_id=${user.id} ORDER BY l.is_primary DESC,l.link_order`;
    if (!links.length) return cardJson({ ok: false, error: 'AI 작성 전에 문항에 사용할 경험카드를 연결해주세요.' }, 400);
    const cardIds = links.map((link) => Number((link as { experience_card_id: number }).experience_card_id));
    const metrics = await sql`SELECT m.experience_card_id,m.display_text FROM experience_metrics m WHERE m.experience_card_id = ANY(${cardIds}) AND m.verification_status='confirmed' ORDER BY m.sort_order,m.id`;
    const facts = links.map((link, index) => { const row = link as Record<string, unknown>; const actions = Array.isArray(row.actions) ? row.actions.map((item) => String((item as { text?: string }).text || '')).filter(Boolean) : []; return { id: `experience-${index + 1}`, priority: Boolean(row.is_primary) ? 'primary' : 'supporting', title: row.title, story: row.story_title || '', coreMessage: row.core_message || '', situation: row.story_situation || row.situation || '', challenge: row.challenge || row.task || '', actions: row.story_action ? [row.story_action] : actions, result: row.story_result || row.result || '', learning: row.story_learning || row.learning || '' }; });
    const generation = await generateAnswer(env, { companyName: question.company_name || '', jobField: question.job_field || '', question: question.question_text, limit: { type: question.limit_type, value: question.limit_value }, selectedFacts: facts, confirmedMetrics: metrics.map((metric) => (metric as { display_text: string }).display_text), instructions: { tone: 'professional', structure: 'conclusion_first' } });
    if (!generation.answer) return cardJson({ ok: false, error: 'AI가 초안을 만들지 못했습니다.' }, 500);
    const count = question.limit_type === 'bytes' ? bytes(generation.answer) : generation.answer.length;
    const versions = await sql`SELECT COALESCE(MAX(version_number), 0)::int AS latest FROM resume_answer_versions WHERE resume_question_id=${questionId}`;
    const versionNumber = Number((versions[0] as { latest: number }).latest) + 1;
    const inserted = await sql`INSERT INTO resume_answer_versions (resume_question_id,version_number,content,source,generation_metadata) VALUES (${questionId},${versionNumber},${generation.answer},'ai_generated',${JSON.stringify({ usedFacts: generation.usedFacts, warnings: generation.warnings })}::jsonb) RETURNING id`;
    return cardJson({ ok: true, data: { ...generation, versionId: Number((inserted[0] as { id: number }).id), versionNumber, charCount: generation.answer.length, byteCount: bytes(generation.answer), limitStatus: { type: question.limit_type, limit: question.limit_value, current: count, isExceeded: question.limit_type !== 'none' && Boolean(question.limit_value) && count > Number(question.limit_value) } } });
  } catch (error) { return cardJson({ ok: false, error: error instanceof Error ? error.message : 'AI 자소서 초안을 생성하지 못했습니다.' }, 500); }
};
