<script setup>
import { ref, watch } from 'vue'
import Modal from '~/components/Modal.vue'
import { UploadCloud, FileText, X, Trash2, Paperclip, Eye } from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'
import { useToast } from '~/composables/useToast'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'add', // 'add' | 'edit'
  },
  expense: {
    type: Object,
    default: () => null,
  },
  categories: {
    type: Array,
    default: () => [
      'Raw Materials',
      'Labour Cost',
      'Designer & Map',
      'Hardware & Fittings',
      'Machinery / Rental',
      'General & Logistics',
    ],
  },
})

const emit = defineEmits(['close', 'save'])

const { effectiveSettings } = useSettings()
const toast = useToast()

const defaultForm = () => ({
  title: '',
  category: props.categories[0] || 'Raw Materials',
  amount: '',
  vendor: '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: 'Cash',
  status: 'Paid',
  receiptUrl: '',
  receiptName: '',
  receiptFile: null,
  notes: '',
})

const form = ref(defaultForm())

watch(
  () => props.expense,
  (newVal) => {
    if (newVal && props.mode === 'edit') {
      form.value = {
        title: newVal.title || '',
        category: newVal.category || props.categories[0] || 'Raw Materials',
        amount: newVal.amount || '',
        vendor: newVal.vendor || '',
        date: newVal.date || new Date().toISOString().split('T')[0],
        paymentMethod: newVal.paymentMethod || 'Cash',
        status: newVal.status || 'Paid',
        receiptUrl: newVal.receiptUrl || '',
        receiptName: newVal.receiptName || '',
        receiptFile: null,
        notes: newVal.notes || '',
      }
    } else {
      form.value = defaultForm()
    }
  },
  { immediate: true }
)

watch(
  () => props.show,
  (isShown) => {
    if (isShown && props.mode === 'add') {
      form.value = defaultForm()
    }
  }
)

const handleFileUpload = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    form.value.receiptName = file.name
    form.value.receiptFile = file
    // Read file as base64 Data URL for instant, permanent picture preview
    const reader = new FileReader()
    reader.onload = (event) => {
      form.value.receiptUrl = event.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeReceipt = () => {
  form.value.receiptName = ''
  form.value.receiptUrl = ''
  form.value.receiptFile = null
}

const handleSubmit = () => {
  if (!form.value.title.trim()) {
    toast.error('Please provide a title for the expense.')
    return
  }
  if (!form.value.amount || Number(form.value.amount) <= 0) {
    toast.error('Please enter a valid amount greater than 0.')
    return
  }

  emit('save', {
    ...form.value,
    amount: Number(form.value.amount),
  })
}
</script>

<template>
  <Modal
    :show="show"
    :title="mode === 'add' ? 'Record New Payment / Expense' : 'Edit Expense Details'"
    maxWidth="lg"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Title -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">
          Expense / Item Title <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          required
          placeholder="e.g. 5000 Awal Bricks from Bhatta"
          class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
        />
      </div>

      <!-- Category & Amount -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Category <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="form.category"
            required
            class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
          >
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Amount ({{ effectiveSettings.currencySymbol }}) <span class="text-rose-500">*</span>
          </label>
          <input
            v-model="form.amount"
            type="number"
            min="1"
            step="any"
            required
            placeholder="e.g. 75000"
            class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition font-semibold"
          />
        </div>
      </div>

      <!-- Vendor & Payment Method -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Vendor
          </label>
          <input
            v-model="form.vendor"
            type="text"
            placeholder="e.g. Haji Riaz Bricks / Mistri Aslam"
            class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Payment Method
          </label>
          <select
            v-model="form.paymentMethod"
            class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
          >
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer / Online</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit Card">Credit Card</option>
          </select>
        </div>
      </div>

      <!-- Date & Status -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Date</label>
          <input
            v-model="form.date"
            type="date"
            required
            class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Status</label>
          <select
            v-model="form.status"
            class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
          >
            <option value="Paid">Fully Paid</option>
            <option value="Pending">Pending / Advance Due</option>
          </select>
        </div>
      </div>

      <!-- Optional Receipt / Document Upload with LIVE PICTURE VIEW -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">
          Attach Receipt, Invoice or Slip Picture <span class="text-xs text-slate-400 font-normal">(100% Optional)</span>
        </label>

        <!-- Live Picture Preview if selected -->
        <div
          v-if="form.receiptUrl || form.receiptName"
          class="space-y-2"
        >
          <div class="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-48 flex items-center justify-center p-2 group">
            <img
              v-if="form.receiptUrl"
              :src="form.receiptUrl"
              alt="Receipt Preview"
              class="max-h-44 object-contain rounded-lg shadow-xs"
            />
            <div
              v-else
              class="p-4 text-center text-xs text-slate-500 flex flex-col items-center gap-1.5"
            >
              <Paperclip :size="24" class="text-indigo-600" />
              <span class="font-semibold text-slate-800">{{ form.receiptName }}</span>
            </div>

            <!-- Hover overlay with Remove button -->
            <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                @click="removeReceipt"
                class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 :size="14" />
                <span>Remove Picture</span>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs text-slate-500 px-1">
            <span class="truncate font-medium text-slate-700 max-w-[260px]">{{ form.receiptName || 'Receipt Picture Attached' }}</span>
            <button
              type="button"
              @click="removeReceipt"
              class="text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>

        <!-- Upload Dropzone -->
        <label
          v-else
          class="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition text-center group"
        >
          <UploadCloud :size="24" class="text-slate-400 group-hover:text-indigo-600 mb-1.5 transition-colors" />
          <span class="text-xs font-semibold text-slate-700">Click to upload bill / receipt picture</span>
          <span class="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP, PDF (or leave blank if no slip)</span>
          <input
            type="file"
            accept="image/*,.pdf"
            class="hidden"
            @change="handleFileUpload"
          />
        </label>
      </div>

      <!-- Notes / Specifics -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">
          Notes / Specifications <span class="text-xs text-slate-400 font-normal">(Optional)</span>
        </label>
        <textarea
          v-model="form.notes"
          rows="2"
          placeholder="e.g. Fauji cement 100 bags @ 1380 PKR, delivery included"
          class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
        ></textarea>
      </div>

      <!-- Submit & Cancel Buttons -->
      <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
        >
          {{ mode === 'add' ? 'Save Payment Entry' : 'Update Entry' }}
        </button>
      </div>
    </form>
  </Modal>
</template>
