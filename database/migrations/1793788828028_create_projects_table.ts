import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.string('name', 255).notNullable()
      table.string('type', 100).defaultTo('Construction')
      table.string('location', 255).nullable()
      table.decimal('target_budget', 15, 2).nullable()
      table.string('start_date', 50).nullable()
      table.string('status', 50).defaultTo('Active')
      table.text('description').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
