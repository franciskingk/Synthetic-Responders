'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { Question, SurveyDetail } from '@/lib/types';

type QuestionType = 'mcq' | 'likert' | 'open';

const initialQuestion = {
  question_text: '',
  type: 'likert' as QuestionType,
  options: [''],
};

export default function SurveyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    void fetchSurvey();
  }, [params.id, router]);

  const fetchSurvey = async () => {
    try {
      const response = await api.get<SurveyDetail>(`/surveys/${params.id}`);
      setSurvey(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.post(`/surveys/${params.id}/questions`, {
        question_text: currentQuestion.question_text,
        type: currentQuestion.type,
        options: currentQuestion.type === 'mcq' ? currentQuestion.options.filter(Boolean) : null,
        order_index: survey?.questions.length ?? 0,
      });
      setCurrentQuestion(initialQuestion);
      await fetchSurvey();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) {
      return;
    }

    try {
      await api.delete(`/surveys/${params.id}/questions/${questionId}`);
      await fetchSurvey();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete question');
    }
  };

  if (loading) {
    return <div className="container flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!survey) {
    return (
      <div className="container max-w-3xl py-8">
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
          {error || 'Survey not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">{survey.title}</h1>
          <p className="page-subtitle">{survey.question_count} questions ready for simulation.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/surveys" className="button-secondary">
            Back to Surveys
          </Link>
          <Link href={`/simulations/create?surveyId=${params.id}`} className="button">
            Run Simulation
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Questions</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
              {survey.question_count} total
            </span>
          </div>

          {survey.questions.length === 0 ? (
            <p className="text-gray-600">Add your first question to make this survey usable in simulations.</p>
          ) : (
            <div className="space-y-3">
              {survey.questions.map((question: Question, index: number) => (
                <div key={question.id} className="rounded border border-gray-200 p-4">
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{index + 1}. {question.question_text}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Type: {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'likert' ? 'Likert Scale' : 'Open Ended'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-sm text-red-600 underline"
                    >
                      Delete
                    </button>
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="mt-3 rounded bg-gray-50 p-3 text-sm text-gray-700">
                      {question.options.join(' | ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAddQuestion} className="card space-y-4">
          <h2 className="text-xl font-bold">Add Question</h2>

          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <textarea
              className="form-input"
              rows={4}
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, question_text: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Question Type *</label>
            <select
              className="form-input"
              value={currentQuestion.type}
              onChange={(e) =>
                setCurrentQuestion((prev) => ({
                  ...prev,
                  type: e.target.value as QuestionType,
                  options: e.target.value === 'mcq' ? prev.options : [''],
                }))
              }
            >
              <option value="likert">Likert Scale (1-5)</option>
              <option value="mcq">Multiple Choice</option>
              <option value="open">Open Ended</option>
            </select>
          </div>

          {currentQuestion.type === 'mcq' && (
            <div className="form-group">
              <label className="form-label">Options *</label>
              <textarea
                className="form-input"
                rows={5}
                value={currentQuestion.options.join('\n')}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    options: e.target.value.split('\n'),
                  }))
                }
                placeholder={'Option 1\nOption 2\nOption 3'}
                required
              />
            </div>
          )}

          <button type="submit" disabled={saving} className="button w-full justify-center">
            {saving ? 'Saving...' : 'Add Question'}
          </button>
        </form>
      </div>
    </div>
  );
}
