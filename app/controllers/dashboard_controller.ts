import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'

export default class DashboardController {
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

    let activeExpenses: any[] = []
    if (activeProject) {
      const found = projects.find((p) => p.id === activeProject.id)
      if (found && found.expenses) {
        activeExpenses = found.expenses.map((e) => ({
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

    return inertia.render('Dashboard', {
      projects: projectsData,
      activeProjectId,
      activeProject,
      activeExpenses,
      globalSettings,
      projectSettingsMap,
    })
  }
}
