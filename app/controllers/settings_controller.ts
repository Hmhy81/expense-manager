import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'

export default class SettingsController {
  /**
   * Render the Settings page with live database settings
   */
  async index({ auth, inertia, request }: HttpContext) {
    const user = auth.user!
    const projects = await user
      .related('projects')
      .query()
      .orderBy('created_at', 'desc')

    let activeProjectId = request.input('projectId') ? Number(request.input('projectId')) : null
    if (!activeProjectId && projects.length > 0) {
      activeProjectId = projects[0].id
    }

    const { globalSettings, projectSettingsMap } = await Setting.getUserSettings(user.id)

    return inertia.render('Settings/Index', {
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type || 'Construction',
        status: p.status || 'Active',
      })),
      activeProjectId,
      globalSettings,
      projectSettingsMap,
    })
  }

  /**
   * Save global or project-specific settings to MySQL
   */
  async update({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { scope, payload, selectedProjectIds, preserveOverrides, activeProjectId } = request.all()

    const fieldsToExtract = (obj: any) => {
      const result: Record<string, any> = {}
      if (obj.themeId !== undefined) result.themeId = obj.themeId
      if (obj.logoMode !== undefined) result.logoMode = obj.logoMode
      if (obj.brandName !== undefined) result.brandName = obj.brandName
      if (obj.brandSubtitle !== undefined) result.brandSubtitle = obj.brandSubtitle
      if (obj.logoUrl !== undefined) result.logoUrl = obj.logoUrl
      if (obj.currency !== undefined) result.currency = obj.currency
      if (obj.currencySymbol !== undefined) result.currencySymbol = obj.currencySymbol
      if (obj.symbolPosition !== undefined) result.symbolPosition = obj.symbolPosition
      if (obj.numberSystem !== undefined) result.numberSystem = obj.numberSystem
      if (obj.decimalPlaces !== undefined) result.decimalPlaces = Number(obj.decimalPlaces)
      if (obj.dateFormat !== undefined) result.dateFormat = obj.dateFormat
      if (obj.receiptSlipHeader !== undefined) result.receiptSlipHeader = obj.receiptSlipHeader
      return result
    }

    const mapped = fieldsToExtract(payload || {})

    if (scope === 'all') {
      // Upsert global user settings row
      let globalRow = await Setting.query().where('userId', user.id).whereNull('projectId').first()
      if (!globalRow) {
        globalRow = new Setting()
        globalRow.userId = user.id
        globalRow.projectId = null
      }
      globalRow.merge(mapped)
      await globalRow.save()

      // If user chose not to preserve overrides, wipe out project-specific overrides
      if (!preserveOverrides) {
        await Setting.query().where('userId', user.id).whereNotNull('projectId').delete()
      }
    } else if (scope === 'active') {
      const pid = Number(activeProjectId)
      if (pid) {
        let row = await Setting.query().where('userId', user.id).where('projectId', pid).first()
        if (!row) {
          row = new Setting()
          row.userId = user.id
          row.projectId = pid
        }
        row.merge(mapped)
        await row.save()
      }
    } else if (scope === 'selected' && Array.isArray(selectedProjectIds)) {
      for (const rawId of selectedProjectIds) {
        const pid = Number(rawId)
        if (pid) {
          let row = await Setting.query().where('userId', user.id).where('projectId', pid).first()
          if (!row) {
            row = new Setting()
            row.userId = user.id
            row.projectId = pid
          }
          row.merge(mapped)
          await row.save()
        }
      }
    }

    return response.redirect().back()
  }

  /**
   * Reset settings to original defaults or global defaults
   */
  async reset({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const { scope, projectId } = request.all()

    if (scope === 'active' && projectId) {
      await Setting.query().where('userId', user.id).where('projectId', Number(projectId)).delete()
    } else if (scope === 'all') {
      await Setting.query().where('userId', user.id).delete()
    }

    return response.redirect().back()
  }
}

