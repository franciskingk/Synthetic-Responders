'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import api from '@/lib/api';
import { Survey } from '@/lib/types';

export default function SurveysPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchSurveys();
  }, [router]);

  const fetchSurveys = async () => {
    try {
      const response = await api.get('/surveys');
      setSurveys(response.data.surveys);
    } catch (error) {
      console.error('Failed to fetch surveys', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      await api.delete(`/surveys/${id}`);
      setSurveys(surveys.filter((survey) => survey.id !== id));
    } catch (error) {
      console.error('Failed to delete survey', error);
    }
  };

  if (loading) {
    return <div className="container flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const readySurveys = surveys.filter((survey) => survey.question_count > 0);
  const averageQuestions = surveys.length
    ? (surveys.reduce((sum, survey) => sum + survey.question_count, 0) / surveys.length).toFixed(1)
    : '0.0';

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Surveys</h1>
          <p className="page-subtitle">Build questionnaires and keep an eye on which ones are ready to simulate.</p>
        </div>
        <Link href="/surveys/create" className="button">
          Create Survey
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Total Surveys</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{surveys.length}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Ready to Simulate</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{readySurveys.length}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Average Questions</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{averageQuestions}</p>
        </div>
      </div>

      {surveys.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="mb-4 text-gray-600">No surveys yet.</p>
          <Link href="/surveys/create" className="button">
            Create your first survey
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => (
            <div key={survey.id} className="card flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{survey.title}</h2>
                <p className="text-gray-600">{survey.question_count} questions</p>
                <p className="mt-2 text-sm text-gray-500">
                  {survey.question_count > 0 ? 'This survey is ready for simulations.' : 'Add questions before you run a simulation.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/surveys/${survey.id}`} className="button-secondary">
                  View
                </Link>
                {survey.question_count > 0 && (
                  <Link href={`/simulations/create?surveyId=${survey.id}`} className="button-secondary">
                    Simulate
                  </Link>
                )}
                <button
                  onClick={() => handleDelete(survey.id)}
                  className="button-secondary text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
