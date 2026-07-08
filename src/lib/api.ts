import type {
  AppSession,
  CreateExperienceInput,
  Experience,
} from '../types';

type ExperienceListResponse = {
  ok: boolean;
  experiences?: Experience[];
  error?: string;
};

type ExperienceCreateResponse = {
  ok: boolean;
  experience?: Experience;
  error?: string;
};

type CsrfResponse = {
  csrfToken?: string;
};

export async function fetchExperiences(): Promise<Experience[]> {
  const res = await fetch('/api/experiences');
  const data = (await res.json()) as ExperienceListResponse;

  if (!res.ok || !data.ok || !data.experiences) {
    throw new Error(data.error || '경험 목록을 불러오지 못했습니다.');
  }

  return data.experiences;
}

export async function fetchSession(): Promise<AppSession | null> {
  const res = await fetch('/api/auth/session', {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('로그인 상태를 확인하지 못했습니다.');
  }

  const data = (await res.json()) as AppSession | null;

  return data;
}

export async function fetchCsrfToken(): Promise<string> {
  const res = await fetch('/api/auth/csrf', {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('로그인 보안 토큰을 불러오지 못했습니다.');
  }

  const data = (await res.json()) as CsrfResponse;

  if (!data.csrfToken) {
    throw new Error('로그인 보안 토큰이 비어 있습니다.');
  }

  return data.csrfToken;
}

export async function createExperience(
  input: CreateExperienceInput
): Promise<Experience> {
  const res = await fetch('/api/experiences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as ExperienceCreateResponse;

  if (!res.ok || !data.ok || !data.experience) {
    throw new Error(data.error || '경험 저장에 실패했습니다.');
  }

  return data.experience;
}
