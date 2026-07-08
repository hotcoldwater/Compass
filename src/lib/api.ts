import type { CreateExperienceInput, Experience } from '../types';

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

export async function fetchExperiences(): Promise<Experience[]> {
  const res = await fetch('/api/experiences');
  const data = (await res.json()) as ExperienceListResponse;

  if (!res.ok || !data.ok || !data.experiences) {
    throw new Error(data.error || '경험 목록을 불러오지 못했습니다.');
  }

  return data.experiences;
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
