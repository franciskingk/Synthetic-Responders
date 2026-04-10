'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import api from '@/lib/api';

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

export default function CreatePersonaPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const [form, setForm] = useState({
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

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/personas', {
        demographics: {
          name: form.name,
          age: parseInt(form.age as any),
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
      router.push('/personas');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="page-title mb-8">Create Persona</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Demographics */}
        <div>
          <h2 className="text-xl font-bold mb-4">Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) => handleChange('age', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select className="form-input" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
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
              <select className="form-input" value={form.income_band} onChange={(e) => handleChange('income_band', e.target.value)}>
                {incomeBands.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Education *</label>
              <select className="form-input" value={form.education_level} onChange={(e) => handleChange('education_level', e.target.value)}>
                <option value="HS">High School</option>
                <option value="BA">Bachelor's</option>
                <option value="MA">Master's</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Psychographics */}
        <div>
          <h2 className="text-xl font-bold mb-2">Psychographics (0 = Low, 1 = High)</h2>
          <p className="mb-4 text-sm text-[var(--ink-soft)]">
            Use a broader psychographic profile so simulation behavior feels closer to a real respondent.
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

        <button type="submit" disabled={loading} className="button w-full justify-center">
          {loading ? 'Creating...' : 'Create Persona'}
        </button>
      </form>
    </div>
  );
}
