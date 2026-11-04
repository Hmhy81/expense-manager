<script setup>
import { ref, computed } from 'vue'
import { Head, Link, router, usePage } from '@inertiajs/vue3'
import AppLogo from '~/components/AppLogo.vue'
import AppToaster from '~/components/AppToaster.vue'
import ProjectModal from '~/components/ProjectModal.vue'
import { useActiveProject } from '~/composables/useActiveProject'
import { useSettings, resetThemeToDefault } from '~/composables/useSettings'
import { LayoutDashboard, Receipt, FolderKanban, LogOut, Clock, ChevronDown, Building2, Store } from 'lucide-vue-next'
import { Briefcase, Sprout, Car, Layers, Menu, X, Plus, Settings } from 'lucide-vue-next'

const props = defineProps({
  title: {
    type: String,
    default: 'Dashboard',
  },
  subtitle: {
    type: String,
    default: '',
  },
  activePage: {
    type: String,
    default: 'dashboard', // 'dashboard' | 'expenses' | 'projects'
  },
  expensesCount: {
    type: Number,
    default: null,
  },
})

const page = usePage()
const {
  projectsWithStats,
  activeProject,
  activeExpenses,
  getProjectIcon,
  switchProject: selectProjectById,
  createProject,
} = useActiveProject()
const { effectiveSettings } = useSettings()

const currentUser = computed(() => {
  const shared = page.props.user
  if (shared?.fullName) return shared
  return {
    fullName: 'Finance Manager',
    email: 'finance@expensepro.com',
  }
})

// Mobile Drawer State
const isMobileMenuOpen = ref(false)

// Project Switcher state
const isProjectDropdownOpen = ref(false)
const isNewProjectModalOpen = ref(false)

const switchProject = (proj) => {
  selectProjectById(proj.id)
  isProjectDropdownOpen.value = false
  isMobileMenuOpen.value = false
}

const openNewProjectModal = () => {
  isProjectDropdownOpen.value = false
  isMobileMenuOpen.value = false
  isNewProjectModalOpen.value = true
}

const handleSaveNewProject = (newProj) => {
  createProject(newProj)
  isNewProjectModalOpen.value = false
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

const logout = () => {
  resetThemeToDefault()
  router.post('/logout')
}
</script>

<template>
  <!-- Full Screen Viewport: Fixed height, no window-level scroll -->
  <div class="h-screen w-full overflow-hidden bg-slate-50 text-slate-800 flex flex-col md:flex-row">
    <!-- MOBILE TOP BAR (visible on < md) -->
    <header class="md:hidden h-16 bg-white border-b border-slate-200/90 px-4 flex items-center justify-between shrink-0 z-30 shadow-2xs">
      <AppLogo href="/dashboard" size="sm" />

      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <X v-if="isMobileMenuOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>
      </div>
    </header>

    <!-- MOBILE SIDEBAR DRAWER BACKDROP (visible when drawer open) -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
      @click="isMobileMenuOpen = false"
    />

    <!-- SIDEBAR: Fixed on Desktop with its own independent scroll, Slide-over drawer on Mobile -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between shadow-lg md:shadow-xs transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:w-64 md:h-full md:shrink-0',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Top Section of Sidebar (Logo + Project Switcher) -->
      <div class="shrink-0">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between">
          <AppLogo href="/dashboard" size="md" />
          <button
            type="button"
            @click="isMobileMenuOpen = false"
            class="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Project Switcher Box -->
        <div class="p-4 border-b border-slate-100">
          <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Active Project / Ledger
          </label>
          <div class="relative">
            <button
              type="button"
              @click="isProjectDropdownOpen = !isProjectDropdownOpen"
              class="w-full flex items-center justify-between gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 transition cursor-pointer text-left"
            >
              <div class="flex items-center gap-2 truncate">
                <component :is="getProjectIcon(activeProject?.type)" :size="15" class="text-indigo-600 shrink-0" />
                <span class="truncate">{{ activeProject?.name || 'No Project Created' }}</span>
              </div>
              <ChevronDown :size="14" class="text-slate-400 shrink-0" />
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isProjectDropdownOpen"
              class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 space-y-1 max-h-64 overflow-y-auto"
            >
              <div
                v-if="projectsWithStats.length === 0"
                class="px-2.5 py-3 text-xs text-slate-400 text-center font-medium"
              >
                No projects created yet
              </div>

              <button
                v-for="proj in projectsWithStats"
                :key="proj.id"
                type="button"
                @click="switchProject(proj)"
                :class="[
                  'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left',
                  activeProject?.id === proj.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50',
                ]"
              >
                <div class="flex items-center gap-2 truncate">
                  <component :is="proj.icon" :size="14" class="shrink-0" />
                  <span class="truncate">{{ proj.name }}</span>
                </div>
                <span v-if="activeProject?.id === proj.id" class="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
              </button>

              <!-- Divider & Create New Project CTA -->
              <div class="pt-1.5 border-t border-slate-100 mt-1">
                <button
                  type="button"
                  @click="openNewProjectModal"
                  class="w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition cursor-pointer text-left"
                >
                  <Plus :size="14" />
                  <span>Create New Project</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Middle Section: Navigation Links with Independent Scroll -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-1.5 overscroll-contain">
        <Link
          href="/dashboard"
          @click="isMobileMenuOpen = false"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all',
            activePage === 'dashboard'
              ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50',
          ]"
        >
          <LayoutDashboard :size="18" :class="activePage === 'dashboard' ? 'text-indigo-600' : ''" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/expenses"
          @click="isMobileMenuOpen = false"
          :class="[
            'flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all',
            activePage === 'expenses'
              ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50',
          ]"
        >
          <div class="flex items-center gap-3">
            <Receipt :size="18" :class="activePage === 'expenses' ? 'text-indigo-600' : ''" />
            <span>Payments & Ledger</span>
          </div>
          <span
            :class="[
              'text-[11px] font-semibold px-2 py-0.5 rounded-md',
              activePage === 'expenses' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600',
            ]"
          >
            {{ expensesCount !== null ? expensesCount : activeExpenses.length }}
          </span>
        </Link>

        <Link
          href="/projects"
          @click="isMobileMenuOpen = false"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all',
            activePage === 'projects'
              ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50',
          ]"
        >
          <FolderKanban :size="18" :class="activePage === 'projects' ? 'text-indigo-600' : ''" />
          <span>Projects & Ledgers</span>
        </Link>

        <Link
          href="/settings"
          @click="isMobileMenuOpen = false"
          :class="[
            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all',
            activePage === 'settings'
              ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50',
          ]"
        >
          <Settings :size="18" :class="activePage === 'settings' ? 'text-indigo-600' : ''" />
          <span>Settings & Appearance</span>
        </Link>
      </nav>

      <!-- Bottom Section: User Profile & Working Logout Button -->
      <div class="shrink-0 p-4 border-t border-slate-100 space-y-3 bg-white">
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

    <!-- MAIN CONTENT COLUMN: Independent viewport with internal scroll -->
    <div class="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
      <!-- Desktop Top Navbar (Sticky/Fixed Header) -->
      <header class="bg-white border-b border-slate-200/90 h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-2xs z-10">
        <div class="truncate mr-3">
          <h1 class="text-base sm:text-lg font-bold text-slate-900 truncate">{{ title }}</h1>
          <p v-if="subtitle" class="text-xs text-slate-500 hidden sm:block truncate">{{ subtitle }}</p>
        </div>

        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <!-- Active Project Indicator Pill -->
          <div class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-200/70 text-indigo-900 text-xs font-semibold truncate max-w-xs shadow-2xs">
            <component :is="getProjectIcon(activeProject?.type)" :size="14" class="text-indigo-600 shrink-0" />
            <span class="truncate">{{ activeProject?.name }}</span>
          </div>

          <div class="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
            <Clock :size="14" class="text-indigo-600" />
            <span>{{ todayFormatted }}</span>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-700 text-xs font-semibold">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{{ effectiveSettings.currency }} ({{ effectiveSettings.currencySymbol }})</span>
          </div>

          <slot name="actions" />
        </div>
      </header>

      <!-- MAIN BODY: Has its own independent scroll! Sidebar remains completely still! -->
      <main class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 space-y-6">
        <slot />
      </main>
    </div>

    <!-- Reusable Create Project Modal from anywhere in layout -->
    <ProjectModal
      :show="isNewProjectModalOpen"
      mode="create"
      @close="isNewProjectModalOpen = false"
      @save="handleSaveNewProject"
    />
    <!-- Global Toast Notification System -->
    <AppToaster />
  </div>
</template>
