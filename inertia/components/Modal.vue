<script setup>
import { watch, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: 'md', // 'sm', 'md', 'lg', 'xl', '2xl'
  },
  closeable: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['close'])

const close = () => {
  if (props.closeable) {
    emit('close')
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.show) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

watch(
  () => props.show,
  (val) => {
    if (val) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
  }
)

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-hidden"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="show"
            :class="[
              'w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[92vh] flex flex-col',
              maxWidthClasses[maxWidth] || 'max-w-md',
            ]"
          >
            <!-- Header (Fixed at top) -->
            <div
              v-if="title || closeable"
              class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white"
            >
              <h3 class="text-sm sm:text-base font-bold text-slate-900 truncate pr-2">
                {{ title }}
              </h3>
              <button
                v-if="closeable"
                type="button"
                @click="close"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- Body Slot (Scrolls internally if content is long) -->
            <div class="p-5 sm:p-6 flex-1 overflow-y-auto overscroll-contain">
              <slot />
            </div>

            <!-- Footer Slot (Fixed at bottom) -->
            <div
              v-if="$slots.footer"
              class="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
