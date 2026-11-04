import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'

export default class ProjectsController {
  /**
   * Display a list of all projects belonging to the logged-in user
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
        createdAt: proj.createdAt.toISO(),
      }
    })

    const activeProject = projectsData.find((p) => p.id === activeProjectId) || projectsData[0] || null

    return inertia.render('Projects/Index', {
      projects: projectsData,
      activeProjectId,
      activeProject,
      globalSettings,
      projectSettingsMap,
    })
  }

  /**
   * Create and store a new project in the MySQL database
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const data = request.only([
      'name',
      'type',
      'location',
      'targetBudget',
      'startDate',
      'status',
      'description',
    ])

    await user.related('projects').create({
      name: data.name?.trim(),
      type: data.type || 'Construction',
      location: data.location?.trim() || null,
      targetBudget: data.targetBudget ? String(Number(data.targetBudget)) : null,
      startDate: data.startDate || null,
      status: data.status || 'Active',
      description: data.description?.trim() || null,
    })

    return response.redirect().toPath('/projects')
  }

  /**
   * Update an existing project in MySQL
   */
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const project = await user
      .related('projects')
      .query()
      .where('id', params.id)
      .firstOrFail()

    const data = request.only([
      'name',
      'type',
      'location',
      'targetBudget',
      'startDate',
      'status',
      'description',
    ])

    project.merge({
      name: data.name?.trim() || project.name,
      type: data.type || project.type,
      location: data.location?.trim() ?? project.location,
      targetBudget: data.targetBudget !== undefined ? (data.targetBudget ? String(Number(data.targetBudget)) : null) : project.targetBudget,
      startDate: data.startDate ?? project.startDate,
      status: data.status || project.status,
      description: data.description?.trim() ?? project.description,
    })

    await project.save()

    return response.redirect().toPath('/projects')
  }

  /**
   * Delete a project and cascade delete all its expenses
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const project = await user
      .related('projects')
      .query()
      .where('id', params.id)
      .firstOrFail()

    await project.delete()

    return response.redirect().toPath('/projects')
  }
}
