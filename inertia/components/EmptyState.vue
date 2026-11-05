<script setup>
import { Link } from '@inertiajs/vue3'
import { FolderKanban, Plus } from 'lucide-vue-next'

const props = defineProps({
  icon: {
    type: [Object, Function],
    default: () => FolderKanban,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  actionText: {
    type: String,
    default: '',
  },
  actionHref: {
    type: String,
    default: '',
  },
  dashed: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['action'])
</script>

<template>
  <div
    :class="[
      'bg-white rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3.5',
      dashed ? 'border-2 border-dashed border-slate-200/90' : 'border border-slate-200/80 shadow-2xs',
    ]"
  >
    <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
      <component :is="icon" :size="24" />
    </div>

    <div class="space-y-1">
      <h3 class="text-sm sm:text-base font-bold text-slate-900">{{ title }}</h3>
      <p v-if="description" class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
        {{ description }}
      </p>
    </div>

    <!-- Action CTA -->
    <div v-if="actionText" class="pt-1">
      <Link
        v-if="actionHref"
        :href="actionHref"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        <Plus :size="14" />
        <span>{{ actionText }}</span>
      </Link>

      <button
        v-else
        type="button"
        @click="$emit('action')"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
      >
        <Plus :size="14" />
        <span>{{ actionText }}</span>
      </button>
    </div>
  </div>
</template>

