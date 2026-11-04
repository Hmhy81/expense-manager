import { ProjectSchema } from '#database/schema'
import { belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Expense from '#models/expense'
import Setting from '#models/setting'

export default class Project extends ProjectSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Expense)
  declare expenses: HasMany<typeof Expense>

  @hasOne(() => Setting)
  declare setting: HasOne<typeof Setting>
}

