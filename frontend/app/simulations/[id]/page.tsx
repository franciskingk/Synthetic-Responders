'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { ResponseRecord, SimulationDetail } from '@/lib/types';

const statusTone: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const questionTypeLabel: Record<string, string> = {
  likert: 'Likert Scale',
  mcq: 'Multiple Choice',
  open: 'Open Ended',
};

const stopWords = new Set([
  'about', 'after', 'again', 'also', 'and', 'because', 'before', 'being', 'between', 'both', 'but', 'could',
  'first', 'from', 'have', 'into', 'just', 'like', 'main', 'more', 'most', 'much', 'only', 'other', 'over',
  'probably', 'question', 'really', 'seems', 'should', 'that', 'their', 'them', 'then', 'there', 'they', 'thing',
  'this', 'those', 'would', 'with', 'your', 'what', 'when', 'where', 'which', 'while', 'want', 'worth',
]);

type QuestionInsight = {
  questionId: string;
  questionText: string;
  type: string;
  total: number;
  likertAverage?: string;
  likertDistribution?: { label: string; count: number; percentage: number }[];
  mcqDistribution?: { label: string; count: number; percentage: number }[];
  openAnswers?: string[];
  topTerms?: { term: string; count: number }[];
};

function extractTopTerms(responses: string[]) {
  const counts = new Map<string, number>();

  responses.forEach((response) => {
    response
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !stopWords.has(word))
      .forEach((word) => {
        counts.set(word, (counts.get(word) || 0) + 1);
      });
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term, count]) => ({ term, count }));
}

export default function SimulationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [simulation, setSimulation] = useState<SimulationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const fetchResults = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await api.get<SimulationDetail>(`/simulations/${params.id}/results`);
      setSimulation(response.data);
      setError('');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.detail || 'Failed to load simulation results'
        : 'Failed to load simulation results';
      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    void fetchResults();
  }, [params.id, router]);

  useEffect(() => {
    if (simulation?.status !== 'running') {
      return;
    }

    const interval = setInterval(() => {
      void fetchResults(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [simulation?.status]);

  const groupedResponses = useMemo(() => {
    if (!simulation) {
      return [];
    }

    const grouped = new Map<number, ResponseRecord[]>();
    simulation.responses.forEach((response) => {
      const collection = grouped.get(response.respondent_id) || [];
      collection.push(response);
      grouped.set(response.respondent_id, collection);
    });

    return Array.from(grouped.entries()).map(([respondentId, responses]) => ({
      respondentId,
      responses,
    }));
  }, [simulation]);

  const questionInsights = useMemo(() => {
    if (!simulation) {
      return [];
    }

    const grouped = new Map<string, ResponseRecord[]>();
    simulation.responses.forEach((response) => {
      const collection = grouped.get(response.question_id) || [];
      collection.push(response);
      grouped.set(response.question_id, collection);
    });

    return Array.from(grouped.entries()).map(([questionId, responses]) => {
      const first = responses[0];
      const total = responses.length;
      const insight: QuestionInsight = {
        questionId,
        questionText: first.question_text,
        type: first.type,
        total,
      };

      if (first.type === 'likert') {
        const values = responses
          .map((response) => response.numeric_answer)
          .filter((value): value is number => value !== null);
        const distribution = [1, 2, 3, 4, 5].map((score) => {
          const count = values.filter((value) => value === score).length;
          return {
            label: `${score}`,
            count,
            percentage: total ? Math.round((count / total) * 100) : 0,
          };
        });

        insight.likertAverage = values.length
          ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
          : '0.0';
        insight.likertDistribution = distribution;
      }

      if (first.type === 'mcq') {
        const options = first.options || [];
        insight.mcqDistribution = options.map((option, index) => {
          const count = responses.filter((response) => response.numeric_answer === index).length;
          return {
            label: option,
            count,
            percentage: total ? Math.round((count / total) * 100) : 0,
          };
        });
      }

      if (first.type === 'open') {
        const openAnswers = responses
          .map((response) => response.text_answer)
          .filter((answer): answer is string => Boolean(answer));
        insight.openAnswers = openAnswers;
        insight.topTerms = extractTopTerms(openAnswers);
      }

      return insight;
    });
  }, [simulation]);

  const derivedStats = useMemo(() => {
    if (!simulation) {
      return null;
    }

    const openResponses = simulation.responses.filter((response) => response.type === 'open').length;
    const quantResponses = simulation.responses.length - openResponses;
    const respondentCount = groupedResponses.length;
    const questionCount = questionInsights.length;
    const expectedResponses = simulation.sample_size * questionCount;
    const completionRate = expectedResponses ? Math.round((simulation.responses.length / expectedResponses) * 100) : 0;

    return {
      respondentCount,
      openResponses,
      quantResponses,
      questionCount,
      expectedResponses,
      completionRate,
      avgResponsesPerRespondent: respondentCount > 0 ? (simulation.responses.length / respondentCount).toFixed(1) : '0.0',
    };
  }, [groupedResponses, questionInsights.length, simulation]);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/simulations/${params.id}/export`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = contentDisposition?.match(/filename=([^;]+)/i);
      const filename = filenameMatch?.[1]?.replace(/"/g, '') || `simulation_${params.id}.csv`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.detail || 'Failed to export simulation'
        : 'Failed to export simulation';
      window.alert(message);
    } finally {
      setDownloading(false);
    }
  };

  const renderAnswer = (response: ResponseRecord) => {
    if (response.type === 'open') {
      return response.text_answer || 'No answer generated';
    }

    if (response.type === 'mcq' && response.options && response.numeric_answer !== null) {
      return response.options[response.numeric_answer] || `Option ${response.numeric_answer + 1}`;
    }

    if (response.numeric_answer !== null) {
      return String(response.numeric_answer);
    }

    return 'No answer recorded';
  };

  if (loading) {
    return <div className="container flex min-h-screen items-center justify-center">Loading simulation results...</div>;
  }

  if (!simulation) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Simulation Results</h1>
          <p className="page-subtitle">
            {simulation.survey_title} with {simulation.persona_name}
          </p>
          {simulation.status === 'running' && (
            <p className="mt-2 text-sm text-blue-700">
              This run is still generating output. {refreshing ? 'Refreshing now...' : 'Auto-refresh is active.'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/simulations" className="button-secondary">
            Back to Simulations
          </Link>
          <button
            type="button"
            onClick={handleExport}
            disabled={downloading || simulation.status !== 'complete'}
            className="button-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? 'Exporting...' : 'Export CSV'}
          </button>
          <Link href={`/simulations/create?personaId=${simulation.persona_id}&surveyId=${simulation.survey_id}`} className="button">
            Re-run Simulation
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Status</p>
          <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusTone[simulation.status] || statusTone.running}`}>
            {simulation.status}
          </div>
          {simulation.error_message && <p className="mt-3 text-sm text-red-600">{simulation.error_message}</p>}
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Respondents</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{derivedStats?.respondentCount || 0}</p>
          <p className="mt-2 text-sm text-gray-600">Target sample size: {simulation.sample_size}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Completion</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{derivedStats?.completionRate || 0}%</p>
          <p className="mt-2 text-sm text-gray-600">
            {simulation.total_responses} of {derivedStats?.expectedResponses || 0} expected answers
          </p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Question Mix</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{derivedStats?.quantResponses || 0}</p>
          <p className="mt-2 text-sm text-gray-600">{derivedStats?.openResponses || 0} open-ended answers</p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="card">
          <h2 className="text-xl font-bold">Run Overview</h2>
          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
              <dt className="font-medium text-gray-500">Created</dt>
              <dd>{new Date(simulation.created_at).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
              <dt className="font-medium text-gray-500">Last updated</dt>
              <dd>{new Date(simulation.updated_at).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
              <dt className="font-medium text-gray-500">Survey</dt>
              <dd className="text-right">{simulation.survey_title}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
              <dt className="font-medium text-gray-500">Persona</dt>
              <dd className="text-right">{simulation.persona_name}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
              <dt className="font-medium text-gray-500">Questions covered</dt>
              <dd>{derivedStats?.questionCount || 0}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-gray-500">Avg. answers per respondent</dt>
              <dd>{derivedStats?.avgResponsesPerRespondent || '0.0'}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Question Insights</h2>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {questionInsights.length} questions
            </span>
          </div>

          {questionInsights.length === 0 ? (
            <p className="mt-4 text-gray-600">Insights will appear here when the simulation produces response records.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {questionInsights.map((question, index) => (
                <div key={question.questionId} className="rounded border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {index + 1}. {question.questionText}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {questionTypeLabel[question.type] || question.type} · {question.total} answers captured
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                      {questionTypeLabel[question.type] || question.type}
                    </span>
                  </div>

                  {question.likertDistribution && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Average score: {question.likertAverage}</p>
                      <div className="mt-3 space-y-2">
                        {question.likertDistribution.map((entry) => (
                          <div key={entry.label}>
                            <div className="mb-1 flex justify-between text-sm text-gray-600">
                              <span>{entry.label}</span>
                              <span>{entry.count} responses</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100">
                              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${entry.percentage}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {question.mcqDistribution && (
                    <div className="mt-4 space-y-3">
                      {question.mcqDistribution.map((entry) => (
                        <div key={entry.label}>
                          <div className="mb-1 flex justify-between gap-4 text-sm text-gray-600">
                            <span>{entry.label}</span>
                            <span>{entry.count} · {entry.percentage}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100">
                            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${entry.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.openAnswers && (
                    <div className="mt-4">
                      {question.topTerms && question.topTerms.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {question.topTerms.map((term) => (
                            <span key={term.term} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
                              {term.term} · {term.count}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="space-y-3">
                        {question.openAnswers.slice(0, 3).map((answer, answerIndex) => (
                          <blockquote key={`${question.questionId}-${answerIndex}`} className="rounded bg-gray-50 p-3 text-sm text-gray-700">
                            {answer}
                          </blockquote>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Respondent Snapshots</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
            {groupedResponses.length} respondents
          </span>
        </div>

        {groupedResponses.length === 0 ? (
          <p className="mt-4 text-gray-600">Results will appear here when the simulation produces response records.</p>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {groupedResponses.map((group) => (
              <div key={group.respondentId} className="rounded border border-gray-200 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Respondent {group.respondentId}
                </h3>
                <div className="mt-3 space-y-3">
                  {group.responses.map((response) => (
                    <div key={`${group.respondentId}-${response.question_id}`} className="rounded bg-gray-50 p-3">
                      <p className="font-medium text-gray-900">{response.question_text}</p>
                      <p className="mt-2 text-sm text-gray-700">{renderAnswer(response)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
