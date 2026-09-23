# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js full-stack application with TypeScript, SQLite + Drizzle, local private file storage, and Docker deployment to the user's own VPS.

## Users

One power-systems researcher using the application privately across desktop and mobile browsers to coordinate research work, outputs, professional growth, and promotion evidence.

## Product Purpose

“电研工作台” is the user's durable personal research operating system. It brings projects, papers, patents, growth records, promotion criteria, files, deadlines, and cross-record evidence into one action-oriented workspace. Success means the user can see what needs attention, update work without friction, and assemble an evidence-backed view of progress without maintaining parallel spreadsheets.

## Positioning

The product links day-to-day research actions with long-horizon promotion evidence: a task can belong to a research output, and that output can automatically satisfy a configurable promotion metric.

## Operating Context

- Chinese academic and research workflows in the power-systems field.
- Common documents include PDF manuscripts, Word files, spreadsheets, slides, images, ZIP archives, and BibTeX libraries.
- The first view prioritizes overdue work, near-term deadlines, and project risk before aggregate output counts.
- The application will run on an independent subdomain behind the user's existing VPS reverse proxy.

## Capabilities and Constraints

- Single administrator only; no self-registration or team permissions.
- Durable CRUD for projects, publication records, literature items, patents, growth records, tasks, milestones, promotion cycles, metrics, tags, attachments, links, and activity history.
- Unified tasks and deadlines across research records.
- BibTeX preview/import into the literature library with DOI and normalized title/year deduplication; imported references never count as publication outputs.
- Authenticated local attachment storage and versioned full backup export; restore is limited to an empty instance.
- Chinese UI, UTC persistence, and Asia/Hong_Kong display time.
- No email or WeChat reminders, live Zotero sync, citation scraping, OCR, AI writing, or institutional SSO in v1.

## Brand Commitments

- Product name: 电研工作台.
- Working-surface UI rather than a marketing page.
- Professional scientific dashboard, light by default with dark mode, using deep blue and power-cyan accents.

## Evidence on Hand

No logo, institutional brand system, production data, or public claims were supplied. Demonstration data must be clearly presented as sample content and must not imply real achievements.

## Product Principles

- Action before analytics: deadlines and risk lead the experience.
- One source of truth: records, files, tasks, and evidence remain linked.
- Research-native language: fields and states match Chinese power-systems work.
- Safe by default: private access, recoverable exports, and explicit destructive actions.
- Progressive detail: dense information stays scannable and details appear when needed.

## Accessibility & Inclusion

Keyboard-operable controls, visible focus, readable Chinese typography, adequate contrast, responsive layouts, and usability at 200% text zoom are required.
