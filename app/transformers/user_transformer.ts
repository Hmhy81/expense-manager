import type User from '#models/user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'fullName',
        'email',
        'phone',
        'role',
        'status',
        'createdAt',
        'updatedAt',
        'initials',
      ]),
      role: this.resource.role || 'user',
      isSuperAdmin: this.resource.role === 'superadmin',
      isAdmin: this.resource.role === 'admin',
      isStaffOrAdmin: this.resource.role === 'superadmin' || this.resource.role === 'admin',
    }
  }
}
