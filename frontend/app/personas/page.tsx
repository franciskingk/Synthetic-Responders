'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import api from '@/lib/api';
import { Persona } from '@/lib/types';

export default function PersonasPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchPersonas();
  }, [router]);

  const fetchPersonas = async () => {
    try {
      const response = await api.get('/personas');
      setPersonas(response.data.personas);
    } catch (error) {
      console.error('Failed to fetch personas', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      await api.delete(`/personas/${id}`);
      setPersonas(personas.filter((persona) => persona.id !== id));
    } catch (error) {
      console.error('Failed to delete persona', error);
    }
  };

  if (loading) {
    return <div className="container flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const averageBrandLoyalty = personas.length
    ? (personas.reduce((sum, persona) => sum + persona.psychographics.brand_loyalty, 0) / personas.length) * 100
    : 0;

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="page-title">Personas</h1>
          <p className="page-subtitle">Manage the respondent profiles that power your synthetic research runs.</p>
        </div>
        <Link href="/personas/create" className="button">
          Create Persona
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Total Personas</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{personas.length}</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Average Brand Loyalty</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{averageBrandLoyalty.toFixed(0)}%</p>
        </div>
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-gray-500">Simulation Ready</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{personas.length}</p>
        </div>
      </div>

      {personas.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="mb-4 text-gray-600">No personas yet.</p>
          <Link href="/personas/create" className="button">
            Create your first persona
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <div key={persona.id} className="card">
              <h2 className="mb-2 text-xl font-bold">{persona.demographics.name}</h2>
              <p className="mb-4 text-sm text-gray-600">
                {persona.demographics.age} | {persona.demographics.gender} | {persona.demographics.location}
              </p>
              <div className="mb-4 space-y-2 text-sm">
                <p><strong>Income:</strong> {persona.demographics.income_band}</p>
                <p><strong>Education:</strong> {persona.demographics.education_level}</p>
                <p><strong>Brand Loyalty:</strong> {(persona.psychographics.brand_loyalty * 100).toFixed(0)}%</p>
              </div>
              <div className="mb-4 space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>Innovation Openness</span>
                    <span>{(persona.psychographics.innovation_openness * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${persona.psychographics.innovation_openness * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>Price Sensitivity</span>
                    <span>{(persona.psychographics.price_sensitivity * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${persona.psychographics.price_sensitivity * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/personas/${persona.id}`} className="button-secondary flex-1 text-center">
                  Edit
                </Link>
                <Link href={`/simulations/create?personaId=${persona.id}`} className="button-secondary flex-1 text-center">
                  Simulate
                </Link>
                <button
                  onClick={() => handleDelete(persona.id)}
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
