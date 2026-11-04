/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  dashboard: typeof routes['dashboard']
  projects: {
    index: typeof routes['projects.index']
    store: typeof routes['projects.store']
    update: typeof routes['projects.update'] & {
      post: typeof routes['projects.update.post']
    }
    destroy: typeof routes['projects.destroy']
  }
  expenses: {
    index: typeof routes['expenses.index']
    store: typeof routes['expenses.store']
    update: typeof routes['expenses.update'] & {
      post: typeof routes['expenses.update.post']
    }
    destroy: typeof routes['expenses.destroy']
  }
  settings: {
    index: typeof routes['settings.index']
    update: typeof routes['settings.update']
    reset: typeof routes['settings.reset']
    profile: typeof routes['settings.profile']
    password: typeof routes['settings.password']
  }
}
