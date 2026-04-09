'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import api from '@/lib/api';

interface Question {
  id: string;
  question_text: string;
  type: 'mcq' | 'likert' | 'open';
  options: string[] | null;
  order_index: number;
}

export default function CreateSurveyPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [surveyId, setSurveyId] = useState('');
  const [ready, setReady] = useState(false);

  const [surveyTitle, setSurveyTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    type: 'likert' as 'mcq' | 'likert' | 'open',
    options: [''],
  });

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return <div className="container flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const handleCreateSurvey = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/surveys', { title: surveyTitle });
      setSurveyId(response.data.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create survey');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!surveyId) {
      setError('Create survey first');
      return;
    }

    setLoading(true);

    try {
      const questionData = {
        question_text: currentQuestion.question_text,
        type: currentQuestion.type,
        options: currentQuestion.type === 'mcq' ? currentQuestion.options.filter((o) => o) : null,
        order_index: questions.length,
      };

      const response = await api.post(`/surveys/${surveyId}/questions`, questionData);
      setQuestions([...questions, response.data]);
      setCurrentQuestion({ question_text: '', type: 'likert', options: [''] });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    router.push(`/surveys/${surveyId}`);
  };

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="page-title mb-8">Create Survey</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!surveyId ? (
        <form onSubmit={handleCreateSurvey} className="card space-y-4">
          <h2 className="text-xl font-bold">Survey Details</h2>
          <div className="form-group">
            <label className="form-label">Survey Title *</label>
            <input
              type="text"
              className="form-input"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="button w-full justify-center">
            {loading ? 'Creating...' : 'Create Survey'}
          </button>
        </form>
      ) : (
        <div className="space-y-8">
          <div className="card">
            <h2 className="text-xl font-bold mb-2">{surveyTitle}</h2>
            <p className="text-gray-600">{questions.length} questions</p>
          </div>

          <form onSubmit={handleAddQuestion} className="card space-y-4">
            <h2 className="text-xl font-bold">Add Question</h2>

            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <textarea
                className="form-input"
                rows={3}
                value={currentQuestion.question_text}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Question Type *</label>
              <select
                className="form-input"
                value={currentQuestion.type}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as any })}
              >
                <option value="likert">Likert Scale (1-5)</option>
                <option value="mcq">Multiple Choice</option>
                <option value="open">Open Ended</option>
              </select>
            </div>

            {currentQuestion.type === 'mcq' && (
              <div className="form-group">
                <label className="form-label">Options (one per line) *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={currentQuestion.options.join('\n')}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, options: e.target.value.split('\n') })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  required
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="button w-full justify-center">
              {loading ? 'Adding...' : 'Add Question'}
            </button>
          </form>

          {questions.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Questions</h2>
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-3 border border-gray-200 rounded">
                    <p className="font-semibold">{idx + 1}. {q.question_text}</p>
                    <p className="text-sm text-gray-600">{q.type}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleFinish} className="button w-full justify-center bg-green-600 hover:bg-green-700">
            Finish & Go to Surveys
          </button>
        </div>
      )}
    </div>
  );
}
