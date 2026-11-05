/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'

// 1. Landing / Home page & Global Logout
router.on('/').renderInertia('Home', {}).as('home')
router.get('logout', [controllers.Session, 'destroy']).as('session.destroy.get')

// 2. Guest Authentication routes (/signup, /login)
router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create']).as('new_account.create')
    router.post('signup', [controllers.NewAccount, 'store']).as('new_account.store')

    router.get('login', [controllers.Session, 'create']).as('session.create')
    router.post('login', [controllers.Session, 'store']).as('session.store')
  })
  .use(middleware.guest())

// 3. Authenticated Application routes (/dashboard, /projects, /expenses, /settings, /logout)
router
  .group(() => {
    // Dashboard Route
    router.get('dashboard', [controllers.Dashboard, 'index']).as('dashboard')

    // Projects CRUD Routes
    router.get('projects', [controllers.Projects, 'index']).as('projects.index')
    router.post('projects', [controllers.Projects, 'store']).as('projects.store')
    router.put('projects/:id', [controllers.Projects, 'update']).as('projects.update')
    router.post('projects/:id', [controllers.Projects, 'update']).as('projects.update.post')
    router.delete('projects/:id', [controllers.Projects, 'destroy']).as('projects.destroy')

    // Expenses CRUD Routes
    router.get('expenses', [controllers.Expenses, 'index']).as('expenses.index')
    router.post('expenses', [controllers.Expenses, 'store']).as('expenses.store')
    router.put('expenses/:id', [controllers.Expenses, 'update']).as('expenses.update')
    router.post('expenses/:id', [controllers.Expenses, 'update']).as('expenses.update.post')
    router.delete('expenses/:id', [controllers.Expenses, 'destroy']).as('expenses.destroy')

    // Settings Routes
    router.get('settings', [controllers.Settings, 'index']).as('settings.index')
    router.post('settings', [controllers.Settings, 'update']).as('settings.update')
    router.post('settings/reset', [controllers.Settings, 'reset']).as('settings.reset')
    router.post('settings/profile', [controllers.Settings, 'updateProfile']).as('settings.profile')
    router.post('settings/password', [controllers.Settings, 'updatePassword']).as('settings.password')

    // Logout Route
    router.post('logout', [controllers.Session, 'destroy']).as('session.destroy')
  })
  .use(middleware.auth())
