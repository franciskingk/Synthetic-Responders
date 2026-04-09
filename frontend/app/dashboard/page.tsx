'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import api from '@/lib/api';
import { Persona, Simulation, Survey } from '@/lib/types';

interface DashboardData {
  personas: Persona[];
  surveys: Survey[];
  simulations: Simulation[];
}

const statusTone: Record<string, string> = {
  running: 'bg-blue-100 text-blue-800',
  complete: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    personas: [],
    surveys: [],
    simulations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const [personasRes, surveysRes, simulationsRes] = await Promise.all([
          api.get('/personas'),
          api.get('/surveys'),
          api.get('/simulations'),
        ]);

        setData({
          personas: personasRes.data.personas,
          surveys: surveysRes.data.surveys,
          simulations: simulationsRes.data.simulations,
        });
      } catch (fetchError) {
        console.error('Failed to fetch stats', fetchError);
        setError('Unable to load dashboard data. Check your backend database configuration and sign-in session.');
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, [router]);

  const handleLogout = () => {
    auth.clear();
    router.push('/login');
  };

  if (loading) {
    return <div className="container flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const completedSimulations = data.simulations.filter((sim) => sim.status === 'complete');
  const runningSimulations = data.simulations.filter((sim) => sim.status === 'running');
  const failedSimulations = data.simulations.filter((sim) => sim.status === 'failed');
  const readySurveys = data.surveys.filter((survey) => survey.question_count > 0);
  const totalResponses = data.simulations.reduce((sum, sim) => sum + sim.total_responses, 0);
  const totalQuestions = data.surveys.reduce((sum, survey) => sum + survey.question_count, 0);
  const completionRate = data.simulations.length
    ? Math.round((completedSimulations.length / data.simulations.length) * 100)
    : 0;
  const surveyReadiness = data.surveys.length ? Math.round((readySurveys.length / data.surveys.length) * 100) : 0;
  const averageQuestionsPerSurvey = data.surveys.length ? (totalQuestions / data.surveys.length).toFixed(1) : '0.0';
  const averageSampleSize = data.simulations.length
    ? (data.simulations.reduce((sum, sim) => sum + sim.sample_size, 0) / data.simulations.length).toFixed(1)
    : '0.0';
  const averageResponsesPerRun = completedSimulations.length
    ? (completedSimulations.reduce((sum, sim) => sum + sim.total_responses, 0) / completedSimulations.length).toFixed(1)
    : '0.0';
  const recentRuns = data.simulations.slice(0, 4);
  const recentPersonas = [...data.personas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
  const topSurveys = [...data.surveys]
    .sort((a, b) => b.question_count - a.question_count)
    .slice(0, 3);
  const latestSimulation = data.simulations[0];

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Keep an eye on research readiness, run quality, and the latest synthetic output.
          </p>
        </div>
        <button onClick={handleLogout} className="button-secondary">
          Logout
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Research Cockpit</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-900">
            {data.personas.length} personas, {readySurveys.length} ready surveys, {completedSimulations.length} completed runs
          </h2>
          <p className="mt-3 max-w-2xl text-gray-600">
            Your workspace is currently converting {surveyReadiness}% of surveys into simulation-ready instruments and
            delivering a {completionRate}% run success rate.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-700">Responses Generated</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">{totalResponses}</p>
              <p className="mt-2 text-sm text-blue-700">Across all completed and in-progress runs</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Avg. Responses Per Run</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{averageResponsesPerRun}</p>
              <p className="mt-2 text-sm text-emerald-700">Completed simulations only</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-700">Runs in Motion</p>
              <p className="mt-2 text-2xl font-bold text-amber-900">{runningSimulations.length}</p>
              <p className="mt-2 text-sm text-amber-700">Active simulations still generating output</p>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Workspace Health</p>
          <dl className="mt-4 space-y-4">
            <div className="flex items-end justify-between border-b border-gray-100 pb-4">
              <dt className="text-sm text-gray-500">Survey readiness</dt>
              <dd className="text-2xl font-bold text-gray-900">{surveyReadiness}%</dd>
            </div>
            <div className="flex items-end justify-between border-b border-gray-100 pb-4">
              <dt className="text-sm text-gray-500">Avg. questions per survey</dt>
              <dd className="text-xl font-semibold text-gray-900">{averageQuestionsPerSurvey}</dd>
            </div>
            <div className="flex items-end justify-between border-b border-gray-100 pb-4">
              <dt className="text-sm text-gray-500">Avg. sample size</dt>
              <dd className="text-xl font-semibold text-gray-900">{averageSampleSize}</dd>
            </div>
            <div className="flex items-end justify-between">
              <dt className="text-sm text-gray-500">Failed runs</dt>
              <dd className="text-xl font-semibold text-gray-900">{failedSimulations.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link href="/personas/create" className="card cursor-pointer transition-shadow hover:shadow-lg">
          <h2 className="mb-2 text-xl font-bold">Create Persona</h2>
          <p className="text-gray-600">Define a new research subject and sharpen your audience library.</p>
        </Link>
        <Link href="/surveys/create" className="card cursor-pointer transition-shadow hover:shadow-lg">
          <h2 className="mb-2 text-xl font-bold">Create Survey</h2>
          <p className="text-gray-600">Build a new instrument and prepare it for simulation.</p>
        </Link>
        <Link href="/simulations/create" className="card cursor-pointer transition-shadow hover:shadow-lg">
          <h2 className="mb-2 text-xl font-bold">Run Simulation</h2>
          <p className="text-gray-600">Launch a new synthetic fieldwork run and inspect the results.</p>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Recent Runs</h2>
            <Link href="/simulations" className="text-sm text-blue-600 underline">
              Open run history
            </Link>
          </div>

          {recentRuns.length === 0 ? (
            <p className="mt-4 text-gray-600">Run a simulation and the latest output will show up here.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentRuns.map((simulation) => (
                <div key={simulation.id} className="rounded border border-gray-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{simulation.survey_title || 'Survey run'}</p>
                      <p className="text-sm text-gray-600">{simulation.persona_name || 'Persona'}</p>
                      <p className="mt-2 text-sm text-gray-500">
                        {new Date(simulation.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusTone[simulation.status] || statusTone.running}`}>
                      {simulation.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-gray-500">Sample size</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{simulation.sample_size}</p>
                    </div>
                    <div className="rounded bg-gray-50 p-3">
                      <p className="text-gray-500">Responses</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{simulation.total_responses}</p>
                    </div>
                  </div>
                  <Link href={`/simulations/${simulation.id}`} className="mt-4 inline-flex text-sm text-blue-600 underline">
                    Inspect run
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Top Surveys</h2>
              <Link href="/surveys" className="text-sm text-blue-600 underline">
                View surveys
              </Link>
            </div>
            {topSurveys.length === 0 ? (
              <p className="mt-4 text-gray-600">Your surveys will appear here once you start building them.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {topSurveys.map((survey) => (
                  <Link
                    key={survey.id}
                    href={`/surveys/${survey.id}`}
                    className="flex items-center justify-between rounded border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{survey.title}</p>
                      <p className="text-sm text-gray-600">{survey.question_count} questions ready</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                      {survey.question_count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Recent Personas</h2>
              <Link href="/personas" className="text-sm text-blue-600 underline">
                View personas
              </Link>
            </div>
            {recentPersonas.length === 0 ? (
              <p className="mt-4 text-gray-600">Create a persona to start building a respondent library.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {recentPersonas.map((persona) => (
                  <Link
                    key={persona.id}
                    href={`/personas/${persona.id}`}
                    className="block rounded border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{persona.demographics.name}</p>
                        <p className="text-sm text-gray-600">
                          {persona.demographics.location} · {persona.demographics.age} years old
                        </p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {Math.round(persona.psychographics.innovation_openness * 100)}% open to change
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold">Latest Run Signal</h2>
            {latestSimulation ? (
              <div className="mt-4 rounded bg-gray-50 p-4">
                <p className="text-sm uppercase tracking-wide text-gray-500">Most recent activity</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{latestSimulation.survey_title || 'Simulation run'}</p>
                <p className="mt-1 text-sm text-gray-600">{latestSimulation.persona_name || 'Persona'}</p>
                <p className="mt-4 text-sm text-gray-700">
                  {latestSimulation.total_responses} responses generated from a sample size of {latestSimulation.sample_size}.
                </p>
                <Link href={`/simulations/${latestSimulation.id}`} className="mt-4 inline-flex text-sm text-blue-600 underline">
                  Open result view
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-gray-600">Recent simulation signals will appear here after your first run.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
