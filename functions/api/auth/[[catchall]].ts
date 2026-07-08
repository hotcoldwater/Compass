import { handleAuthRequest, type AuthEnv } from '../../_lib/auth';

export const onRequest = async (context: {
  request: Request;
  env: AuthEnv;
}) => {
  try {
    return await handleAuthRequest(new Request(context.request), context.env);
  } catch (error) {
    console.error('Auth.js request failed:', error);

    return Response.json(
      {
        ok: false,
        error: '로그인 기능을 초기화하지 못했습니다.',
      },
      { status: 500 }
    );
  }
};
