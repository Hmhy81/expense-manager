<script setup>
import { computed } from 'vue'
import { Sparkles } from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'

const props = defineProps({
  spent: {
    type: Number,
    default: 0,
  },
  budget: {
    type: Number,
    default: null,
  },
  percent: {
    type: Number,
    default: null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  showMeta: {
    type: Boolean,
    default: true,
  },
})

const { formatCurrency } = useSettings()

const calculatedPercent = computed(() => {
  if (props.percent !== null && props.percent !== undefined) {
    return Math.min(100, Math.max(0, props.percent))
  }
  if (!props.budget || props.budget <= 0) return 0
  return Math.min(100, Math.round(((props.spent || 0) / props.budget) * 100))
})

const isOverBudget = computed(() => {
  return props.budget && props.budget > 0 && props.spent > props.budget
})

const barColor = computed(() => {
  if (isOverBudget.value) return 'bg-rose-600'
  if (calculatedPercent.value >= 90) return 'bg-amber-500'
  return 'bg-indigo-600'
})
</script>

<template>
  <div v-if="budget && budget > 0" :class="[compact ? 'space-y-1.5' : 'space-y-2']">
    <div v-if="!compact && showMeta" class="flex items-center justify-between text-xs font-bold">
      <span class="text-slate-600">Budget Progress</span>
      <span :class="isOverBudget ? 'text-rose-600' : 'text-indigo-600'">
        {{ calculatedPercent }}%{{ isOverBudget ? ' (Exceeded)' : '' }}
      </span>
    </div>

    <!-- Progress Track -->
    <div :class="['w-full rounded-full bg-slate-100 overflow-hidden', compact ? 'h-2 bg-slate-200' : 'h-2.5']">
      <div
        :class="['h-full rounded-full transition-all duration-500', barColor]"
        :style="{ width: `${calculatedPercent}%` }"
      ></div>
    </div>

    <div v-if="showMeta" class="flex items-center justify-between text-[11px] text-slate-500">
      <span>Budget: {{ formatCurrency(budget) }}</span>
      <span :class="['font-semibold', isOverBudget ? 'text-rose-600' : 'text-indigo-700']">
        {{ formatCurrency(spent) }} spent
      </span>
    </div>
  </div>

  <div
    v-else
    class="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50/80 px-2.5 py-1 rounded-lg border border-purple-200/50"
  >
    <Sparkles :size="13" class="text-purple-600 shrink-0" />
    <span>Open Budget (Spend as you go)</span>
  </div>
</template>

