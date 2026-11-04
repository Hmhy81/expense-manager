import { SettingSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Project from '#models/project'

export interface AppSettingsData {
  themeId: string
  logoMode: string
  brandName: string
  brandSubtitle: string
  logoUrl: string
  currency: string
  currencySymbol: string
  symbolPosition: string
  numberSystem: string
  decimalPlaces: number
  dateFormat: string
  receiptSlipHeader: string
}

export const defaultSettingsData: AppSettingsData = {
  themeId: 'indigo',
  logoMode: 'default',
  brandName: 'ExpensePro',
  brandSubtitle: 'Smart Ledger & Financials',
  logoUrl: '',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  symbolPosition: 'prefix',
  numberSystem: 'lakh_crore',
  decimalPlaces: 0,
  dateFormat: 'DD MMM YYYY',
  receiptSlipHeader: 'ExpensePro Official Proof Slip',
}

export default class Setting extends SettingSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  /**
   * Fetch structured global settings and per-project override map for a user
   */
  static async getUserSettings(userId: number): Promise<{
    globalSettings: AppSettingsData
    projectSettingsMap: Record<number, Partial<AppSettingsData>>
  }> {
    const records = await Setting.query().where('userId', userId)
    const globalRow = records.find((s) => s.projectId === null || s.projectId === undefined)

    const globalSettings: AppSettingsData = {
      themeId: globalRow?.themeId || defaultSettingsData.themeId,
      logoMode: globalRow?.logoMode || defaultSettingsData.logoMode,
      brandName: globalRow?.brandName || defaultSettingsData.brandName,
      brandSubtitle: globalRow?.brandSubtitle || defaultSettingsData.brandSubtitle,
      logoUrl: globalRow?.logoUrl || defaultSettingsData.logoUrl,
      currency: globalRow?.currency || defaultSettingsData.currency,
      currencySymbol: globalRow?.currencySymbol || defaultSettingsData.currencySymbol,
      symbolPosition: globalRow?.symbolPosition || defaultSettingsData.symbolPosition,
      numberSystem: globalRow?.numberSystem || defaultSettingsData.numberSystem,
      decimalPlaces: globalRow?.decimalPlaces ?? defaultSettingsData.decimalPlaces,
      dateFormat: globalRow?.dateFormat || defaultSettingsData.dateFormat,
      receiptSlipHeader: globalRow?.receiptSlipHeader || defaultSettingsData.receiptSlipHeader,
    }

    const projectSettingsMap: Record<number, Partial<AppSettingsData>> = {}
    for (const row of records) {
      if (row.projectId) {
        projectSettingsMap[row.projectId] = {
          themeId: row.themeId || undefined,
          logoMode: row.logoMode || undefined,
          brandName: row.brandName || undefined,
          brandSubtitle: row.brandSubtitle || undefined,
          logoUrl: row.logoUrl || undefined,
          currency: row.currency || undefined,
          currencySymbol: row.currencySymbol || undefined,
          symbolPosition: row.symbolPosition || undefined,
          numberSystem: row.numberSystem || undefined,
          decimalPlaces: row.decimalPlaces ?? undefined,
          dateFormat: row.dateFormat || undefined,
          receiptSlipHeader: row.receiptSlipHeader || undefined,
        }
      }
    }

    return {
      globalSettings,
      projectSettingsMap,
    }
  }
}
