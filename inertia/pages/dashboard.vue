<script setup lang="ts">
import { computed } from 'vue'
import { Head, Link, router, usePage } from '@inertiajs/vue3'
import {
  LayoutDashboard,
  Receipt,
  LogOut,
  Wallet,
  TrendingUp,
  Tag,
  AlertCircle,
  Clock,
  ArrowRight,
  CreditCard,
  Plus,
  PieChart,
} from 'lucide-vue-next'

type Stats = {
  totalExpense?: string
  thisMonth?: string
  categoriesCount?: number
  pendingCount?: number
}

type UserData = {
  id?: number
  fullName?: string
  email?: string
  initials?: string
}

const props = withDefaults(
  defineProps<{
    user?: UserData
    stats?: Stats
  }>(),
  {
    stats: () => ({
      totalExpense: 'Rs. 45,200',
      thisMonth: 'Rs. 12,500',
      categoriesCount: 5,
      pendingCount: 2,
    }),
  }
)

const page = usePage()

// Get user dynamically from props or shared inertia page props
const currentUser = computed(() => {
  const shared = (page.props as any).user
  if (props.user?.fullName) return props.user
  if (shared?.fullName) return shared
  return {
    fullName: 'Finance Manager',
    email: 'finance@expensepro.com',
  }
})

// Logout handler
const logout = () => {
  router.post('/logout')
}

// Current date formatted nicely
const todayFormatted = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
})

// Budget allocation breakdown
const budgetSummary = {
  monthlyBudget: 'Rs. 80,000',
  usedAmount: 'Rs. 45,200',
  remainingAmount: 'Rs. 34,800',
  percentageUsed: 56.5,
}

// Category distribution
const categoryDistribution = [
  { name: 'Software & Tools', percent: 32, amount: 'Rs. 14,500', color: 'bg-indigo-600' },
  { name: 'Cloud Hosting', percent: 27, amount: 'Rs. 12,500', color: 'bg-purple-600' },
  { name: 'Utilities', percent: 18, amount: 'Rs. 8,400', color: 'bg-blue-600' },
  { name: 'Food & Dining', percent: 16, amount: 'Rs. 7,700', color: 'bg-emerald-600' },
  { name: 'Office Supplies', percent: 7, amount: 'Rs. 2,100', color: 'bg-amber-500' },
]

// Recent transactions
const recentExpenses = [
  {
    id: 1,
    title: 'Office Electricity Bill',
    category: 'Utilities',
    amount: 'Rs. 8,400',
    date: 'Today, 2:30 PM',
    status: 'Paid',
  },
  {
    id: 2,
    title: 'Team Lunch & Coffee',
    category: 'Food & Dining',
    amount: 'Rs. 3,200',
    date: 'Yesterday',
    status: 'Paid',
  },
  {
    id: 3,
    title: 'Figma Annual Subscription',
    category: 'Software & Tools',
    amount: 'Rs. 14,500',
    date: '28 Oct 2026',
    status: 'Paid',
  },
  {
    id: 4,
    title: 'AWS Cloud Hosting',
    category: 'Cloud Hosting',
    amount: 'Rs. 12,500',
    date: '20 Oct 2026',
    status: 'Pending',
  },
]
</script>

<template>
  <Head title="Dashboard - ExpensePro" />

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
            class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all bg-indigo-50 text-indigo-700 font-semibold shadow-2xs"
          >
            <LayoutDashboard :size="18" class="text-indigo-600" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/expenses"
            class="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
          >
            <div class="flex items-center gap-3">
              <Receipt :size="18" />
              <span>Expenses</span>
            </div>
            <span class="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">6</span>
          </Link>
        </nav>
      </div>

      <!-- User Profile & Working Logout Button -->
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
          <h1 class="text-base sm:text-lg font-bold text-slate-900">Dashboard Overview</h1>
          <p class="text-xs text-slate-500 hidden sm:block">Track monthly cash outflows, budget limits, and active recurring bills.</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <Clock :size="14" class="text-indigo-600" />
            <span>{{ todayFormatted }}</span>
          </div>

          <!-- Currency & Ledger indicator -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-700 text-xs font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Currency: PKR (₨)</span>
          </div>

          <Link
            href="/expenses"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-xl shadow-2xs transition"
          >
            <Plus :size="14" />
            <span>Record Expense</span>
          </Link>
        </div>
      </header>

      <!-- Dashboard Main Body -->
      <main class="p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        <!-- Stats Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <!-- Total Expense -->
          <div class="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Spent</span>
              <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet :size="18" />
              </div>
            </div>
            <h3 class="text-2xl font-extrabold text-slate-900 mt-3">{{ stats?.totalExpense }}</h3>
            <p class="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp :size="13" /> +8.4% vs last cycle
            </p>
          </div>

          <!-- This Month -->
          <div class="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">This Month</span>
              <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard :size="18" />
              </div>
            </div>
            <h3 class="text-2xl font-extrabold text-emerald-600 mt-3">{{ stats?.thisMonth }}</h3>
            <p class="text-xs text-slate-500 font-medium mt-1">Within allocated limit</p>
          </div>

          <!-- Active Categories -->
          <div class="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Categories</span>
              <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Tag :size="18" />
              </div>
            </div>
            <h3 class="text-2xl font-extrabold text-purple-600 mt-3">{{ stats?.categoriesCount }} Active</h3>
            <p class="text-xs text-slate-500 font-medium mt-1">All departments monitored</p>
          </div>

          <!-- Pending Bills -->
          <div class="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Invoices</span>
              <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle :size="18" />
              </div>
            </div>
            <h3 class="text-2xl font-extrabold text-amber-600 mt-3">{{ stats?.pendingCount }} Pending</h3>
            <p class="text-xs text-amber-600 font-medium mt-1">AWS Cloud Hosting</p>
          </div>
        </div>

        <!-- Monthly Budget & Allocation Progress Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Budget Progress Card -->
          <div class="lg:col-span-2 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 class="text-base font-bold text-slate-900">Monthly Budget Utilization</h3>
                <p class="text-xs text-slate-500 mt-0.5">Overall cap for November 2026</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500">Remaining Buffer:</span>
                <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                  {{ budgetSummary.remainingAmount }}
                </span>
              </div>
            </div>

            <div class="mt-5 space-y-2">
              <div class="flex justify-between items-baseline text-sm">
                <span class="font-bold text-slate-900">{{ budgetSummary.usedAmount }} spent</span>
                <span class="text-slate-500 text-xs">Total Limit: {{ budgetSummary.monthlyBudget }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  class="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  :style="{ width: `${budgetSummary.percentageUsed}%` }"
                ></div>
              </div>
              <div class="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span>{{ budgetSummary.percentageUsed }}% utilized</span>
                <span class="text-emerald-600 font-medium">Safe spending pace</span>
              </div>
            </div>

            <!-- Spending Insights Highlights -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-slate-500 block mb-1">Average Daily Spend</span>
                <span class="font-bold text-slate-950 text-sm">Rs. 1,506 / day</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-slate-500 block mb-1">Projected Month End</span>
                <span class="font-bold text-slate-950 text-sm">Rs. 58,400</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-slate-500 block mb-1">Largest Transaction</span>
                <span class="font-bold text-indigo-700 text-sm">Rs. 14,500</span>
              </div>
            </div>
          </div>

          <!-- Category Breakdown Widget -->
          <div class="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 class="text-sm font-bold text-slate-900">Spending by Category</h3>
                <PieChart :size="16" class="text-slate-400" />
              </div>
              <div class="mt-4 space-y-3">
                <div v-for="cat in categoryDistribution" :key="cat.name">
                  <div class="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>{{ cat.name }}</span>
                    <span class="font-bold">{{ cat.amount }}</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div :class="['h-1.5 rounded-full', cat.color]" :style="{ width: `${cat.percent}%` }"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>5 recorded sectors</span>
              <Link href="/expenses" class="text-indigo-600 font-semibold hover:underline">
                View breakdown &rarr;
              </Link>
            </div>
          </div>
        </div>

        <!-- Recent Expenses Section -->
        <div class="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 class="text-base font-bold text-slate-900">Recent Transactions</h3>
              <p class="text-xs text-slate-500 mt-0.5">Latest recorded expenses across all categories</p>
            </div>
            <Link
              href="/expenses"
              class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
            >
              <span>See Full Table</span>
              <ArrowRight :size="14" />
            </Link>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50/80 border-b border-slate-200/60 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th scope="col" class="py-3 px-5">Expense Title</th>
                  <th scope="col" class="py-3 px-5">Category</th>
                  <th scope="col" class="py-3 px-5">Date</th>
                  <th scope="col" class="py-3 px-5">Status</th>
                  <th scope="col" class="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="expense in recentExpenses"
                  :key="expense.id"
                  class="hover:bg-slate-50/70 transition-colors"
                >
                  <td class="py-3.5 px-5 font-semibold text-slate-900">
                    {{ expense.title }}
                  </td>
                  <td class="py-3.5 px-5">
                    <span class="inline-block text-xs font-medium px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                      {{ expense.category }}
                    </span>
                  </td>
                  <td class="py-3.5 px-5 text-xs text-slate-500">
                    {{ expense.date }}
                  </td>
                  <td class="py-3.5 px-5">
                    <span
                      v-if="expense.status === 'Paid'"
                      class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Paid
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Pending
                    </span>
                  </td>
                  <td class="py-3.5 px-5 text-right font-bold text-slate-900">
                    {{ expense.amount }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
