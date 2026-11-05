import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // 1. Superadmin User
    const superAdminExists = await User.findBy('email', 'superadmin@expensepro.com')
    if (!superAdminExists) {
      await User.create({
        fullName: 'Super Administrator',
        email: 'superadmin@expensepro.com',
        password: 'SuperAdmin@123',
        role: 'superadmin',
        status: true,
      })
    } else {
      superAdminExists.role = 'superadmin'
      superAdminExists.status = true
      await superAdminExists.save()
    }

    // 2. Admin User
    const adminExists = await User.findBy('email', 'admin@expensepro.com')
    if (!adminExists) {
      await User.create({
        fullName: 'System Administrator',
        email: 'admin@expensepro.com',
        password: 'Admin@123',
        role: 'admin',
        status: true,
      })
    } else {
      adminExists.role = 'admin'
      adminExists.status = true
      await adminExists.save()
    }
  }
}
