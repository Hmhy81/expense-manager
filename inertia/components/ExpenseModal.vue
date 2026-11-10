<script setup>
import { ref, watch, computed } from 'vue'
import Modal from '~/components/Modal.vue'
import { UploadCloud, FileText, X, Trash2, Paperclip, Plus, Eye, Image as ImageIcon } from 'lucide-vue-next'
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

const fileInputRef = ref(null)
const isDraggingOver = ref(false)

const defaultForm = () => ({
  title: '',
  category: props.categories[0] || 'Raw Materials',
  amount: '',
  vendor: '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: 'Cash',
  status: 'Full Paid',
  notes: '',
})

const form = ref(defaultForm())
const existingReceipts = ref([])
const newReceipts = ref([])

const totalReceiptsCount = computed(() => existingReceipts.value.length + newReceipts.value.length)

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

watch(
  () => props.expense,
  (newVal) => {
    if (newVal && props.mode === 'edit') {
      let initialStatus = newVal.status || 'Full Paid'
      if (initialStatus === 'Paid') initialStatus = 'Full Paid'

      form.value = {
        title: newVal.title || '',
        category: newVal.category || props.categories[0] || 'Raw Materials',
        amount: newVal.amount || '',
        vendor: newVal.vendor || '',
        date: newVal.date || new Date().toISOString().split('T')[0],
        paymentMethod: newVal.paymentMethod || 'Cash',
        status: initialStatus,
        notes: newVal.notes || '',
      }

      if (Array.isArray(newVal.receipts) && newVal.receipts.length > 0) {
        existingReceipts.value = [...newVal.receipts]
      } else if (newVal.receiptUrl) {
        existingReceipts.value = [
          {
            url: newVal.receiptUrl,
            name: newVal.receiptName || 'Receipt Slip',
            type: newVal.receiptUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
          },
        ]
      } else {
        existingReceipts.value = []
      }
      newReceipts.value = []
    } else {
      form.value = defaultForm()
      existingReceipts.value = []
      newReceipts.value = []
    }
  },
  { immediate: true }
)

watch(
  () => props.show,
  (isShown) => {
    if (isShown && props.mode === 'add') {
      form.value = defaultForm()
      existingReceipts.value = []
      newReceipts.value = []
    }
  }
)

const processSelectedFiles = (fileList) => {
  if (!fileList || fileList.length === 0) return

  const filesArray = Array.from(fileList)
  for (const file of filesArray) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const item = {
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: isPdf ? 'pdf' : 'image',
      previewUrl: '',
    }

    if (!isPdf && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        item.previewUrl = e.target.result
      }
      reader.readAsDataURL(file)
    }

    newReceipts.value.push(item)
  }

  // Clear file input so same file can be selected again if needed
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleFileUpload = (e) => {
  processSelectedFiles(e.target.files)
}

const handleDrop = (e) => {
  isDraggingOver.value = false
  if (e.dataTransfer?.files) {
    processSelectedFiles(e.dataTransfer.files)
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const removeExistingReceipt = (index) => {
  existingReceipts.value.splice(index, 1)
}

const removeNewReceipt = (index) => {
  newReceipts.value.splice(index, 1)
}

const clearAllReceipts = () => {
  existingReceipts.value = []
  newReceipts.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
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
    existingReceipts: existingReceipts.value,
    receiptFiles: newReceipts.value.map((item) => item.file),
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
            class="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="Full Paid">Full Paid</option>
            <option value="Partial Paid">Partial Paid</option>
            <option value="Advance Paid">Advance Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <!-- MULTIPLE RECEIPTS / PROOFS UPLOAD SECTION -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="block text-xs font-semibold text-slate-700">
            Attach Receipts, Invoices or Slips
            <span class="text-xs text-slate-400 font-normal">(Multiple files supported)</span>
          </label>
          <div v-if="totalReceiptsCount > 0" class="flex items-center gap-2">
            <button
              type="button"
              @click="triggerFileInput"
              class="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition cursor-pointer"
            >
              <Plus :size="12" />
              <span>Add More</span>
            </button>
            <button
              type="button"
              @click="clearAllReceipts"
              class="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        <!-- Hidden multi-file input -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          accept="image/*,.pdf"
          class="hidden"
          @change="handleFileUpload"
        />

        <!-- Staged Receipts Preview Gallery -->
        <div v-if="totalReceiptsCount > 0" class="space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            <!-- 1. Existing Receipts (Server-side) -->
            <div
              v-for="(item, idx) in existingReceipts"
              :key="'existing-' + idx"
              class="relative flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl group hover:border-slate-300 transition"
            >
              <!-- Thumbnail -->
              <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-200 flex items-center justify-center">
                <img
                  v-if="item.url && item.type !== 'pdf'"
                  :src="item.url"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
                <FileText v-else :size="18" class="text-rose-600" />
              </div>

              <!-- Name & Badge -->
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-slate-800 truncate" :title="item.name">
                  {{ item.name || 'Receipt Document' }}
                </p>
                <span class="text-[10px] text-emerald-600 font-medium">Saved Proof</span>
              </div>

              <!-- Delete Button -->
              <button
                type="button"
                @click="removeExistingReceipt(idx)"
                class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Remove this receipt"
              >
                <X :size="14" />
              </button>
            </div>

            <!-- 2. Newly Added Receipts (Client-side) -->
            <div
              v-for="(item, idx) in newReceipts"
              :key="'new-' + idx"
              class="relative flex items-center gap-2.5 p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl group hover:border-indigo-200 transition"
            >
              <!-- Thumbnail -->
              <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white border border-indigo-100 flex items-center justify-center">
                <img
                  v-if="item.previewUrl"
                  :src="item.previewUrl"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
                <FileText v-else-if="item.type === 'pdf'" :size="18" class="text-rose-600" />
                <ImageIcon v-else :size="18" class="text-indigo-500" />
              </div>

              <!-- Name & Size -->
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-slate-800 truncate" :title="item.name">
                  {{ item.name }}
                </p>
                <span class="text-[10px] text-indigo-600 font-medium">{{ item.size }} &bull; Ready to upload</span>
              </div>

              <!-- Delete Button -->
              <button
                type="button"
                @click="removeNewReceipt(idx)"
                class="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Remove this file"
              >
                <X :size="14" />
              </button>
            </div>
          </div>

          <!-- Quick Drop / Add More Area -->
          <div
            @click="triggerFileInput"
            @dragover.prevent="isDraggingOver = true"
            @dragleave.prevent="isDraggingOver = false"
            @drop.prevent="handleDrop"
            :class="isDraggingOver ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'"
            class="border border-dashed rounded-xl py-2 px-3 flex items-center justify-center gap-2 cursor-pointer transition text-center"
          >
            <Plus :size="14" class="text-indigo-600" />
            <span class="text-xs font-medium text-slate-600">Click or drag more files to attach</span>
          </div>
        </div>

        <!-- Empty State Dropzone -->
        <div
          v-else
          @click="triggerFileInput"
          @dragover.prevent="isDraggingOver = true"
          @dragleave.prevent="isDraggingOver = false"
          @drop.prevent="handleDrop"
          :class="isDraggingOver ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/30'"
          class="border-2 border-dashed rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer transition text-center group"
        >
          <UploadCloud :size="26" class="text-slate-400 group-hover:text-indigo-600 mb-1.5 transition-colors" />
          <span class="text-xs font-semibold text-slate-700">Click to upload bill, receipt, or slip pictures</span>
          <span class="text-[11px] text-slate-400 mt-0.5">Attach multiple JPG, PNG, WebP, or PDF files (Up to 10MB each)</span>
        </div>
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
