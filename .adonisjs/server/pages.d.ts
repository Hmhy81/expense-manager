import '@adonisjs/inertia/types'

import type { VNodeProps, AllowedComponentProps, ComponentInstance } from 'vue'

type ExtractProps<T> = Omit<
  ComponentInstance<T>['$props'],
  keyof VNodeProps | keyof AllowedComponentProps
>

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'Auth/Login': ExtractProps<(typeof import('../../inertia/pages/Auth/Login.vue'))['default']>
    'Auth/Signup': ExtractProps<(typeof import('../../inertia/pages/Auth/Signup.vue'))['default']>
    'Dashboard': ExtractProps<(typeof import('../../inertia/pages/Dashboard.vue'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.vue'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.vue'))['default']>
    'Expenses/Index': ExtractProps<(typeof import('../../inertia/pages/Expenses/Index.vue'))['default']>
    'Home': ExtractProps<(typeof import('../../inertia/pages/Home.vue'))['default']>
    'Projects/Index': ExtractProps<(typeof import('../../inertia/pages/Projects/Index.vue'))['default']>
    'Settings/Index': ExtractProps<(typeof import('../../inertia/pages/Settings/Index.vue'))['default']>
  }
}
