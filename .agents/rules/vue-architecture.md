---
trigger: always_on
description: Coding guidelines for Vue 3, Inertia.js, and component architecture in the Expense Manager.
---

# Vue 3 & Inertia Frontend Guidelines

1. **Strict DRY Principle (Don't Repeat Yourself)**:
   - Never duplicate modals, confirmation dialogs, tables, or metric cards across pages.
   - Place reusable UI elements in `inertia/components/` (e.g., `Modal.vue`, `ConfirmModal.vue`, `ReceiptModal.vue`, `StatCard.vue`).
   - All modals must be modular, configurable via props and events (`isOpen`, `title`, `confirm`, `cancel`).

2. **No TypeScript in Vue Components**:
   - Use standard `<script setup>` without `lang="ts"` in all `.vue` single file components.
   - Server-side files (`start/`, `app/`, `config/`) remain in TypeScript, but all Inertia Vue files use clean, standard Vue 3 composition API with JavaScript.

3. **PascalCase Naming Conventions**:
   - All Vue component and page filenames must use PascalCase (e.g., `Home.vue`, `Dashboard.vue`).
   - Page directories must use PascalCase (e.g., `inertia/pages/Expenses/Index.vue`, `inertia/pages/Auth/Login.vue`).
   - Inertia render calls in `start/routes.ts` and controllers must match the exact PascalCase path (e.g., `.renderInertia('Dashboard')`, `.renderInertia('Expenses/Index')`, `inertia.render('Auth/Login')`).

4. **Compact Import Statements**:
   - Keep named imports (especially icon imports from `lucide-vue-next` and utilities) compact in 1 or at most 2 lines.
   - Never spread each imported symbol across individual lines creating 10–20 line tall import lists. Group them cleanly and compactly.

