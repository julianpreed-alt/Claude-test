# 8epochs Career Personality Assessment

A two-phase conversational career personality assessment powered by Claude (Opus).

## Architecture

- **Frontend**: Static HTML/CSS/JS → Cloudflare Pages
- **API**: Cloudflare Workers
- **Database & Auth**: Supabase (PostgreSQL + magic link auth)
- **AI**: Anthropic API (Claude Opus 4.6)

## Project Structure

```
├── frontend/          Static site (deployed to Cloudflare Pages)
│   ├── css/           Stylesheets
│   ├── js/            Client-side JavaScript
│   └── pages/         HTML pages (landing, chat, report, dashboard, admin)
│
├── workers/           Cloudflare Worker API
│   └── src/           Worker source code
│
├── prompts/           System prompts for Phase 1 and Phase 2
│
├── questionnaire/     Personality questionnaire item bank (JSON)
│
├── sql/               Database migration scripts (run in Supabase SQL editor)
│
└── docs/              Product spec, implementation notes
```

## Setup

See `docs/setup.md` for environment setup instructions.

## Build Phases

- **Phase A**: Auth + Database + Access Control
- **Phase B**: Intake + Questionnaire + Basic Chat
- **Phase C**: Phase 1 Completion + Report Extraction
- **Phase D**: Phase 2 Integration
- **Phase E**: Design Polish + PDF Generation + Analytics
- **Phase F**: Transcript Export + Comparison + Retake
