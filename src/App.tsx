import { FormEvent, useEffect, useState } from 'react';
import { createExperience, fetchExperiences } from './lib/api';
import type { Experience } from './types';

const EXPERIENCE_TYPES = [
  '학업',
  '학교프로젝트',
  '교내동아리',
  '대외활동(교외 동아리)',
  '연구/개발',
  '공모전/대회',
  '인턴',
  '아르바이트',
  '계약직/파견직',
  '정규 입사 경험',
  '개인사업/창업/사이드프로젝트',
] as const;

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\.\s/g, '.')
    .replace(/\.$/, '');
}

export default function App() {
  const [experienceType, setExperienceType] = useState('');
  const [content, setContent] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadExperiences() {
      try {
        const rows = await fetchExperiences();

        if (isMounted) {
          setExperiences(rows);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '경험 목록을 불러오지 못했습니다.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadExperiences();

    return () => {
      isMounted = false;
    };
  }, []);

  const trimmedContent = content.trim();
  const contentTooShort =
    trimmedContent.length > 0 && trimmedContent.length < 10;
  const isDisabled =
    isSubmitting || !experienceType.trim() || trimmedContent.length === 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (contentTooShort) {
      setError('경험 내용을 10자 이상 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const savedExperience = await createExperience({
        experience_type: experienceType,
        content: trimmedContent,
      });

      setExperiences((prev) => [savedExperience, ...prev].slice(0, 20));
      setExperienceType('');
      setContent('');
      setMessage('경험이 저장되었습니다.');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '저장 중 문제가 발생했습니다.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-neutral-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-12">
        <header className="border-b border-neutral-200 pb-6">
          <div className="text-lg font-semibold tracking-tight">Compass</div>
        </header>

        <main className="grid flex-1 gap-10 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
          <section className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                나의 경험 기록하기
              </h1>
              <p className="max-w-2xl whitespace-pre-line text-base leading-7 text-neutral-500">
                자소서에 활용할 수 있는 경험을 자유롭게 기록해보세요.
                {'\n'}
                정리되지 않은 문장이어도 괜찮습니다.
              </p>
            </div>

            <form
              className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
              onSubmit={handleSubmit}
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="experienceType"
                    className="text-sm font-medium text-neutral-700"
                  >
                    경험 유형 선택
                  </label>
                  <select
                    id="experienceType"
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                    value={experienceType}
                    onChange={(event) => setExperienceType(event.target.value)}
                  >
                    <option value="">경험 유형을 선택해주세요.</option>
                    {EXPERIENCE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="content"
                    className="text-sm font-medium text-neutral-700"
                  >
                    구체적인 경험 내용 작성
                  </label>
                  <textarea
                    id="content"
                    className="min-h-[280px] w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-base leading-7 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                    placeholder={`이 경험에서 어떤 일을 했고, 어떤 문제가 있었고, 무엇을 느꼈는지 자유롭게 작성해주세요.\n예: CPA 공부를 하면서 회계감사 과목의 비효율을 느꼈고...`}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    maxLength={10000}
                  />
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <span>
                      {contentTooShort
                        ? '경험 내용을 10자 이상 입력해주세요.'
                        : '정리되지 않은 문장이어도 괜찮습니다.'}
                    </span>
                    <span>{trimmedContent.length}/10000</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    className="inline-flex min-w-[120px] items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    disabled={isDisabled}
                  >
                    {isSubmitting ? '저장 중...' : '저장하기'}
                  </button>

                  {message ? (
                    <p className="text-sm text-neutral-700">{message}</p>
                  ) : null}
                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                </div>
              </div>
            </form>
          </section>

          <aside className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight">
                최근 저장된 경험
              </h2>
            </div>

            {isLoading ? (
              <p className="text-sm text-neutral-500">경험 목록을 불러오는 중입니다.</p>
            ) : experiences.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-500">
                아직 저장된 경험이 없습니다.
                <br />
                첫 경험을 기록해보세요.
              </div>
            ) : (
              <div className="space-y-4">
                {experiences.map((experience) => (
                  <article
                    key={experience.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-4"
                  >
                    <div className="mb-3 text-sm font-medium text-neutral-950">
                      [{experience.experience_type}]
                    </div>
                    <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-neutral-700">
                      {experience.content}
                    </p>
                    <div className="mt-4 text-xs text-neutral-500">
                      {formatDate(experience.created_at)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
