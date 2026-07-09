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

const PRIMARY_SECTIONS = ['새 자소서', '경험 기록', '일정'] as const;

type PrimarySection = (typeof PRIMARY_SECTIONS)[number];

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

function EmptyPanel({ title }: { title: string }) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-[#f7f7f8] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <header className="border-b border-neutral-200/80 px-6 py-6 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
      </header>
      <div className="min-h-[560px] px-6 py-6 sm:px-8 sm:py-8" />
    </section>
  );
}

export default function App() {
  const [activeSection, setActiveSection] =
    useState<PrimarySection>('경험 기록');
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
      setMessage('저장되었습니다.');
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

  function renderExperienceSection() {
    return (
      <section className="rounded-[32px] border border-white/70 bg-[#f7f7f8] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <header className="border-b border-neutral-200/80 px-6 py-6 sm:px-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            경험 기록
          </h1>
        </header>

        <div className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
            onSubmit={handleSubmit}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="experienceType"
                  className="text-sm font-medium text-neutral-700"
                >
                  경험 유형
                </label>
                <select
                  id="experienceType"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base outline-none transition focus:border-neutral-400"
                  value={experienceType}
                  onChange={(event) => setExperienceType(event.target.value)}
                  disabled={!session?.user}
                >
                  <option value="">선택</option>
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
                  내용
                </label>
                <textarea
                  id="content"
                  className="min-h-[360px] w-full resize-y rounded-[28px] border border-neutral-200 bg-white px-5 py-5 text-base leading-8 outline-none transition focus:border-neutral-400"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={10000}
                  disabled={!session?.user}
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  {message ? (
                    <p className="text-sm text-neutral-700">{message}</p>
                  ) : null}
                  {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                  ) : null}
                  {!message && !error && contentTooShort ? (
                    <p className="text-sm text-neutral-500">
                      10자 이상 입력해주세요.
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">
                    {trimmedContent.length}/10000
                  </span>
                  <button
                    type="submit"
                    className="inline-flex min-w-[140px] items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    disabled={isDisabled}
                  >
                    {isSubmitting ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium text-neutral-700">
              기록 목록
            </div>

            {!session?.user ? null : isLoading ? (
              <div className="rounded-2xl border border-neutral-200 px-4 py-4 text-sm text-neutral-500">
                불러오는 중...
              </div>
            ) : experiences.length === 0 ? null : (
              <div className="space-y-2">
                {experiences.map((experience) => (
                  <article
                    key={experience.id}
                    className="rounded-3xl border border-neutral-200 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-neutral-950">
                        {experience.experience_type}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {formatDate(experience.created_at)}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-neutral-500">
                      {truncatePreview(
                        experience.content.replace(/\s+/g, ' ').trim()
                      )}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    );
  }

  function renderMainContent() {
    if (activeSection === '경험 기록') {
      return renderExperienceSection();
    }

    return <EmptyPanel title={activeSection} />;
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
              <div className="text-lg font-semibold tracking-tight">Compass</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-5">
            <section>
              <div className="mb-3 px-2 text-xs uppercase tracking-[0.24em] text-neutral-500">
                Menu
              </div>
              <div className="space-y-2">
                {PRIMARY_SECTIONS.map((section) => {
                  const isActive = activeSection === section;

                  return (
                    <button
                      key={section}
                      type="button"
                      onClick={() => {
                        setActiveSection(section);
                        setMessage('');
                        setError('');
                      }}
                      className={`flex w-full items-center rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                        isActive
                          ? 'bg-white text-neutral-950'
                          : 'bg-white/[0.04] text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {section}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mt-6">
              <div className="mb-3 px-2 text-xs uppercase tracking-[0.24em] text-neutral-500">
                자소서 작성한거
              </div>
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5" />
            </section>
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
          <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
