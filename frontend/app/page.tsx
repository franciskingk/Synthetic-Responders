'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/auth';

const featureCards = [
  {
    title: 'Persona-Led Simulation',
    copy: 'Model demographics and psychographics together so every response run carries a clear respondent point of view.',
  },
  {
    title: 'Survey QA Before Launch',
    copy: 'Use synthetic answers to spot weak questions, ambiguous options, and missing prompts before spending on live respondents.',
  },
  {
    title: 'Mixed-Method Output',
    copy: 'Combine quantified scores, option selection patterns, and open-ended rationale in one continuous review flow.',
  },
  {
    title: 'Fast Research Loops',
    copy: 'Move from idea, to questionnaire, to directional insight in minutes instead of waiting days for fieldwork.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Define the audience',
    copy: 'Create personas with the attributes that matter for response behavior, from age and location to innovation openness.',
  },
  {
    step: '02',
    title: 'Build the instrument',
    copy: 'Author Likert, multiple-choice, and open-ended questions inside a survey workspace that is ready to simulate.',
  },
  {
    step: '03',
    title: 'Review signals quickly',
    copy: 'Run a sample, inspect question-level patterns, skim respondent snapshots, then tighten the survey before live launch.',
  },
];

const checklistItems = [
  {
    title: 'Guided onboarding and starter workspace',
    copy: 'A normal SaaS product should help new users land on value fast with a setup checklist, example persona, and sample survey.',
  },
  {
    title: 'Workspace settings and account controls',
    copy: 'Add profile settings, password reset, API key management, project naming, and a visible environment/status area.',
  },
  {
    title: 'Team collaboration basics',
    copy: 'Shared workspaces, invites, roles, and activity history make the product feel production-ready even before advanced enterprise features.',
  },
  {
    title: 'Usage visibility',
    copy: 'Show run counts, response volume, export history, and processing states so users understand what happened and what is left to do.',
  },
  {
    title: 'Trust and support surfaces',
    copy: 'A normal SaaS MVP needs a help path, clearer empty states, release notes, reliability messaging, and simple security explanations.',
  },
];

const faqs = [
  {
    question: 'Who is this MVP for right now?',
    answer: 'It is best suited to product researchers, founders, agencies, and UX teams who want directional feedback before paying for live respondents.',
  },
  {
    question: 'What should the home page do in an MVP SaaS?',
    answer: 'It should explain the value in one pass: who it serves, how the workflow works, what proof the product produces, and the next action to take.',
  },
  {
    question: 'Why skip pricing for now?',
    answer: 'Because the MVP still needs product confidence, onboarding clarity, and workflow trust more than monetization complexity.',
  },
];

const energyTags = ['Synthetic respondents', 'Survey QA', 'Question insights', 'Mixed-method output'];

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
  }, []);

  return (
    <div className="relative overflow-hidden">
      <section className="hero-shell">
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="container relative z-10 grid gap-14 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow">MVP Research Platform</p>
            <h1 className="hero-title mt-5">
              Build synthetic respondent studies that feel closer to a real SaaS workflow.
            </h1>
            <p className="hero-copy mt-6">
              Synthetic Responders helps teams create personas, pressure-test surveys, and review structured response
              patterns before spending money on live fieldwork. The goal is faster confidence, not fake certainty.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {energyTags.map((tag) => (
                <span key={tag} className="lively-chip !bg-[rgba(22,32,43,0.06)] !text-[var(--ink-strong)]">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={isAuthenticated ? '/dashboard' : '/register'} className="button">
                {isAuthenticated ? 'Open Workspace' : 'Create Your Workspace'}
              </Link>
              <Link href="/simulations" className="button-secondary">
                Explore Simulation Views
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="metric-card">
                <span className="metric-value">3-stage</span>
                <span className="metric-label">{'Persona -> Survey -> Simulation flow'}</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">Mixed</span>
                <span className="metric-label">Quant + qualitative output in one place</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">MVP</span>
                <span className="metric-label">Focused on workflow proof, not pricing complexity</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="showcase-panel">
              <div className="showcase-glow" />
              <div className="showcase-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow">Workspace Snapshot</p>
                    <h2 className="mt-2 font-heading text-2xl font-semibold text-[var(--ink-strong)]">
                      Synthetic launch review
                    </h2>
                  </div>
                  <span className="rounded-full bg-[rgba(17,135,101,0.12)] px-3 py-1 text-sm font-medium text-[var(--success-ink)]">
                    Ready to test
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="surface-card">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Persona Focus</p>
                    <p className="mt-3 font-heading text-xl font-semibold">Urban wellness buyer</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                      High innovation openness, medium brand loyalty, and strong packaging sensitivity.
                    </p>
                  </div>
                  <div className="surface-card">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Research Signal</p>
                    <p className="mt-3 font-heading text-xl font-semibold">Question insights first</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                      Review average sentiment, option spread, and open-ended themes before reading full transcripts.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.9)] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--ink-soft)]">Home page structure that works for SaaS</p>
                      <p className="mt-2 font-heading text-lg font-semibold text-[var(--ink-strong)]">
                        Value proposition, proof, workflow, trust, CTA
                      </p>
                    </div>
                    <span className="rounded-full bg-[rgba(31,124,189,0.1)] px-3 py-1 text-sm text-[var(--accent-strong)]">
                      MVP guide
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {['Clear hero and CTA', 'Product workflow section', 'Trust and support checklist'].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--ink-soft)]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="container py-10 lg:py-16">
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr] xl:items-start">
          <div className="lively-panel">
            <span className="lively-chip">What Makes It Feel Like SaaS</span>
            <h2 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em]">
              Stronger hierarchy, bolder states, and visible product momentum.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/72">
              The platform needs more than clean cards. It should feel responsive, directional, and alive, with motion
              that highlights product status instead of flattening everything into the same visual weight.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-white/50">Feel</p>
                <p className="mt-2 text-xl font-semibold">Sharper and warmer</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-white/50">Motion</p>
                <p className="mt-2 text-xl font-semibold">Lift, pulse, drift</p>
              </div>
            </div>
          </div>

          <div>
            <div className="section-heading">
              <p className="eyebrow">What Makes It Feel Like SaaS</p>
              <h2 className="section-title">The frontend needs clarity, trust, and a visible path from setup to output.</h2>
              <p className="section-copy">
                The best current SaaS interfaces lean on strong information hierarchy, clear primary actions, visible status,
                and compact proof of value. This redesign follows that pattern with a more intentional shell and a product-led home page.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {featureCards.map((card) => (
                <article key={card.title} className="feature-card">
                  <div className="feature-dot" />
                  <h3 className="mt-6 font-heading text-xl font-semibold text-[var(--ink-strong)]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{card.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="container py-10 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="eyebrow">Workflow</p>
            <h2 className="section-title mt-4">A good MVP home page should explain the product in one glance.</h2>
            <p className="section-copy mt-4">
              For this product, that means showing the sequence clearly: define respondents, build the questionnaire,
              then inspect result quality before committing to live research.
            </p>
          </div>

          <div className="space-y-4">
            {workflowSteps.map((step) => (
              <div key={step.step} className="workflow-card">
                <div className="workflow-step">{step.step}</div>
                <div>
                  <h3 className="font-heading text-xl font-semibold text-[var(--ink-strong)]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="checklist" className="container py-10 lg:py-16">
        <div className="section-heading">
          <p className="eyebrow">MVP To SaaS Checklist</p>
          <h2 className="section-title">What still needs to be added so this behaves like a normal SaaS platform.</h2>
          <p className="section-copy">
            Because this is an MVP, skip pricing for now. The better investment is tightening onboarding, support, team usage,
            and account surfaces so the experience feels dependable before monetization complexity is introduced.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {checklistItems.map((item) => (
            <div key={item.title} className="checklist-card">
              <div className="checklist-badge">Add next</div>
              <h3 className="mt-5 font-heading text-xl font-semibold text-[var(--ink-strong)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-10 lg:py-16">
        <div className="cta-panel">
          <div className="max-w-2xl">
            <p className="eyebrow">Home Page Instruction</p>
            <h2 className="section-title mt-4">A well-designed MVP home page should do four things in under a minute.</h2>
            <div className="mt-6 grid gap-3 text-sm leading-7 text-[var(--ink-soft)]">
              <div className="instruction-row">Say exactly who the product is for.</div>
              <div className="instruction-row">Show how the workflow works with real product nouns.</div>
              <div className="instruction-row">Prove the output quality with visuals, not just promises.</div>
              <div className="instruction-row">Offer one strong CTA for new users and one route for returning users.</div>
            </div>
          </div>
          <div className="rounded-[28px] border border-white/50 bg-[rgba(255,255,255,0.78)] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-soft)]">Primary CTA</p>
            <p className="mt-3 font-heading text-2xl font-semibold text-[var(--ink-strong)]">
              {isAuthenticated ? 'Return to your workspace' : 'Start building your first study'}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href={isAuthenticated ? '/dashboard' : '/register'} className="button justify-center">
                {isAuthenticated ? 'Open Dashboard' : 'Create Account'}
              </Link>
              <Link href="/login" className="button-secondary justify-center">
                Existing user login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="container py-10 lg:py-16">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2 className="section-title">Questions the home page should answer early.</h2>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="faq-card">
              <h3 className="font-heading text-lg font-semibold text-[var(--ink-strong)]">{faq.question}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
