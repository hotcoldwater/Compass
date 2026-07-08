import { FormEvent, useEffect, useState } from 'react';
import {
  createExperience,
  fetchCsrfToken,
  fetchExperiences,
  fetchSession,
} from './lib/api';
import type { AppSession, Experience } from './types';

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

function truncatePreview(value: string) {
  return value.length > 84 ? `${value.slice(0, 84)}...` : value;
}

export default function App() {
  const [session, setSession] = useState<AppSession | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [experienceType, setExperienceType] = useState('');
  const [content, setContent] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const [sessionData, csrf] = await Promise.all([
          fetchSession(),
          fetchCsrfToken(),
        ]);

        if (isMounted) {
          setSession(sessionData);
          setCsrfToken(csrf);
        }
      } catch (bootstrapError) {
        if (isMounted) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : '로그인 기능을 초기화하지 못했습니다.'
          );
        }
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadExperiences() {
      if (!session?.user.id) {
        setExperiences([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

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
  }, [session?.user.id]);

  const trimmedContent = content.trim();
  const contentTooShort =
    trimmedContent.length > 0 && trimmedContent.length < 10;
  const isDisabled =
    isSubmitting ||
    !session?.user.id ||
    !experienceType.trim() ||
    trimmedContent.length === 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!session?.user.id) {
      setError('로그인 후 경험을 저장할 수 있습니다.');
      return;
    }

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
    <div className="min-h-screen bg-[#ececec] text-neutral-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-neutral-800 bg-[#171717] text-white lg:w-[320px] lg:border-b-0 lg:border-r lg:border-r-neutral-800">
          <div className="border-b border-neutral-800 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
                <img
                  src="/compass-logo.svg"
                  alt="Compass logo"
                  className="h-10 w-10 rounded-xl"
                />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">Compass</div>
                <div className="text-xs text-neutral-400">
                  Experience workspace
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <button
              type="button"
              onClick={() => {
                setExperienceType('');
                setContent('');
                setMessage('');
                setError('');
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/10"
            >
              <span>새 경험 기록</span>
              <span className="text-neutral-500">+</span>
            </button>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                Workspace
              </div>
              <div className="mt-3 text-2xl font-semibold text-white">
                {session?.user ? `${experiences.length}개의 카드` : '로그인 필요'}
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-400">
                경험을 기록할수록 자소서 재료가 쌓입니다. 사이드바에서 최근 카드를
                빠르게 훑고, 오른쪽에서 새 경험을 정리하세요.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <div className="mb-3 px-2 text-xs uppercase tracking-[0.24em] text-neutral-500">
              Recent Cards
            </div>

            {!session?.user ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-6 text-neutral-400">
                로그인 후 사용자별 경험 카드가 이 사이드바에 쌓입니다.
              </div>
            ) : isLoading ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-neutral-400">
                최근 경험을 불러오는 중입니다.
              </div>
            ) : experiences.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-6 text-neutral-400">
                아직 저장된 경험이 없습니다.
                <br />
                첫 번째 경험 카드를 만들어보세요.
              </div>
            ) : (
              <div className="space-y-2">
                {experiences.map((experience) => (
                  <article
                    key={experience.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4 transition hover:bg-white/[0.08]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white">
                        {experience.experience_type}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {formatDate(experience.created_at)}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">
                      {truncatePreview(
                        experience.content.replace(/\s+/g, ' ').trim()
                      )}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-800 px-5 py-4">
            {isSessionLoading ? (
              <div className="text-sm text-neutral-400">로그인 상태 확인 중...</div>
            ) : session?.user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">
                    {session.user.name || '로그인 사용자'}
                  </div>
                  <div className="truncate text-xs text-neutral-500">
                    {session.user.email}
                  </div>
                </div>
                <form method="post" action="/api/auth/signout?callbackUrl=/">
                  <input type="hidden" name="csrfToken" value={csrfToken} />
                  <button
                    type="submit"
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            ) : (
              <form
                method="post"
                action="/api/auth/signin/google?callbackUrl=/"
              >
                <input type="hidden" name="csrfToken" value={csrfToken} />
                <button
                  type="submit"
                  disabled={!csrfToken}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-500"
                >
                  Google로 로그인
                </button>
              </form>
            )}
          </div>
        </aside>

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
            <div className="rounded-[32px] border border-white/70 bg-[#f7f7f8] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <div className="border-b border-neutral-200/80 px-6 py-6 sm:px-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm">
                        <img
                          src="/compass-logo.svg"
                          alt="Compass logo"
                          className="h-8 w-8 rounded-lg"
                        />
                      </div>
                      <span className="text-sm font-medium uppercase tracking-[0.28em] text-neutral-500">
                        Compass Workspace
                      </span>
                    </div>
                    <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                      나의 경험 기록하기
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-neutral-500">
                      ChatGPT처럼 한 곳에서 아이디어를 쌓고, 사이드바에서 저장된
                      경험 카드를 빠르게 확인하세요. 정리되지 않은 문장이어도
                      괜찮습니다.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[330px]">
                    <div className="rounded-3xl border border-neutral-200 bg-white px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                        상태
                      </div>
                      <div className="mt-3 text-sm font-medium text-neutral-950">
                        {session?.user ? '로그인됨' : '게스트'}
                      </div>
                      <div className="mt-1 text-sm text-neutral-500">
                        {session?.user
                          ? '사용자별 경험카드 저장 가능'
                          : '로그인 후 사용자별 저장 가능'}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-neutral-200 bg-white px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-neutral-500">
                        최근 카드
                      </div>
                      <div className="mt-3 text-sm font-medium text-neutral-950">
                        {experiences.length}개
                      </div>
                      <div className="mt-1 text-sm text-neutral-500">
                        최신순으로 사이드바에서 확인
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6 sm:px-8 sm:py-8">
                <form
                  className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
                  onSubmit={handleSubmit}
                >
                  <div className="space-y-6">
                    {!session?.user ? (
                      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-6 text-neutral-600">
                        경험을 저장하려면 먼저 Google 로그인이 필요합니다. 로그인 후
                        작성한 경험은 사용자별 카드로 분리되어 저장됩니다.
                      </div>
                    ) : null}

                    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
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
                          onChange={(event) =>
                            setExperienceType(event.target.value)
                          }
                          disabled={!session?.user}
                        >
                          <option value="">경험 유형을 선택해주세요.</option>
                          {EXPERIENCE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm leading-6 text-neutral-600">
                        어떤 일을 했는지, 어디서 어려움이 있었는지, 어떻게 풀었는지,
                        무엇을 느꼈는지를 한 흐름으로 적으면 나중에 카드 재정리에
                        훨씬 유리합니다.
                      </div>
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
                        className="min-h-[360px] w-full resize-y rounded-[28px] border border-neutral-200 bg-white px-5 py-5 text-base leading-8 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400"
                        placeholder={`이 경험에서 어떤 일을 했고, 어떤 문제가 있었고, 무엇을 느꼈는지 자유롭게 작성해주세요.\n예: CPA 공부를 하면서 회계감사 과목의 비효율을 느꼈고...`}
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        maxLength={10000}
                        disabled={!session?.user}
                      />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-neutral-500">
                          {contentTooShort
                            ? '경험 내용을 10자 이상 입력해주세요.'
                            : '짧은 메모처럼 시작해도 됩니다. 나중에 카드형으로 다시 정리할 수 있습니다.'}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {trimmedContent.length}/10000
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        {message ? (
                          <p className="text-sm text-neutral-700">{message}</p>
                        ) : (
                          <p className="text-sm text-neutral-500">
                            사이드바에 카드가 쌓이면 최근 경험을 빠르게 탐색할 수
                            있습니다.
                          </p>
                        )}
                        {error ? (
                          <p className="text-sm text-red-600">{error}</p>
                        ) : null}
                      </div>

                      <button
                        type="submit"
                        className="inline-flex min-w-[140px] items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                        disabled={isDisabled}
                      >
                        {isSubmitting ? '저장 중...' : '저장하기'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
