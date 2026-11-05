<script setup>
import { ref, watch, computed } from 'vue'
import Modal from '~/components/Modal.vue'
import { Building2, Store, Briefcase, Sprout, Car, Layers, Calendar } from 'lucide-vue-next'
import { MapPin, DollarSign, Plus, Check } from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  project: {
    type: Object,
    default: () => null,
  },
  mode: {
    type: String,
    default: 'create', // 'create' | 'edit'
  },
})

const emit = defineEmits(['close', 'save'])

const { effectiveSettings } = useSettings()

const projectTypes = [
  { value: 'Construction', label: 'Construction & Renovation', icon: Building2, hint: 'House, plaza, remodeling, grey structure' },
  { value: 'Retail Business', label: 'Retail & Store Setup', icon: Store, hint: 'Pharmacy, mart, grocery, boutique' },
  { value: 'Business Venture', label: 'Business Venture & Startup', icon: Briefcase, hint: 'Agency, manufacturing, distribution' },
  { value: 'Agriculture', label: 'Agriculture & Farming', icon: Sprout, hint: 'Crops, livestock, dairy farm, orchard' },
  { value: 'Vehicle & Fleet', label: 'Vehicle / Machinery Asset', icon: Car, hint: 'Trucks, excavators, commercial fleet' },
  { value: 'Other Ledger', label: 'Other / Custom Ledger', icon: Layers, hint: 'General investment, events, multi-purpose' },
]

const form = ref({
  name: '',
  type: 'Construction',
  targetBudget: '',
  hasTargetBudget: false,
  location: '',
  startDate: new Date().toISOString().split('T')[0],
  status: 'Active',
  description: '',
})

const errors = ref({})

// Populate form when modal opens
watch(
  () => props.show,
  (val) => {
    if (val) {
      errors.value = {}
      if (props.project && props.mode === 'edit') {
        form.value = {
          name: props.project.name || '',
          type: props.project.type || 'Construction',
          targetBudget: props.project.targetBudget ? String(props.project.targetBudget) : '',
          hasTargetBudget: Boolean(props.project.targetBudget && props.project.targetBudget > 0),
          location: props.project.location || '',
          startDate: props.project.startDate || new Date().toISOString().split('T')[0],
          status: props.project.status || 'Active',
          description: props.project.description || '',
        }
      } else {
        // Reset defaults for create
        form.value = {
          name: '',
          type: 'Construction',
          targetBudget: '',
          hasTargetBudget: false,
          location: '',
          startDate: new Date().toISOString().split('T')[0],
          status: 'Active',
          description: '',
        }
      }
    }
  },
  { immediate: true }
)

const modalTitle = computed(() => {
  return props.mode === 'edit' ? 'Edit Project / Ledger' : 'Create New Project / Ledger'
})

const handleSubmit = () => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Project name is required'
    return
  }

  const payload = {
    id: props.project?.id || Date.now(),
    name: form.value.name.trim(),
    type: form.value.type,
    targetBudget: form.value.hasTargetBudget && Number(form.value.targetBudget) > 0 ? Number(form.value.targetBudget) : null,
    location: form.value.location.trim(),
    startDate: form.value.startDate,
    status: form.value.status,
    description: form.value.description.trim(),
  }

  emit('save', payload)
}
</script>

<template>
  <Modal :show="show" :title="modalTitle" maxWidth="lg" @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Project / Ledger Name -->
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Project Name / Title <span class="text-rose-500">*</span>
        </label>
        <div class="relative">
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="e.g. House Construction (Plot 45) or New Pharmacy Store"
            class="w-full pl-3.5 pr-4 py-2.5 text-sm bg-slate-50 hover:bg-white focus:bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
            :class="errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-600'"
          />
        </div>
        <p v-if="errors.name" class="text-xs text-rose-500 mt-1 font-medium">{{ errors.name }}</p>
      </div>

      <!-- Project Type / Category -->
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Industry / Ledger Type <span class="text-rose-500">*</span>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            v-for="t in projectTypes"
            :key="t.value"
            type="button"
            @click="form.type = t.value"
            :class="[
              'p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer',
              form.type === t.value
                ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
            ]"
          >
            <component
              :is="t.icon"
              :size="18"
              :class="form.type === t.value ? 'text-indigo-600' : 'text-slate-400'"
              class="shrink-0 mt-0.5"
            />
            <div class="min-w-0">
              <span class="block text-xs font-bold truncate">{{ t.label }}</span>
              <span class="block text-[10px] text-slate-400 truncate">{{ t.hint }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Target Budget (Optional) -->
      <div class="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <DollarSign :size="14" class="text-indigo-600" />
            <span>Target Budget (Optional)</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              v-model="form.hasTargetBudget"
              class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Set target amount</span>
          </label>
        </div>

        <div v-if="form.hasTargetBudget" class="pt-1">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
              {{ effectiveSettings.currencySymbol }}
            </span>
            <input
              v-model="form.targetBudget"
              type="number"
              min="0"
              step="1000"
              placeholder="e.g. 5000000"
              class="w-full pl-12 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
          <p class="text-[11px] text-slate-500 mt-1">
            Specify estimated target budget. Progress will be tracked as expenses are logged.
          </p>
        </div>

        <div v-else class="text-[11px] text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200/60">
          💡 <strong>Open / Untracked Budget:</strong> If you do not have a fixed budget limit, leave this blank. All recorded expenditures will be aggregated without a budget cap.
        </div>
      </div>

      <!-- Location & Start Date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Site Location -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Site Location / City (Optional)
          </label>
          <div class="relative">
            <MapPin :size="15" class="absolute left-3 top-3 text-slate-400" />
            <input
              v-model="form.location"
              type="text"
              placeholder="e.g. Plot 45, Bahria Town"
              class="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
        </div>

        <!-- Start Date -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Start Date <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <Calendar :size="15" class="absolute left-3 top-3 text-slate-400" />
            <input
              v-model="form.startDate"
              type="date"
              required
              class="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
        </div>
      </div>

      <!-- Status (for edit mode) -->
      <div v-if="mode === 'edit'">
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Project Status
        </label>
        <select
          v-model="form.status"
          class="w-full px-3.5 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
        >
          <option value="Active">Active (In Progress)</option>
          <option value="Completed">Completed / Archived</option>
        </select>
      </div>

      <!-- Description / Notes -->
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Description & Notes (Optional)
        </label>
        <div class="relative">
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Add relevant specifics, plot dimensions, contractor details, or initial plans..."
            class="w-full p-3 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-none"
          ></textarea>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 w-full">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          class="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs hover:shadow-md rounded-xl transition flex items-center gap-1.5 cursor-pointer"
        >
          <Check v-if="mode === 'edit'" :size="14" />
          <Plus v-else :size="14" />
          <span>{{ mode === 'edit' ? 'Update Project' : 'Create Project Ledger' }}</span>
        </button>
      </div>
    </template>
  </Modal>
</template>

