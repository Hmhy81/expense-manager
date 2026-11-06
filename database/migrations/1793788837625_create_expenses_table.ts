import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expenses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('project_id').unsigned().references('id').inTable('projects').onDelete('CASCADE').notNullable()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.string('title', 255).notNullable()
      table.string('vendor', 255).nullable()
      table.string('category', 100).notNullable()
      table.decimal('amount', 15, 2).notNullable()
      table.string('date', 50).notNullable()
      table.string('payment_method', 100).defaultTo('Cash')
      table.string('status', 50).defaultTo('Paid')
      table.text('notes').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
