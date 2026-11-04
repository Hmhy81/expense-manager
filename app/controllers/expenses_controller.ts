import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import Setting from '#models/setting'

export default class ExpensesController {
  /**
   * Display expenses for the active project
   */
  async index({ auth, request, inertia }: HttpContext) {
    const user = auth.user!
    const projects = await user
      .related('projects')
      .query()
      .preload('expenses')
      .orderBy('created_at', 'desc')

    let activeProjectId = request.input('projectId') ? Number(request.input('projectId')) : null
    if (!activeProjectId && projects.length > 0) {
      activeProjectId = projects[0].id
    }

    const { globalSettings, projectSettingsMap } = await Setting.getUserSettings(user.id)

    const projectsData = projects.map((proj) => {
      const expenses = proj.expenses || []
      const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      const receiptsCount = expenses.filter((e) => Boolean(e.receiptUrl || e.receiptName)).length
      return {
        id: proj.id,
        name: proj.name,
        type: proj.type || 'Construction',
        location: proj.location || '',
        targetBudget: proj.targetBudget ? Number(proj.targetBudget) : null,
        startDate: proj.startDate || '',
        status: proj.status || 'Active',
        description: proj.description || '',
        totalSpent,
        entriesCount: expenses.length,
        receiptsCount,
      }
    })

    const activeProject = projectsData.find((p) => p.id === activeProjectId) || projectsData[0] || null

    let expenses: any[] = []
    if (activeProject) {
      const found = projects.find((p) => p.id === activeProject.id)
      if (found && found.expenses) {
        expenses = found.expenses.map((e) => ({
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
        }))
      }
    }

    return inertia.render('Expenses/Index', {
      projects: projectsData,
      activeProjectId,
      activeProject,
      activeExpenses: expenses,
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

    const newExpense = await user.related('expenses').create({
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
    const expense = await user
      .related('expenses')
      .query()
      .where('id', params.id)
      .firstOrFail()

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
    const expense = await user
      .related('expenses')
      .query()
      .where('id', params.id)
      .firstOrFail()

    const projectId = expense.projectId
    await expense.delete()

    return response.redirect().toPath(`/expenses?projectId=${projectId}`)
  }
}
