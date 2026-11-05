<script setup>
import { ref } from 'vue'
import { Head, Link, router } from '@inertiajs/vue3'
import AppLayout from '~/components/AppLayout.vue'
import StatCard from '~/components/StatCard.vue'
import ExpenseModal from '~/components/ExpenseModal.vue'
import ReceiptModal from '~/components/ReceiptModal.vue'
import EmptyState from '~/components/EmptyState.vue'
import BudgetProgressBar from '~/components/BudgetProgressBar.vue'
import { useActiveProject } from '~/composables/useActiveProject'
import { useSettings } from '~/composables/useSettings'
import { Wallet, Receipt, FileText, AlertCircle, Plus, ArrowRight, PieChart, User, Paperclip, Sparkles, FolderKanban } from 'lucide-vue-next'

const props = defineProps({
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
  activeExpenses,
  activeCategories,
  activeStats,
  categoryDistribution,
  addExpense,
} = useActiveProject()
const { formatCurrency } = useSettings()

const selectedUserId = ref(props.filterUserId || '')

const handleUserFilterChange = () => {
  const query = {}
  if (selectedUserId.value) {
    query.filterUserId = selectedUserId.value
  }
  router.get('/dashboard', query, {
    preserveState: true,
    preserveScroll: true,
  })
}

// Modal states
const isAddModalOpen = ref(false)
const selectedReceipt = ref(null)
const isReceiptModalOpen = ref(false)

const openReceipt = (expense) => {
  selectedReceipt.value = {
    title: expense.title,
    vendor: expense.vendor,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,
    paymentMethod: expense.paymentMethod,
    notes: expense.notes,
    receiptUrl: expense.receiptUrl || '',
    receiptName: expense.receiptName,
  }
  isReceiptModalOpen.value = true
}

const handleSaveExpense = (newExpense) => {
  addExpense(newExpense)
  isAddModalOpen.value = false
}
</script>

<template>
  <Head :title="`${activeProject?.name || 'Dashboard'} - ExpensePro`" />

  <AppLayout
    :title="activeProject?.name || 'Project Financial Overview'"
    :subtitle="activeProject?.description || 'Live cumulative cost tracking, category breakdowns, and document archive.'"
    activePage="dashboard"
    :expensesCount="activeStats.totalCount"
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

      <button
        v-if="activeProject"
        type="button"
        @click="isAddModalOpen = true"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
      >
        <Plus :size="15" />
        <span>Record Payment</span>
      </button>

      <Link
        v-else
        href="/projects"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
      >
        <Plus :size="15" />
        <span>Create Project</span>
      </Link>
    </template>

    <!-- Empty Projects Onboarding State -->
    <EmptyState
      v-if="!activeProject"
      :icon="FolderKanban"
      title="No Projects Created Yet"
      description="Create your first project or ledger to start recording vouchers, monitoring budgets, and viewing financial insights."
      actionText="Create Your First Project"
      actionHref="/projects"
      dashed
    />

    <!-- Active Project Dashboard View -->
    <template v-else>
      <!-- 4 Reusable Metric StatCards Dynamically Scoped to Active Project -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Project Outflow"
          :value="formatCurrency(activeStats.totalSpent)"
          subtitle="Cumulative recorded expenditure"
          :icon="Wallet"
          color="indigo"
        />

        <StatCard
          title="Recorded Payments"
          :value="`${activeStats.totalCount} Entries`"
          subtitle="Vouchers in this project"
          :icon="Receipt"
          color="emerald"
        />

        <StatCard
          title="Verified Proofs"
          :value="`${activeStats.receiptsCount} Documents`"
          subtitle="Verified slips & receipts attached"
          :icon="FileText"
          color="purple"
        />

        <StatCard
          title="Pending Balance"
          :value="formatCurrency(activeStats.pendingTotal)"
          subtitle="Unsettled contractor / vendor bills"
          :icon="AlertCircle"
          color="amber"
        />
      </div>

      <!-- Target Budget Progress Banner (If Budget Exists) or Open Budget Card -->
      <div
        v-if="activeProject?.targetBudget && activeProject.targetBudget > 0"
        class="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div class="w-full sm:w-auto">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <h3 class="text-sm font-bold text-slate-900">Project Target Budget Progress</h3>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ formatCurrency(activeStats.totalSpent) }} spent of {{ formatCurrency(activeStats.targetBudget) }} planned target
          </p>
        </div>

        <div class="w-full sm:w-72">
          <BudgetProgressBar
            :spent="activeStats.totalSpent"
            :budget="activeProject.targetBudget"
            :percent="activeStats.budgetPercent"
          />
        </div>
      </div>

      <div
        v-else
        class="bg-purple-50/60 border border-purple-200/60 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs"
      >
        <div class="flex items-center gap-2.5 text-purple-900 font-medium">
          <Sparkles :size="16" class="text-purple-600 shrink-0" />
          <span>
            <strong>Open / Untracked Budget:</strong> No fixed budget cap is set for this project. Expenses will be tracked and aggregated in real time.
          </span>
        </div>
        <Link
          href="/projects"
          class="shrink-0 text-purple-700 font-bold hover:underline hover:text-purple-800"
        >
          Set Budget &rarr;
        </Link>
      </div>

      <!-- Category Allocation & Running Insights -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Cumulative Outflow Breakdown -->
        <div class="lg:col-span-2 bg-white border border-slate-200/90 p-6 rounded-2xl shadow-2xs">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-900">Cost Distribution by Category</h3>
              <p class="text-xs text-slate-500 mt-0.5">Where your money is being spent in this project</p>
            </div>
            <Link href="/expenses" class="text-xs font-semibold text-indigo-600 hover:underline">
              View full ledger &rarr;
            </Link>
          </div>

          <div v-if="categoryDistribution.length > 0" class="mt-5 space-y-4">
            <div v-for="cat in categoryDistribution" :key="cat.name">
              <div class="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span class="font-semibold text-slate-900">{{ cat.name }}</span>
                <span class="font-extrabold text-indigo-700">{{ formatCurrency(cat.rawAmount || cat.amount) }} ({{ cat.percent }}%)</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div :class="['h-2.5 rounded-full transition-all duration-500', cat.color]" :style="{ width: `${cat.percent}%` }"></div>
              </div>
            </div>
          </div>

          <div v-else class="py-12 text-center text-xs text-slate-400">
            No expenses recorded yet. Click "Record Payment" above to start logging expenditures.
          </div>
        </div>

        <!-- Quick Summary Card -->
        <div class="bg-white border border-slate-200/90 p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="text-sm font-bold text-slate-900">Project Highlights</h3>
              <PieChart :size="16" class="text-slate-400" />
            </div>

            <div class="mt-4 space-y-3.5 text-xs text-slate-600">
              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-slate-400 block mb-0.5">Primary Spending Area</span>
                <span class="font-bold text-slate-900 text-sm">
                  {{ categoryDistribution[0]?.name ? `${categoryDistribution[0].name} (${categoryDistribution[0].percent}%)` : 'None yet' }}
                </span>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-slate-400 block mb-0.5">Latest Activity</span>
                <span class="font-bold text-slate-900 text-sm truncate block">
                  {{ activeExpenses[0] ? `${activeExpenses[0].title} (Rs. ${Number(activeExpenses[0].amount).toLocaleString()})` : 'No transactions recorded' }}
                </span>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span class="text-slate-400 block mb-0.5">Proof Slips Ratio</span>
                <span class="font-bold text-emerald-700 text-sm">
                  {{ activeStats.totalCount > 0 ? Math.round((activeStats.receiptsCount / activeStats.totalCount) * 100) : 0 }}% payments have slips
                </span>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100">
            <button
              type="button"
              @click="isAddModalOpen = true"
              class="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition cursor-pointer text-center"
            >
              + Record Payment in This Project
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Transactions Table -->
      <div class="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-900">Recent Payment Records</h3>
            <p class="text-xs text-slate-500 mt-0.5">Filtered specifically for {{ activeProject?.name }}</p>
          </div>
          <Link
            href="/expenses"
            class="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
          >
            <span>Open Full Ledger</span>
            <ArrowRight :size="14" />
          </Link>
        </div>

        <div class="overflow-x-auto">
          <table v-if="activeExpenses.length > 0" class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50/80 border-b border-slate-200/60 text-xs font-bold text-slate-700 tracking-wider">
              <tr>
                <th scope="col" class="py-3 px-5">Item</th>
                <th scope="col" class="py-3 px-5">Vendor</th>
                <th scope="col" class="py-3 px-5">Category</th>
                <th scope="col" class="py-3 px-5">Receipt Slip</th>
                <th scope="col" class="py-3 px-5">Date</th>
                <th scope="col" class="py-3 px-5 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="expense in activeExpenses.slice(0, 5)"
                :key="expense.id"
                class="hover:bg-slate-50/70 transition-colors"
              >
                <td class="py-3.5 px-5 font-semibold text-slate-900">
                  {{ expense.title }}
                </td>
                <td class="py-3.5 px-5 text-xs text-slate-600">
                  <span class="inline-flex items-center gap-1">
                    <User :size="12" class="text-slate-400" />
                    {{ expense.vendor || 'Direct Purchase' }}
                  </span>
                </td>
                <td class="py-3.5 px-5">
                  <span class="inline-block text-xs font-medium px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                    {{ expense.category }}
                  </span>
                </td>
                <!-- Receipt Preview Button -->
                <td class="py-3.5 px-5">
                  <button
                    v-if="expense.hasReceipt"
                    type="button"
                    @click="openReceipt(expense)"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition cursor-pointer"
                    title="View attached receipt slip"
                  >
                    <Paperclip :size="12" />
                    <span>View Slip</span>
                  </button>
                  <span v-else class="text-xs text-slate-400 font-normal">
                    No slip
                  </span>
                </td>
                <td class="py-3.5 px-5 text-xs text-slate-500">
                  {{ expense.date }}
                </td>
                <td class="py-3.5 px-5 text-right font-bold text-slate-900">
                  {{ formatCurrency(expense.amount) }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty state when no transactions exist in this project -->
          <div v-else class="p-8">
            <EmptyState
              :icon="Receipt"
              title="No expenses recorded"
              :description="`No expenses recorded for ${activeProject?.name || 'this project'} yet. Click 'Record Payment' to add your first expense voucher.`"
              actionText="Record Payment"
              @action="isAddModalOpen = true"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Reusable Add/Edit Expense Modal -->
    <ExpenseModal
      v-if="activeProject"
      :show="isAddModalOpen"
      mode="add"
      :categories="activeCategories"
      @close="isAddModalOpen = false"
      @save="handleSaveExpense"
    />

    <!-- Reusable Receipt Modal -->
    <ReceiptModal
      :show="isReceiptModalOpen"
      :receipt="selectedReceipt"
      @close="isReceiptModalOpen = false"
    />
  </AppLayout>
</template>
