import { toast } from 'vue-sonner'

export function useToast() {
  return {
    success: (msg, opts = {}) => toast.success(msg, { duration: 3500, ...opts }),
    error: (msg, opts = {}) => toast.error(msg, { duration: 4500, ...opts }),
    info: (msg, opts = {}) => toast.info(msg, { duration: 3500, ...opts }),
    warning: (msg, opts = {}) => toast.warning(msg, { duration: 4000, ...opts }),
    toast,
  }
}

export { toast }

