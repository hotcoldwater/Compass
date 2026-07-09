import type { ResumePayload } from '../_lib/resumes';
import {
  createResumeRecord,
  ensureResumeTables,
  jsonResponse,
  loadResumeRecords,
} from '../_lib/resumes';
import {
  getAuthenticatedUser,
  type AuthEnv,
} from '../_lib/auth';

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

    await ensureResumeTables(context.env);
    const resumes = await loadResumeRecords(context.env, user);

    return jsonResponse({
      ok: true,
      resumes,
    });
  } catch (error) {
    console.error('Failed to load resumes:', error);

    return jsonResponse(
      {
        ok: false,
        error: '최근 기록을 불러오지 못했습니다.',
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

    await ensureResumeTables(context.env);
    const body = (await context.request.json()) as Partial<ResumePayload>;
    const resume = await createResumeRecord(context.env, user, body);

    return jsonResponse({
      ok: true,
      resume,
    });
  } catch (error) {
    console.error('Failed to create resume:', error);

    return jsonResponse(
      {
        ok: false,
        error: '자소서 저장 중 문제가 발생했습니다.',
      },
      500
    );
  }
};
