import { useEffect, useState } from 'react';
import {
  createResume,
  fetchCsrfToken,
  fetchResumes,
  fetchSession,
  updateResume,
} from './lib/api';
import type {
  AppSession,
  ResumeLimitType,
  ResumePayload,
  ResumePayloadQuestion,
  ResumeRecord,
} from './types';
import { SimpleExperience } from './features/experience-cards/SimpleExperience';
import { ResumeExperienceLinks } from './features/resumes/ResumeExperienceLinks';
import { AiAnswerGenerator } from './features/resumes/AiAnswerGenerator';

const STEP_ITEMS = [
  { id: 1, label: '회사와 문항' },
  { id: 2, label: '답변 작성' },
] as const;
const LIMIT_OPTIONS: Array<{ value: ResumeLimitType; label: string }> = [
  { value: 'chars', label: '글자수' },
  { value: 'bytes', label: 'byte' },
  { value: 'none', label: '제한없음' },
];
const EXAMPLE_QUESTIONS = [
  {
    label: '지원 동기',
    text: '지원한 회사와 직무에 관심을 갖게 된 계기와, 이를 위해 준비한 경험을 구체적으로 기술해 주십시오.',
  },
  {
    label: '직무 역량',
    text: '지원 직무를 수행하는 데 필요한 역량은 무엇이라고 생각하며, 이를 보여주는 본인의 경험과 기여를 설명해 주십시오.',
  },
  {
    label: '문제 해결',
    text: '목표를 달성하는 과정에서 예상하지 못한 문제를 발견하고 해결한 경험을 상황, 행동, 결과 중심으로 기술해 주십시오.',
  },
  {
    label: '협업',
    text: '다른 사람과 협업하며 서로 다른 의견을 조율하고 공동의 성과를 만든 경험을 본인의 역할 중심으로 기술해 주십시오.',
  },
  {
    label: '실패와 개선',
    text: '실패하거나 기대에 미치지 못한 결과를 개선한 경험과, 그 과정에서 배운 점을 구체적으로 기술해 주십시오.',
  },
] as const;

type PrimarySection = '새 자소서' | '경험 아카이브';
type StepId = (typeof STEP_ITEMS)[number]['id'];

type DraftQuestion = {
  client_id: string;
  id?: number;
  question_text: string;
  limit_type: ResumeLimitType;
  limit_value: string;
  answer_content: string;
  company_info: string;
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

function createQuestion(seed = 0): DraftQuestion {
  return {
    client_id: `${Date.now()}-${seed}-${Math.random().toString(36).slice(2, 8)}`,
    question_text: '',
    limit_type: 'none',
    limit_value: '',
    answer_content: '',
    company_info: '',
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
            company_info: question.company_info || '',
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
        company_info: question.company_info,
      })),
  };
}

function hasCompleteBasicInfo(draft: ResumeDraft) {
  return (
    draft.company_name.trim() !== '' &&
    draft.job_field.trim() !== '' &&
    draft.questions.some((question) => question.question_text.trim() !== '')
  );
}

function getByteLength(value: string) {
  return encoder.encode(value).length;
}

function getResumeTitle(record: ResumeRecord) {
  return `${record.company_name || '-'} / ${record.job_field || '-'}`;
}

export default function App() {
  const [activeSection, setActiveSection] =
    useState<PrimarySection>('경험 아카이브');
  const [activeStep, setActiveStep] = useState<StepId>(1);
  const [session, setSession] = useState<AppSession | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [resumeDraft, setResumeDraft] = useState<ResumeDraft>(
    createEmptyResumeDraft()
  );
  const [resumeRecords, setResumeRecords] = useState<ResumeRecord[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');
  const [resumeError, setResumeError] = useState('');

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
        setResumeRecords([]);
        setIsLoadingResumes(false);
        return;
      }

      setIsLoadingResumes(true);

      try {
        const resumeRows = await fetchResumes();

        if (isMounted) {
          setResumeRecords(resumeRows);
        }
      } catch (loadError) {
        if (isMounted) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : '데이터를 불러오지 못했습니다.';
          setResumeError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingResumes(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [session?.user.id]);

  const canOpenStepTwo = hasCompleteBasicInfo(resumeDraft);

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

  function addExampleQuestion(questionText: string) {
    setResumeDraft((prev) => ({
      ...prev,
      questions: [
        ...prev.questions.filter((question) => question.question_text.trim() !== ''),
        {
          ...createQuestion(prev.questions.length),
          question_text: questionText,
        },
      ],
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
        <p className="text-sm text-neutral-500">
          회사명, 지원 분야, 첫 문항만 입력하면 바로 작성할 수 있습니다.
        </p>
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

        <details className="rounded-2xl border border-neutral-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-700">
            지원 일정 추가하기 (선택)
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-neutral-600">시작일
              <input type="date" className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 outline-none" value={resumeDraft.application_start_date} onChange={(event) => updateDraftField('application_start_date', event.target.value)} />
            </label>
            <label className="text-sm text-neutral-600">마감일
              <input type="date" className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 outline-none" value={resumeDraft.application_end_date} onChange={(event) => updateDraftField('application_end_date', event.target.value)} />
            </label>
          </div>
        </details>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-neutral-700">자소서 질문</div>
            <button
              type="button"
              onClick={addQuestion}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
            >
              문항 추가
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-medium text-neutral-700">
              경험카드 활용 문항 예시
            </div>
            <p className="mt-1 text-xs leading-5 text-neutral-500">
              예시를 추가한 뒤, 작성 단계에서 경험카드와 스토리 각도를 연결해 보세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => addExampleQuestion(example.text)}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:border-neutral-400"
                >
                  + {example.label}
                </button>
              ))}
            </div>
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
              <details className="mt-4 rounded-xl bg-neutral-50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                  경험 선택과 AI 작성
                </summary>
                <div className="mt-3">
                  <ResumeExperienceLinks
                    questionId={question.id}
                    disabled={!session?.user.id}
                  />
                  <div className="mt-3">
                    <label className="text-xs font-medium text-neutral-600">
                      기업 정보 (인재상·정책·신년사 등, 선택)
                    </label>
                    <textarea
                      className="mt-2 min-h-[80px] w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
                      placeholder="지원동기 등 기업 연계형 문항에서 참고할 기업 정보를 붙여넣으세요."
                      value={question.company_info}
                      onChange={(event) =>
                        updateQuestion(question.client_id, 'company_info', event.target.value)
                      }
                    />
                  </div>
                  <AiAnswerGenerator
                    questionId={question.id}
                    disabled={!session?.user.id}
                    companyInfo={question.company_info}
                    onApply={(answer) =>
                      updateQuestion(question.client_id, 'answer_content', answer)
                    }
                  />
                </div>
              </details>
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
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">자소서</h1>
            <p className="mt-2 text-sm text-neutral-500">경험을 고르고, 필요한 문항만 작성하세요.</p>
          </div>
          <button type="button" onClick={openNewResume} className="rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white">+ 새 자소서</button>
        </div>
        {resumeRecords.length > 0 ? (
          <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
            {resumeRecords.map((record) => (
              <button key={record.id} type="button" onClick={() => openResumeRecord(record)} className={`min-w-56 rounded-2xl border p-4 text-left ${resumeDraft.id === record.id ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-900'}`}>
                <div className="text-sm font-medium">{getResumeTitle(record)}</div>
                <div className={`mt-2 text-xs ${resumeDraft.id === record.id ? 'text-neutral-300' : 'text-neutral-500'}`}>마지막 수정 {formatDate(record.updated_at)}</div>
              </button>
            ))}
          </div>
        ) : null}
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-[#f7f7f8] shadow-sm">
        {renderResumeStepNavigation()}
        {activeStep === 1 ? renderResumeBasicInfo() : renderResumeWriting()}
        </div>
      </section>
    );
  }

  function renderMainContent() {
    if (activeSection === '경험 아카이브') {
      return <SimpleExperience enabled={Boolean(session?.user.id)} />;
    }

    return renderResumeSection();
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-950">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button type="button" onClick={() => setActiveSection('경험 아카이브')} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src="/compass-logo.svg" alt="Compass" className="h-8 w-8 rounded-lg" /> Compass
          </button>
          <nav className="flex items-center gap-1 rounded-xl bg-neutral-100 p-1">
            <button type="button" onClick={() => setActiveSection('경험 아카이브')} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeSection === '경험 아카이브' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>경험</button>
            <button type="button" onClick={() => setActiveSection('새 자소서')} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeSection === '새 자소서' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}>자소서</button>
          </nav>
          {isSessionLoading ? <span className="text-xs text-neutral-400">불러오는 중</span> : session?.user ? <form method="post" action="/api/auth/signout?callbackUrl=/" className="hidden sm:block"><input type="hidden" name="csrfToken" value={csrfToken}/><button className="text-sm text-neutral-500">로그아웃</button></form> : <form method="post" action="/api/auth/signin/google?callbackUrl=/"><input type="hidden" name="csrfToken" value={csrfToken}/><button disabled={!csrfToken} className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-medium text-white disabled:bg-neutral-300">로그인</button></form>}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{renderMainContent()}</main>
    </div>
  );

}
