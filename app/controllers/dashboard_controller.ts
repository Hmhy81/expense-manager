import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import ProjectService from '#services/project_service'

export default class DashboardController {
  async index({ auth, request, inertia }: HttpContext) {
    const user = auth.user!
    const projectsData = await ProjectService.getUserProjectsWithStats(user.id)

    let activeProjectId = request.input('projectId') ? Number(request.input('projectId')) : null
    if (!activeProjectId && projectsData.length > 0) {
      activeProjectId = projectsData[0].id
    }

    const { globalSettings, projectSettingsMap } = await Setting.getUserSettings(user.id)
    const activeProject = projectsData.find((p) => p.id === activeProjectId) || projectsData[0] || null

    let activeStats = {
      totalSpent: 0,
      grandTotal: 0,
      pendingTotal: 0,
      totalCount: 0,
      receiptsCount: 0,
      targetBudget: null as number | null,
      budgetPercent: null as number | null,
    }
    let categoryDistribution: any[] = []
    let recentExpenses: any[] = []

    if (activeProject) {
      activeStats = await ProjectService.getActiveProjectStats(activeProject.id)
      categoryDistribution = await ProjectService.getCategoryDistribution(activeProject.id)
      recentExpenses = await ProjectService.getRecentExpenses(activeProject.id, 5)
    }

    return inertia.render('Dashboard', {
      projects: projectsData,
      activeProjectId,
      activeProject,
      activeStats,
      categoryDistribution,
      activeExpenses: recentExpenses,
      globalSettings,
      projectSettingsMap,
    })
  }
}

