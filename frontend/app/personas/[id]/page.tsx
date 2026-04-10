'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { auth } from '@/lib/auth';
import { Persona } from '@/lib/types';

type PersonaTraitKey =
  | 'risk_tolerance'
  | 'brand_loyalty'
  | 'price_sensitivity'
  | 'innovation_openness'
  | 'trust_in_institutions'
  | 'social_influence'
  | 'routine_preference'
  | 'convenience_focus'
  | 'quality_orientation';

type PersonaForm = {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  location: string;
  income_band: string;
  education_level: string;
  risk_tolerance: number;
  brand_loyalty: number;
  price_sensitivity: number;
  innovation_openness: number;
  trust_in_institutions: number;
  social_influence: number;
  routine_preference: number;
  convenience_focus: number;
  quality_orientation: number;
};

const personaTraits: PersonaTraitKey[] = [
  'risk_tolerance',
  'brand_loyalty',
  'price_sensitivity',
  'innovation_openness',
  'trust_in_institutions',
  'social_influence',
  'routine_preference',
  'convenience_focus',
  'quality_orientation',
];

const incomeBands = [
  'Below KES 50,000',
  'KES 50,000 - 100,000',
  'KES 100,000 - 250,000',
  'KES 250,000+',
];

const traitLabels: Record<PersonaTraitKey, string> = {
  risk_tolerance: 'Risk tolerance',
  brand_loyalty: 'Brand loyalty',
  price_sensitivity: 'Price sensitivity',
  innovation_openness: 'Innovation openness',
  trust_in_institutions: 'Trust in institutions',
  social_influence: 'Social influence',
  routine_preference: 'Routine preference',
  convenience_focus: 'Convenience focus',
  quality_orientation: 'Quality orientation',
};

const emptyForm: PersonaForm = {
  name: '',
  age: 30,
  gender: 'M',
  location: '',
  income_band: 'KES 50,000 - 100,000',
  education_level: 'BA',
  risk_tolerance: 0.5,
  brand_loyalty: 0.5,
  price_sensitivity: 0.5,
  innovation_openness: 0.5,
  trust_in_institutions: 0.5,
  social_influence: 0.5,
  routine_preference: 0.5,
  convenience_focus: 0.5,
  quality_orientation: 0.5,
};

export default function PersonaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<PersonaForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const loadPersona = async () => {
      try {
        const response = await api.get<Persona>(`/personas/${params.id}`);
        const persona = response.data;
        setForm({
          name: persona.demographics.name,
          age: persona.demographics.age,
          gender: persona.demographics.gender,
          location: persona.demographics.location,
          income_band: persona.demographics.income_band,
          education_level: persona.demographics.education_level,
          risk_tolerance: persona.psychographics.risk_tolerance,
          brand_loyalty: persona.psychographics.brand_loyalty,
          price_sensitivity: persona.psychographics.price_sensitivity,
          innovation_openness: persona.psychographics.innovation_openness,
          trust_in_institutions: persona.psychographics.trust_in_institutions,
          social_influence: persona.psychographics.social_influence,
          routine_preference: persona.psychographics.routine_preference,
          convenience_focus: persona.psychographics.convenience_focus,
          quality_orientation: persona.psychographics.quality_orientation,
        });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load persona');
      } finally {
        setLoading(false);
      }
    };

    loadPersona();
  }, [params.id, router]);

  const handleChange = (field: keyof PersonaForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.put(`/personas/${params.id}`, {
        demographics: {
          name: form.name,
          age: Number(form.age),
          gender: form.gender,
          location: form.location,
          income_band: form.income_band,
          education_level: form.education_level,
        },
        psychographics: {
          risk_tolerance: form.risk_tolerance,
          brand_loyalty: form.brand_loyalty,
          price_sensitivity: form.price_sensitivity,
          innovation_openness: form.innovation_openness,
          trust_in_institutions: form.trust_in_institutions,
          social_influence: form.social_influence,
          routine_preference: form.routine_preference,
          convenience_focus: form.convenience_focus,
          quality_orientation: form.quality_orientation,
        },
      });
      setSuccess('Persona updated successfully.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update persona');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Edit Persona</h1>
          <p className="page-subtitle">Refine demographics and psychographics for this respondent profile.</p>
        </div>
        <Link href="/personas" className="button-secondary">
          Back to Personas
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 p-4 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-bold">Demographics</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age (18-100) *</label>
              <input
                type="number"
                className="form-input"
                min="18"
                max="100"
                value={form.age}
                onChange={(e) => handleChange('age', Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                className="form-input"
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value as PersonaForm['gender'])}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input
                type="text"
                className="form-input"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Income *</label>
              <select
                className="form-input"
                value={form.income_band}
                onChange={(e) => handleChange('income_band', e.target.value)}
              >
                {incomeBands.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Education *</label>
              <select
                className="form-input"
                value={form.education_level}
                onChange={(e) => handleChange('education_level', e.target.value)}
              >
                <option value="HS">High School</option>
                <option value="BA">Bachelor&apos;s</option>
                <option value="MA">Master&apos;s</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-bold">Psychographics</h2>
          <p className="mb-4 text-sm text-[var(--ink-soft)]">
            Tune a richer psychographic profile to shape simulation responses more realistically.
          </p>
          <div className="space-y-4">
            {personaTraits.map((trait) => (
              <div key={trait} className="form-group">
                <label className="form-label">
                  {traitLabels[trait]}: {(form[trait] * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full"
                  value={form[trait]}
                  onChange={(e) => handleChange(trait, parseFloat(e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" disabled={saving} className="button justify-center">
            {saving ? 'Saving...' : 'Save Persona'}
          </button>
          <Link href={`/simulations/create?personaId=${params.id}`} className="button-secondary justify-center">
            Use in Simulation
          </Link>
        </div>
      </form>
    </div>
  );
}
