<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
    default: 1,
  },
  totalItems: {
    type: Number,
    required: true,
    default: 0,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 25, 50, 100],
  },
  showPageSize: {
    type: Boolean,
    default: true,
  },
  showInfo: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'change'])

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.totalItems / props.pageSize))
})

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalItems)
})

const setPage = (page) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('update:currentPage', page)
  emit('change', { page, pageSize: props.pageSize })
}

const handlePageSizeChange = (event) => {
  const newSize = Number(event.target.value)
  emit('update:pageSize', newSize)
  const newTotalPages = Math.max(1, Math.ceil(props.totalItems / newSize))
  if (props.currentPage > newTotalPages) {
    emit('update:currentPage', newTotalPages)
    emit('change', { page: newTotalPages, pageSize: newSize })
  } else {
    emit('change', { page: props.currentPage, pageSize: newSize })
  }
}

// Generate intelligent page numbers window with ellipsis
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.currentPage
  const pages = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  } else if (current >= total - 3) {
    pages.push(1)
    pages.push('...')
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    pages.push('...')
    pages.push(current - 1)
    pages.push(current)
    pages.push(current + 1)
    pages.push('...')
    pages.push(total)
  }

  return pages
})
</script>

<template>
  <div
    v-if="totalItems > 0"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 text-xs text-slate-600"
  >
    <!-- Left: Entry Information & Page Size Selector -->
    <div class="flex items-center gap-3.5 flex-wrap">
      <span v-if="showInfo" class="text-slate-500 font-medium">
        Showing <strong class="text-slate-900 font-bold">{{ startItem }}</strong> to
        <strong class="text-slate-900 font-bold">{{ endItem }}</strong> of
        <strong class="text-slate-900 font-bold">{{ totalItems }}</strong> entries
      </span>

      <!-- Page Size Selector -->
      <div v-if="showPageSize && pageSizeOptions.length > 1" class="flex items-center gap-1.5 text-slate-500">
        <label for="page-size-select" class="text-[11px] font-medium">Rows per page:</label>
        <select
          id="page-size-select"
          :value="pageSize"
          @change="handlePageSizeChange"
          class="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
        >
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>
    </div>

    <!-- Right: Pagination Navigation Controls -->
    <div v-if="totalPages > 1" class="flex items-center gap-1 select-none">
      <!-- First Page -->
      <button
        type="button"
        @click="setPage(1)"
        :disabled="currentPage === 1"
        :class="[
          'p-1.5 rounded-lg border transition text-slate-500',
          currentPage === 1
            ? 'opacity-30 cursor-not-allowed border-slate-200 bg-slate-100'
            : 'border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs',
        ]"
        title="First Page"
      >
        <ChevronsLeft :size="14" />
      </button>

      <!-- Previous Page -->
      <button
        type="button"
        @click="setPage(currentPage - 1)"
        :disabled="currentPage === 1"
        :class="[
          'p-1.5 rounded-lg border transition text-slate-500',
          currentPage === 1
            ? 'opacity-30 cursor-not-allowed border-slate-200 bg-slate-100'
            : 'border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs',
        ]"
        title="Previous Page"
      >
        <ChevronLeft :size="14" />
      </button>

      <!-- Page Numbers & Ellipsis -->
      <template v-for="(p, idx) in visiblePages" :key="idx">
        <span
          v-if="p === '...'"
          class="px-2 py-1 text-slate-400 font-semibold select-none text-[11px]"
        >
          &hellip;
        </span>
        <button
          v-else
          type="button"
          @click="setPage(p)"
          :class="[
            'min-w-[30px] h-[30px] px-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center',
            p === currentPage
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs',
          ]"
        >
          {{ p }}
        </button>
      </template>

      <!-- Next Page -->
      <button
        type="button"
        @click="setPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        :class="[
          'p-1.5 rounded-lg border transition text-slate-500',
          currentPage === totalPages
            ? 'opacity-30 cursor-not-allowed border-slate-200 bg-slate-100'
            : 'border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs',
        ]"
        title="Next Page"
      >
        <ChevronRight :size="14" />
      </button>

      <!-- Last Page -->
      <button
        type="button"
        @click="setPage(totalPages)"
        :disabled="currentPage === totalPages"
        :class="[
          'p-1.5 rounded-lg border transition text-slate-500',
          currentPage === totalPages
            ? 'opacity-30 cursor-not-allowed border-slate-200 bg-slate-100'
            : 'border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs',
        ]"
        title="Last Page"
      >
        <ChevronsRight :size="14" />
      </button>
    </div>
  </div>
</template>

