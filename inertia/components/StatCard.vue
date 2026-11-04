<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  icon: {
    type: [Object, Function],
    default: null,
  },
  color: {
    type: String,
    default: 'indigo', // 'indigo', 'emerald', 'purple', 'amber', 'blue'
  },
  trend: {
    type: String,
    default: '',
  },
})

const colorMap = {
  indigo: {
    badge: 'bg-indigo-50 text-indigo-600',
    text: 'text-indigo-600',
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-600',
    text: 'text-emerald-600',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-600',
    text: 'text-purple-600',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-600',
    text: 'text-amber-600',
  },
  blue: {
    badge: 'bg-blue-50 text-blue-600',
    text: 'text-blue-600',
  },
}

const activeColor = computed(() => colorMap[props.color] || colorMap.indigo)
</script>

<template>
  <div class="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {{ title }}
      </span>
      <div v-if="icon" :class="['w-9 h-9 rounded-xl flex items-center justify-center', activeColor.badge]">
        <component :is="icon" :size="18" />
      </div>
    </div>
    <h3 class="text-2xl font-extrabold text-slate-900 mt-3">
      {{ value }}
    </h3>
    <p v-if="subtitle || trend" class="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
      <span v-if="trend" class="text-emerald-600 font-semibold">{{ trend }}</span>
      <span v-if="subtitle">{{ subtitle }}</span>
    </p>
  </div>
</template>

