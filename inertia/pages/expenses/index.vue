<script setup lang="ts">
import { ref, computed } from 'vue'
import { Head, Link, router, usePage } from '@inertiajs/vue3'
import {
  LayoutDashboard,
  Receipt,
  LogOut,
  Wallet,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  X,
  Download,
  CheckCircle2,
  Clock,
} from 'lucide-vue-next'

export type ExpenseItem = {
  id: number
  title: string
  category: string
  amount: number
  date: string
  paymentMethod: string
  status: 'Paid' | 'Pending'
}

type UserData = {
  id?: number
  fullName?: string
  email?: string
}

const props = withDefaults(
  defineProps<{
    user?: UserData
    expenses?: ExpenseItem[]
    categories?: string[]
  }>(),
  {
    expenses: () => [
      {
        id: 1,
        title: 'Office Electricity Bill',
        category: 'Utilities',
        amount: 8400,
        date: '2026-11-01',
        paymentMethod: 'Bank Transfer',
        status: 'Paid',
      },
      {
        id: 2,
        title: 'Team Lunch & Coffee',
        category: 'Food & Dining',
        amount: 3200,
        date: '2026-10-30',
        paymentMethod: 'Cash',
        status: 'Paid',
      },
      {
        id: 3,
        title: 'Figma Annual Subscription',
        category: 'Software & Tools',
        amount: 14500,
        date: '2026-10-28',
        paymentMethod: 'Credit Card',
        status: 'Paid',
      },
      {
        id: 4,
        title: 'High-speed Fiber Internet',
        category: 'Utilities',
        amount: 4500,
        date: '2026-10-25',
        paymentMethod: 'Online Banking',
        status: 'Paid',
      },
      {
        id: 5,
        title: 'Printer Paper & Stationeries',
        category: 'Office Supplies',
        amount: 2100,
        date: '2026-10-22',
        paymentMethod: 'Cash',
        status: 'Paid',
      },
      {
        id: 6,
        title: 'AWS Cloud Infrastructure',
        category: 'Cloud Hosting',
        amount: 12500,
        date: '2026-10-20',
        paymentMethod: 'Credit Card',
        status: 'Pending',
      },
    ],
    categories: () => [
      'All',
      'Utilities',
      'Food & Dining',
      'Software & Tools',
      'Office Supplies',
      'Cloud Hosting',
    ],
  }
)

const page = usePage()

const currentUser = computed(() => {
  const shared = (page.props as any).user
  if (props.user?.fullName) return props.user
  if (shared?.fullName) return shared
  return {
    fullName: 'Finance Manager',
    email: 'finance@expensepro.com',
  }
})

// Working logout
const logout = () => {
  router.post('/logout')
}

// Local reactive expenses list
const expenseList = ref<ExpenseItem[]>([...props.expenses])

// Filtering and Search State
const searchQuery = ref('')
const selectedCategory = ref('All')

const filteredExpenses = computed(() => {
  return expenseList.value.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.paymentMethod.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory =
      selectedCategory.value === 'All' || item.category === selectedCategory.value

    return matchesSearch && matchesCategory
  })
})

const totalExpenseAmount = computed(() => {
  return filteredExpenses.value.reduce((acc, curr) => acc + curr.amount, 0)
})

const totalPaidAmount = computed(() => {
  return filteredExpenses.value
    .filter((e) => e.status === 'Paid')
    .reduce((acc, curr) => acc + curr.amount, 0)
})

const totalPendingAmount = computed(() => {
  return filteredExpenses.value
    .filter((e) => e.status === 'Pending')
    .reduce((acc, curr) => acc + curr.amount, 0)
})

// Modal State
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const currentEditId = ref<number | null>(null)

const form = ref<Omit<ExpenseItem, 'id'>>({
  title: '',
  category: 'Utilities',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  paymentMethod: 'Cash',
  status: 'Paid',
})

const openAddModal = () => {
  modalMode.value = 'add'
  currentEditId.value = null
  form.value = {
    title: '',
    category: 'Utilities',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    status: 'Paid',
  }
  isModalOpen.value = true
}

const openEditModal = (item: ExpenseItem) => {
  modalMode.value = 'edit'
  currentEditId.value = item.id
  form.value = {
    title: item.title,
    category: item.category,
    amount: item.amount,
    date: item.date,
    paymentMethod: item.paymentMethod,
    status: item.status,
  }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const saveExpense = () => {
  if (!form.value.title || form.value.amount <= 0) {
    alert('Please provide a valid title and amount.')
    return
  }

  if (modalMode.value === 'add') {
    const newId = expenseList.value.length ? Math.max(...expenseList.value.map((e) => e.id)) + 1 : 1
    expenseList.value.unshift({
      id: newId,
      ...form.value,
    })
  } else if (modalMode.value === 'edit' && currentEditId.value !== null) {
    const index = expenseList.value.findIndex((e) => e.id === currentEditId.value)
    if (index !== -1) {
      expenseList.value[index] = {
        id: currentEditId.value,
        ...form.value,
      }
    }
  }

  closeModal()
}

const deleteExpense = (id: number) => {
  if (confirm('Are you sure you want to delete this expense record?')) {
    expenseList.value = expenseList.value.filter((e) => e.id !== id)
  }
}

// Export CSV handler
const exportCSV = () => {
  const headers = ['ID,Title,Category,Amount_PKR,Date,PaymentMethod,Status']
  const rows = filteredExpenses.value.map(
    (e) => `${e.id},"${e.title}","${e.category}",${e.amount},${e.date},"${e.paymentMethod}","${e.status}"`
  )
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `expensepro_report_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Category pill colors helper
const getCategoryStyle = (cat: string) => {
  switch (cat) {
    case 'Utilities':
      return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Food & Dining':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Software & Tools':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
    case 'Cloud Hosting':
      return 'bg-purple-50 text-purple-700 border-purple-200/60'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
</script>

<template>
  <Head title="Expenses List - ExpensePro" />

  <div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
    <!-- Sidebar Navigation -->
    <aside class="w-full md:w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 justify-between shadow-xs">
      <div>
        <!-- Logo -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" class="flex items-center gap-2.5 font-bold text-xl text-slate-900 group">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Wallet :size="18" />
            </div>
            <span>Expense<span class="text-indigo-600">Pro</span></span>
          </Link>
        </div>

        <!-- Navigation Links -->
        <nav class="p-4 space-y-1.5">
          <Link
            href="/dashboard"
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
          >
            <LayoutDashboard :size="18" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/expenses"
            class="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
          >
            <div class="flex items-center gap-3">
              <Receipt :size="18" class="text-indigo-600" />
              <span>Expenses</span>
            </div>
            <span class="text-[11px] font-semibold bg-indigo-600 text-white px-2 py-0.5 rounded-md">
              {{ expenseList.length }}
            </span>
          </Link>
        </nav>
      </div>

      <!-- User Profile & Logout -->
      <div class="p-4 border-t border-slate-100 space-y-3">
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
              {{ currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U' }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-slate-900 truncate">{{ currentUser.fullName }}</p>
              <p class="text-[11px] text-slate-500 truncate">{{ currentUser.email || 'user@expensepro.com' }}</p>
            </div>
          </div>
          <div class="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
            <span class="text-slate-500 font-medium">Account Role:</span>
            <span class="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Finance Admin</span>
          </div>
        </div>

        <button
          @click="logout"
          type="button"
          class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-100 transition-colors shadow-2xs cursor-pointer"
        >
          <LogOut :size="15" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Navbar -->
      <header class="bg-white border-b border-slate-200/90 h-16 flex items-center justify-between px-6 lg:px-8 shrink-0 shadow-2xs">
        <div>
          <h1 class="text-base sm:text-lg font-bold text-slate-900">Expenses Directory</h1>
          <p class="text-xs text-slate-500 hidden sm:block">Filter, review, edit, and record all team expenditures.</p>
        </div>

        <div class="flex items-center gap-2.5">
          <button
            @click="exportCSV"
            class="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl shadow-2xs transition cursor-pointer"
            title="Download CSV Spreadsheet"
          >
            <Download :size="15" class="text-slate-500" />
            <span class="hidden sm:inline">Export CSV</span>
          </button>

          <button
            @click="openAddModal"
            class="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus :size="16" />
            <span>Add New Expense</span>
          </button>
        </div>
      </header>

      <!-- Main Body -->
      <main class="p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        <!-- Quick Financial Metrics Bar -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtered Outflow</span>
            <p class="text-2xl font-extrabold text-slate-900 mt-1">Rs. {{ totalExpenseAmount.toLocaleString() }}</p>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ filteredExpenses.length }} transactions in view</p>
          </div>
          <div class="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 :size="13" /> Settled / Paid
            </span>
            <p class="text-2xl font-extrabold text-emerald-600 mt-1">Rs. {{ totalPaidAmount.toLocaleString() }}</p>
            <p class="text-[11px] text-slate-500 mt-0.5">Cleared with invoice records</p>
          </div>
          <div class="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <span class="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <Clock :size="13" /> Pending Invoices
            </span>
            <p class="text-2xl font-extrabold text-amber-600 mt-1">Rs. {{ totalPendingAmount.toLocaleString() }}</p>
            <p class="text-[11px] text-slate-500 mt-0.5">Requires approval or payment</p>
          </div>
        </div>

        <!-- Summary & Filters Bar -->
        <div class="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <!-- Search Input -->
            <div class="relative flex-1 max-w-md">
              <Search :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by expense title or payment method..."
                class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>

            <!-- Currency & Status badge -->
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active Ledger: PKR (₨)</span>
              </div>
            </div>
          </div>

          <!-- Category Pill Filter -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span class="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter :size="13" /> Category:
            </span>
            <button
              v-for="cat in categories"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap',
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70',
              ]"
            >
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Data Table Card -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50/80 border-b border-slate-200/80 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th scope="col" class="py-3.5 px-5">Expense Title</th>
                  <th scope="col" class="py-3.5 px-5">Category</th>
                  <th scope="col" class="py-3.5 px-5">Payment Method</th>
                  <th scope="col" class="py-3.5 px-5">Date</th>
                  <th scope="col" class="py-3.5 px-5">Status</th>
                  <th scope="col" class="py-3.5 px-5 text-right">Amount (PKR)</th>
                  <th scope="col" class="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="expense in filteredExpenses"
                  :key="expense.id"
                  class="hover:bg-slate-50/70 transition-colors"
                >
                  <!-- Title -->
                  <td class="py-4 px-5 font-semibold text-slate-900">
                    {{ expense.title }}
                  </td>

                  <!-- Category -->
                  <td class="py-4 px-5">
                    <span :class="['inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md border', getCategoryStyle(expense.category)]">
                      {{ expense.category }}
                    </span>
                  </td>

                  <!-- Payment Method -->
                  <td class="py-4 px-5 text-xs text-slate-600 font-medium">
                    <span class="inline-flex items-center gap-1.5">
                      <CreditCard :size="14" class="text-slate-400" />
                      {{ expense.paymentMethod }}
                    </span>
                  </td>

                  <!-- Date -->
                  <td class="py-4 px-5 text-xs text-slate-500">
                    <span class="inline-flex items-center gap-1.5">
                      <Calendar :size="14" class="text-slate-400" />
                      {{ expense.date }}
                    </span>
                  </td>

                  <!-- Status -->
                  <td class="py-4 px-5">
                    <span
                      v-if="expense.status === 'Paid'"
                      class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Paid
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Pending
                    </span>
                  </td>

                  <!-- Amount -->
                  <td class="py-4 px-5 text-right font-extrabold text-slate-900 text-sm">
                    Rs. {{ expense.amount.toLocaleString() }}
                  </td>

                  <!-- Actions -->
                  <td class="py-4 px-5 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        @click="openEditModal(expense)"
                        class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit2 :size="15" />
                      </button>
                      <button
                        @click="deleteExpense(expense.id)"
                        class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 :size="15" />
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Empty State -->
                <tr v-if="filteredExpenses.length === 0">
                  <td colspan="7" class="py-12 text-center text-slate-500">
                    <Receipt :size="36" class="mx-auto text-slate-300 mb-3" />
                    <p class="font-medium">No expenses found matching your query.</p>
                    <button
                      @click="searchQuery = ''; selectedCategory = 'All'"
                      class="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table Footer / Count info -->
          <div class="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div class="flex items-center gap-3">
              <span>Showing {{ filteredExpenses.length }} of {{ expenseList.length }} entries</span>
              <span class="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
              <span class="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 :size="13" /> Verified Balance: Rs. {{ totalExpenseAmount.toLocaleString() }}
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
      </main>
    </div>

    <!-- Add / Edit Expense Modal -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
    >
      <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900">
            {{ modalMode === 'add' ? 'Add New Expense' : 'Edit Expense' }}
          </h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X :size="18" />
          </button>
        </div>

        <form @submit.prevent="saveExpense" class="space-y-4">
          <!-- Title -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Expense Title</label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="e.g. Office Electricity Bill"
              class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              v-model="form.category"
              class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
            >
              <option value="Utilities">Utilities</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Software & Tools">Software & Tools</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Cloud Hosting">Cloud Hosting</option>
            </select>
          </div>

          <!-- Amount & Date -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Amount (PKR)</label>
              <input
                v-model.number="form.amount"
                type="number"
                min="1"
                required
                placeholder="4500"
                class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                v-model="form.date"
                type="date"
                required
                class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <!-- Payment Method & Status -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                v-model="form.paymentMethod"
                class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Online Banking">Online Banking</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                v-model="form.status"
                class="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <!-- Buttons -->
          <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              {{ modalMode === 'add' ? 'Save Record' : 'Update Record' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
