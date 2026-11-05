<script setup>
import { ref, computed } from 'vue'
import { Head, router } from '@inertiajs/vue3'
import AppLayout from '~/components/AppLayout.vue'
import StatCard from '~/components/StatCard.vue'
import ProjectModal from '~/components/ProjectModal.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import EmptyState from '~/components/EmptyState.vue'
import BudgetProgressBar from '~/components/BudgetProgressBar.vue'
import { useActiveProject } from '~/composables/useActiveProject'
import { useSettings } from '~/composables/useSettings'
import { FolderKanban, Plus, Search, Receipt, CheckCircle2, MapPin, TrendingUp, ArrowRight, Edit2, Trash2, Sparkles, Check } from 'lucide-vue-next'

const {
  projectsWithStats,
  activeProject,
  switchProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectIcon,
} = useActiveProject()
const { formatCurrency } = useSettings()

// Search & Filter state
const searchQuery = ref('')
const selectedType = ref('All')
const selectedStatus = ref('All')

// Modals State
const isProjectModalOpen = ref(false)
const projectModalMode = ref('create')
const selectedProject = ref(null)

const isConfirmModalOpen = ref(false)
const projectToDelete = ref(null)

// Filtered Projects
const filteredProjects = computed(() => {
  return projectsWithStats.value.filter((proj) => {
    const matchesSearch =
      proj.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (proj.location && proj.location.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      proj.type.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesType = selectedType.value === 'All' || proj.type === selectedType.value
    const matchesStatus = selectedStatus.value === 'All' || proj.status === selectedStatus.value

    return matchesSearch && matchesType && matchesStatus
  })
})

// Overall Metrics across all projects (Utilizing the SQL pre-aggregated stats in projectsWithStats)
const totalPortfoliosCount = computed(() => projectsWithStats.value.length)
const totalSpentSum = computed(() => {
  return projectsWithStats.value.reduce((acc, curr) => acc + (curr.totalSpent || 0), 0)
})
const totalReceiptsSum = computed(() => {
  return projectsWithStats.value.reduce((acc, curr) => acc + (curr.receiptsCount || 0), 0)
})
const openBudgetCount = computed(() => {
  return projectsWithStats.value.filter((p) => !p.targetBudget).length
})

// Handlers
const openCreateModal = () => {
  selectedProject.value = null
  projectModalMode.value = 'create'
  isProjectModalOpen.value = true
}

const openEditModal = (proj) => {
  selectedProject.value = { ...proj }
  projectModalMode.value = 'edit'
  isProjectModalOpen.value = true
}

const handleSaveProject = (data) => {
  if (projectModalMode.value === 'create') {
    createProject(data)
  } else {
    updateProject(data)
  }
  isProjectModalOpen.value = false
}

const promptDeleteProject = (proj) => {
  projectToDelete.value = proj
  isConfirmModalOpen.value = true
}

const handleConfirmDelete = () => {
  if (projectToDelete.value) {
    deleteProject(projectToDelete.value.id)
    projectToDelete.value = null
  }
  isConfirmModalOpen.value = false
}

// Select project and navigate to its ledger
const openProjectLedger = (proj) => {
  router.visit(`/expenses?projectId=${proj.id}`)
}
</script>

<template>
  <Head title="Projects & Ledgers - ExpensePro" />

  <AppLayout
    title="Projects & Ledgers"
    subtitle="Manage multiple construction sites, retail stores, farms, or customized portfolios"
    activePage="projects"
  >
    <template #actions>
      <button
        type="button"
        @click="openCreateModal"
        class="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
      >
        <Plus :size="16" />
        <span class="hidden sm:inline">Create New Project</span>
        <span class="sm:hidden">New Project</span>
      </button>
    </template>

    <!-- TOP KPI STAT CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Portfolios"
        :value="String(totalPortfoliosCount)"
        subtext="Separate client/site ledgers"
        trend="Multi-Ledger"
        trendDirection="neutral"
        :icon="FolderKanban"
        color="indigo"
      />
      <StatCard
        title="Total Capital Logged"
        :value="formatCurrency(totalSpentSum)"
        subtext="Combined recorded spend"
        trend="Live Ledger"
        trendDirection="up"
        :icon="TrendingUp"
        color="emerald"
      />
      <StatCard
        title="Verified Proofs"
        :value="String(totalReceiptsSum)"
        subtext="Bills & vouchers attached"
        trend="Audit Ready"
        trendDirection="neutral"
        :icon="CheckCircle2"
        color="amber"
      />
      <StatCard
        title="Open Budget Portfolios"
        :value="`${openBudgetCount} Ledgers`"
        subtext="Untracked / spend-as-you-go"
        trend="Flexible"
        trendDirection="neutral"
        :icon="Sparkles"
        color="purple"
      />
    </div>

    <!-- FILTER & SEARCH TOOLBAR -->
    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
      <div class="relative w-full md:w-96">
        <Search :size="16" class="absolute left-3.5 top-3 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by project name, location or type..."
          class="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
        />
      </div>

      <div class="flex items-center gap-2.5 w-full md:w-auto">
        <!-- Type Filter -->
        <select
          v-model="selectedType"
          class="px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition cursor-pointer"
        >
          <option value="All">All Types</option>
          <option value="Construction">Construction</option>
          <option value="Retail Business">Retail Store</option>
          <option value="Agriculture">Agriculture</option>
          <option value="Business Venture">Business</option>
          <option value="Vehicle & Fleet">Vehicle Asset</option>
          <option value="Other Ledger">Other</option>
        </select>

        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          class="px-3 py-2 text-xs font-medium bg-slate-50 hover:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 transition cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active Only</option>
          <option value="Completed">Completed Only</option>
        </select>
      </div>
    </div>

    <!-- PROJECTS GRID -->
    <div v-if="filteredProjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="proj in filteredProjects"
        :key="proj.id"
        class="bg-white rounded-2xl border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
        :class="activeProject?.id === proj.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200/90'"
      >
        <!-- Card Header -->
        <div class="p-5 pb-4">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <component :is="getProjectIcon(proj.type)" :size="22" />
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span
                v-if="activeProject?.id === proj.id"
                class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1"
              >
                <Check :size="11" />
                <span>ACTIVE</span>
              </span>

              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5',
                  proj.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-slate-100 text-slate-600 border border-slate-200',
                ]"
              >
                <span
                  v-if="proj.status === 'Active'"
                  class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                ></span>
                {{ proj.status }}
              </span>

              <!-- Action Menu: Edit / Delete -->
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="openEditModal(proj)"
                  class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  title="Edit project"
                >
                  <Edit2 :size="14" />
                </button>
                <button
                  type="button"
                  @click="promptDeleteProject(proj)"
                  class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Delete project"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- Project Title & Location -->
          <h3 class="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {{ proj.name }}
          </h3>
          <p v-if="proj.location" class="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
            <MapPin :size="13" class="text-slate-400 shrink-0" />
            <span class="truncate">{{ proj.location }}</span>
          </p>
          <p v-if="proj.description" class="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {{ proj.description }}
          </p>
        </div>

        <!-- Budget & Spend Tracking Block (Reusable Component) -->
        <div class="px-5 py-3.5 bg-slate-50/70 border-t border-b border-slate-100 space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 font-medium">Recorded Outflow:</span>
            <span class="font-bold text-slate-900 text-sm">
              {{ formatCurrency(proj.totalSpent) }}
            </span>
          </div>

          <BudgetProgressBar
            :spent="proj.totalSpent"
            :budget="proj.targetBudget"
            compact
          />
        </div>

        <!-- Card Footer -->
        <div class="p-4 px-5 flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-2">
            <span class="flex items-center gap-1 font-medium text-slate-700">
              <Receipt :size="13" class="text-slate-400" />
              {{ proj.entriesCount || 0 }} vouchers
            </span>
            <span>&bull;</span>
            <span class="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 :size="13" />
              {{ proj.receiptsCount || 0 }} proofs
            </span>
          </div>

          <button
            type="button"
            @click="openProjectLedger(proj)"
            class="font-bold flex items-center gap-1 cursor-pointer transition"
            :class="activeProject?.id === proj.id ? 'text-indigo-600 hover:text-indigo-700 hover:underline' : 'text-slate-600 hover:text-indigo-600'"
          >
            <span>{{ activeProject?.id === proj.id ? 'Open Ledger' : 'Switch & Open' }}</span>
            <ArrowRight :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- EMPTY STATE -->
    <div v-else class="p-8">
      <EmptyState
        :icon="FolderKanban"
        title="No project portfolios found"
        description="No projects found matching the active filter. Create a new project portfolio to start recording vouchers and managing budgets."
        actionText="Create Project Ledger"
        @action="openCreateModal"
        dashed
      />
    </div>

    <!-- Reusable Project Modal -->
    <ProjectModal
      :show="isProjectModalOpen"
      :project="selectedProject"
      :mode="projectModalMode"
      @close="isProjectModalOpen = false"
      @save="handleSaveProject"
    />

    <!-- Reusable Confirmation Modal -->
    <ConfirmModal
      :show="isConfirmModalOpen"
      title="Delete Project Ledger"
      :message="`Are you sure you want to delete '${projectToDelete?.name}'? All related payments and ledger history will be removed.`"
      confirmText="Yes, Delete Ledger"
      variant="danger"
      @confirm="handleConfirmDelete"
      @close="isConfirmModalOpen = false"
    />
  </AppLayout>
</template>
