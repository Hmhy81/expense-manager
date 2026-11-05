import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import ProjectService from '#services/project_service'

export default class DashboardController {
  async index({ auth, request, inertia }: HttpContext) {
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
      usersList,
      filterUserId,
      isSuperAdmin: user.role === 'superadmin',
      isAdmin: user.role === 'admin',
    })
  }
}
