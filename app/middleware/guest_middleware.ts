import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Guest middleware is used to deny access to routes that should
 * be accessed by unauthenticated users.
 *
 * For example, the login page should redirect to dashboard if the user
 * is already logged-in, unless they explicitly request to switch account.
 */
export default class GuestMiddleware {
  /**
   * The URL to redirect to when user is logged-in
   */
  redirectTo = '/dashboard'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { guards?: (keyof Authenticators)[] } = {}
  ) {
    // If user explicitly asks to switch account or re-authenticate
    if (ctx.request.input('switch') || ctx.request.input('logout')) {
      await ctx.auth.use('web').logout()
      ctx.session.clear()
      return next()
    }

    for (let guard of options.guards || [ctx.auth.defaultGuard]) {
      if (await ctx.auth.use(guard).check()) {
        ctx.session.reflash()
        return ctx.response.redirect(this.redirectTo, true)
      }
    }

    return next()
  }
}
