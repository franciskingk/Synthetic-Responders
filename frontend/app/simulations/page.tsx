'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { auth } from '@/lib/auth';
import api from '@/lib/api';
import { Simulation } from '@/lib/types';

export default function SimulationsPage() {
  const router = useRouter();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchSimulations();
    const interval = setInterval(fetchSimulations, 3000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchSimulations = async () => {
    try {
      const response = await api.get('/simulations');
      setSimulations(response.data.simulations);
    } catch (error) {
      console.error('Failed to fetch simulations', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = async (simulationId: string) => {
    try {
      const response = await api.get(`/simulations/${simulationId}/export`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = contentDisposition?.match(/filename=([^;]+)/i);
      const filename = filenameMatch?.[1]?.replace(/"/g, '') || `simulation_${simulationId}.csv`;

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.detail || 'Failed to export simulation'
        : 'Failed to export simulation';
      window.alert(message);
    }
  };

  if (loading) {
    return <div className="container flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const completedCount = simulations.filter((sim) => sim.status === 'complete').length;
  const runningCount = simulations.filter((sim) => sim.status === 'running').length;
  const failedCount = simulations.filter((sim) => sim.status === 'failed').length;
  const completionRate = simulations.length ? Math.round((completedCount / simulations.length) * 100) : 0;

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Simulations</h1>
          <p className="page-subtitle">Track run status, inspect generated responses, and export finished runs.</p>
        </div>
        <Link href="/simulations/create" className="button">
          Run Simulation
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Completed</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{completedCount}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Running</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{runningCount}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Failed</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{failedCount}</p>
          <p className="mt-2 text-sm text-gray-600">{completionRate}% completion rate overall</p>
        </div>
      </div>

      {simulations.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="mb-4 text-gray-600">No simulations yet.</p>
          <Link href="/simulations/create" className="button">
            Run your first simulation
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Created</th>
                <th>Configuration</th>
                <th>Sample Size</th>
                <th>Responses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {simulations.map((sim) => (
                <tr key={sim.id}>
                  <td>{new Date(sim.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="min-w-[220px]">
                      <p className="font-medium text-gray-900">{sim.survey_title || 'Survey'}</p>
                      <p className="text-sm text-gray-600">{sim.persona_name || 'Persona'}</p>
                    </div>
                  </td>
                  <td>{sim.sample_size}</td>
                  <td>{sim.total_responses}</td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-sm ${getStatusColor(sim.status)}`}>
                      {sim.status}
                    </span>
                    {sim.error_message && (
                      <p className="mt-2 text-sm text-red-600">{sim.error_message}</p>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col gap-2">
                      <Link href={`/simulations/${sim.id}`} className="text-blue-600 underline hover:text-blue-800">
                        View Results
                      </Link>
                      {sim.status === 'complete' && (
                        <button
                          type="button"
                          onClick={() => handleExport(sim.id)}
                          className="text-left text-blue-600 underline hover:text-blue-800"
                        >
                          Export CSV
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
