import { ExpenseDocumentSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Expense from '#models/expense'
import Project from '#models/project'
import User from '#models/user'

export default class ExpenseDocument extends ExpenseDocumentSchema {
  @belongsTo(() => Expense)
  declare expense: BelongsTo<typeof Expense>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

