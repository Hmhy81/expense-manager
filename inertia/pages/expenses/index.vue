<script setup>
import { ref, computed, watch } from 'vue'
import { Head, Link, router, usePage } from '@inertiajs/vue3'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import AppLayout from '~/components/AppLayout.vue'
import StatCard from '~/components/StatCard.vue'
import ExpenseModal from '~/components/ExpenseModal.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import ReceiptModal from '~/components/ReceiptModal.vue'
import VoucherSlip from '~/components/VoucherSlip.vue'
import Pagination from '~/components/Pagination.vue'
import EmptyState from '~/components/EmptyState.vue'
import { useActiveProject } from '~/composables/useActiveProject'
import { useSettings } from '~/composables/useSettings'
import { useToast } from '~/composables/useToast'
import { Plus, Search, Calendar, CreditCard, Download, FolderKanban, Printer, Paperclip, CheckCircle2, Clock, User, Receipt, FileText, Trash2, Edit2, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  expenses: {
    type: Object,
    default: () => ({ data: [], meta: { total: 0, perPage: 10, currentPage: 1, lastPage: 1 } }),
  },
  filterStats: {
    type: Object,
    default: () => ({ filteredOutflow: 0, totalPaid: 0, totalPending: 0, totalCount: 0 }),
  },
  filters: {
    type: Object,
    default: () => ({
      page: 1,
      limit: 10,
      search: '',
      category: 'All',
      receipt: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: '',
    }),
  },
  usersList: {
    type: Array,
    default: () => [],
  },
  filterUserId: {
    type: [Number, String],
    default: null,
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
})

const {
  activeProject,
  activeCategories,
  addExpense,
  updateExpense,
  deleteExpense,
} = useActiveProject()
const { formatCurrency, effectiveSettings } = useSettings()
const toast = useToast()
const page = usePage()

// Strictly restrict delete permissions to Superadmin and Admin
const canDelete = computed(() => {
  return Boolean(
    props.isSuperAdmin ||
    props.isAdmin ||
    page.props.user?.isSuperAdmin ||
    page.props.user?.isAdmin ||
    page.props.user?.isStaffOrAdmin ||
    page.props.user?.role === 'superadmin' ||
    page.props.user?.role === 'admin'
  )
})

// Categories list with 'All' prepended
const categories = computed(() => ['All', ...activeCategories.value])

// Filtering & Search state initialized from server props
const searchQuery = ref(props.filters?.search || '')
const selectedCategory = ref(props.filters?.category || 'All')
const filterWithReceipt = ref(props.filters?.receipt || 'all') // 'all', 'with_receipt', 'without_receipt'

// Date Range Filtering State
const dateRangeOption = ref(props.filters?.dateRange || 'all')
const customStartDate = ref(props.filters?.startDate || '')
const customEndDate = ref(props.filters?.endDate || '')
const selectedUserId = ref(props.filterUserId || '')

const handleUserFilterChange = () => {
  currentPage.value = 1
  fetchFilteredExpenses(1)
}

// Pagination State
const currentPage = ref(props.expenses?.meta?.currentPage || 1)
const pageSize = ref(props.expenses?.meta?.perPage || 10)
const isExporting = ref(false)
const isExportingPdf = ref(false)

const datePresets = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
]

function getStartAndEndDatesForOption(option) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  if (option === 'today') {
    const todayStr = toYMD(now)
    return { start: todayStr, end: todayStr }
  }

  if (option === 'this_week') {
    const current = new Date(now)
    const day = current.getDay()
    const diffToMon = day === 0 ? -6 : 1 - day
    const monday = new Date(current.setDate(current.getDate() + diffToMon))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return { start: toYMD(monday), end: toYMD(sunday) }
  }

  if (option === 'this_month') {
    const y = now.getFullYear()
    const m = now.getMonth()
    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m + 1, 0)
    return { start: toYMD(firstDay), end: toYMD(lastDay) }
  }

  if (option === 'last_month') {
    const y = now.getFullYear()
    const m = now.getMonth() - 1
    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m + 1, 0)
    return { start: toYMD(firstDay), end: toYMD(lastDay) }
  }

  if (option === 'this_year') {
    const y = now.getFullYear()
    return { start: `${y}-01-01`, end: `${y}-12-31` }
  }

  return { start: '', end: '' }
}

const activeDateBounds = computed(() => {
  if (dateRangeOption.value === 'custom') {
    return { start: customStartDate.value || '', end: customEndDate.value || '' }
  }
  return getStartAndEndDatesForOption(dateRangeOption.value)
})

// Sync when server props change (e.g. project switch or history navigation)
watch(
  () => props.filters,
  (newFilters) => {
    if (newFilters) {
      if (newFilters.search !== undefined) searchQuery.value = newFilters.search
      if (newFilters.category !== undefined) selectedCategory.value = newFilters.category
      if (newFilters.receipt !== undefined) filterWithReceipt.value = newFilters.receipt
      if (newFilters.dateRange !== undefined) dateRangeOption.value = newFilters.dateRange
      if (newFilters.startDate !== undefined) customStartDate.value = newFilters.startDate
      if (newFilters.endDate !== undefined) customEndDate.value = newFilters.endDate
    }
  },
  { deep: true }
)

watch(
  () => props.expenses?.meta,
  (meta) => {
    if (meta) {
      currentPage.value = meta.currentPage
      pageSize.value = meta.perPage
    }
  },
  { deep: true }
)

// Reset category filter if it doesn't exist in the active project
watch(categories, (newCats) => {
  if (selectedCategory.value !== 'All' && !newCats.includes(selectedCategory.value)) {
    selectedCategory.value = 'All'
    fetchFilteredExpenses(1)
  }
})

// Server-side Query Fetcher with debounced search
let searchDebounceTimer = null

const fetchFilteredExpenses = (page = 1) => {
  const queryParams = {
    projectId: activeProject.value?.id,
    page,
    limit: pageSize.value,
  }

  if (selectedUserId.value) {
    queryParams.filterUserId = selectedUserId.value
  }

  if (searchQuery.value?.trim()) {
    queryParams.search = searchQuery.value.trim()
  }
  if (selectedCategory.value && selectedCategory.value !== 'All') {
    queryParams.category = selectedCategory.value
  }
  if (filterWithReceipt.value && filterWithReceipt.value !== 'all') {
    queryParams.receipt = filterWithReceipt.value
  }
  if (dateRangeOption.value && dateRangeOption.value !== 'all') {
    queryParams.dateRange = dateRangeOption.value
    if (dateRangeOption.value === 'custom') {
      if (customStartDate.value) queryParams.startDate = customStartDate.value
      if (customEndDate.value) queryParams.endDate = customEndDate.value
    }
  }

  router.get('/expenses', queryParams, {
    preserveState: true,
    preserveScroll: true,
    only: ['expenses', 'filterStats', 'filters'],
  })
}

// Watch search input with 350ms debounce
watch(searchQuery, () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchFilteredExpenses(1)
  }, 350)
})

const selectCategory = (cat) => {
  if (selectedCategory.value === cat) return
  selectedCategory.value = cat
  currentPage.value = 1
  fetchFilteredExpenses(1)
}

const selectReceiptFilter = (filter) => {
  if (filterWithReceipt.value === filter) return
  filterWithReceipt.value = filter
  currentPage.value = 1
  fetchFilteredExpenses(1)
}

const selectDatePreset = (presetId) => {
  if (dateRangeOption.value === presetId) return
  dateRangeOption.value = presetId
  if (presetId !== 'custom') {
    customStartDate.value = ''
    customEndDate.value = ''
    currentPage.value = 1
    fetchFilteredExpenses(1)
  }
}

const applyCustomDates = () => {
  currentPage.value = 1
  fetchFilteredExpenses(1)
}

const clearCustomDates = () => {
  customStartDate.value = ''
  customEndDate.value = ''
  currentPage.value = 1
  fetchFilteredExpenses(1)
}

const handlePageChange = ({ page, pageSize: newPageSize }) => {
  pageSize.value = newPageSize
  fetchFilteredExpenses(page)
}

// Modals State
const isExpenseModalOpen = ref(false)
const expenseModalMode = ref('add')
const selectedExpense = ref(null)

const isConfirmModalOpen = ref(false)
const expenseToDelete = ref(null)

const isReceiptModalOpen = ref(false)
const selectedReceipt = ref(null)

// Add & Edit actions
const openAddModal = () => {
  expenseModalMode.value = 'add'
  selectedExpense.value = null
  isExpenseModalOpen.value = true
}

const openEditModal = (item) => {
  expenseModalMode.value = 'edit'
  selectedExpense.value = item
  isExpenseModalOpen.value = true
}

const handleSaveExpense = (formData) => {
  if (expenseModalMode.value === 'add') {
    addExpense(formData)
  } else if (expenseModalMode.value === 'edit' && selectedExpense.value) {
    updateExpense({
      id: selectedExpense.value.id,
      ...formData,
    })
  }
  isExpenseModalOpen.value = false
}

// Delete actions using ConfirmModal
const promptDeleteExpense = (item) => {
  if (!canDelete.value) {
    toast.error('Only administrators are authorized to delete payment records.')
    return
  }
  expenseToDelete.value = item
  isConfirmModalOpen.value = true
}

const handleConfirmDelete = () => {
  if (expenseToDelete.value) {
    deleteExpense(expenseToDelete.value.id)
    expenseToDelete.value = null
  }
  isConfirmModalOpen.value = false
}

// Receipt preview
const openReceiptModal = (expense) => {
  selectedReceipt.value = {
    id: expense.id,
    title: expense.title,
    vendor: expense.vendor,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,
    paymentMethod: expense.paymentMethod,
    status: expense.status,
    notes: expense.notes,
    receiptUrl: expense.receiptUrl || '',
    receiptName: expense.receiptName,
    receipts: expense.receipts || (expense.receiptUrl ? [{ url: expense.receiptUrl, name: expense.receiptName || 'Receipt Slip' }] : []),
  }
  isReceiptModalOpen.value = true
}

// Fetch all filtered rows for full export (CSV or PDF)
async function fetchAllFilteredExpensesForExport() {
  const params = new URLSearchParams()
  params.append('export', 'json')
  if (selectedUserId.value) params.append('filterUserId', String(selectedUserId.value))
  if (activeProject.value?.id) params.append('projectId', String(activeProject.value.id))
  if (searchQuery.value?.trim()) params.append('search', searchQuery.value.trim())
  if (selectedCategory.value && selectedCategory.value !== 'All') params.append('category', selectedCategory.value)
  if (filterWithReceipt.value && filterWithReceipt.value !== 'all') params.append('receipt', filterWithReceipt.value)
  if (dateRangeOption.value && dateRangeOption.value !== 'all') {
    params.append('dateRange', dateRangeOption.value)
    if (dateRangeOption.value === 'custom') {
      if (customStartDate.value) params.append('startDate', customStartDate.value)
      if (customEndDate.value) params.append('endDate', customEndDate.value)
    }
  }

  const res = await fetch(`/expenses?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to fetch export data')
  return await res.json()
}

// Export CSV handler
const exportCSV = async () => {
  try {
    isExporting.value = true
    const allRows = await fetchAllFilteredExpensesForExport()
    if (!allRows || allRows.length === 0) {
      toast.error('No expense records available to export.')
      return
    }

    const headers = ['ID', 'Title', 'Vendor', 'Category', 'Amount (PKR)', 'Date', 'Payment Method', 'Status', 'Has Receipt', 'Notes']
    const rows = allRows.map((e) => [
      e.id,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      e.amount,
      e.date,
      e.paymentMethod,
      e.status,
      e.hasReceipt ? 'Yes' : 'No',
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const safeName = (activeProject.value?.name || 'ledger').toLowerCase().replace(/[^a-z0-9]/g, '_')
    link.setAttribute('download', `${safeName}_expenses_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${allRows.length} records to CSV!`)
  } catch (err) {
    toast.error('Failed to export CSV. Please try again.')
  } finally {
    isExporting.value = false
  }
}

// Standalone Voucher Print State (direct row printing without opening any modal)
const voucherToPrint = ref(null)

// Direct Print Voucher handler for individual table row WITHOUT opening modal
const printExpenseVoucher = (expense) => {
  voucherToPrint.value = {
    id: expense.id,
    title: expense.title,
    vendor: expense.vendor,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,
    paymentMethod: expense.paymentMethod,
    status: expense.status,
    notes: expense.notes,
  }

  document.body.classList.add('print-mode-voucher')

  // Allow DOM to mount the hidden print component, then trigger native print
  setTimeout(() => {
    const cleanup = () => {
      document.body.classList.remove('print-mode-voucher')
      voucherToPrint.value = null
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()

    // Safety fallback cleanup
    setTimeout(cleanup, 2500)
  }, 100)
}

// Standalone Full Ledger Print State
const isPrintingLedger = ref(false)
const ledgerRowsToPrint = ref([])

// Print full ledger
const printFullLedger = async () => {
  try {
    isPrintingLedger.value = true
    const allRows = await fetchAllFilteredExpensesForExport()
    ledgerRowsToPrint.value = allRows && allRows.length > 0 ? allRows : (props.expenses?.data || [])

    document.body.classList.add('print-mode-ledger')

    setTimeout(() => {
      const cleanup = () => {
        document.body.classList.remove('print-mode-ledger')
        ledgerRowsToPrint.value = []
        isPrintingLedger.value = false
        window.removeEventListener('afterprint', cleanup)
      }
      window.addEventListener('afterprint', cleanup)
      window.print()

      // Safety fallback cleanup
      setTimeout(cleanup, 2500)
    }, 150)
  } catch (err) {
    ledgerRowsToPrint.value = props.expenses?.data || []
    document.body.classList.add('print-mode-ledger')
    setTimeout(() => {
      const cleanup = () => {
        document.body.classList.remove('print-mode-ledger')
        ledgerRowsToPrint.value = []
        isPrintingLedger.value = false
        window.removeEventListener('afterprint', cleanup)
      }
      window.addEventListener('afterprint', cleanup)
      window.print()

      // Safety fallback cleanup
      setTimeout(cleanup, 2500)
    }, 150)
  }
}

// Export Complete PDF Statement handler
const exportPDF = async () => {
  try {
    isExportingPdf.value = true
    const allRows = await fetchAllFilteredExpensesForExport()
    if (!allRows || allRows.length === 0) {
      toast.error('No expense records available to export.')
      return
    }

    const doc = new jsPDF('landscape', 'pt', 'a4')

    const projectName = activeProject.value?.name || 'Expense Ledger'
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    const currencySym = effectiveSettings.value?.currencySymbol || 'PKR'

    // Document Title Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text(projectName, 40, 42)

    doc.setFontSize(9.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`Official Expense Ledger & Disbursement Statement | Generated: ${dateStr}`, 40, 58)

    // Applied Filter Meta
    let filterText = `Filter: ${datePresets.find((p) => p.id === dateRangeOption.value)?.label || 'All Time'}`
    if (dateRangeOption.value === 'custom') {
      filterText += ` (${customStartDate.value || 'Beginning'} to ${customEndDate.value || 'Today'})`
    } else if (dateRangeOption.value !== 'all' && activeDateBounds.value.start) {
      filterText += ` (${activeDateBounds.value.start} to ${activeDateBounds.value.end})`
    }
    if (selectedCategory.value !== 'All') {
      filterText += ` | Category: ${selectedCategory.value}`
    }
    if (filterWithReceipt.value !== 'all') {
      filterText += ` | Receipt: ${filterWithReceipt.value === 'with_receipt' ? 'Attached Proof Only' : 'Without Proof'}`
    }
    doc.text(filterText, 40, 72)

    // Summary Metrics Banner
    doc.setDrawColor(226, 232, 240)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(40, 84, 762, 44, 6, 6, 'FD')

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text('TOTAL FILTERED OUTFLOW', 55, 101)
    doc.text('SETTLED / CLEARED', 315, 101)
    doc.text('PENDING BALANCE DUE', 575, 101)

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(79, 70, 229)
    doc.text(`${currencySym} ${Number(props.filterStats.filteredOutflow).toLocaleString()}`, 55, 118)

    doc.setTextColor(5, 150, 105)
    doc.text(`${currencySym} ${Number(props.filterStats.totalPaid).toLocaleString()}`, 315, 118)

    doc.setTextColor(217, 119, 6)
    doc.text(`${currencySym} ${Number(props.filterStats.totalPending).toLocaleString()}`, 575, 118)

    // Prepare Table Rows
    const tableHeaders = [['#', 'Date', 'Description / Title', 'Vendor / Payee', 'Category', 'Payment Channel', 'Status', `Amount (${currencySym})`]]
    const tableData = allRows.map((e, index) => [
      index + 1,
      e.date || '-',
      e.title || '-',
      e.vendor || 'Direct Purchase',
      e.category || 'General',
      e.paymentMethod || 'Cash',
      e.status || 'Paid',
      Number(e.amount || 0).toLocaleString(),
    ])

    // Summary Total Row at the bottom
    tableData.push([
      '',
      '',
      'TOTAL STATEMENT AMOUNT',
      '',
      '',
      '',
      `${allRows.length} Record${allRows.length > 1 ? 's' : ''}`,
      Number(props.filterStats.filteredOutflow).toLocaleString(),
    ])

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 140,
      margin: { left: 40, right: 40, bottom: 40 },
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 28, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 170 },
        3: { cellWidth: 140 },
        4: { cellWidth: 90 },
        5: { cellWidth: 90 },
        6: { cellWidth: 74, halign: 'center' },
        7: { cellWidth: 100, halign: 'right', fontStyle: 'bold' },
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [51, 65, 85],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didParseCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [241, 245, 249]
          data.cell.styles.textColor = [15, 23, 42]
        }
      },
      foot: [],
    })

    // Page Numbers Footer
    const totalPdfPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPdfPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text(
        `ExpensePro Portal Statement - Page ${i} of ${totalPdfPages}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 18,
        { align: 'center' }
      )
    }

    const safeName = (activeProject.value?.name || 'ledger').toLowerCase().replace(/[^a-z0-9]/g, '_')
    doc.save(`${safeName}_expenses_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Complete PDF statement downloaded successfully!')
  } catch (err) {
    toast.error('Failed to export PDF. Please try again.')
  } finally {
    isExportingPdf.value = false
  }
}

// Dynamic badge palette for categories
const getCategoryColor = (category) => {
  const palette = [
    'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    'bg-purple-50 text-purple-700 border-purple-200/60',
    'bg-blue-50 text-blue-700 border-blue-200/60',
    'bg-amber-50 text-amber-700 border-amber-200/60',
    'bg-rose-50 text-rose-700 border-rose-200/60',
  ]
  let hash = 0
  for (let i = 0; i < (category || '').length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % palette.length
  return palette[index]
}
</script>

<template>
  <Head :title="`${activeProject?.name || 'Expenses'} - Ledger - ExpensePro`" />

  <AppLayout
    :title="`${activeProject?.name || 'Project'} Payments & Ledger`"
    :subtitle="activeProject?.description || 'Itemized expenditures, attached bills, and transaction vouchers.'"
    activePage="expenses"
    :expensesCount="props.expenses?.meta?.total || 0"
  >
    <!-- Top Action Slot -->
    <template #actions>
      <!-- Admin User Filter -->
      <div v-if="props.usersList?.length > 0" class="flex items-center gap-1.5">
        <select
          v-model="selectedUserId"
          @change="handleUserFilterChange"
          class="px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-purple-50 hover:bg-purple-100/80 border border-purple-200 text-purple-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition cursor-pointer"
        >
          <option value="">All Users (System)</option>
          <option v-for="u in props.usersList" :key="u.id" :value="u.id">
            {{ u.name }} ({{ u.role }})
          </option>
        </select>
      </div>

      <template v-if="activeProject">
        <button
          @click="exportCSV"
          :disabled="isExporting"
          type="button"
          class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl shadow-2xs transition cursor-pointer"
          title="Download CSV spreadsheet"
        >
          <Loader2 v-if="isExporting" :size="14" class="animate-spin text-indigo-600" />
          <Download v-else :size="14" class="text-slate-500" />
          <span class="hidden sm:inline">{{ isExporting ? 'Exporting...' : 'Export CSV' }}</span>
        </button>

        <button
          @click="exportPDF"
          :disabled="isExportingPdf"
          type="button"
          class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl shadow-2xs transition cursor-pointer"
          title="Download complete PDF statement"
        >
          <Loader2 v-if="isExportingPdf" :size="14" class="animate-spin text-rose-600" />
          <FileText v-else :size="14" class="text-rose-600" />
          <span class="hidden sm:inline">{{ isExportingPdf ? 'Generating...' : 'Export PDF' }}</span>
        </button>

        <button
          @click="printFullLedger"
          :disabled="isPrintingLedger"
          type="button"
          class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl shadow-2xs transition cursor-pointer"
          title="Print complete ledger or save as PDF via browser"
        >
          <Loader2 v-if="isPrintingLedger" :size="14" class="animate-spin text-indigo-600" />
          <Printer v-else :size="14" class="text-indigo-600" />
          <span class="hidden sm:inline">{{ isPrintingLedger ? 'Preparing...' : 'Print' }}</span>
        </button>

        <button
          @click="openAddModal"
          type="button"
          class="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus :size="16" />
          <span>Add New Payment</span>
        </button>
      </template>
      <Link
        v-else
        href="/projects"
        class="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
      >
        <Plus :size="16" />
        <span>Create Project</span>
      </Link>
    </template>

    <!-- Empty Projects State -->
    <EmptyState
      v-if="!activeProject"
      :icon="FolderKanban"
      title="No Projects Found"
      description="Please create or select a project first before logging expense vouchers."
      actionText="Create Project"
      actionHref="/projects"
      dashed
    />

    <!-- Active Ledger View -->
    <template v-else>
      <!-- 3 Modular Stat Cards Scoped to Current Filter (Driven by SQL Aggregates) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Filtered Outflow"
          :value="formatCurrency(props.filterStats.filteredOutflow)"
          :subtitle="`${props.filterStats.totalCount} entries matching search`"
          :icon="Receipt"
          color="indigo"
        />

        <StatCard
          title="Settled / Paid"
          :value="formatCurrency(props.filterStats.totalPaid)"
          subtitle="Cleared with contractor or vendor"
          :icon="CheckCircle2"
          color="emerald"
        />

        <StatCard
          title="Pending / Balance Due"
          :value="formatCurrency(props.filterStats.totalPending)"
          subtitle="Requires future clearance"
          :icon="Clock"
          color="amber"
        />
      </div>

      <!-- Main Table Card -->
      <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <!-- Filter and Search Header -->
        <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <!-- Search Input -->
          <div class="relative w-full md:w-80">
            <Search :size="16" class="absolute left-3.5 top-3 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search payments, vendors, cheque #..."
              class="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <!-- Receipt & Status Filters -->
          <div class="flex items-center gap-2 self-end md:self-auto">
            <div class="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-600">
              <button
                type="button"
                @click="selectReceiptFilter('all')"
                :class="[
                  'px-2.5 py-1 rounded-lg transition cursor-pointer',
                  filterWithReceipt === 'all' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'hover:text-slate-900',
                ]"
              >
                All
              </button>
              <button
                type="button"
                @click="selectReceiptFilter('with_receipt')"
                :class="[
                  'px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1',
                  filterWithReceipt === 'with_receipt' ? 'bg-white font-semibold text-emerald-700 shadow-2xs' : 'hover:text-slate-900',
                ]"
              >
                <Paperclip :size="12" />
                <span>With Receipt</span>
              </button>
              <button
                type="button"
                @click="selectReceiptFilter('without_receipt')"
                :class="[
                  'px-2.5 py-1 rounded-lg transition cursor-pointer',
                  filterWithReceipt === 'without_receipt' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'hover:text-slate-900',
                ]"
              >
                No Receipt
              </button>
            </div>
          </div>
        </div>

        <!-- Date Range Filter Bar -->
        <div class="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-slate-500 font-semibold flex items-center gap-1 mr-0.5 text-xs">
              <Calendar :size="13" class="text-indigo-600" />
              <span>Date Range:</span>
            </span>

            <div class="inline-flex items-center bg-white p-0.5 rounded-xl border border-slate-200/90 shadow-2xs overflow-x-auto">
              <button
                v-for="preset in datePresets"
                :key="preset.id"
                type="button"
                @click="selectDatePreset(preset.id)"
                :class="[
                  'px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs whitespace-nowrap',
                  dateRangeOption === preset.id
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                ]"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <!-- Custom Date Range Inputs when Custom is selected -->
          <div v-if="dateRangeOption === 'custom'" class="flex items-center gap-2 flex-wrap">
            <div class="flex items-center gap-1.5">
              <label class="text-[11px] font-semibold text-slate-500">From:</label>
              <input
                v-model="customStartDate"
                @change="applyCustomDates"
                type="date"
                class="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
            <div class="flex items-center gap-1.5">
              <label class="text-[11px] font-semibold text-slate-500">To:</label>
              <input
                v-model="customEndDate"
                @change="applyCustomDates"
                type="date"
                class="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
            <button
              v-if="customStartDate || customEndDate"
              type="button"
              @click="clearCustomDates"
              class="text-[11px] text-slate-500 hover:text-rose-600 font-semibold underline cursor-pointer ml-1"
            >
              Clear
            </button>
          </div>

          <!-- Active Date Indicator Pill -->
          <div v-else-if="dateRangeOption !== 'all'" class="text-[11px] text-slate-500 font-medium">
            Showing: <strong class="text-slate-800">{{ activeDateBounds.start }}</strong> to <strong class="text-slate-800">{{ activeDateBounds.end }}</strong>
          </div>
        </div>

        <!-- Category Filter Tabs Dynamically Scoped to Active Project -->
        <div class="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold overscroll-contain">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            @click="selectCategory(cat)"
            :class="[
              'px-3.5 py-1.5 rounded-xl transition shrink-0 cursor-pointer',
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80',
            ]"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Table View -->
        <div class="overflow-x-auto">
          <table v-if="props.expenses?.data?.length > 0" class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50/80 border-b border-slate-200/60 text-xs font-bold text-slate-900 tracking-wider">
              <tr>
                <th scope="col" class="py-3 px-4 w-12 text-center">#</th>
                <th scope="col" class="py-3 px-5">Item</th>
                <th scope="col" class="py-3 px-5">Vendor</th>
                <th scope="col" class="py-3 px-5">Category</th>
                <th scope="col" class="py-3 px-5">Method</th>
                <th scope="col" class="py-3 px-5">Receipt Slip</th>
                <th scope="col" class="py-3 px-5">Status</th>
                <th scope="col" class="py-3 px-5">Date</th>
                <th scope="col" class="py-3 px-5 text-right">Amount ({{ effectiveSettings.currencySymbol }})</th>
                <th scope="col" class="py-3 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="(expense, index) in props.expenses.data"
                :key="expense.id"
                class="hover:bg-slate-50/70 transition-colors group"
              >
                <!-- Serial Number (continuous across pages) -->
                <td class="py-3.5 px-4 text-center text-xs font-bold text-slate-400 whitespace-nowrap">
                  {{ (props.expenses.meta.currentPage - 1) * props.expenses.meta.perPage + index + 1 }}
                </td>

                <!-- Description / Notes -->
                <td class="py-3.5 px-5">
                  <div class="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {{ expense.title }}
                  </div>
                  <div v-if="expense.notes" class="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                    {{ expense.notes }}
                  </div>
                </td>

                <!-- Vendor -->
                <td class="py-3.5 px-5 text-xs text-slate-600 font-medium whitespace-nowrap">
                  <span class="flex items-center gap-1.5">
                    <User :size="13" class="text-slate-400" />
                    {{ expense.vendor || 'Direct Purchase' }}
                  </span>
                </td>

                <!-- Category Badge -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <span
                    class="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md border"
                    :class="getCategoryColor(expense.category)"
                  >
                    {{ expense.category }}
                  </span>
                </td>

                <!-- Payment Method -->
                <td class="py-3.5 px-5 text-xs text-slate-600 whitespace-nowrap">
                  <span class="flex items-center gap-1.5">
                    <CreditCard :size="13" class="text-slate-400" />
                    {{ expense.paymentMethod }}
                  </span>
                </td>

                <!-- Receipt Slip Button -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <button
                    v-if="expense.hasReceipt"
                    type="button"
                    @click="openReceiptModal(expense)"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition cursor-pointer"
                    title="View attached receipt slip(s)"
                  >
                    <Paperclip :size="12" />
                    <span>{{ (expense.receipts && expense.receipts.length > 1) ? `${expense.receipts.length} Proofs` : 'View Proof' }}</span>
                  </button>
                  <span v-else class="text-xs text-slate-400 font-normal">
                    No Slip
                  </span>
                </td>

                <!-- Status Badge -->
                <td class="py-3.5 px-5 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full',
                      expense.status === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60',
                    ]"
                  >
                    <span
                      :class="[
                        'w-1.5 h-1.5 rounded-full',
                        expense.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse',
                      ]"
                    ></span>
                    {{ expense.status }}
                  </span>
                </td>

                <!-- Date -->
                <td class="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap">
                  <span class="flex items-center gap-1.5">
                    <Calendar :size="13" class="text-slate-400" />
                    {{ expense.date }}
                  </span>
                </td>

                <!-- Amount -->
                <td class="py-3.5 px-5 text-right font-extrabold text-slate-900 whitespace-nowrap text-sm">
                  {{ formatCurrency(expense.amount) }}
                </td>

                <!-- Actions: Print, Edit & Delete -->
                <td class="py-3.5 px-5 text-center whitespace-nowrap">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      @click="printExpenseVoucher(expense)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                      title="Print payment voucher"
                    >
                      <Printer :size="14" />
                    </button>
                    <button
                      type="button"
                      @click="openEditModal(expense)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                      title="Edit record"
                    >
                      <Edit2 :size="14" />
                    </button>
                    <button
                      v-if="canDelete"
                      type="button"
                      @click="promptDeleteExpense(expense)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State for Filter or Empty Project -->
          <div v-else class="p-8">
            <EmptyState
              :icon="Receipt"
              title="No payment records found"
              :description="`No payment records found for ${activeProject?.name || 'this project'} matching the active filters. Click 'Add New Payment' to record a new transaction voucher.`"
              actionText="Add New Payment"
              @action="openAddModal"
            />
          </div>
        </div>

        <!-- Table Summary Status Banner -->
        <div
          v-if="props.expenses?.meta?.total > 0"
          class="px-5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-md">
              <CheckCircle2 :size="13" class="text-emerald-600" />
              <span>Active Outflow Total: {{ formatCurrency(props.filterStats.filteredOutflow) }}</span>
            </span>
            <span class="text-slate-400">({{ props.expenses.meta.total }} total matching records)</span>
          </div>
          <button
            @click="exportCSV"
            :disabled="isExporting"
            type="button"
            class="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
          >
            <Download :size="13" />
            <span>{{ isExporting ? 'Exporting...' : 'Export All to CSV' }}</span>
          </button>
        </div>

        <!-- Reusable Pagination Component -->
        <Pagination
          v-if="props.expenses?.meta?.total > 0"
          :currentPage="props.expenses.meta.currentPage"
          :pageSize="props.expenses.meta.perPage"
          :totalItems="props.expenses.meta.total"
          @update:currentPage="(page) => fetchFilteredExpenses(page)"
          @update:pageSize="(limit) => { pageSize = limit; fetchFilteredExpenses(1); }"
          @change="handlePageChange"
        />
      </div>
    </template>

    <!-- Reusable Add/Edit Expense Modal -->
    <ExpenseModal
      v-if="activeProject"
      :show="isExpenseModalOpen"
      :mode="expenseModalMode"
      :expense="selectedExpense"
      :categories="activeCategories"
      @close="isExpenseModalOpen = false"
      @save="handleSaveExpense"
    />

    <!-- Reusable Confirmation Modal -->
    <ConfirmModal
      :show="isConfirmModalOpen"
      title="Delete Expense Record"
      :message="`Are you sure you want to delete '${expenseToDelete?.title}' (Rs. ${Number(expenseToDelete?.amount || 0).toLocaleString()})? This action cannot be undone.`"
      confirmText="Yes, Delete Record"
      variant="danger"
      @confirm="handleConfirmDelete"
      @close="isConfirmModalOpen = false"
    />

    <!-- Reusable Receipt Modal -->
    <ReceiptModal
      :show="isReceiptModalOpen"
      :receipt="selectedReceipt"
      @close="isReceiptModalOpen = false"
    />

    <!-- Standalone Printable Voucher (Direct row print without opening modal) -->
    <VoucherSlip v-if="voucherToPrint" :voucher="voucherToPrint" />

    <!-- Standalone Printable Full Ledger (Direct top-bar print) -->
    <div id="ledger-print-area" class="hidden">
      <!-- Printable Header -->
      <div class="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
        <div>
          <h1 class="text-2xl font-black tracking-tight text-slate-900 uppercase">
            {{ effectiveSettings?.brandName || 'ExpensePro' }} &bull; {{ activeProject?.name || 'Expense Ledger' }}
          </h1>
          <p class="text-xs text-slate-600 mt-1 font-medium">
            Official Itemized Expenditure Ledger &amp; Disbursement Report
          </p>
          <p class="text-[11px] text-slate-500 mt-0.5">
            {{ activeProject?.type || 'Portfolio' }} &bull; {{ activeProject?.location || 'Pakistan' }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs font-bold text-slate-900">
            Statement Date: {{ new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}
          </p>
          <p class="text-xs text-slate-600 mt-0.5">
            Period: {{ datePresets.find((p) => p.id === dateRangeOption)?.label || 'All Time' }}
            <span v-if="dateRangeOption === 'custom' && (customStartDate || customEndDate)">
              ({{ customStartDate || 'Start' }} to {{ customEndDate || 'Today' }})
            </span>
          </p>
          <p class="text-[11px] text-slate-500 mt-0.5">
            Total Records: {{ (ledgerRowsToPrint.length > 0 ? ledgerRowsToPrint : (props.expenses?.data || [])).length }}
          </p>
        </div>
      </div>

      <!-- Financial Metrics Summary Banner -->
      <div class="grid grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-300 rounded-lg mb-4 text-xs">
        <div>
          <span class="text-[10px] font-bold text-slate-500 uppercase block">Total Filtered Outflow</span>
          <span class="text-sm font-extrabold text-indigo-700">{{ formatCurrency(props.filterStats.filteredOutflow) }}</span>
        </div>
        <div>
          <span class="text-[10px] font-bold text-slate-500 uppercase block">Settled / Paid Out</span>
          <span class="text-sm font-extrabold text-emerald-700">{{ formatCurrency(props.filterStats.totalPaid) }}</span>
        </div>
        <div>
          <span class="text-[10px] font-bold text-slate-500 uppercase block">Pending Balance Due</span>
          <span class="text-sm font-extrabold text-amber-700">{{ formatCurrency(props.filterStats.totalPending) }}</span>
        </div>
        <div>
          <span class="text-[10px] font-bold text-slate-500 uppercase block">Receipt Proofs</span>
          <span class="text-sm font-extrabold text-slate-800">
            {{ (ledgerRowsToPrint.length > 0 ? ledgerRowsToPrint : (props.expenses?.data || [])).filter(r => r.hasReceipt || r.receiptsCount > 0).length }} Verified Slips
          </span>
        </div>
      </div>

      <!-- Full Table for Printing -->
      <table class="w-full text-xs border border-slate-300 border-collapse mb-5">
        <thead>
          <tr class="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
            <th class="py-2 px-2 text-center border-r border-slate-300 w-8">#</th>
            <th class="py-2 px-2 text-left border-r border-slate-300 w-24">Date</th>
            <th class="py-2 px-3 text-left border-r border-slate-300">Description / Title</th>
            <th class="py-2 px-3 text-left border-r border-slate-300">Vendor / Payee</th>
            <th class="py-2 px-2 text-left border-r border-slate-300">Category</th>
            <th class="py-2 px-2 text-left border-r border-slate-300">Method</th>
            <th class="py-2 px-2 text-center border-r border-slate-300 w-16">Status</th>
            <th class="py-2 px-3 text-right">Amount ({{ effectiveSettings?.currencySymbol || 'PKR' }})</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in (ledgerRowsToPrint.length > 0 ? ledgerRowsToPrint : (props.expenses?.data || []))"
            :key="'print-' + row.id"
            class="border-b border-slate-200"
          >
            <td class="py-1.5 px-2 text-center border-r border-slate-200 font-medium text-slate-500">{{ idx + 1 }}</td>
            <td class="py-1.5 px-2 border-r border-slate-200 whitespace-nowrap text-slate-700">{{ row.date }}</td>
            <td class="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-900">
              {{ row.title }}
              <span v-if="row.notes" class="block text-[10px] font-normal text-slate-500 italic">{{ row.notes }}</span>
            </td>
            <td class="py-1.5 px-3 border-r border-slate-200 text-slate-700">{{ row.vendor || 'Direct Purchase' }}</td>
            <td class="py-1.5 px-2 border-r border-slate-200 text-slate-700">{{ row.category }}</td>
            <td class="py-1.5 px-2 border-r border-slate-200 text-slate-700">{{ row.paymentMethod || 'Cash' }}</td>
            <td class="py-1.5 px-2 border-r border-slate-200 text-center font-semibold" :class="row.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'">
              {{ row.status }}
            </td>
            <td class="py-1.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
              {{ Number(row.amount || 0).toLocaleString() }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
            <td colspan="7" class="py-2 px-3 text-right uppercase tracking-wider">
              Total Filtered Outflow:
            </td>
            <td class="py-2 px-3 text-right font-black text-sm text-indigo-700">
              {{ formatCurrency(props.filterStats.filteredOutflow) }}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Official Signatures -->
      <div class="grid grid-cols-3 gap-8 pt-6 mt-4 border-t border-slate-300 text-center text-xs text-slate-700">
        <div>
          <div class="border-b border-slate-400 mb-1.5 h-10"></div>
          <p class="font-bold text-slate-900">Prepared By</p>
          <p class="text-[10px] text-slate-500">Site Accountant / Cashier</p>
        </div>
        <div>
          <div class="border-b border-slate-400 mb-1.5 h-10"></div>
          <p class="font-bold text-slate-900">Verified &amp; Checked</p>
          <p class="text-[10px] text-slate-500">Project Manager / Auditor</p>
        </div>
        <div>
          <div class="border-b border-slate-400 mb-1.5 h-10"></div>
          <p class="font-bold text-slate-900">Authorized Signature</p>
          <p class="text-[10px] text-slate-500">Managing Director / Client</p>
        </div>
      </div>

      <!-- Print Footer -->
      <div class="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
        ExpensePro Digital Financial Ledger Statement &bull; Official System Record
      </div>
    </div>
  </AppLayout>
</template>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  body.print-mode-ledger * {
    visibility: hidden !important;
  }

  body.print-mode-ledger #ledger-print-area,
  body.print-mode-ledger #ledger-print-area * {
    visibility: visible !important;
  }

  body.print-mode-ledger #ledger-print-area {
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 5mm !important;
    background: #ffffff !important;
    color: #0f172a !important;
    z-index: 99999999 !important;
    box-sizing: border-box !important;
  }

  body.print-mode-ledger #ledger-print-area table {
    page-break-inside: auto;
  }

  body.print-mode-ledger #ledger-print-area tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  body.print-mode-ledger #ledger-print-area thead {
    display: table-header-group;
  }

  body.print-mode-ledger #ledger-print-area tfoot {
    display: table-footer-group;
  }
}
</style>
