import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      table
        .integer('project_id')
        .unsigned()
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')
        .nullable()

      table.string('theme_id', 50).defaultTo('indigo')
      table.string('logo_mode', 30).defaultTo('default')
      table.string('brand_name', 100).defaultTo('ExpensePro')
      table.string('brand_subtitle', 150).defaultTo('Smart Ledger & Financials')
      table.text('logo_url', 'long').nullable()
      table.string('currency', 20).defaultTo('PKR')
      table.string('currency_symbol', 20).defaultTo('Rs.')
      table.string('symbol_position', 20).defaultTo('prefix')
      table.string('number_system', 30).defaultTo('lakh_crore')
      table.integer('decimal_places').defaultTo(0)
      table.string('date_format', 50).defaultTo('DD MMM YYYY')
      table.string('receipt_slip_header', 255).defaultTo('ExpensePro Official Proof Slip')

      table.index(['user_id', 'project_id'])

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}