/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [[0,"/"]],
    types: placeholder as Registry['home']['types'],
  },
  'new_account.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [[0,"signup"]],
    types: placeholder as Registry['new_account.create']['types'],
  },
  'new_account.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [[0,"signup"]],
    types: placeholder as Registry['new_account.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [[0,"login"]],
    types: placeholder as Registry['session.store']['types'],
  },
  'dashboard': {
    methods: ["GET","HEAD"],
    pattern: '/dashboard',
    tokens: [[0,"dashboard"]],
    types: placeholder as Registry['dashboard']['types'],
  },
  'projects.index': {
    methods: ["GET","HEAD"],
    pattern: '/projects',
    tokens: [[0,"projects"]],
    types: placeholder as Registry['projects.index']['types'],
  },
  'projects.store': {
    methods: ["POST"],
    pattern: '/projects',
    tokens: [[0,"projects"]],
    types: placeholder as Registry['projects.store']['types'],
  },
  'projects.update': {
    methods: ["PUT"],
    pattern: '/projects/:id',
    tokens: [[0,"projects"],[1,"id"]],
    types: placeholder as Registry['projects.update']['types'],
  },
  'projects.update.post': {
    methods: ["POST"],
    pattern: '/projects/:id',
    tokens: [[0,"projects"],[1,"id"]],
    types: placeholder as Registry['projects.update.post']['types'],
  },
  'projects.destroy': {
    methods: ["DELETE"],
    pattern: '/projects/:id',
    tokens: [[0,"projects"],[1,"id"]],
    types: placeholder as Registry['projects.destroy']['types'],
  },
  'expenses.index': {
    methods: ["GET","HEAD"],
    pattern: '/expenses',
    tokens: [[0,"expenses"]],
    types: placeholder as Registry['expenses.index']['types'],
  },
  'expenses.store': {
    methods: ["POST"],
    pattern: '/expenses',
    tokens: [[0,"expenses"]],
    types: placeholder as Registry['expenses.store']['types'],
  },
  'expenses.update': {
    methods: ["PUT"],
    pattern: '/expenses/:id',
    tokens: [[0,"expenses"],[1,"id"]],
    types: placeholder as Registry['expenses.update']['types'],
  },
  'expenses.update.post': {
    methods: ["POST"],
    pattern: '/expenses/:id',
    tokens: [[0,"expenses"],[1,"id"]],
    types: placeholder as Registry['expenses.update.post']['types'],
  },
  'expenses.destroy': {
    methods: ["DELETE"],
    pattern: '/expenses/:id',
    tokens: [[0,"expenses"],[1,"id"]],
    types: placeholder as Registry['expenses.destroy']['types'],
  },
  'settings.index': {
    methods: ["GET","HEAD"],
    pattern: '/settings',
    tokens: [[0,"settings"]],
    types: placeholder as Registry['settings.index']['types'],
  },
  'settings.update': {
    methods: ["POST"],
    pattern: '/settings',
    tokens: [[0,"settings"]],
    types: placeholder as Registry['settings.update']['types'],
  },
  'settings.reset': {
    methods: ["POST"],
    pattern: '/settings/reset',
    tokens: [[0,"settings"],[0,"reset"]],
    types: placeholder as Registry['settings.reset']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [[0,"logout"]],
    types: placeholder as Registry['session.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
