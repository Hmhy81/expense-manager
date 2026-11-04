<script setup>
import { ref, computed, watch } from 'vue'
import { Head, Link } from '@inertiajs/vue3'
import AppLayout from '~/components/AppLayout.vue'
import StatCard from '~/components/StatCard.vue'
import ExpenseModal from '~/components/ExpenseModal.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import ReceiptModal from '~/components/ReceiptModal.vue'
import { useActiveProject } from '~/composables/useActiveProject'
import { useSettings } from '~/composables/useSettings'
import { Plus, Search, Filter, Trash2, Edit2, Calendar, CreditCard, Download, FolderKanban } from 'lucide-vue-next'
import { Paperclip, CheckCircle2, Clock, User, Receipt, FileText } from 'lucide-vue-next'

const {
  activeProject,
  activeExpenses,
  activeCategories,
  activeStats,
  addExpense,
  updateExpense,
  deleteExpense,
} = useActiveProject()
const { formatCurrency, effectiveSettings } = useSettings()

// Categories list with 'All' prepended
const categories = computed(() => ['All', ...activeCategories.value])

// Filtering & Search state
const searchQuery = ref('')
const selectedCategory = ref('All')
const filterWithReceipt = ref('all') // 'all', 'with_receipt', 'without_receipt'

// Date Range Filtering State
const dateRangeOption = ref('all') // 'all', 'today', 'this_week', 'this_month', 'last_month', 'this_year', 'custom'
const customStartDate = ref('')
const customEndDate = ref('')

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

// Reset category filter if it doesn't exist in the active project
watch(categories, (newCats) => {
  if (selectedCategory.value !== 'All' && !newCats.includes(selectedCategory.value)) {
    selectedCategory.value = 'All'
  }
})

// Scoped filtered expenses for active project
const filteredExpenses = computed(() => {
  return activeExpenses.value.filter((item) => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      (item.vendor && item.vendor.toLowerCase().includes(q)) ||
      (item.paymentMethod && item.paymentMethod.toLowerCase().includes(q))

    const matchesCategory =
      selectedCategory.value === 'All' || item.category === selectedCategory.value

    const matchesReceipt =
      filterWithReceipt.value === 'all' ||
      (filterWithReceipt.value === 'with_receipt' && item.hasReceipt) ||
      (filterWithReceipt.value === 'without_receipt' && !item.hasReceipt)

    const matchesDate = (() => {
      if (dateRangeOption.value === 'all') return true
      if (!item.date) return false

      const itemDate = item.date.slice(0, 10)
      const { start, end } = activeDateBounds.value

      if (start && itemDate < start) return false
      if (end && itemDate > end) return false
      return true
    })()

    return matchesSearch && matchesCategory && matchesReceipt && matchesDate
  })
})

const totalExpenseAmount = computed(() => {
  return filteredExpenses.value.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
})

const totalPaidAmount = computed(() => {
  return filteredExpenses.value
    .filter((e) => e.status === 'Paid')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
})

const totalPendingAmount = computed(() => {
  return filteredExpenses.value
    .filter((e) => e.status === 'Pending')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
})

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
  }
  isReceiptModalOpen.value = true
}

// Export CSV handler
const exportCSV = () => {
  const headers = ['ID', 'Title', 'Vendor', 'Category', 'Amount (PKR)', 'Date', 'Payment Method', 'Status', 'Has Receipt', 'Notes']
  const rows = filteredExpenses.value.map((e) => [
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
    :expensesCount="activeExpenses.length"
  >
    <!-- Top Action Slot -->
    <template #actions>
      <template v-if="activeProject">
        <button
          @click="exportCSV"
          type="button"
          class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-2xs transition cursor-pointer"
          title="Download CSV spreadsheet"
        >
          <Download :size="15" class="text-slate-500" />
          <span class="hidden sm:inline">Export CSV</span>
        </button>

        <button
          @click="openAddModal"
          type="button"
          class="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
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
    <div
      v-if="!activeProject"
      class="bg-white border-2 border-dashed border-slate-200/90 rounded-2xl p-10 sm:p-14 text-center flex flex-col items-center justify-center space-y-4"
    >
      <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
        <FolderKanban :size="28" />
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-bold text-slate-900">No Projects Found</h3>
        <p class="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Please create or select a project first before logging expense vouchers.
        </p>
      </div>
      <Link
        href="/projects"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
      >
        <Plus :size="15" />
        <span>Create Project</span>
      </Link>
    </div>

    <!-- Active Ledger View -->
    <template v-else>
      <!-- 3 Modular Stat Cards Scoped to Current Filter -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <StatCard
        title="Filtered Outflow"
        :value="formatCurrency(totalExpenseAmount)"
        :subtitle="`${filteredExpenses.length} entries matching search`"
        :icon="Receipt"
        color="indigo"
      />

      <StatCard
        title="Settled / Paid"
        :value="formatCurrency(totalPaidAmount)"
        subtitle="Cleared with contractor or vendor"
        :icon="CheckCircle2"
        color="emerald"
      />

      <StatCard
        title="Pending / Balance Due"
        :value="formatCurrency(totalPendingAmount)"
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
              @click="filterWithReceipt = 'all'"
              :class="[
                'px-2.5 py-1 rounded-lg transition cursor-pointer',
                filterWithReceipt === 'all' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'hover:text-slate-900',
              ]"
            >
              All
            </button>
            <button
              type="button"
              @click="filterWithReceipt = 'with_receipt'"
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
              @click="filterWithReceipt = 'without_receipt'"
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
              @click="dateRangeOption = preset.id"
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
              type="date"
              class="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
          <div class="flex items-center gap-1.5">
            <label class="text-[11px] font-semibold text-slate-500">To:</label>
            <input
              v-model="customEndDate"
              type="date"
              class="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
          <button
            v-if="customStartDate || customEndDate"
            type="button"
            @click="customStartDate = ''; customEndDate = ''"
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
          @click="selectedCategory = cat"
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
        <table v-if="filteredExpenses.length > 0" class="w-full text-left text-sm text-slate-600">
          <thead class="bg-slate-50/80 border-b border-slate-200/60 text-xs font-bold text-slate-900 tracking-wider">
            <tr>
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
              v-for="expense in filteredExpenses"
              :key="expense.id"
              class="hover:bg-slate-50/70 transition-colors group"
            >
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
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition cursor-pointer"
                  title="View attached receipt slip"
                >
                  <Paperclip :size="12" />
                  <span>View Proof</span>
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

              <!-- Actions: Edit & Delete -->
              <td class="py-3.5 px-5 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    @click="openEditModal(expense)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Edit record"
                  >
                    <Edit2 :size="14" />
                  </button>
                  <button
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
        <div
          v-else
          class="p-12 text-center flex flex-col items-center justify-center space-y-2 text-slate-500"
        >
          <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
            <Receipt :size="20" />
          </div>
          <p class="font-bold text-slate-800 text-sm">No payment records found</p>
          <p class="text-xs max-w-sm">
            Is project ({{ activeProject?.name }}) mein koi payments match nahi hui. "Add New Payment" button par click karke naya voucher record karein.
          </p>
        </div>
      </div>

      <!-- Table Footer / Count info -->
      <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div class="flex items-center gap-3">
          <span>Showing {{ filteredExpenses.length }} of {{ activeExpenses.length }} entries</span>
          <span class="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
          <span class="text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 :size="13" /> Ledger Total: {{ formatCurrency(totalExpenseAmount) }}
          </span>
        </div>
        <div>
          <button
            @click="exportCSV"
            type="button"
            class="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <Download :size="13" />
            <span>Export Spreadsheet (.csv)</span>
          </button>
        </div>
      </div>
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
  </AppLayout>
</template>
