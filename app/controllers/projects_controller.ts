import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs'
import Project from '#models/project'
import ExpenseDocument from '#models/expense_document'
import Setting from '#models/setting'
import ProjectService from '#services/project_service'

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

export default class ProjectsController {
  /**
   * Display a list of all projects belonging to the user (or all projects for superadmin/admin)
   */
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

    return inertia.render('Projects/Index', {
      projects: projectsData,
      activeProjectId,
      activeProject,
      usersList,
      filterUserId,
      isSuperAdmin: user.role === 'superadmin',
      isAdmin: user.role === 'admin',
      globalSettings,
      projectSettingsMap,
    })
  }

  /**
   * Create and store a new project in the MySQL database
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const isStaff = user.role === 'superadmin' || user.role === 'admin'
    const data = request.only([
      'name',
      'type',
      'location',
      'targetBudget',
      'startDate',
      'status',
      'description',
      'userId',
    ])

    const targetUserId = (isStaff && data.userId) ? Number(data.userId) : user.id

    await Project.create({
      userId: targetUserId,
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
    const isStaff = user.role === 'superadmin' || user.role === 'admin'

    const projectQuery = Project.query().where('id', params.id)
    if (!isStaff) {
      projectQuery.where('userId', user.id)
    }
    const project = await projectQuery.firstOrFail()

    const data = request.only([
      'name',
      'type',
      'location',
      'targetBudget',
      'startDate',
      'status',
      'description',
      'userId',
    ])

    project.merge({
      name: data.name?.trim() || project.name,
      type: data.type || project.type,
      location: data.location?.trim() ?? project.location,
      targetBudget: data.targetBudget !== undefined ? (data.targetBudget ? String(Number(data.targetBudget)) : null) : project.targetBudget,
      startDate: data.startDate ?? project.startDate,
      status: data.status || project.status,
      description: data.description?.trim() ?? project.description,
      userId: (isStaff && data.userId) ? Number(data.userId) : project.userId,
    })

    await project.save()

    return response.redirect().toPath('/projects')
  }

  /**
   * Delete a project and cascade delete all its expenses
   */
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const isStaff = user.role === 'superadmin' || user.role === 'admin'

    const projectQuery = Project.query().where('id', params.id)
    if (!isStaff) {
      projectQuery.where('userId', user.id)
    }
    const project = await projectQuery.firstOrFail()

    // 1. Delete physical files from disk for all documents in this project
    const docs = await ExpenseDocument.query().where('projectId', project.id)
    for (const doc of docs) {
      deletePhysicalFile(doc.filePath)
    }

    // 2. Delete project (CASCADE removes expenses and documents from DB)
    await project.delete()

    return response.redirect().toPath('/projects')
  }
}
