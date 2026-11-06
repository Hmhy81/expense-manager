import { ExpenseSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Project from '#models/project'
import ExpenseDocument from '#models/expense_document'

export default class Expense extends ExpenseSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @hasMany(() => ExpenseDocument)
  declare documents: HasMany<typeof ExpenseDocument>
}
