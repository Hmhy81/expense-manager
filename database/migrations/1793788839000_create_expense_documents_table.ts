import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expense_documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('expense_id').unsigned().references('id').inTable('expenses').onDelete('CASCADE').notNullable()
      table.integer('project_id').unsigned().references('id').inTable('projects').onDelete('CASCADE').notNullable()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.string('file_name', 255).notNullable()
      table.text('file_path').notNullable()
      table.string('file_type', 100).nullable()
      table.bigInteger('file_size').unsigned().nullable()
      table.string('document_type', 50).defaultTo('receipt')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['expense_id'])
      table.index(['project_id'])
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

