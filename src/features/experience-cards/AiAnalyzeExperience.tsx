import { useState } from 'react';
import { requestNextAnalysisQuestion, synthesizeExperience, type QaItem } from './api';

export function AiAnalyzeExperience({
  cardId,
  disabled,
  onEnriched,
}: {
  cardId?: number;
  disabled: boolean;
  onEnriched: (rawNote: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [qaHistory, setQaHistory] = useState<QaItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function openModal() {
    if (!cardId) {
      setMessage('먼저 경험을 저장한 뒤 AI 분석을 사용할 수 있습니다.');
      return;
    }
    setMessage('');
    setError('');
    setQaHistory([]);
    setCurrentAnswer('');
    setModalOpen(true);
    void fetchNext([]);
  }

  async function fetchNext(history: QaItem[]) {
    if (!cardId) return;
    setLoading(true);
    setError('');
    try {
      const result = await requestNextAnalysisQuestion(cardId, history);
      if (result.done) {
        await finalize(history);
      } else {
        setCurrentQuestion(result.question);
        setCurrentAnswer('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 분석 질문을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function finalize(history: QaItem[]) {
    const answered = history.filter((item): item is { question: string; answer: string } => Boolean(item.answer));
    setModalOpen(false);
    setCurrentQuestion('');
    if (!answered.length) {
      setMessage('추가로 반영할 답변이 없어 경험 내용을 그대로 두었습니다.');
      return;
    }
    if (!cardId) return;
    setFinishing(true);
    setMessage('');
    try {
      const result = await synthesizeExperience(cardId, answered);
      onEnriched(result.raw_note);
      setMessage('답변을 반영해 경험 내용을 보강했습니다.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '경험 내용을 보강하지 못했습니다.');
    } finally {
      setFinishing(false);
    }
  }

  function submitAnswer() {
    if (!currentAnswer.trim()) {
      setError('답변을 입력하거나 건너뛰기를 눌러주세요.');
      return;
    }
    const nextHistory = [...qaHistory, { question: currentQuestion, answer: currentAnswer.trim() }];
    setQaHistory(nextHistory);
    void fetchNext(nextHistory);
  }

  function skipQuestion() {
    const nextHistory = [...qaHistory, { question: currentQuestion, answer: null }];
    setQaHistory(nextHistory);
    void fetchNext(nextHistory);
  }

  function stopAnalysis() {
    void finalize(qaHistory);
  }

  return (
    <div className="mt-8 border-t border-neutral-100 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">이 경험을 더 풍부하게 만들까요?</h2>
          <p className="mt-1 text-sm text-neutral-500">AI가 부족한 부분에 대해 질문하고, 답변을 종합해 경험 내용을 보강합니다.</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          disabled={disabled || finishing}
          className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800 disabled:opacity-50"
        >
          {finishing ? 'AI가 반영하는 중...' : 'AI 분석'}
        </button>
      </div>
      {message ? <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-600">{message}</p> : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">AI 분석</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-xs text-neutral-400">
                닫기
              </button>
            </div>

            {loading && !currentQuestion ? (
              <p className="text-sm text-neutral-500">질문을 준비하는 중...</p>
            ) : currentQuestion ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-800">{currentQuestion}</p>
                <textarea
                  className="min-h-[100px] w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-neutral-400"
                  value={currentAnswer}
                  onChange={(event) => setCurrentAnswer(event.target.value)}
                  placeholder="답변을 적어주세요."
                />
                {error ? <p className="text-xs text-red-700">{error}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={submitAnswer}
                    className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-medium text-white disabled:bg-neutral-300"
                  >
                    답변
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={skipQuestion}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 disabled:opacity-50"
                  >
                    건너뛰기
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={stopAnalysis}
                    className="ml-auto rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-500 disabled:opacity-50"
                  >
                    그만하기
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">추가로 물어볼 내용이 없습니다.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
