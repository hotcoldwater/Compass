import { neon } from '@neondatabase/serverless';
import { getAuthenticatedUser, type AuthEnv } from '../../_lib/auth';
import { cardJson } from '../../_lib/experience-cards';
import { loadAnswerContext } from '../../_lib/ai/answer-context';
import { generateAnswer } from '../../_lib/ai/generate-answer';

type AiEnv = AuthEnv & { AI_API_KEY?: string; AI_MODEL?: string; AI_PROVIDER?: string };
type Followup = { question: string; answer: string };
const bytes = (value: string) => new TextEncoder().encode(value).length;

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

    const body = (await request.json()) as {
      resumeQuestionId?: unknown;
      outline?: unknown;
      companyInfo?: unknown;
      followups?: unknown;
    };
    const questionId = Number(body.resumeQuestionId);
    if (!Number.isInteger(questionId)) return cardJson({ ok: false, error: '저장된 자소서 문항에서만 AI 작성을 사용할 수 있습니다.' }, 400);
    const outline = String(body.outline || '').trim();
    const companyInfo = String(body.companyInfo || '').trim();
    const followups = normalizeFollowups(body.followups);

    const sql = neon(env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS resume_answer_versions (id SERIAL PRIMARY KEY, resume_question_id INTEGER NOT NULL REFERENCES resume_questions(id) ON DELETE CASCADE, version_number INTEGER NOT NULL, content TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'manual', generation_metadata JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (resume_question_id, version_number))`;

    const context = await loadAnswerContext(env, user, questionId);
    if (!context.ok) return cardJson({ ok: false, error: context.error }, context.status);
    const { question, facts, confirmedMetrics, primaryExperienceCardId } = context.data;

    const generation = await generateAnswer(env, {
      companyName: question.company_name || '',
      jobField: question.job_field || '',
      question: question.question_text,
      limit: { type: question.limit_type, value: question.limit_value },
      selectedFacts: facts,
      confirmedMetrics,
      outline: outline || undefined,
      companyInfo: companyInfo || question.company_info || undefined,
      additionalDetails: followups.length ? followups : undefined,
      instructions: { tone: 'professional', structure: 'conclusion_first' },
    });
    if (!generation.answer) return cardJson({ ok: false, error: 'AI가 초안을 만들지 못했습니다.' }, 500);

    const count = question.limit_type === 'bytes' ? bytes(generation.answer) : generation.answer.length;
    const versions = await sql`SELECT COALESCE(MAX(version_number), 0)::int AS latest FROM resume_answer_versions WHERE resume_question_id=${questionId}`;
    const versionNumber = Number((versions[0] as { latest: number }).latest) + 1;
    const inserted = await sql`INSERT INTO resume_answer_versions (resume_question_id,version_number,content,source,generation_metadata) VALUES (${questionId},${versionNumber},${generation.answer},'ai_generated',${JSON.stringify({ usedFacts: generation.usedFacts, warnings: generation.warnings, outline, followups })}::jsonb) RETURNING id`;

    if (companyInfo) {
      await sql`UPDATE resume_questions SET company_info=${companyInfo} WHERE id=${questionId}`;
    }
    if (followups.length && primaryExperienceCardId) {
      const addition = followups.map((item) => `Q. ${item.question}\nA. ${item.answer}`).join('\n\n');
      await sql`UPDATE experience_cards SET raw_note = raw_note || ${`\n\n[자소서 추가 질문 답변]\n${addition}`}, updated_at = NOW() WHERE id=${primaryExperienceCardId} AND user_id=${user.id}`;
    }

    return cardJson({
      ok: true,
      data: {
        ...generation,
        versionId: Number((inserted[0] as { id: number }).id),
        versionNumber,
        charCount: generation.answer.length,
        byteCount: bytes(generation.answer),
        limitStatus: {
          type: question.limit_type,
          limit: question.limit_value,
          current: count,
          isExceeded: question.limit_type !== 'none' && Boolean(question.limit_value) && count > Number(question.limit_value),
        },
      },
    });
  } catch (error) {
    return cardJson({ ok: false, error: error instanceof Error ? error.message : 'AI 자소서 초안을 생성하지 못했습니다.' }, 500);
  }
};
