import { neon } from '@neondatabase/serverless';
import {
  getAuthenticatedUser,
  type AuthEnv,
} from '../_lib/auth';

type ExperienceRow = {
  id: number;
  experience_type: string;
  content: string;
  created_at: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export const onRequestGet: PagesFunction<AuthEnv> = async (context) => {
  try {
    if (!context.env.DATABASE_URL) {
      return jsonResponse(
        {
          ok: false,
          error: 'DATABASE_URL 환경변수가 설정되지 않았습니다.',
        },
        500
      );
    }

    const user = await getAuthenticatedUser(context.request, context.env);

    if (!user) {
      return jsonResponse(
        {
          ok: false,
          error: '로그인이 필요합니다.',
        },
        401
      );
    }

    const sql = neon(context.env.DATABASE_URL);

    const rows = (await sql`
      SELECT id, experience_type, content, created_at
      FROM experiences
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC, id DESC
      LIMIT 20
    `) as ExperienceRow[];

    return jsonResponse({
      ok: true,
      experiences: rows,
    });
  } catch (error) {
    console.error('Failed to load experiences:', error);

    return jsonResponse(
      {
        ok: false,
        error: '경험 목록을 불러오지 못했습니다.',
      },
      500
    );
  }
};

export const onRequestPost: PagesFunction<AuthEnv> = async (context) => {
  try {
    if (!context.env.DATABASE_URL) {
      return jsonResponse(
        {
          ok: false,
          error: 'DATABASE_URL 환경변수가 설정되지 않았습니다.',
        },
        500
      );
    }

    const user = await getAuthenticatedUser(context.request, context.env);

    if (!user) {
      return jsonResponse(
        {
          ok: false,
          error: '로그인이 필요합니다.',
        },
        401
      );
    }

    const sql = neon(context.env.DATABASE_URL);
    const body = (await context.request.json()) as Partial<ExperienceRow>;
    const experienceType = String(body.experience_type || '').trim();
    const content = String(body.content || '').trim();

    if (!experienceType) {
      return jsonResponse(
        {
          ok: false,
          error: '경험 유형을 선택해주세요.',
        },
        400
      );
    }

    if (!content) {
      return jsonResponse(
        {
          ok: false,
          error: '경험 내용을 입력해주세요.',
        },
        400
      );
    }

    if (content.length < 10) {
      return jsonResponse(
        {
          ok: false,
          error: '경험 내용을 10자 이상 입력해주세요.',
        },
        400
      );
    }

    if (content.length > 10000) {
      return jsonResponse(
        {
          ok: false,
          error: '경험 내용은 10000자 이하로 입력해주세요.',
        },
        400
      );
    }

    const rows = (await sql`
      INSERT INTO experiences (user_id, experience_type, content)
      VALUES (${user.id}, ${experienceType}, ${content})
      RETURNING id, experience_type, content, created_at
    `) as ExperienceRow[];

    return jsonResponse({
      ok: true,
      experience: rows[0],
    });
  } catch (error) {
    console.error('Failed to save experience:', error);

    return jsonResponse(
      {
        ok: false,
        error: '경험 저장 중 문제가 발생했습니다.',
      },
      500
    );
  }
};
