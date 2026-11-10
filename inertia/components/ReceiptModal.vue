<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import Modal from '~/components/Modal.vue'
import VoucherSlip from '~/components/VoucherSlip.vue'
import {
  Download, Calendar, User, ZoomIn, ZoomOut, RotateCcw, Move, CheckCircle2,
  Printer, ChevronLeft, ChevronRight, FileText, ExternalLink, Image as ImageIcon
} from 'lucide-vue-next'
import { useSettings } from '~/composables/useSettings'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  receipt: {
    type: Object,
    default: () => null,
  },
})

defineEmits(['close'])

const { formatCurrency, currentTheme } = useSettings()

// Zoom and Pan state
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const activeProofIndex = ref(0)

let startMouseX = 0
let startMouseY = 0
let initialTranslateX = 0
let initialTranslateY = 0

// Normalize all proofs / attachments
const attachments = computed(() => {
  if (!props.receipt) return []

  if (Array.isArray(props.receipt.receipts) && props.receipt.receipts.length > 0) {
    return props.receipt.receipts.map((r, i) => {
      const url = r.url || ''
      const isPdf = r.type === 'pdf' || url.toLowerCase().endsWith('.pdf')
      return {
        url,
        name: r.name || `Proof Document ${i + 1}`,
        type: isPdf ? 'pdf' : 'image',
      }
    })
  }

  if (props.receipt.receiptUrl) {
    const isPdf = props.receipt.receiptUrl.toLowerCase().endsWith('.pdf')
    return [
      {
        url: props.receipt.receiptUrl,
        name: props.receipt.receiptName || 'Receipt Slip',
        type: isPdf ? 'pdf' : 'image',
      },
    ]
  }

  return [
    {
      url: '',
      name: 'Official Digital Voucher Slip',
      type: 'svg',
    },
  ]
})

const activeProof = computed(() => {
  return attachments.value[activeProofIndex.value] || attachments.value[0] || null
})

const resetZoom = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  isDragging.value = false
}

// Reset view whenever modal opens or active attachment changes
watch(
  () => props.show,
  (isShown) => {
    if (isShown) {
      activeProofIndex.value = 0
      resetZoom()
    }
  }
)

watch(
  () => props.receipt,
  () => {
    activeProofIndex.value = 0
    resetZoom()
  }
)

// Carousel navigation
const nextProof = () => {
  if (activeProofIndex.value < attachments.value.length - 1) {
    activeProofIndex.value++
    resetZoom()
  }
}

const prevProof = () => {
  if (activeProofIndex.value > 0) {
    activeProofIndex.value--
    resetZoom()
  }
}

const selectProof = (index) => {
  activeProofIndex.value = index
  resetZoom()
}

// Keyboard shortcuts for gallery navigation
const handleKeyDown = (e) => {
  if (!props.show || attachments.value.length <= 1) return
  if (e.key === 'ArrowRight') {
    nextProof()
  } else if (e.key === 'ArrowLeft') {
    prevProof()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const zoomIn = () => {
  scale.value = Math.min(Number((scale.value + 0.35).toFixed(2)), 3.5)
}

const zoomOut = () => {
  const next = Math.max(Number((scale.value - 0.35).toFixed(2)), 1)
  scale.value = next
  if (next === 1) {
    translateX.value = 0
    translateY.value = 0
  }
}

const toggleZoom = () => {
  if (scale.value > 1) {
    resetZoom()
  } else {
    scale.value = 1.8
  }
}

const handleWheel = (e) => {
  const delta = e.deltaY < 0 ? 0.2 : -0.2
  const next = Math.min(Math.max(Number((scale.value + delta).toFixed(2)), 1), 3.5)
  scale.value = next
  if (next === 1) {
    translateX.value = 0
    translateY.value = 0
  }
}

const handleMouseDown = (e) => {
  if (e.button !== 0) return
  isDragging.value = true
  startMouseX = e.clientX
  startMouseY = e.clientY
  initialTranslateX = translateX.value
  initialTranslateY = translateY.value
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  const dx = e.clientX - startMouseX
  const dy = e.clientY - startMouseY
  translateX.value = initialTranslateX + dx
  translateY.value = initialTranslateY + dy
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
}

const handleTouchStart = (e) => {
  if (e.touches.length === 1) {
    isDragging.value = true
    const touch = e.touches[0]
    startMouseX = touch.clientX
    startMouseY = touch.clientY
    initialTranslateX = translateX.value
    initialTranslateY = translateY.value
  }
}

const handleTouchMove = (e) => {
  if (!isDragging.value || e.touches.length !== 1) return
  const touch = e.touches[0]
  const dx = touch.clientX - startMouseX
  const dy = touch.clientY - startMouseY
  translateX.value = initialTranslateX + dx
  translateY.value = initialTranslateY + dy
}

const handleTouchEnd = () => {
  isDragging.value = false
}

// Generate an authentic visual SVG receipt picture if no uploaded file exists
const getReceiptImageUrl = (item) => {
  if (activeProof.value?.url && activeProof.value.type !== 'pdf') {
    return activeProof.value.url
  }

  const vendor = item?.vendor || 'Prime Supplies & Materials'
  const title = item?.title || 'Payment Receipt'
  const amount = Number(item?.amount || 0).toLocaleString()
  const date = item?.date || '03 Nov 2026'
  const method = item?.paymentMethod || 'Cash Payment'
  const category = item?.category || 'Project Expense'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">
    <rect width="600" height="750" rx="16" fill="#F8FAFC"/>
    <rect x="30" y="30" width="540" height="690" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <rect x="30" y="30" width="540" height="12" rx="6" fill="#4F46E5"/>
    <circle cx="300" cy="90" r="28" fill="#EEF2FF"/>
    <path d="M290 85L300 95L310 85" stroke="#4F46E5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="300" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#0F172A" text-anchor="middle">${vendor}</text>
    <text x="300" y="170" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Official Payment Voucher &amp; Invoice Slip</text>
    <text x="300" y="190" font-family="monospace" font-size="11" fill="#94A3B8" text-anchor="middle">TAX / NTN INVOICE #: PK-98402-${Math.floor(Math.random() * 9000 + 1000)}</text>
    <line x1="60" y1="215" x2="540" y2="215" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6 6"/>
    <text x="60" y="250" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B">DESCRIPTION / ITEM</text>
    <text x="60" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="bold" fill="#1E293B">${title}</text>
    <text x="60" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B">CATEGORY</text>
    <text x="60" y="345" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#4F46E5">${category}</text>
    <text x="360" y="320" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B">DATE RECORDED</text>
    <text x="360" y="345" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#1E293B">${date}</text>
    <text x="60" y="390" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B">PAYMENT CHANNEL</text>
    <text x="60" y="415" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#1E293B">${method}</text>
    <text x="360" y="390" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B">PAYMENT STATUS</text>
    <text x="360" y="415" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#059669">PAID &amp; VERIFIED</text>
    <line x1="60" y1="450" x2="540" y2="450" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6 6"/>
    <rect x="60" y="475" width="480" height="75" rx="10" fill="#EEF2FF"/>
    <text x="85" y="520" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#312E81">TOTAL AMOUNT PAID</text>
    <text x="515" y="522" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="${currentTheme.value.primary}" text-anchor="end">${formatCurrency(item?.amount)}</text>
    <g transform="translate(380, 565) rotate(-8)">
      <rect x="0" y="0" width="130" height="45" rx="6" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="5 3"/>
      <text x="65" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#059669" text-anchor="middle">VERIFIED PAID</text>
    </g>
    <rect x="60" y="630" width="4" height="35" fill="#334155"/>
    <rect x="68" y="630" width="8" height="35" fill="#334155"/>
    <rect x="80" y="630" width="4" height="35" fill="#334155"/>
    <rect x="90" y="630" width="6" height="35" fill="#334155"/>
    <rect x="100" y="630" width="3" height="35" fill="#334155"/>
    <rect x="108" y="630" width="10" height="35" fill="#334155"/>
    <rect x="122" y="630" width="5" height="35" fill="#334155"/>
    <rect x="132" y="630" width="8" height="35" fill="#334155"/>
    <rect x="145" y="630" width="4" height="35" fill="#334155"/>
    <rect x="153" y="630" width="7" height="35" fill="#334155"/>
    <rect x="165" y="630" width="4" height="35" fill="#334155"/>
    <text x="60" y="682" font-family="monospace" font-size="10" fill="#94A3B8">EXPENSEPRO CERTIFIED PROOF SLIP</text>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const downloadProof = () => {
  const proof = activeProof.value
  if (proof?.url) {
    const a = document.createElement('a')
    a.href = proof.url
    a.download = proof.name || 'receipt_proof'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } else {
    const url = getReceiptImageUrl(props.receipt)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt_${props.receipt?.title?.replace(/\s+/g, '_') || 'bill'}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

const handlePrintVoucher = () => {
  document.body.classList.add('print-mode-voucher')
  const cleanup = () => {
    document.body.classList.remove('print-mode-voucher')
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)
  window.print()
  setTimeout(cleanup, 2500)
}
</script>

<template>
  <Modal :show="show" title="Receipt & Picture Proof View" maxWidth="lg" @close="$emit('close')">
    <div v-if="receipt" class="space-y-3.5">
      <!-- Receipt Meta Header -->
      <div class="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div class="min-w-0">
          <h4 class="font-bold text-slate-900 text-sm sm:text-base truncate">{{ receipt.title }}</h4>
          <p class="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
            <span v-if="receipt.vendor" class="flex items-center gap-1 font-medium text-slate-700">
              <User :size="12" class="text-slate-400" /> {{ receipt.vendor }}
            </span>
            <span>&bull;</span>
            <span class="flex items-center gap-1">
              <Calendar :size="12" class="text-slate-400" /> {{ receipt.date }}
            </span>
          </p>
        </div>
        <div class="text-left sm:text-right shrink-0">
          <span class="text-[11px] text-slate-500 block">Total Billed</span>
          <span class="text-base sm:text-lg font-extrabold text-indigo-700">
            {{ formatCurrency(receipt.amount) }}
          </span>
        </div>
      </div>

      <!-- Multiple Proofs Gallery Navigation Header (Shown when >1 attachment) -->
      <div
        v-if="attachments.length > 1"
        class="bg-indigo-50/70 border border-indigo-100 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs"
      >
        <button
          type="button"
          @click="prevProof"
          :disabled="activeProofIndex === 0"
          :class="activeProofIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white text-indigo-700 cursor-pointer shadow-2xs'"
          class="p-1 rounded-lg bg-indigo-100/60 transition"
          title="Previous Proof (Arrow Left)"
        >
          <ChevronLeft :size="16" />
        </button>

        <div class="flex items-center gap-2 min-w-0 text-center">
          <span class="px-2 py-0.5 rounded-full font-bold bg-indigo-600 text-white text-[11px]">
            {{ activeProofIndex + 1 }} / {{ attachments.length }}
          </span>
          <span class="font-semibold text-slate-800 truncate text-xs" :title="activeProof?.name">
            {{ activeProof?.name || 'Attached Proof' }}
          </span>
        </div>

        <button
          type="button"
          @click="nextProof"
          :disabled="activeProofIndex === attachments.length - 1"
          :class="activeProofIndex === attachments.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white text-indigo-700 cursor-pointer shadow-2xs'"
          class="p-1 rounded-lg bg-indigo-100/60 transition"
          title="Next Proof (Arrow Right)"
        >
          <ChevronRight :size="16" />
        </button>
      </div>

      <!-- PICTURE & DOCUMENT VIEW CANVAS -->
      <div
        class="relative rounded-2xl border border-slate-200/90 bg-slate-100 overflow-hidden select-none flex items-center justify-center h-[380px] sm:h-[430px] group transition-colors"
        :class="[
          activeProof?.type === 'pdf'
            ? 'bg-slate-50'
            : scale > 1
              ? (isDragging ? 'cursor-grabbing' : 'cursor-grab bg-slate-200/60')
              : 'cursor-zoom-in hover:bg-slate-200/40',
        ]"
        @wheel.prevent="activeProof?.type !== 'pdf' && handleWheel($event)"
        @mousedown="activeProof?.type !== 'pdf' && handleMouseDown($event)"
        @mousemove="activeProof?.type !== 'pdf' && handleMouseMove($event)"
        @mouseup="activeProof?.type !== 'pdf' && handleMouseUp()"
        @mouseleave="activeProof?.type !== 'pdf' && handleMouseLeave()"
        @touchstart.passive="activeProof?.type !== 'pdf' && handleTouchStart($event)"
        @touchmove="activeProof?.type !== 'pdf' && handleTouchMove($event)"
        @touchend="activeProof?.type !== 'pdf' && handleTouchEnd()"
        @dblclick="activeProof?.type !== 'pdf' && toggleZoom()"
      >
        <!-- Floating Interactive Zoom, Reset & Action Pills -->
        <div
          class="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-xs border border-slate-200/90 text-xs select-none"
          @mousedown.stop
          @touchstart.stop
          @dblclick.stop
        >
          <!-- Image Zoom Controls (hidden for PDF) -->
          <template v-if="activeProof?.type !== 'pdf'">
            <!-- Zoom Out Button -->
            <button
              type="button"
              @click.stop="zoomOut"
              :disabled="scale <= 1"
              :class="scale <= 1 ? 'opacity-35 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700 cursor-pointer'"
              class="p-1 rounded-lg transition"
              title="Zoom Out"
            >
              <ZoomOut :size="14" />
            </button>

            <!-- Zoom Percentage Indicator -->
            <span class="px-1 text-[11px] font-semibold text-slate-600 min-w-[38px] text-center">
              {{ Math.round(scale * 100) }}%
            </span>

            <!-- Zoom In Button -->
            <button
              type="button"
              @click.stop="zoomIn"
              :disabled="scale >= 3.5"
              :class="scale >= 3.5 ? 'opacity-35 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700 cursor-pointer'"
              class="p-1 rounded-lg transition"
              title="Zoom In"
            >
              <ZoomIn :size="14" />
            </button>

            <span class="w-px h-3.5 bg-slate-200 mx-0.5"></span>

            <!-- Reset Position & Zoom Button -->
            <button
              type="button"
              @click.stop="resetZoom"
              :disabled="scale === 1 && translateX === 0 && translateY === 0"
              :class="(scale === 1 && translateX === 0 && translateY === 0) ? 'opacity-35 cursor-not-allowed' : 'hover:bg-slate-100 text-indigo-600 cursor-pointer'"
              class="flex items-center gap-1 px-1.5 py-1 rounded-lg font-medium transition text-[11px]"
              title="Reset position and zoom"
            >
              <RotateCcw :size="12" />
              <span>Reset</span>
            </button>

            <span class="w-px h-3.5 bg-slate-200 mx-0.5"></span>
          </template>

          <!-- Download Picture / PDF Button -->
          <button
            type="button"
            @click.stop="downloadProof"
            class="flex items-center gap-1 px-1.5 py-1 rounded-lg font-semibold text-emerald-600 hover:bg-emerald-50 transition cursor-pointer text-[11px]"
            title="Download this document"
          >
            <Download :size="12" />
            <span>Save</span>
          </button>

          <span class="w-px h-3.5 bg-slate-200 mx-0.5"></span>

          <!-- Print Voucher Button -->
          <button
            type="button"
            @click.stop="handlePrintVoucher"
            class="flex items-center gap-1 px-1.5 py-1 rounded-lg font-semibold text-indigo-600 hover:bg-indigo-50 transition cursor-pointer text-[11px]"
            title="Print voucher or save as PDF"
          >
            <Printer :size="12" />
            <span>Print</span>
          </button>
        </div>

        <!-- Sleek Micro Hints (Image Mode) -->
        <template v-if="activeProof?.type !== 'pdf'">
          <div
            v-if="scale > 1"
            class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-sm"
          >
            <Move :size="12" class="text-indigo-300" />
            <span>Click &amp; drag to pan &bull; Double-click to reset</span>
          </div>
          <div
            v-else
            class="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-xs text-slate-500 text-[10px] font-medium px-2.5 py-0.5 rounded-full pointer-events-none hidden group-hover:flex items-center gap-1 shadow-2xs border border-slate-200/60"
          >
            <span>Double-click or scroll wheel to zoom</span>
          </div>
        </template>

        <!-- A: PDF Document View -->
        <div v-if="activeProof?.type === 'pdf'" class="w-full h-full flex flex-col items-center justify-center p-6 text-center">
          <div class="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-3 shadow-xs">
            <FileText :size="32" />
          </div>
          <h5 class="text-sm font-bold text-slate-900 max-w-sm truncate">{{ activeProof.name }}</h5>
          <p class="text-xs text-slate-500 mt-1 mb-4">Official PDF Document / Invoice Slip</p>
          <div class="flex items-center gap-2">
            <a
              :href="activeProof.url"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <ExternalLink :size="14" />
              <span>Open PDF in New Window</span>
            </a>
            <button
              type="button"
              @click="downloadProof"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition shadow-2xs"
            >
              <Download :size="14" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <!-- B: Image Document View (Pannable / Zoomable) -->
        <div v-else class="w-full h-full flex items-center justify-center p-3 pointer-events-none">
          <img
            :src="getReceiptImageUrl(receipt)"
            :alt="activeProof?.name || receipt.title"
            draggable="false"
            class="max-h-[350px] max-w-full rounded-xl shadow-md object-contain will-change-transform select-none"
            :style="{
              transform: `translate3d(${translateX}px, ${translateY}px, 0px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
            }"
          />
        </div>
      </div>

      <!-- Multiple Proofs Thumbnail Strip (Shown when >1 attachment) -->
      <div v-if="attachments.length > 1" class="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
        <button
          v-for="(att, idx) in attachments"
          :key="idx"
          type="button"
          @click="selectProof(idx)"
          :class="[
            'relative w-14 h-14 rounded-xl shrink-0 overflow-hidden border-2 transition cursor-pointer p-0.5 bg-slate-50',
            activeProofIndex === idx
              ? 'border-indigo-600 ring-2 ring-indigo-500/30'
              : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100',
          ]"
          :title="att.name"
        >
          <img
            v-if="att.url && att.type !== 'pdf'"
            :src="att.url"
            :alt="att.name"
            class="w-full h-full object-cover rounded-lg"
          />
          <div v-else-if="att.type === 'pdf'" class="w-full h-full flex flex-col items-center justify-center bg-rose-50 rounded-lg">
            <FileText :size="18" class="text-rose-600" />
            <span class="text-[8px] font-bold text-rose-700 mt-0.5">PDF</span>
          </div>
          <div v-else class="w-full h-full flex items-center justify-center bg-indigo-50 rounded-lg">
            <ImageIcon :size="16" class="text-indigo-600" />
          </div>
        </button>
      </div>

      <!-- Notes / Specifics -->
      <div v-if="receipt.notes" class="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
        <span class="font-semibold text-amber-900 block mb-0.5">Specifications &amp; Details:</span>
        <p>{{ receipt.notes }}</p>
      </div>

      <!-- PRINTABLE VOUCHER COMPONENT (Shared DRY slip) -->
      <VoucherSlip v-if="receipt" :voucher="receipt" />
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="text-xs text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 :size="14" class="text-emerald-500" />
          <span>{{ attachments.length > 1 ? `${attachments.length} Verified Attachments` : 'Verified Ledger Proof' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handlePrintVoucher"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
            title="Print Voucher or save as PDF"
          >
            <Printer :size="14" class="text-indigo-600" />
            <span>Print Voucher</span>
          </button>

          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>
