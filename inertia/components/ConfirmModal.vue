<script setup>
import Modal from '~/components/Modal.vue'
import { AlertTriangle, Trash2, Info } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Confirm Action',
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed with this action? This operation cannot be undone.',
  },
  confirmText: {
    type: String,
    default: 'Delete',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  variant: {
    type: String,
    default: 'danger', // 'danger', 'warning', 'info'
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('close')
}
</script>

<template>
  <Modal :show="show" :title="title" maxWidth="sm" @close="handleCancel">
    <div class="flex items-start gap-4">
      <div
        v-if="variant === 'danger'"
        class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100"
      >
        <Trash2 :size="20" />
      </div>
      <div
        v-else-if="variant === 'warning'"
        class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100"
      >
        <AlertTriangle :size="20" />
      </div>
      <div
        v-else
        class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100"
      >
        <Info :size="20" />
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-sm text-slate-600 leading-relaxed">
          {{ message }}
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        @click="handleCancel"
        :disabled="loading"
        class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
      >
        {{ cancelText }}
      </button>
      <button
        type="button"
        @click="handleConfirm"
        :disabled="loading"
        :class="[
          'px-4.5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60',
          variant === 'danger'
            ? 'bg-rose-600 hover:bg-rose-700'
            : variant === 'warning'
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-indigo-600 hover:bg-indigo-700',
        ]"
      >
        {{ loading ? 'Processing...' : confirmText }}
      </button>
    </template>
  </Modal>
</template>

