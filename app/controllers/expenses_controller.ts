import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import Expense from '#models/expense'
import ExpenseDocument from '#models/expense_document'
import Project from '#models/project'
import Setting from '#models/setting'
import ProjectService from '#services/project_service'

/**
 * Safely delete a physical file from the public uploads directory
 */
function deletePhysicalFile(filePath?: string | null) {
  if (!filePath) return
  try {
    const cleanPath = filePath.replace(/^\//, '')
    const fullPath = app.makePath('public', cleanPath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch (err) {
    console.error('Failed to remove physical file:', err)
  }
}

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
    query.whereExists((sub: any) => {
      sub.from('expense_documents').whereRaw('expense_documents.expense_id = expenses.id')
    })
  } else if (filters.receipt === 'without_receipt') {
    query.whereNotExists((sub: any) => {
      sub.from('expense_documents').whereRaw('expense_documents.expense_id = expenses.id')
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
      const expenseIds = rows.map((r) => r.id)

      const docRows =
        expenseIds.length > 0
          ? await db.from('expense_documents').whereIn('expense_id', expenseIds).orderBy('id', 'asc')
          : []

      const docsByExpense = new Map<number, any[]>()
      for (const d of docRows) {
        const list = docsByExpense.get(d.expense_id) || []
        list.push({
          id: d.id,
          url: d.file_path,
          name: d.file_name,
          type: d.file_type?.includes('pdf') || d.file_path.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
          size: d.file_size ? Number(d.file_size) : null,
          documentType: d.document_type || 'receipt',
        })
        docsByExpense.set(d.expense_id, list)
      }

      return response.json(
        rows.map((e) => {
          const docs = docsByExpense.get(e.id) || []
          return {
            id: e.id,
            title: e.title,
            vendor: e.vendor || '',
            category: e.category,
            amount: Number(e.amount),
            date: e.date,
            paymentMethod: e.payment_method || 'Cash',
            status: e.status || 'Paid',
            notes: e.notes || '',
            receipts: docs,
            receiptsCount: docs.length,
            hasReceipt: docs.length > 0,
          }
        })
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

    // 2. Paginated expenses query preloading documents
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
        expenseQuery.whereExists((sub) => {
          sub.from('expense_documents').whereRaw('expense_documents.expense_id = expenses.id')
        })
      } else if (receipt === 'without_receipt') {
        expenseQuery.whereNotExists((sub) => {
          sub.from('expense_documents').whereRaw('expense_documents.expense_id = expenses.id')
        })
      }
      if (bounds.start) expenseQuery.where('date', '>=', bounds.start)
      if (bounds.end) expenseQuery.where('date', '<=', bounds.end)

      const result = await expenseQuery
        .preload('documents')
        .orderBy('date', 'desc')
        .orderBy('id', 'desc')
        .paginate(page, limit)

      paginatedExpenses = {
        data: result.all().map((e) => {
          const docs = (e.documents || []).map((d) => ({
            id: d.id,
            url: d.filePath,
            name: d.fileName,
            type: d.fileType?.includes('pdf') || d.filePath.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
            size: d.fileSize ? Number(d.fileSize) : null,
            documentType: d.documentType || 'receipt',
          }))

          return {
            id: e.id,
            projectId: e.projectId,
            title: e.title,
            vendor: e.vendor || '',
            category: e.category,
            amount: Number(e.amount),
            date: e.date,
            paymentMethod: e.paymentMethod || 'Cash',
            status: e.status || 'Paid',
            receipts: docs,
            receiptsCount: docs.length,
            receiptUrl: docs[0]?.url || '',
            receiptName: docs[0]?.name || '',
            notes: e.notes || '',
            hasReceipt: docs.length > 0,
          }
        }),
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
   * Record a new expense with attached documents in MySQL
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

    const isStaff = user.role === 'superadmin' || user.role === 'admin'
    const projectQuery = Project.query().where('id', Number(data.projectId))
    if (!isStaff) {
      projectQuery.where('userId', user.id)
    }
    const project = await projectQuery.firstOrFail()
    const ownerUserId = isStaff ? project.userId : user.id

    // 1. Create Expense Record
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
      notes: data.notes?.trim() || null,
    })

    // 2. Process Multi-File Uploads and Save in expense_documents Table
    const receiptFiles = request.files('receipts', {
      size: '10mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    })
    const bracketFiles = request.files('receipts[]', {
      size: '10mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    })
    const singleReceipt = request.file('receipt', {
      size: '10mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    })

    const allFilesToProcess = [
      ...(Array.isArray(receiptFiles) ? receiptFiles : []),
      ...(Array.isArray(bracketFiles) ? bracketFiles : []),
    ]
    if (singleReceipt && singleReceipt.isValid) {
      allFilesToProcess.push(singleReceipt)
    }

    for (const file of allFilesToProcess) {
      if (file && file.isValid) {
        const ext = (file.extname || 'jpg').toLowerCase()
        const fileName = `${randomUUID()}.${ext}`
        await file.move(app.makePath('public/uploads/receipts'), {
          name: fileName,
        })

        await ExpenseDocument.create({
          expenseId: newExpense.id,
          projectId: newExpense.projectId,
          userId: ownerUserId,
          fileName: file.clientName,
          filePath: `/uploads/receipts/${fileName}`,
          fileType: ext === 'pdf' ? 'application/pdf' : `image/${ext}`,
          fileSize: file.size,
          documentType: 'receipt',
        })
      }
    }

    // Fallback for direct receiptUrl string if provided without file
    if (allFilesToProcess.length === 0 && data.receiptUrl) {
      const isPdf = data.receiptUrl.toLowerCase().endsWith('.pdf')
      await ExpenseDocument.create({
        expenseId: newExpense.id,
        projectId: newExpense.projectId,
        userId: ownerUserId,
        fileName: data.receiptName || 'Receipt Document',
        filePath: data.receiptUrl,
        fileType: isPdf ? 'application/pdf' : 'image/jpeg',
        fileSize: null,
        documentType: 'receipt',
      })
    }

    return response.redirect().toPath(`/expenses?projectId=${newExpense.projectId}`)
  }

  /**
   * Update an existing expense and its attached documents in MySQL
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
    ])

    // Strictly update the existing expense record - NO new expense row is created
    expense.merge({
      title: data.title?.trim() || expense.title,
      vendor: data.vendor?.trim() ?? expense.vendor,
      category: data.category || expense.category,
      amount: data.amount ? String(Number(data.amount)) : expense.amount,
      date: data.date || expense.date,
      paymentMethod: data.paymentMethod || expense.paymentMethod,
      status: data.status || expense.status,
      notes: data.notes?.trim() ?? expense.notes,
    })

    await expense.save()

    // 1. Fetch current existing documents of this expense
    const existingDocs = await ExpenseDocument.query()
      .where('expenseId', expense.id)
      .orderBy('id', 'asc')

    // 2. Parse client-submitted kept existing receipts
    const existingReceiptsRaw = request.input('existingReceipts')
    let keptDocIds: number[] = []
    let keptDocUrls: string[] = []

    if (existingReceiptsRaw !== undefined && existingReceiptsRaw !== null) {
      try {
        const parsed = typeof existingReceiptsRaw === 'string' ? JSON.parse(existingReceiptsRaw) : existingReceiptsRaw
        if (Array.isArray(parsed)) {
          keptDocIds = parsed.map((d: any) => Number(d.id)).filter(Boolean)
          keptDocUrls = parsed.map((d: any) => String(d.url || '').trim()).filter(Boolean)
        }
      } catch {}
    } else {
      // If client didn't send existingReceipts list, preserve existing docs by default
      keptDocIds = existingDocs.map((d) => d.id)
      keptDocUrls = existingDocs.map((d) => d.filePath)
    }

    // 3. Separate kept docs vs unkept (explicitly removed or replaced) docs
    const unkeptDocs = existingDocs.filter(
      (d) => !keptDocIds.includes(d.id) && !keptDocUrls.includes(d.filePath)
    )

    // Delete old physical files from server disk ONLY for unkept/removed docs
    for (const oldDoc of unkeptDocs) {
      deletePhysicalFile(oldDoc.filePath)
    }

    // 4. Collect newly uploaded files
    const receiptFiles = request.files('receipts', {
      size: '10mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    })
    const bracketFiles = request.files('receipts[]', {
      size: '10mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    })
    const singleReceipt = request.file('receipt', {
      size: '10mb',
      extnames: ['jpg', 'png', 'jpeg', 'webp', 'pdf'],
    })

    const allFilesToProcess = [
      ...(Array.isArray(receiptFiles) ? receiptFiles : []),
      ...(Array.isArray(bracketFiles) ? bracketFiles : []),
    ]
    if (singleReceipt && singleReceipt.isValid) {
      allFilesToProcess.push(singleReceipt)
    }
    const validNewFiles = allFilesToProcess.filter((f) => f && f.isValid)

    if (validNewFiles.length > 0) {
      let unkeptIdx = 0

      for (let i = 0; i < validNewFiles.length; i++) {
        const file = validNewFiles[i]
        const ext = (file.extname || 'jpg').toLowerCase()
        const fileName = `${randomUUID()}.${ext}`
        await file.move(app.makePath('public/uploads/receipts'), {
          name: fileName,
        })

        const filePath = `/uploads/receipts/${fileName}`
        const fileType = ext === 'pdf' ? 'application/pdf' : `image/${ext}`
        const fileSize = file.size

        if (unkeptIdx < unkeptDocs.length) {
          // Strictly UPDATE existing unkept record in place: NO new row created in MySQL!
          unkeptDocs[unkeptIdx].merge({
            fileName: file.clientName,
            filePath,
            fileType,
            fileSize,
            documentType: 'receipt',
          })
          await unkeptDocs[unkeptIdx].save()
          unkeptIdx++
        } else {
          // If all unkept rows were recycled or none were unkept, insert new document row
          await ExpenseDocument.create({
            expenseId: expense.id,
            projectId: expense.projectId,
            userId: expense.userId,
            fileName: file.clientName,
            filePath,
            fileType,
            fileSize,
            documentType: 'receipt',
          })
        }
      }

      // If more unkept docs than new files, delete remaining unkept rows from database
      while (unkeptIdx < unkeptDocs.length) {
        await unkeptDocs[unkeptIdx].delete()
        unkeptIdx++
      }
    } else {
      // No new files uploaded: delete all unkept docs from database
      for (const oldDoc of unkeptDocs) {
        await oldDoc.delete()
      }
    }

    return response.redirect().toPath(`/expenses?projectId=${expense.projectId}`)
  }

  /**
   * Delete an expense from MySQL (Strictly restricted to Admin/Superadmin)
   */
  async destroy({ auth, params, response, session }: HttpContext) {
    const user = auth.user!
    const isStaff = user.role === 'superadmin' || user.role === 'admin'

    if (!isStaff) {
      session?.flash('error', 'Only administrators are authorized to delete payment vouchers.')
      return response.status(403).redirect().toPath('/expenses')
    }

    const expense = await Expense.query().where('id', params.id).firstOrFail()

    // 1. Delete all attached physical files from server disk
    const docs = await ExpenseDocument.query().where('expenseId', expense.id)
    for (const doc of docs) {
      deletePhysicalFile(doc.filePath)
    }

    // 2. Delete expense (CASCADE handles DB records)
    const projectId = expense.projectId
    await expense.delete()

    return response.redirect().toPath(`/expenses?projectId=${projectId}`)
  }
}
