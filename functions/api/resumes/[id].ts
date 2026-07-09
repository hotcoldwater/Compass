import type { ResumePayload } from '../../_lib/resumes';
import {
  ensureResumeTables,
  jsonResponse,
  updateResumeRecord,
} from '../../_lib/resumes';
import {
  getAuthenticatedUser,
  type AuthEnv,
} from '../../_lib/auth';

export const onRequestPut: PagesFunction<AuthEnv> = async (context) => {
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

    const id = Number(context.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return jsonResponse(
        {
          ok: false,
          error: '잘못된 자소서 ID입니다.',
        },
        400
      );
    }

    const body = (await context.request.json()) as Partial<ResumePayload>;
    const resume = await updateResumeRecord(context.env, user, id, body);

    if (!resume) {
      return jsonResponse(
        {
          ok: false,
          error: '자소서를 찾을 수 없습니다.',
        },
        404
      );
    }

    return jsonResponse({
      ok: true,
      resume,
    });
  } catch (error) {
    console.error('Failed to update resume:', error);

    return jsonResponse(
      {
        ok: false,
        error: '자소서 저장 중 문제가 발생했습니다.',
      },
      500
    );
  }
};
