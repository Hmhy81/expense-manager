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

// 1. Landing / Home page
router.on('/').renderInertia('home', {}).as('home')

// 2. Guest Authentication routes (/signup, /login)
router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create']).as('new_account.create')
    router.post('signup', [controllers.NewAccount, 'store']).as('new_account.store')

    router.get('login', [controllers.Session, 'create']).as('session.create')
    router.post('login', [controllers.Session, 'store']).as('session.store')
  })
  .use(middleware.guest())

// 3. Authenticated Application routes (/dashboard, /expenses, /logout)
router
  .group(() => {
    // Dashboard Route
    router
      .on('dashboard')
      .renderInertia('dashboard', {
        stats: {
          totalExpense: 'Rs. 45,200',
          thisMonth: 'Rs. 12,500',
          categoriesCount: 5,
          pendingCount: 2,
        },
      })
      .as('dashboard')

    // Expenses Listing Route
    router
      .on('expenses')
      .renderInertia('expenses/index', {
        expenses: [
          {
            id: 1,
            title: 'Office Electricity Bill',
            category: 'Utilities',
            amount: 8400,
            date: '2026-11-01',
            paymentMethod: 'Bank Transfer',
            status: 'Paid',
          },
          {
            id: 2,
            title: 'Team Lunch & Coffee',
            category: 'Food & Dining',
            amount: 3200,
            date: '2026-10-30',
            paymentMethod: 'Cash',
            status: 'Paid',
          },
          {
            id: 3,
            title: 'Figma Annual Subscription',
            category: 'Software & Tools',
            amount: 14500,
            date: '2026-10-28',
            paymentMethod: 'Credit Card',
            status: 'Paid',
          },
          {
            id: 4,
            title: 'High-speed Fiber Internet',
            category: 'Utilities',
            amount: 4500,
            date: '2026-10-25',
            paymentMethod: 'Online Banking',
            status: 'Paid',
          },
          {
            id: 5,
            title: 'Printer Paper & Stationeries',
            category: 'Office Supplies',
            amount: 2100,
            date: '2026-10-22',
            paymentMethod: 'Cash',
            status: 'Paid',
          },
          {
            id: 6,
            title: 'AWS Cloud Infrastructure',
            category: 'Cloud Hosting',
            amount: 12500,
            date: '2026-10-20',
            paymentMethod: 'Credit Card',
            status: 'Pending',
          },
        ],
        categories: [
          'All',
          'Utilities',
          'Food & Dining',
          'Software & Tools',
          'Office Supplies',
          'Cloud Hosting',
        ],
      })
      .as('expenses.index')

    // Logout Route
    router.post('logout', [controllers.Session, 'destroy']).as('session.destroy')
  })
  .use(middleware.auth())
