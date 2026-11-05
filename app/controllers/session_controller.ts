import User from '#models/user'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('Auth/Login', {})
  }

  async store({ request, auth, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(email, password)

    await auth.use('web').login(user)
    return response.redirect().toRoute('dashboard')
  }

  async destroy({ auth, session, response }: HttpContext) {
    try {
      if (await auth.use('web').check()) {
        await auth.use('web').logout()
      }
    } catch {
      // Ignore if session already destroyed
    }
    session.clear()
    return response.redirect().toPath('/login')
  }
}
