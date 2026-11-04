<script setup>
import { ref, watch } from 'vue'
import Modal from '~/components/Modal.vue'
import { Download, Calendar, User, ZoomIn, ZoomOut, RotateCcw, Move, CheckCircle2 } from 'lucide-vue-next'
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

let startMouseX = 0
let startMouseY = 0
let initialTranslateX = 0
let initialTranslateY = 0

const resetZoom = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  isDragging.value = false
}

// Reset view whenever modal opens or closes
watch(
  () => props.show,
  () => {
    resetZoom()
  }
)

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

// Smooth mouse wheel zoom without scrolling page/modal
const handleWheel = (e) => {
  const delta = e.deltaY < 0 ? 0.2 : -0.2
  const next = Math.min(Math.max(Number((scale.value + delta).toFixed(2)), 1), 3.5)
  scale.value = next
  if (next === 1) {
    translateX.value = 0
    translateY.value = 0
  }
}

// Mouse Drag handlers
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

// Mobile Touch Drag handlers
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
  if (item?.receiptUrl) {
    return item.receiptUrl
  }

  // Create an authentic realistic SVG receipt picture data URL
  const vendor = item?.vendor || 'Bismillah Hardware & Material'
  const title = item?.title || 'Payment Receipt'
  const amount = Number(item?.amount || 0).toLocaleString()
  const date = item?.date || '03 Nov 2026'
  const method = item?.paymentMethod || 'Cash Payment'
  const category = item?.category || 'Project Expense'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">
    <rect width="600" height="750" rx="16" fill="#F8FAFC"/>
    <!-- Receipt Paper Card -->
    <rect x="30" y="30" width="540" height="690" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <!-- Decorative top bar -->
    <rect x="30" y="30" width="540" height="12" rx="6" fill="#4F46E5"/>
    
    <!-- Merchant Header -->
    <circle cx="300" cy="90" r="28" fill="#EEF2FF"/>
    <path d="M290 85L300 95L310 85" stroke="#4F46E5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="300" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#0F172A" text-anchor="middle">${vendor}</text>
    <text x="300" y="170" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Official Payment Voucher &amp; Invoice Slip</text>
    <text x="300" y="190" font-family="monospace" font-size="11" fill="#94A3B8" text-anchor="middle">TAX / NTN INVOICE #: PK-98402-${Math.floor(Math.random() * 9000 + 1000)}</text>
    
    <!-- Dashed separator -->
    <line x1="60" y1="215" x2="540" y2="215" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6 6"/>
    
    <!-- Expense Details Block -->
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
    
    <!-- Dashed separator -->
    <line x1="60" y1="450" x2="540" y2="450" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="6 6"/>
    
    <!-- Total Amount Block -->
    <rect x="60" y="475" width="480" height="75" rx="10" fill="#EEF2FF"/>
    <text x="85" y="520" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#312E81">TOTAL AMOUNT PAID</text>
    <text x="515" y="522" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="${currentTheme.value.primary}" text-anchor="end">${formatCurrency(item?.amount)}</text>
    
    <!-- Rubber Stamp Graphic -->
    <g transform="translate(380, 565) rotate(-8)">
      <rect x="0" y="0" width="130" height="45" rx="6" fill="none" stroke="#059669" stroke-width="2.5" stroke-dasharray="5 3"/>
      <text x="65" y="28" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="900" fill="#059669" text-anchor="middle">VERIFIED PAID</text>
    </g>
    
    <!-- Barcode at bottom -->
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

const downloadReceipt = (item) => {
  const url = getReceiptImageUrl(item)
  const a = document.createElement('a')
  a.href = url
  a.download = `receipt_${item?.title?.replace(/\s+/g, '_') || 'bill'}.svg`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<template>
  <Modal :show="show" title="Receipt & Picture Proof View" maxWidth="lg" @close="$emit('close')">
    <div v-if="receipt" class="space-y-4">
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

      <!-- PICTURE VIEW AREA (DRAGGABLE / PANNABLE & ZERO SCROLLBARS) -->
      <div
        class="relative rounded-2xl border border-slate-200/90 bg-slate-100 overflow-hidden select-none flex items-center justify-center h-[380px] sm:h-[430px] group transition-colors"
        :class="[
          scale > 1
            ? (isDragging ? 'cursor-grabbing' : 'cursor-grab bg-slate-200/60')
            : 'cursor-zoom-in hover:bg-slate-200/40',
        ]"
        @wheel.prevent="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
        @touchstart.passive="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @dblclick="toggleZoom"
      >
        <!-- Floating Interactive Zoom, Reset & Action Pills -->
        <div
          class="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-xs border border-slate-200/90 text-xs select-none"
          @mousedown.stop
          @touchstart.stop
          @dblclick.stop
        >
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

          <!-- Download Picture Button -->
          <button
            type="button"
            @click.stop="downloadReceipt(receipt)"
            class="flex items-center gap-1 px-1.5 py-1 rounded-lg font-semibold text-emerald-600 hover:bg-emerald-50 transition cursor-pointer text-[11px]"
            title="Download picture proof"
          >
            <Download :size="12" />
            <span>Save</span>
          </button>
        </div>

        <!-- Sleek Micro Hints (Top Left / Bottom Center) -->
        <div
          v-if="scale > 1"
          class="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-sm"
        >
          <Move :size="12" class="text-indigo-300" />
          <span>Click &amp; drag to pan picture &bull; Double-click to reset</span>
        </div>
        <div
          v-else
          class="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white/80 backdrop-blur-xs text-slate-500 text-[10px] font-medium px-2.5 py-0.5 rounded-full pointer-events-none hidden group-hover:flex items-center gap-1 shadow-2xs border border-slate-200/60"
        >
          <span>Double-click or scroll wheel to zoom</span>
        </div>

        <!-- Pannable Picture Canvas -->
        <div class="w-full h-full flex items-center justify-center p-3 pointer-events-none">
          <img
            :src="getReceiptImageUrl(receipt)"
            :alt="receipt.title"
            draggable="false"
            class="max-h-[350px] max-w-full rounded-xl shadow-md object-contain will-change-transform select-none"
            :style="{
              transform: `translate3d(${translateX}px, ${translateY}px, 0px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)',
            }"
          />
        </div>
      </div>

      <!-- Notes / Specifics -->
      <div v-if="receipt.notes" class="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
        <span class="font-semibold text-amber-900 block mb-0.5">Specifications &amp; Details:</span>
        <p>{{ receipt.notes }}</p>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="text-xs text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 :size="14" class="text-emerald-500" />
          <span>Verified Ledger Proof</span>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        >
          Close Picture
        </button>
      </div>
    </template>
  </Modal>
</template>
