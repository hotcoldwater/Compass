import { FormEvent, useEffect, useState } from 'react';
import {
  createExperience,
  createResume,
  fetchCsrfToken,
  fetchExperiences,
  fetchResumes,
  fetchSession,
  updateResume,
} from './lib/api';
import type {
  AppSession,
  Experience,
  ResumeLimitType,
  ResumePayload,
  ResumePayloadQuestion,
  ResumeRecord,
} from './types';

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
const STEP_ITEMS = [
  { id: 1, label: '기본정보 입력' },
  { id: 2, label: '자소서 작성' },
] as const;
const LIMIT_OPTIONS: Array<{ value: ResumeLimitType; label: string }> = [
  { value: 'chars', label: '글자수' },
  { value: 'bytes', label: 'byte' },
  { value: 'none', label: '제한없음' },
];
const WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

type PrimarySection = (typeof PRIMARY_SECTIONS)[number];
type StepId = (typeof STEP_ITEMS)[number]['id'];

type DraftQuestion = {
  client_id: string;
  id?: number;
  question_text: string;
  limit_type: ResumeLimitType;
  limit_value: string;
  answer_content: string;
};

type ResumeDraft = {
  id: number | null;
  company_name: string;
  application_start_date: string;
  application_end_date: string;
  job_field: string;
  questions: DraftQuestion[];
};

const encoder = new TextEncoder();

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

function formatMonthTitle(value: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(value);
}

function createQuestion(seed = 0): DraftQuestion {
  return {
    client_id: `${Date.now()}-${seed}-${Math.random().toString(36).slice(2, 8)}`,
    question_text: '',
    limit_type: 'none',
    limit_value: '',
    answer_content: '',
  };
}

function createEmptyResumeDraft(): ResumeDraft {
  return {
    id: null,
    company_name: '',
    application_start_date: '',
    application_end_date: '',
    job_field: '',
    questions: [createQuestion(0)],
  };
}

function mapRecordToDraft(record: ResumeRecord): ResumeDraft {
  return {
    id: record.id,
    company_name: record.company_name || '',
    application_start_date: record.application_start_date || '',
    application_end_date: record.application_end_date || '',
    job_field: record.job_field || '',
    questions:
      record.questions.length > 0
        ? record.questions.map((question) => ({
            client_id: `saved-${question.id}`,
            id: question.id,
            question_text: question.question_text,
            limit_type: question.limit_type,
            limit_value:
              question.limit_value === null ? '' : String(question.limit_value),
            answer_content: question.answer_content,
          }))
        : [createQuestion(0)],
  };
}

function buildResumePayload(draft: ResumeDraft): ResumePayload {
  return {
    company_name: draft.company_name.trim(),
    application_start_date: draft.application_start_date.trim(),
    application_end_date: draft.application_end_date.trim(),
    job_field: draft.job_field.trim(),
    questions: draft.questions
      .filter(
        (question) =>
          question.question_text.trim() !== '' ||
          question.answer_content.trim() !== ''
      )
      .map<ResumePayloadQuestion>((question) => ({
        id: question.id,
        question_text: question.question_text.trim(),
        limit_type: question.limit_type,
        limit_value:
          question.limit_type === 'none' || !question.limit_value.trim()
            ? null
            : Number(question.limit_value),
        answer_content: question.answer_content,
      })),
  };
}

function hasCompleteBasicInfo(draft: ResumeDraft) {
  return (
    draft.company_name.trim() !== '' &&
    draft.application_start_date.trim() !== '' &&
    draft.application_end_date.trim() !== '' &&
    draft.job_field.trim() !== '' &&
    draft.questions.some((question) => question.question_text.trim() !== '')
  );
}

function getByteLength(value: string) {
  return encoder.encode(value).length;
}

function buildCalendarDays(baseDate: Date) {
  const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const cells = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getResumeTitle(record: ResumeRecord) {
  return `${record.company_name || '-'} / ${record.job_field || '-'}`;
}

export default function App() {
  const [activeSection, setActiveSection] =
    useState<PrimarySection>('새 자소서');
  const [activeStep, setActiveStep] = useState<StepId>(1);
  const [session, setSession] = useState<AppSession | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [resumeDraft, setResumeDraft] = useState<ResumeDraft>(
    createEmptyResumeDraft()
  );
  const [resumeRecords, setResumeRecords] = useState<ResumeRecord[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [experienceType, setExperienceType] = useState('');
  const [experienceContent, setExperienceContent] = useState('');
  const [experienceMessage, setExperienceMessage] = useState('');
  const [experienceError, setExperienceError] = useState('');
  const [calendarDate] = useState(() => new Date());

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
          const message =
            bootstrapError instanceof Error
              ? bootstrapError.message
              : '로그인 기능을 초기화하지 못했습니다.';
          setResumeError(message);
          setExperienceError(message);
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

    async function loadData() {
      if (!session?.user.id) {
        setExperiences([]);
        setResumeRecords([]);
        setIsLoadingExperiences(false);
        setIsLoadingResumes(false);
        return;
      }

      setIsLoadingExperiences(true);
      setIsLoadingResumes(true);

      try {
        const [experienceRows, resumeRows] = await Promise.all([
          fetchExperiences(),
          fetchResumes(),
        ]);

        if (isMounted) {
          setExperiences(experienceRows);
          setResumeRecords(resumeRows);
        }
      } catch (loadError) {
        if (isMounted) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : '데이터를 불러오지 못했습니다.';
          setExperienceError(message);
          setResumeError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingExperiences(false);
          setIsLoadingResumes(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [session?.user.id]);

  const trimmedExperienceContent = experienceContent.trim();
  const experienceTooShort =
    trimmedExperienceContent.length > 0 && trimmedExperienceContent.length < 10;
  const isExperienceDisabled =
    isSavingExperience ||
    !session?.user.id ||
    !experienceType.trim() ||
    trimmedExperienceContent.length === 0;
  const canOpenStepTwo = hasCompleteBasicInfo(resumeDraft);
  const calendarDays = buildCalendarDays(calendarDate);

  function openNewResume() {
    setActiveSection('새 자소서');
    setActiveStep(1);
    setResumeDraft(createEmptyResumeDraft());
    setResumeMessage('');
    setResumeError('');
  }

  function syncResumeRecord(savedRecord: ResumeRecord) {
    setResumeRecords((prev) => {
      const next = [savedRecord, ...prev.filter((item) => item.id !== savedRecord.id)];
      next.sort((left, right) => {
        const leftTime = new Date(left.updated_at).getTime();
        const rightTime = new Date(right.updated_at).getTime();
        return rightTime - leftTime;
      });
      return next;
    });
    setResumeDraft(mapRecordToDraft(savedRecord));
  }

  async function saveResumeDraft() {
    setResumeMessage('');
    setResumeError('');

    if (!session?.user.id) {
      setResumeError('로그인 후 저장할 수 있습니다.');
      return;
    }

    setIsSavingResume(true);

    try {
      const payload = buildResumePayload(resumeDraft);
      const savedRecord =
        resumeDraft.id === null
          ? await createResume(payload)
          : await updateResume(resumeDraft.id, payload);

      syncResumeRecord(savedRecord);
      setResumeMessage('저장되었습니다.');
    } catch (saveError) {
      setResumeError(
        saveError instanceof Error
          ? saveError.message
          : '자소서 저장 중 문제가 발생했습니다.'
      );
    } finally {
      setIsSavingResume(false);
    }
  }

  function handleStepChange(stepId: StepId) {
    if (stepId === 2 && !canOpenStepTwo) {
      return;
    }

    setActiveStep(stepId);
    setResumeMessage('');
    setResumeError('');
  }

  function openResumeRecord(record: ResumeRecord) {
    const draft = mapRecordToDraft(record);
    setActiveSection('새 자소서');
    setResumeDraft(draft);
    setActiveStep(hasCompleteBasicInfo(draft) ? 2 : 1);
    setResumeMessage('');
    setResumeError('');
  }

  function updateDraftField<Key extends keyof ResumeDraft>(
    key: Key,
    value: ResumeDraft[Key]
  ) {
    setResumeDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateQuestion(
    clientId: string,
    key: keyof DraftQuestion,
    value: string | ResumeLimitType
  ) {
    setResumeDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((question) =>
        question.client_id === clientId
          ? {
              ...question,
              [key]: value,
              ...(key === 'limit_type' && value === 'none'
                ? { limit_value: '' }
                : {}),
            }
          : question
      ),
    }));
  }

  function addQuestion() {
    setResumeDraft((prev) => ({
      ...prev,
      questions: [...prev.questions, createQuestion(prev.questions.length)],
    }));
  }

  function removeQuestion(clientId: string) {
    setResumeDraft((prev) => ({
      ...prev,
      questions:
        prev.questions.length === 1
          ? [createQuestion(0)]
          : prev.questions.filter((question) => question.client_id !== clientId),
    }));
  }

  async function handleExperienceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExperienceMessage('');
    setExperienceError('');

    if (experienceTooShort) {
      setExperienceError('경험 내용을 10자 이상 입력해주세요.');
      return;
    }

    setIsSavingExperience(true);

    try {
      const savedExperience = await createExperience({
        experience_type: experienceType,
        content: trimmedExperienceContent,
      });

      setExperiences((prev) => [savedExperience, ...prev].slice(0, 20));
      setExperienceType('');
      setExperienceContent('');
      setExperienceMessage('저장되었습니다.');
    } catch (submitError) {
      setExperienceError(
        submitError instanceof Error
          ? submitError.message
          : '저장 중 문제가 발생했습니다.'
      );
    } finally {
      setIsSavingExperience(false);
    }
  }

  function renderResumeStepNavigation() {
    return (
      <div className="flex flex-wrap gap-3 border-b border-neutral-200/80 px-6 py-6 sm:px-8">
        {STEP_ITEMS.map((step) => {
          const isActive = activeStep === step.id;
          const isDisabled = step.id === 2 && !canOpenStepTwo;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepChange(step.id)}
              disabled={isDisabled}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                isActive
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700'
              } ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <div className="text-xs font-medium">{step.id}</div>
              <div className="mt-1 text-sm font-medium">{step.label}</div>
            </button>
          );
        })}
      </div>
    );
  }

  function renderResumeBasicInfo() {
    return (
      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="companyName"
              className="text-sm font-medium text-neutral-700"
            >
              법인명
            </label>
            <input
              id="companyName"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
              value={resumeDraft.company_name}
              onChange={(event) =>
                updateDraftField('company_name', event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="jobField"
              className="text-sm font-medium text-neutral-700"
            >
              지원분야
            </label>
            <input
              id="jobField"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
              value={resumeDraft.job_field}
              onChange={(event) =>
                updateDraftField('job_field', event.target.value)
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-neutral-700">지원기간</div>
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="date"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
              value={resumeDraft.application_start_date}
              onChange={(event) =>
                updateDraftField('application_start_date', event.target.value)
              }
            />
            <input
              type="date"
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
              value={resumeDraft.application_end_date}
              onChange={(event) =>
                updateDraftField('application_end_date', event.target.value)
              }
            />
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-neutral-700">자소서 질문</div>
            <button
              type="button"
              onClick={addQuestion}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
            >
              add
            </button>
          </div>

          <div className="space-y-4">
            {resumeDraft.questions.map((question, index) => (
              <article
                key={question.client_id}
                className="rounded-[28px] border border-neutral-200 bg-white p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-neutral-700">
                    질문 {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.client_id)}
                    className="rounded-2xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:border-neutral-400"
                  >
                    삭제
                  </button>
                </div>

                <div className="space-y-4">
                  <textarea
                    className="min-h-[120px] w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-4 outline-none transition focus:border-neutral-400"
                    value={question.question_text}
                    onChange={(event) =>
                      updateQuestion(
                        question.client_id,
                        'question_text',
                        event.target.value
                      )
                    }
                  />

                  <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                    <select
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
                      value={question.limit_type}
                      onChange={(event) =>
                        updateQuestion(
                          question.client_id,
                          'limit_type',
                          event.target.value as ResumeLimitType
                        )
                      }
                    >
                      {LIMIT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      disabled={question.limit_type === 'none'}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-100"
                      value={question.limit_value}
                      onChange={(event) =>
                        updateQuestion(
                          question.client_id,
                          'limit_value',
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-5">
          <div className="space-y-1">
            {resumeMessage ? (
              <p className="text-sm text-neutral-700">{resumeMessage}</p>
            ) : null}
            {resumeError ? (
              <p className="text-sm text-red-600">{resumeError}</p>
            ) : null}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveResumeDraft}
              className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSavingResume}
            >
              {isSavingResume ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => handleStepChange(2)}
              disabled={!canOpenStepTwo}
              className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderResumeWriting() {
    const visibleQuestions = resumeDraft.questions.filter(
      (question) => question.question_text.trim() !== ''
    );

    return (
      <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
        {visibleQuestions.map((question, index) => {
          const currentLength =
            question.limit_type === 'bytes'
              ? getByteLength(question.answer_content)
              : question.answer_content.length;
          const limitLabel =
            question.limit_type === 'chars'
              ? '자'
              : question.limit_type === 'bytes'
                ? 'byte'
                : '';
          const limitValue = question.limit_value.trim();

          return (
            <article
              key={question.client_id}
              className="rounded-[28px] border border-neutral-200 bg-white p-5"
            >
              <div className="mb-3 text-sm font-medium text-neutral-700">
                질문 {index + 1}
              </div>
              <div className="mb-4 whitespace-pre-line text-base leading-7 text-neutral-900">
                {question.question_text}
              </div>
              <textarea
                className="min-h-[220px] w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-4 leading-7 outline-none transition focus:border-neutral-400"
                value={question.answer_content}
                onChange={(event) =>
                  updateQuestion(
                    question.client_id,
                    'answer_content',
                    event.target.value
                  )
                }
              />
              <div className="mt-3 text-right text-sm text-neutral-500">
                {question.limit_type === 'none'
                  ? `${currentLength}`
                  : `${currentLength} / ${limitValue || 0}${limitLabel}`}
              </div>
            </article>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-5">
          <div className="space-y-1">
            {resumeMessage ? (
              <p className="text-sm text-neutral-700">{resumeMessage}</p>
            ) : null}
            {resumeError ? (
              <p className="text-sm text-red-600">{resumeError}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={saveResumeDraft}
            className="rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            disabled={isSavingResume}
          >
            {isSavingResume ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    );
  }

  function renderResumeSection() {
    return (
      <section className="rounded-[32px] border border-white/70 bg-[#f7f7f8] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        {renderResumeStepNavigation()}
        {activeStep === 1 ? renderResumeBasicInfo() : renderResumeWriting()}
      </section>
    );
  }

  function renderExperienceSection() {
    return (
      <section className="rounded-[32px] border border-white/70 bg-[#f7f7f8] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 px-6 py-6 sm:px-8 sm:py-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form
            className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
            onSubmit={handleExperienceSubmit}
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
                  htmlFor="experienceContent"
                  className="text-sm font-medium text-neutral-700"
                >
                  내용
                </label>
                <textarea
                  id="experienceContent"
                  className="min-h-[360px] w-full resize-y rounded-[28px] border border-neutral-200 bg-white px-5 py-5 text-base leading-8 outline-none transition focus:border-neutral-400"
                  value={experienceContent}
                  onChange={(event) => setExperienceContent(event.target.value)}
                  maxLength={10000}
                  disabled={!session?.user}
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  {experienceMessage ? (
                    <p className="text-sm text-neutral-700">{experienceMessage}</p>
                  ) : null}
                  {experienceError ? (
                    <p className="text-sm text-red-600">{experienceError}</p>
                  ) : null}
                  {!experienceMessage && !experienceError && experienceTooShort ? (
                    <p className="text-sm text-neutral-500">
                      10자 이상 입력해주세요.
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">
                    {trimmedExperienceContent.length}/10000
                  </span>
                  <button
                    type="submit"
                    className="inline-flex min-w-[140px] items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    disabled={isExperienceDisabled}
                  >
                    {isSavingExperience ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-medium text-neutral-700">
              기록 목록
            </div>

            {isLoadingExperiences ? (
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
                    <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-neutral-500">
                      {experience.content}
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

  function renderCalendarSection() {
    return (
      <section className="rounded-[32px] border border-white/70 bg-[#f7f7f8] shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 text-2xl font-semibold tracking-tight">
            {formatMonthTitle(calendarDate)}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {WEEK_LABELS.map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-center text-sm font-medium text-neutral-600"
              >
                {label}
              </div>
            ))}
            {calendarDays.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="flex min-h-[96px] items-start rounded-3xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-700"
              >
                {day ? day : ''}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderMainContent() {
    if (activeSection === '경험 기록') {
      return renderExperienceSection();
    }

    if (activeSection === '일정') {
      return renderCalendarSection();
    }

    return renderResumeSection();
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
                        if (section === '새 자소서') {
                          openNewResume();
                          return;
                        }

                        setActiveSection(section);
                        setResumeMessage('');
                        setResumeError('');
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
                최근 기록
              </div>
              {isLoadingResumes ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-neutral-400">
                  불러오는 중...
                </div>
              ) : resumeRecords.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-neutral-400" />
              ) : (
                <div className="space-y-2">
                  {resumeRecords.map((record) => {
                    const isActive = resumeDraft.id === record.id;

                    return (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => openResumeRecord(record)}
                        className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                          isActive
                            ? 'border-white bg-white text-neutral-950'
                            : 'border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {getResumeTitle(record)}
                        </div>
                        <div className="mt-2 text-[11px] text-neutral-500">
                          {formatDate(record.updated_at)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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
