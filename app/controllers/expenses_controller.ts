import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import Expense from '#models/expense'
import Project from '#models/project'
import Setting from '#models/setting'
import ProjectService from '#services/project_service'

function resolveDateBounds(range: string, customStart?: string, customEnd?: string) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (range === 'today') {
    const t = toYMD(now)
    return { start: t, end: t }
  }
  if (range === 'this_week') {
    const current = new Date(now)
    const day = current.getDay()
    const diffToMon = day === 0 ? -6 : 1 - day
    const mon = new Date(current.setDate(current.getDate() + diffToMon))
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return { start: toYMD(mon), end: toYMD(sun) }
  }
  if (range === 'this_month') {
    const y = now.getFullYear()
    const m = now.getMonth()
    return { start: toYMD(new Date(y, m, 1)), end: toYMD(new Date(y, m + 1, 0)) }
  }
  if (range === 'last_month') {
    const y = now.getFullYear()
    const m = now.getMonth() - 1
    return { start: toYMD(new Date(y, m, 1)), end: toYMD(new Date(y, m + 1, 0)) }
  }
  if (range === 'this_year') {
    const y = now.getFullYear()
    return { start: `${y}-01-01`, end: `${y}-12-31` }
  }
  if (range === 'custom') {
    return { start: customStart || '', end: customEnd || '' }
  }
  return { start: '', end: '' }
}

function applyDbFilters(
  query: any,
  filters: {
    projectId: number
    search?: string
    category?: string
    receipt?: string
    startDate?: string
    endDate?: string
  }
) {
  query.where('project_id', filters.projectId)

  if (filters.search) {
    query.where((q: any) => {
      q.whereILike('title', `%${filters.search}%`)
        .orWhereILike('vendor', `%${filters.search}%`)
        .orWhereILike('payment_method', `%${filters.search}%`)
    })
  }

  if (filters.category && filters.category !== 'All') {
    query.where('category', filters.category)
  }

  if (filters.receipt === 'with_receipt') {
    query.where((q: any) => {
      q.whereNotNull('receipt_url')
        .andWhere('receipt_url', '!=', '')
        .orWhereNotNull('receipt_name')
        .andWhere('receipt_name', '!=', '')
    })
  } else if (filters.receipt === 'without_receipt') {
    query
      .where((q: any) => {
        q.whereNull('receipt_url').orWhere('receipt_url', '=', '')
      })
      .where((q: any) => {
        q.whereNull('receipt_name').orWhere('receipt_name', '=', '')
      })
  }

  if (filters.startDate) {
    query.where('date', '>=', filters.startDate)
  }
  if (filters.endDate) {
    query.where('date', '<=', filters.endDate)
  }
}

export default class ExpensesController {
  /**
   * Display expenses for the active project with optimized server-side pagination & filtering
   */
  async index({ auth, request, response, inertia }: HttpContext) {
    const user = auth.user!
    const isStaff = user.role === 'superadmin' || user.role === 'admin'
    const filterUserId = request.input('filterUserId') ? Number(request.input('filterUserId')) : null

    const projectsData = await ProjectService.getUserProjectsWithStats(user, filterUserId)
    const usersList = isStaff ? await ProjectService.getUsersListForFilter() : []

    let activeProjectId = request.input('projectId') ? Number(request.input('projectId')) : null
    if (!activeProjectId && projectsData.length > 0) {
      activeProjectId = projectsData[0].id
    }

    const { globalSettings, projectSettingsMap } = await Setting.getUserSettings(user.id)
    const activeProject = projectsData.find((p) => p.id === activeProjectId) || projectsData[0] || null

    // Query & Filter Parameters
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const limit = Math.max(1, Math.min(100, Number(request.input('limit', 10)) || 10))
    const search = request.input('search', '')?.trim() || ''
    const category = request.input('category', 'All')?.trim() || 'All'
    const receipt = request.input('receipt', 'all')?.trim() || 'all'
    const dateRange = request.input('dateRange', 'all')?.trim() || 'all'
    const customStart = request.input('startDate', '')?.trim() || ''
    const customEnd = request.input('endDate', '')?.trim() || ''

    const bounds = resolveDateBounds(dateRange, customStart, customEnd)

    const filterCriteria = {
      projectId: activeProject?.id || 0,
      search,
      category,
      receipt,
      startDate: bounds.start,
      endDate: bounds.end,
    }

    // Check if user requested JSON export for full dataset (Export CSV / Export PDF)
    if (request.input('export') === 'json' && activeProject) {
      const exportQuery = db.from('expenses')
      applyDbFilters(exportQuery, filterCriteria)
      const rows = await exportQuery.orderBy('date', 'desc').orderBy('id', 'desc')
      return response.json(
        rows.map((e) => ({
          id: e.id,
          title: e.title,
          vendor: e.vendor || '',
          category: e.category,
          amount: Number(e.amount),
          date: e.date,
          paymentMethod: e.payment_method || 'Cash',
          status: e.status || 'Paid',
          notes: e.notes || '',
          hasReceipt: Boolean(e.receipt_url || e.receipt_name),
        }))
      )
    }

    // 1. Single SQL Aggregation Query for Filtered KPI Metrics
    let filterStats = {
      filteredOutflow: 0,
      totalPaid: 0,
      totalPending: 0,
      totalCount: 0,
    }

    if (activeProject) {
      const statsQuery = db.from('expenses')
      applyDbFilters(statsQuery, filterCriteria)
      const statsRow = await statsQuery
        .select(
          db.raw('COALESCE(SUM(amount), 0) as total_amount'),
          db.raw('COALESCE(SUM(CASE WHEN status = "Paid" THEN amount ELSE 0 END), 0) as paid_amount'),
          db.raw('COALESCE(SUM(CASE WHEN status = "Pending" THEN amount ELSE 0 END), 0) as pending_amount'),
          db.raw('COUNT(*) as total_count')
        )
        .first()

      filterStats = {
        filteredOutflow: Number(statsRow?.total_amount || 0),
        totalPaid: Number(statsRow?.paid_amount || 0),
        totalPending: Number(statsRow?.pending_amount || 0),
        totalCount: Number(statsRow?.total_count || 0),
      }
    }

    // 2. Paginated expenses query
    let paginatedExpenses = {
      data: [] as any[],
      meta: {
        total: 0,
        perPage: limit,
        currentPage: page,
        lastPage: 1,
      },
    }

    if (activeProject) {
      const expenseQuery = Expense.query()
      expenseQuery.where('projectId', activeProject.id)

      if (search) {
        expenseQuery.where((q) => {
          q.whereILike('title', `%${search}%`)
            .orWhereILike('vendor', `%${search}%`)
            .orWhereILike('paymentMethod', `%${search}%`)
        })
      }
      if (category && category !== 'All') {
        expenseQuery.where('category', category)
      }
      if (receipt === 'with_receipt') {
        expenseQuery.where((q) => {
          q.whereNotNull('receiptUrl')
            .andWhere('receiptUrl', '!=', '')
            .orWhereNotNull('receiptName')
            .andWhere('receiptName', '!=', '')
        })
      } else if (receipt === 'without_receipt') {
        expenseQuery
          .where((q) => {
            q.whereNull('receiptUrl').orWhere('receiptUrl', '=', '')
          })
          .where((q) => {
            q.whereNull('receiptName').orWhere('receiptName', '=', '')
          })
      }
      if (bounds.start) expenseQuery.where('date', '>=', bounds.start)
      if (bounds.end) expenseQuery.where('date', '<=', bounds.end)

      const result = await expenseQuery
        .orderBy('date', 'desc')
        .orderBy('id', 'desc')
        .paginate(page, limit)

      paginatedExpenses = {
        data: result.all().map((e) => ({
          id: e.id,
          projectId: e.projectId,
          title: e.title,
          vendor: e.vendor || '',
          category: e.category,
          amount: Number(e.amount),
          date: e.date,
          paymentMethod: e.paymentMethod || 'Cash',
          status: e.status || 'Paid',
          receiptUrl: e.receiptUrl || '',
          receiptName: e.receiptName || '',
          notes: e.notes || '',
          hasReceipt: Boolean(e.receiptUrl || e.receiptName),
        })),
        meta: {
          total: result.total,
          perPage: result.perPage,
          currentPage: result.currentPage,
          lastPage: result.lastPage,
        },
      }
    }

    return inertia.render('Expenses/Index', {
      projects: projectsData,
      activeProjectId,
      activeProject,
      usersList,
      filterUserId,
      isSuperAdmin: user.role === 'superadmin',
      isAdmin: user.role === 'admin',
      expenses: paginatedExpenses,
      filterStats,
      filters: {
        page,
        limit,
        search,
        category,
        receipt,
        dateRange,
        startDate: customStart,
        endDate: customEnd,
      },
      globalSettings,
      projectSettingsMap,
    })
  }

  /**
   * Record a new expense in MySQL
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = request.only([
      'projectId',
      'title',
      'vendor',
      'category',
      'amount',
      'date',
      'paymentMethod',
      'status',
      'notes',
      'receiptUrl',
      'receiptName',
    ])

    let receiptUrl = data.receiptUrl || null
    let receiptName = data.receiptName || null

    // Check for uploaded file
    const receiptFile = request.file('receipt', {
      size: '5mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    })

    if (receiptFile && receiptFile.isValid) {
      const fileName = `${randomUUID()}.${receiptFile.extname}`
      await receiptFile.move(app.makePath('public/uploads/receipts'), {
        name: fileName,
      })
      receiptUrl = `/uploads/receipts/${fileName}`
      receiptName = receiptFile.clientName
    }

    const isStaff = user.role === 'superadmin' || user.role === 'admin'
    const projectQuery = Project.query().where('id', Number(data.projectId))
    if (!isStaff) {
      projectQuery.where('userId', user.id)
    }
    const project = await projectQuery.firstOrFail()
    const ownerUserId = isStaff ? project.userId : user.id

    const newExpense = await Expense.create({
      userId: ownerUserId,
      projectId: Number(data.projectId),
      title: data.title?.trim(),
      vendor: data.vendor?.trim() || null,
      category: data.category || 'Raw Materials',
      amount: String(Number(data.amount || 0)),
      date: data.date || new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod || 'Cash',
      status: data.status || 'Paid',
      receiptUrl,
      receiptName,
      notes: data.notes?.trim() || null,
    })

    return response.redirect().toPath(`/expenses?projectId=${newExpense.projectId}`)
  }

  /**
   * Update an existing expense in MySQL
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const isStaff = user.role === 'superadmin' || user.role === 'admin'

    const expenseQuery = Expense.query().where('id', params.id)
    if (!isStaff) {
      expenseQuery.where('userId', user.id)
    }
    const expense = await expenseQuery.firstOrFail()

    const data = request.only([
      'title',
      'vendor',
      'category',
      'amount',
      'date',
      'paymentMethod',
      'status',
      'notes',
      'receiptUrl',
      'receiptName',
    ])

    let receiptUrl = data.receiptUrl ?? expense.receiptUrl
    let receiptName = data.receiptName ?? expense.receiptName

    const receiptFile = request.file('receipt', {
      size: '5mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    })

    if (receiptFile && receiptFile.isValid) {
      const fileName = `${randomUUID()}.${receiptFile.extname}`
      await receiptFile.move(app.makePath('public/uploads/receipts'), {
        name: fileName,
      })
      receiptUrl = `/uploads/receipts/${fileName}`
      receiptName = receiptFile.clientName
    }

    expense.merge({
      title: data.title?.trim() || expense.title,
      vendor: data.vendor?.trim() ?? expense.vendor,
      category: data.category || expense.category,
      amount: data.amount ? String(Number(data.amount)) : expense.amount,
      date: data.date || expense.date,
      paymentMethod: data.paymentMethod || expense.paymentMethod,
      status: data.status || expense.status,
      receiptUrl,
      receiptName,
      notes: data.notes?.trim() ?? expense.notes,
    })

    await expense.save()

    return response.redirect().toPath(`/expenses?projectId=${expense.projectId}`)
  }

  /**
   * Delete an expense from MySQL
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const isStaff = user.role === 'superadmin' || user.role === 'admin'

    const expenseQuery = Expense.query().where('id', params.id)
    if (!isStaff) {
      expenseQuery.where('userId', user.id)
    }
    const expense = await expenseQuery.firstOrFail()

    const projectId = expense.projectId
    await expense.delete()

    return response.redirect().toPath(`/expenses?projectId=${projectId}`)
  }
}
