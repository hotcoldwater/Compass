import { neon } from '@neondatabase/serverless';
import type { AuthenticatedUser, AuthEnv } from '../auth';
import { ensureExperienceCardTables } from '../experience-cards';

type Env = AuthEnv;

export type AnswerContextQuestion = {
  id: number;
  question_text: string;
  limit_type: 'chars' | 'bytes' | 'none';
  limit_value: number | null;
  company_name: string | null;
  job_field: string | null;
  company_info: string;
};

export type AnswerContext = {
  question: AnswerContextQuestion;
  facts: Array<Record<string, unknown>>;
  confirmedMetrics: string[];
  primaryExperienceCardId: number | null;
};

export type AnswerContextResult =
  | { ok: true; data: AnswerContext }
  | { ok: false; status: number; error: string };

export async function loadAnswerContext(
  env: Env,
  user: AuthenticatedUser,
  questionId: number
): Promise<AnswerContextResult> {
  await ensureExperienceCardTables(env);
  const sql = neon(env.DATABASE_URL);

  const questions = await sql`SELECT q.id, q.question_text, q.limit_type, q.limit_value, q.company_info, r.company_name, r.job_field FROM resume_questions q INNER JOIN resumes r ON r.id=q.resume_id WHERE q.id=${questionId} AND r.user_id=${user.id} LIMIT 1`;
  if (!questions.length) return { ok: false, status: 404, error: '문항을 찾을 수 없습니다.' };
  const question = questions[0] as AnswerContextQuestion;

  const links = await sql`SELECT l.experience_card_id, l.story_angle_id, l.is_primary, c.title, c.situation, c.task, c.actions, c.result, c.learning, s.title AS story_title, s.core_message, s.situation AS story_situation, s.challenge, s.action AS story_action, s.result AS story_result, s.learning AS story_learning FROM resume_question_experience_links l INNER JOIN experience_cards c ON c.id=l.experience_card_id LEFT JOIN experience_story_angles s ON s.id=l.story_angle_id WHERE l.resume_question_id=${questionId} AND c.user_id=${user.id} ORDER BY l.is_primary DESC,l.link_order`;
  if (!links.length) return { ok: false, status: 400, error: 'AI 작성 전에 문항에 사용할 경험카드를 연결해주세요.' };

  const cardIds = links.map((link) => Number((link as { experience_card_id: number }).experience_card_id));
  const metrics = await sql`SELECT m.experience_card_id,m.display_text FROM experience_metrics m WHERE m.experience_card_id = ANY(${cardIds}) AND m.verification_status='confirmed' ORDER BY m.sort_order,m.id`;

  const facts = links.map((link, index) => {
    const row = link as Record<string, unknown>;
    const actions = Array.isArray(row.actions) ? row.actions.map((item) => String((item as { text?: string }).text || '')).filter(Boolean) : [];
    return {
      id: `experience-${index + 1}`,
      priority: Boolean(row.is_primary) ? 'primary' : 'supporting',
      title: row.title,
      story: row.story_title || '',
      coreMessage: row.core_message || '',
      situation: row.story_situation || row.situation || '',
      challenge: row.challenge || row.task || '',
      actions: row.story_action ? [row.story_action] : actions,
      result: row.story_result || row.result || '',
      learning: row.story_learning || row.learning || '',
    };
  });

  const primary = links.find((link) => Boolean((link as { is_primary: boolean }).is_primary)) || links[0];
  const primaryExperienceCardId = primary ? Number((primary as { experience_card_id: number }).experience_card_id) : null;

  return {
    ok: true,
    data: {
      question,
      facts,
      confirmedMetrics: metrics.map((metric) => (metric as { display_text: string }).display_text),
      primaryExperienceCardId,
    },
  };
}
