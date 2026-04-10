/**
 * Shared TypeScript types and interfaces
 */

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface PersonaDemographics {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  location: string;
  income_band: string;
  education_level: string;
}

export interface PersonaPsychographics {
  risk_tolerance: number;
  brand_loyalty: number;
  price_sensitivity: number;
  innovation_openness: number;
  trust_in_institutions: number;
  social_influence: number;
  routine_preference: number;
  convenience_focus: number;
  quality_orientation: number;
}

export interface Persona {
  id: string;
  user_id: string;
  demographics: PersonaDemographics;
  psychographics: PersonaPsychographics;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  survey_id: string;
  question_text: string;
  type: 'mcq' | 'likert' | 'open';
  options: string[] | null;
  order_index: number;
  created_at: string;
}

export interface Survey {
  id: string;
  user_id: string;
  title: string;
  question_count: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyDetail extends Survey {
  question_count: number;
  questions: Question[];
}

export interface Simulation {
  id: string;
  user_id: string;
  persona_id: string;
  survey_id: string;
  persona_name?: string | null;
  survey_title?: string | null;
  sample_size: number;
  status: 'running' | 'complete' | 'failed';
  total_responses: number;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponseRecord {
  respondent_id: number;
  question_id: string;
  question_text: string;
  type: string;
  options?: string[] | null;
  numeric_answer: number | null;
  text_answer: string | null;
  created_at: string;
}

export interface SimulationDetail extends Simulation {
  persona_name: string;
  survey_title: string;
  responses: ResponseRecord[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
}
