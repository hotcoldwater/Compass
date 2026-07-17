import { useState } from 'react';

type GeneratedAnswer = {
  answer: string;
  versionNumber: number;
  charCount: number;
  byteCount: number;
  warnings: string[];
  unsupportedClaims: string[];
  limitStatus: { isExceeded: boolean };
};

type Followup = { question: string; answer: string };
type PlanResponse = { ok: boolean; data?: { sufficient: boolean; questions: string[] }; error?: string };
type GenerateResponse = { ok: boolean; data?: GeneratedAnswer; error?: string };

export function AiAnswerGenerator({
  questionId,
  disabled,
  companyInfo,
  onApply,
}: {
  questionId?: number;
  disabled: boolean;
  companyInfo: string;
  onApply: (answer: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [outline, setOutline] = useState('');
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [pendingAnswers, setPendingAnswers] = useState<string[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedAnswer | null>(null);
  const [message, setMessage] = useState('');

  function openModal() {
    if (!questionId) {
      setMessage('자소서를 먼저 저장한 뒤 AI 초안을 만들 수 있습니다.');
      return;
    }
    setMessage('');
    setOutline('');
    setFollowups([]);
    setPendingQuestions([]);
    setPendingAnswers([]);
    setPlanError('');
    setModalOpen(true);
  }

  async function checkPlan(currentFollowups: Followup[]) {
    if (!questionId) return;
    setPlanLoading(true);
    setPlanError('');
    try {
      const response = await fetch('/api/ai/plan-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeQuestionId: questionId, outline, companyInfo, followups: currentFollowups }),
      });
      const body = (await response.json()) as PlanResponse;
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error || '답변 흐름을 점검하지 못했습니다.');
      if (body.data.sufficient) {
        setModalOpen(false);
        await runGenerate(currentFollowups);
      } else {
        setPendingQuestions(body.data.questions);
        setPendingAnswers(body.data.questions.map(() => ''));
      }
    } catch (error) {
      setPlanError(error instanceof Error ? error.message : '답변 흐름을 점검하지 못했습니다.');
    } finally {
      setPlanLoading(false);
    }
  }

  function submitOutline() {
    if (!outline.trim()) {
      setPlanError('답변 흐름을 먼저 입력해주세요.');
      return;
    }
    void checkPlan(followups);
  }

  function submitFollowupAnswers() {
    const answered = pendingQuestions.map((question, index) => ({
      question,
      answer: pendingAnswers[index]?.trim() || '',
    }));
    if (answered.some((item) => !item.answer)) {
      setPlanError('모든 추가 질문에 답변해주세요.');
      return;
    }
    const nextFollowups = [...followups, ...answered];
    setFollowups(nextFollowups);
    setPendingQuestions([]);
    setPendingAnswers([]);
    void checkPlan(nextFollowups);
  }

  async function runGenerate(finalFollowups: Followup[]) {
    if (!questionId) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/ai/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeQuestionId: questionId, outline, companyInfo, followups: finalFollowups }),
      });
      const body = (await response.json()) as GenerateResponse;
      if (!response.ok || !body.ok || !body.data) throw new Error(body.error || 'AI 초안을 생성하지 못했습니다.');
      setResult(body.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI 초안을 생성하지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const checks = result ? [...result.warnings, ...result.unsupportedClaims] : [];

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={openModal}
        className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-medium text-white disabled:bg-violet-300"
      >
        {loading ? '초안 작성 중...' : 'AI 초안 만들기'}
      </button>
      {message ? <p className="mt-2 text-xs text-red-700">{message}</p> : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">답변 흐름 작성</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-xs text-neutral-400">
                닫기
              </button>
            </div>

            {pendingQuestions.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">
                  문항 답변의 흐름(개요)을 적어주세요. 흐름만으로 초안 작성이 부족하면 AI가 추가 질문을 합니다.
                </p>
                <textarea
                  className="min-h-[140px] w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-neutral-400"
                  value={outline}
                  onChange={(event) => setOutline(event.target.value)}
                  placeholder="예) 상황 → 내가 시도한 방법 → 결과 → 이 경험이 지원 직무와 연결되는 지점"
                />
                {planError ? <p className="text-xs text-red-700">{planError}</p> : null}
                <button
                  type="button"
                  disabled={planLoading}
                  onClick={submitOutline}
                  className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-medium text-white disabled:bg-neutral-300"
                >
                  {planLoading ? '확인 중...' : '다음'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">초안 작성에 필요한 추가 질문에 답해주세요.</p>
                {pendingQuestions.map((question, index) => (
                  <div key={question} className="space-y-1">
                    <label className="text-xs font-medium text-neutral-700">{question}</label>
                    <textarea
                      className="min-h-[70px] w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
                      value={pendingAnswers[index] || ''}
                      onChange={(event) =>
                        setPendingAnswers((prev) =>
                          prev.map((value, valueIndex) => (valueIndex === index ? event.target.value : value))
                        )
                      }
                    />
                  </div>
                ))}
                {planError ? <p className="text-xs text-red-700">{planError}</p> : null}
                <button
                  type="button"
                  disabled={planLoading}
                  onClick={submitFollowupAnswers}
                  className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-medium text-white disabled:bg-neutral-300"
                >
                  {planLoading ? '확인 중...' : '다음'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-violet-800">
              AI 초안 · {result.charCount}자 / {result.byteCount}byte
              {result.limitStatus.isExceeded ? ' · 제한 초과' : ''}
            </span>
            <button
              type="button"
              onClick={() => onApply(result.answer)}
              className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-medium text-white"
            >
              답변에 적용
            </button>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-neutral-800">{result.answer}</p>
          {checks.length ? (
            <details className="mt-3 text-xs text-neutral-600">
              <summary className="cursor-pointer">확인 사항 {checks.length}개</summary>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {checks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          ) : null}
          <p className="mt-3 text-xs text-neutral-500">적용 후 자소서 저장을 눌러 반영하세요.</p>
        </div>
      ) : null}
    </div>
  );
}
