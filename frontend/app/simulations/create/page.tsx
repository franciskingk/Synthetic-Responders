'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import api from '@/lib/api';
import { Persona, Survey, Simulation } from '@/lib/types';

export default function CreateSimulationPage() {
  return (
    <Suspense fallback={<CreateSimulationLoadingState />}>
      <CreateSimulationContent />
    </Suspense>
  );
}

function CreateSimulationLoadingState() {
  return <div className="container flex items-center justify-center min-h-screen">Loading...</div>;
}

function CreateSimulationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const [form, setForm] = useState({
    persona_id: searchParams.get('personaId') || '',
    survey_id: searchParams.get('surveyId') || '',
    sample_size: 10,
  });

  const [simulation, setSimulation] = useState<Pick<Simulation, 'id' | 'status' | 'error_message'> | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchResources();
  }, [router]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      persona_id: searchParams.get('personaId') || prev.persona_id,
      survey_id: searchParams.get('surveyId') || prev.survey_id,
    }));
  }, [searchParams]);

  const fetchResources = async () => {
    try {
      const [personasRes, surveysRes] = await Promise.all([
        api.get('/personas'),
        api.get('/surveys'),
      ]);

      setPersonas(personasRes.data.personas);
      setSurveys(surveysRes.data.surveys);
    } catch (err) {
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/simulations', {
        persona_id: form.persona_id,
        survey_id: form.survey_id,
        sample_size: Number(form.sample_size),
      });

      setSimulation({
        id: response.data.id,
        status: 'running',
        error_message: null,
      });

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get<Simulation>(`/simulations/${response.data.id}`);
          setSimulation({
            id: statusRes.data.id,
            status: statusRes.data.status,
            error_message: statusRes.data.error_message,
          });

          if (statusRes.data.status !== 'running') {
            clearInterval(pollInterval);
            if (statusRes.data.status === 'complete') {
              setTimeout(() => router.push('/simulations'), 2000);
            }
          }
        } catch (err) {
          clearInterval(pollInterval);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create simulation');
    }
  };

  if (loading) {
    return <CreateSimulationLoadingState />;
  }

  if (simulation) {
    return (
      <div className="container py-8 max-w-2xl">
        <div className="card text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Simulation Running...</h1>
          <p className="text-gray-600 mb-4">Status: {simulation.status}</p>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded">
            {simulation.status === 'running' && 'Generating synthetic responses...'}
            {simulation.status === 'complete' && 'Complete! Redirecting...'}
            {simulation.status === 'failed' && 'Failed'}
          </div>
          {simulation.error_message && (
            <p className="mt-4 text-sm text-red-600">{simulation.error_message}</p>
          )}
          {simulation.status === 'failed' && (
            <div className="mt-6">
              <Link href="/simulations" className="button-secondary">
                Back to Simulations
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="page-title mb-8">Run Simulation</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="form-group">
          <label className="form-label">Select Persona *</label>
          <select
            className="form-input"
            value={form.persona_id}
            onChange={(e) => setForm({ ...form, persona_id: e.target.value })}
            required
          >
            <option value="">Choose a persona...</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.demographics.name}
              </option>
            ))}
          </select>
          {personas.length === 0 && (
            <p className="text-yellow-600 text-sm mt-2">
              <Link href="/personas/create" className="underline">Create a persona first</Link>
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Select Survey *</label>
          <select
            className="form-input"
            value={form.survey_id}
            onChange={(e) => setForm({ ...form, survey_id: e.target.value })}
            required
          >
            <option value="">Choose a survey...</option>
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.question_count} questions)
              </option>
            ))}
          </select>
          {surveys.length === 0 && (
            <p className="text-yellow-600 text-sm mt-2">
              <Link href="/surveys/create" className="underline">Create a survey first</Link>
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Sample Size (1-300) *</label>
          <input
            type="number"
            className="form-input"
            min="1"
            max="300"
            value={form.sample_size}
            onChange={(e) => setForm({ ...form, sample_size: parseInt(e.target.value) })}
            required
          />
          <p className="text-gray-600 text-sm mt-1">Number of synthetic respondents to generate</p>
        </div>

        <button type="submit" disabled={!form.persona_id || !form.survey_id} className="button w-full justify-center">
          Run Simulation
        </button>
      </form>
    </div>
  );
}
