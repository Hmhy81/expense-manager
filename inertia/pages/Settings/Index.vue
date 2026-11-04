<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Head } from '@inertiajs/vue3'
import AppLayout from '~/components/AppLayout.vue'
import ConfirmModal from '~/components/ConfirmModal.vue'
import { useActiveProject } from '~/composables/useActiveProject'
import { useSettings, availableThemes, availableCurrencies, formatAmountWithSettings, applyThemeCSS } from '~/composables/useSettings'
import { Palette, Coins, Sliders, Check, Globe, FolderKanban, UploadCloud, RotateCcw, Building2 } from 'lucide-vue-next'
import { CheckCircle2, AlertTriangle, ShieldAlert, Info, Zap } from 'lucide-vue-next'

const { projectsWithStats, activeProject, activeProjectId } = useActiveProject()
const {
  globalSettings,
  projectSettingsMap,
  effectiveSettings,
  currentTheme,
  getProjectConfigDetails,
  applySettings,
  resetProjectSettings,
  resetAllToDefaults,
} = useSettings()

// Active Tab: 'theme' | 'branding' | 'currency'
const activeTab = ref('theme')

// Target Scope: 'all' | 'active' | 'selected'
const targetScope = ref('active')
const selectedMultiProjectIds = ref([activeProjectId.value])

// Safe overwrite control for Global scope
const preserveCustomOnGlobalSave = ref(true)

// Local Working Form (cloned from effectiveSettings)
const form = ref({ ...effectiveSettings.value })

// Refresh form when active project changes
watch(
  effectiveSettings,
  (val) => {
    form.value = { ...val }
  },
  { immediate: true }
)

// List of projects that currently have pre-existing custom overrides
const customizedProjects = computed(() => {
  return projectsWithStats.value.filter((p) => Boolean(projectSettingsMap.value && projectSettingsMap.value[p.id]))
})

// Details for currently active project
const activeProjectDetails = computed(() => {
  return getProjectConfigDetails(activeProjectId.value)
})

// Projects that will be affected/overwritten based on current target scope & choices
const affectedCustomProjects = computed(() => {
  if (targetScope.value === 'all') {
    return preserveCustomOnGlobalSave.value ? [] : customizedProjects.value
  }
  if (targetScope.value === 'active') {
    return activeProjectDetails.value.isOverridden ? [activeProject.value] : []
  }
  if (targetScope.value === 'selected') {
    return projectsWithStats.value.filter(
      (p) => selectedMultiProjectIds.value.includes(p.id) && Boolean(projectSettingsMap.value && projectSettingsMap.value[p.id])
    )
  }
  return []
})

const willOverwriteCustom = computed(() => affectedCustomProjects.value.length > 0)

// Currency Auto-preset handler
const handleCurrencyChange = (code) => {
  const found = availableCurrencies.find((c) => c.code === code)
  if (found) {
    form.value.currency = found.code
    form.value.currencySymbol = found.symbol
    form.value.symbolPosition = found.defaultPosition
    form.value.numberSystem = found.defaultSystem
  }
}

// Logo image upload handler
const handleLogoUpload = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      form.value.logoUrl = event.target.result
      form.value.logoMode = 'image'
    }
    reader.readAsDataURL(file)
  }
}

// Live preview formatted amount
const sampleFormattedAmount = computed(() => {
  return formatAmountWithSettings(1485000, form.value)
})

// Current theme object for preview
const previewTheme = computed(() => {
  return availableThemes.find((t) => t.id === form.value.themeId) || availableThemes[0]
})

// Instant live-preview across the layout when clicking any theme swatch
const selectTheme = (thm) => {
  form.value.themeId = thm.id
  applyThemeCSS(thm)
}

onBeforeUnmount(() => {
  // Restore saved active theme if user leaves without saving
  applyThemeCSS(currentTheme.value)
})

// Confirmation Modals State
const isOverwriteConfirmModalOpen = ref(false)
const isRevertConfirmModalOpen = ref(false)
const isResetModalOpen = ref(false)

const handleSaveClick = () => {
  if (willOverwriteCustom.value) {
    isOverwriteConfirmModalOpen.value = true
  } else {
    executeSave()
  }
}

const executeSave = () => {
  applySettings(
    targetScope.value,
    form.value,
    selectedMultiProjectIds.value,
    targetScope.value === 'all' ? preserveCustomOnGlobalSave.value : false
  )
  isOverwriteConfirmModalOpen.value = false
}

const handleConfirmRevertActiveProject = () => {
  resetProjectSettings(activeProjectId.value)
  isRevertConfirmModalOpen.value = false
}

const handleConfirmResetAll = () => {
  if (targetScope.value === 'active') {
    resetProjectSettings(activeProjectId.value)
  } else {
    resetAllToDefaults()
  }
  isResetModalOpen.value = false
}
</script>

<template>
  <Head title="Settings & Appearance - ExpensePro" />

  <AppLayout
    title="Settings & Customization"
    subtitle="Configure brand styling, custom color skins, and currency rules per project or globally"
    activePage="settings"
  >
    <!-- TOP ACTIONS SLOT -->
    <template #actions>
      <button
        type="button"
        @click="isResetModalOpen = true"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs"
      >
        <RotateCcw :size="13" />
        <span>Reset Defaults</span>
      </button>

      <button
        type="button"
        @click="handleSaveClick"
        class="inline-flex items-center gap-1.5 px-4 py-1.5 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs hover:shadow"
        :style="{ backgroundColor: previewTheme.primary }"
      >
        <Check :size="14" />
        <span>Save Settings</span>
      </button>
    </template>

    <!-- 1. TARGET SCOPE SELECTOR & PRE-EXISTING CONFIG AWARENESS -->
    <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders :size="16" class="text-indigo-600" />
            <span>Target Application Scope</span>
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Choose whether to update baseline defaults globally, or apply custom themes to specific ledgers.
          </p>
        </div>

        <!-- Overrides counter badge -->
        <div class="flex items-center gap-2">
          <span
            v-if="customizedProjects.length > 0"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-semibold"
          >
            <Zap :size="13" class="text-amber-600" />
            <span>{{ customizedProjects.length }} Project{{ customizedProjects.length > 1 ? 's' : '' }} with Custom Settings</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <Globe :size="13" class="text-slate-500" />
            <span>All Projects on Global Default</span>
          </span>
        </div>
      </div>

      <!-- Scope Radios Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- Option 1: Global All Projects -->
        <button
          type="button"
          @click="targetScope = 'all'"
          :class="[
            'p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer',
            targetScope === 'all'
              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700',
          ]"
        >
          <Globe :size="18" :class="targetScope === 'all' ? 'text-indigo-600' : 'text-slate-400'" class="shrink-0 mt-0.5" />
          <div class="min-w-0">
            <span class="block text-xs font-bold">All Projects (Global Default)</span>
            <span class="block text-[11px] text-slate-500 mt-0.5 leading-snug">
              Sets baseline configuration for all ledgers and newly created projects.
            </span>
          </div>
        </button>

        <!-- Option 2: Active Project Only -->
        <button
          type="button"
          @click="targetScope = 'active'"
          :class="[
            'p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer',
            targetScope === 'active'
              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700',
          ]"
        >
          <Building2 :size="18" :class="targetScope === 'active' ? 'text-indigo-600' : 'text-slate-400'" class="shrink-0 mt-0.5" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <span class="block text-xs font-bold truncate">Current Project Only</span>
              <span
                v-if="activeProjectDetails.isOverridden"
                class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800"
              >
                Custom
              </span>
            </div>
            <span class="block text-[11px] text-indigo-600 font-semibold truncate mt-0.5">
              {{ activeProject?.name }}
            </span>
          </div>
        </button>

        <!-- Option 3: Multiple Selected Projects -->
        <button
          type="button"
          @click="targetScope = 'selected'"
          :class="[
            'p-3.5 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer',
            targetScope === 'selected'
              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600'
              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 text-slate-700',
          ]"
        >
          <FolderKanban :size="18" :class="targetScope === 'selected' ? 'text-indigo-600' : 'text-slate-400'" class="shrink-0 mt-0.5" />
          <div class="min-w-0">
            <span class="block text-xs font-bold">Selected Multiple Projects</span>
            <span class="block text-[11px] text-slate-500 mt-0.5 leading-snug">
              Choose specific sites or portfolios to update simultaneously.
            </span>
          </div>
        </button>
      </div>

      <!-- Scope Detail Box 1: Global Scope with Pre-existing Custom Overrides Warning -->
      <div
        v-if="targetScope === 'all' && customizedProjects.length > 0"
        class="p-4 rounded-xl border border-amber-200 bg-amber-50/80 text-xs text-amber-950 space-y-2.5"
      >
        <div class="flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle :size="16" class="text-amber-600 shrink-0" />
          <span>Pre-existing Custom Overrides Detected ({{ customizedProjects.length }} Project{{ customizedProjects.length > 1 ? 's' : '' }})</span>
        </div>
        <p class="text-slate-700 leading-relaxed">
          The following project(s) already have dedicated custom settings:
          <strong class="text-slate-900">{{ customizedProjects.map((p) => p.name).join(', ') }}</strong>.
          Choose how you want to handle these customized projects:
        </p>
        <div class="pt-1 flex flex-col sm:flex-row gap-3">
          <label class="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-amber-200 cursor-pointer text-xs">
            <input
              type="radio"
              :value="true"
              v-model="preserveCustomOnGlobalSave"
              class="mt-0.5 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span class="font-bold text-slate-900 block">Preserve Custom Projects (Recommended)</span>
              <span class="text-slate-500 text-[11px] block mt-0.5">
                New global settings will only apply to projects currently following Global Default.
              </span>
            </div>
          </label>

          <label class="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-rose-200 cursor-pointer text-xs">
            <input
              type="radio"
              :value="false"
              v-model="preserveCustomOnGlobalSave"
              class="mt-0.5 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <span class="font-bold text-rose-800 block">Overwrite &amp; Reset All Custom Projects</span>
              <span class="text-slate-500 text-[11px] block mt-0.5">
                Wipes individual overrides on all projects and forces this new global configuration everywhere.
              </span>
            </div>
          </label>
        </div>
      </div>

      <!-- Scope Detail Box 2: Active Project Pre-existing Status -->
      <div v-if="targetScope === 'active'" class="pt-1">
        <div
          v-if="activeProjectDetails.isOverridden"
          class="p-4 rounded-xl border border-amber-200/90 bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2 font-bold text-amber-900">
              <Zap :size="15" class="text-amber-600" />
              <span>'{{ activeProject?.name }}' Currently Has Custom Settings</span>
            </div>
            <p class="text-slate-600">
              Active configuration:
              <span class="font-bold text-slate-900">{{ activeProjectDetails.theme.name }}</span> theme &bull;
              <span class="font-bold text-slate-900">{{ activeProjectDetails.currency.code }} ({{ activeProjectDetails.currency.symbol }})</span> &bull;
              <span class="font-bold text-slate-900">
                {{ activeProjectDetails.settings.logoMode === 'image' ? 'Uploaded Image Logo' : activeProjectDetails.settings.brandName }}
              </span>
            </p>
          </div>
          <button
            type="button"
            @click="isRevertConfirmModalOpen = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shrink-0 transition shadow-2xs cursor-pointer"
          >
            <RotateCcw :size="13" />
            <span>Revert to Global</span>
          </button>
        </div>

        <div
          v-else
          class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-600 flex items-center gap-2.5"
        >
          <Info :size="16" class="text-slate-400 shrink-0" />
          <span>
            <strong>'{{ activeProject?.name }}'</strong> is currently using <strong>Global Default</strong> settings. Saving changes will attach a dedicated override specifically for this project.
          </span>
        </div>
      </div>

      <!-- Scope Detail Box 3: Multi-Select with Pre-existing Configuration Badges -->
      <div v-if="targetScope === 'selected'" class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-bold text-slate-700">Select target projects to update:</label>
          <span class="text-[11px] text-slate-400">
            {{ selectedMultiProjectIds.length }} of {{ projectsWithStats.length }} selected
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          <label
            v-for="p in projectsWithStats"
            :key="p.id"
            :class="[
              'p-2.5 rounded-xl border text-xs cursor-pointer transition flex flex-col justify-between gap-1.5',
              selectedMultiProjectIds.includes(p.id) ? 'bg-white border-indigo-600 ring-1 ring-indigo-600/30' : 'bg-white border-slate-200 hover:border-slate-300',
            ]"
          >
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :value="p.id"
                v-model="selectedMultiProjectIds"
                class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
              />
              <span class="font-bold text-slate-900 truncate">{{ p.name }}</span>
            </div>

            <!-- Existing Configuration Status Badge -->
            <div class="flex items-center justify-between pl-5">
              <span
                v-if="projectSettingsMap[p.id]"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"
                :title="`Current custom settings: ${getProjectConfigDetails(p.id).theme.name} • ${getProjectConfigDetails(p.id).currency.code}`"
              >
                <Zap :size="10" />
                <span>Custom: {{ getProjectConfigDetails(p.id).theme.name }} &bull; {{ getProjectConfigDetails(p.id).currency.code }}</span>
              </span>

              <span
                v-else
                class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
              >
                Global Default
              </span>

              <span
                v-if="selectedMultiProjectIds.includes(p.id) && projectSettingsMap[p.id]"
                class="text-[10px] font-bold text-amber-700"
                title="Saving will overwrite this project's existing custom settings"
              >
                Overwrite
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- 2. TABS NAVIGATION -->
    <div class="flex items-center gap-2 border-b border-slate-200/90 pb-2 text-xs sm:text-sm font-semibold">
      <button
        type="button"
        @click="activeTab = 'theme'"
        :class="[
          'px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer',
          activeTab === 'theme' ? 'bg-white shadow-2xs font-bold text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <Palette :size="16" :style="{ color: previewTheme.primary }" />
        <span>Theme &amp; Color Combinations</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'branding'"
        :class="[
          'px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer',
          activeTab === 'branding' ? 'bg-white shadow-2xs font-bold text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <Building2 :size="16" />
        <span>Branding &amp; Logo</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'currency'"
        :class="[
          'px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer',
          activeTab === 'currency' ? 'bg-white shadow-2xs font-bold text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        <Coins :size="16" />
        <span>Currency &amp; Formats</span>
      </button>
    </div>

    <!-- 3. TAB 1: THEME & COLOR COMBINATIONS -->
    <div v-if="activeTab === 'theme'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Palettes Selector (2 Cols) -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Choose Project Color Theme</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Buttons, badges, highlights, and active elements adapt in real time to your selected color personality.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            v-for="thm in availableThemes"
            :key="thm.id"
            type="button"
            @click="selectTheme(thm)"
            :class="[
              'p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer group',
              form.themeId === thm.id
                ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white',
            ]"
          >
            <div class="flex items-center gap-3">
              <!-- Swatch Circle -->
              <span
                class="w-7 h-7 rounded-xl shadow-xs shrink-0 flex items-center justify-center text-white"
                :style="{ backgroundColor: thm.primary }"
              >
                <Check v-if="form.themeId === thm.id" :size="13" />
              </span>
              <div>
                <span class="block text-xs font-bold text-slate-900">{{ thm.name }}</span>
                <span class="block text-[10px] text-slate-400">{{ thm.tag }}</span>
              </div>
            </div>

            <!-- Mini Swatch preview -->
            <div class="flex items-center gap-1">
              <span class="w-3.5 h-3.5 rounded-full" :style="{ backgroundColor: thm.primary }"></span>
              <span class="w-3.5 h-3.5 rounded-full" :style="{ backgroundColor: thm.light }"></span>
            </div>
          </button>
        </div>
      </div>

      <!-- Live Theme Preview Widget (1 Col) -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Live Skin Preview</h4>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" :style="{ backgroundColor: previewTheme.light, color: previewTheme.text }">
              {{ previewTheme.name }}
            </span>
          </div>

          <div class="mt-4 p-4 rounded-xl space-y-3 border" :style="{ backgroundColor: previewTheme.light, borderColor: previewTheme.ring + '40' }">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold" :style="{ color: previewTheme.text }">Primary Button</span>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs"
                :style="{ backgroundColor: previewTheme.primary }"
              >
                Active Action
              </button>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-200/50">
              <span class="text-xs font-bold" :style="{ color: previewTheme.text }">Badge Tag</span>
              <span
                class="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                :style="{ backgroundColor: previewTheme.primary, color: '#FFFFFF' }"
              >
                Verified
              </span>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-200/50">
              <span class="text-xs font-bold" :style="{ color: previewTheme.text }">Metric Stat</span>
              <span class="text-base font-extrabold" :style="{ color: previewTheme.primary }">
                {{ sampleFormattedAmount }}
              </span>
            </div>
          </div>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-snug border border-slate-100">
          Clicking any palette instantly updates the application shell, top bar, and active buttons for real-time evaluation.
        </div>
      </div>
    </div>

    <!-- 4. TAB 2: BRANDING & LOGO -->
    <div v-if="activeTab === 'branding'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Custom Firm Name &amp; Logo</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Display your company or project brand in headers, navigation sidebar, and printed financial receipt slips.
          </p>
        </div>

        <!-- Logo Mode Radio -->
        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Logo Display Mode</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <label
              :class="[
                'p-3 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center gap-2',
                form.logoMode === 'default' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
              ]"
            >
              <input type="radio" value="default" v-model="form.logoMode" class="text-indigo-600" />
              <span>Standard ExpensePro</span>
            </label>

            <label
              :class="[
                'p-3 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center gap-2',
                form.logoMode === 'text' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
              ]"
            >
              <input type="radio" value="text" v-model="form.logoMode" class="text-indigo-600" />
              <span>Custom Text &amp; Subtitle</span>
            </label>

            <label
              :class="[
                'p-3 rounded-xl border text-xs font-medium cursor-pointer transition flex items-center gap-2',
                form.logoMode === 'image' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
              ]"
            >
              <input type="radio" value="image" v-model="form.logoMode" class="text-indigo-600" />
              <span>Upload Custom Image</span>
            </label>
          </div>
        </div>

        <!-- Custom Text Inputs -->
        <div class="space-y-3 pt-1">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Company / Firm / Ledger Name</label>
            <input
              v-model="form.brandName"
              type="text"
              placeholder="e.g. Al-Rehman Builders or Green Fields Agro"
              class="w-full px-3.5 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Tagline or Subtitle</label>
            <input
              v-model="form.brandSubtitle"
              type="text"
              placeholder="e.g. Construction &amp; Civil Engineering Ledger"
              class="w-full px-3.5 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
        </div>

        <!-- Logo Upload Area -->
        <div v-if="form.logoMode === 'image'" class="space-y-2 pt-2 border-t border-slate-100">
          <label class="block text-xs font-bold text-slate-700">Upload Image File (PNG, SVG, JPG)</label>
          <div class="flex items-center gap-4">
            <div
              v-if="form.logoUrl"
              class="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs"
            >
              <img :src="form.logoUrl" alt="Brand Logo Preview" class="max-w-full max-h-full object-contain" />
            </div>

            <div class="flex-1">
              <label class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition">
                <UploadCloud :size="16" />
                <span>Choose Logo File</span>
                <input type="file" accept="image/*" @change="handleLogoUpload" class="hidden" />
              </label>
              <p class="text-[11px] text-slate-400 mt-1">Recommended square dimension, under 1MB.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Brand Preview Card -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
          Portal Header Preview
        </h4>

        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <!-- Logo Display -->
          <div
            v-if="form.logoMode === 'image' && form.logoUrl"
            class="w-10 h-10 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-xs"
          >
            <img :src="form.logoUrl" alt="Logo" class="max-w-full max-h-full object-contain" />
          </div>
          <div
            v-else
            class="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
            :style="{ backgroundColor: previewTheme.primary }"
          >
            <Building2 :size="18" />
          </div>

          <div class="min-w-0">
            <div class="font-bold text-slate-900 text-sm truncate">
              {{ form.brandName || 'ExpensePro' }}
            </div>
            <div class="text-[11px] text-slate-500 truncate">
              {{ form.brandSubtitle || 'Smart Ledger & Financials' }}
            </div>
          </div>
        </div>

        <p class="text-[11px] text-slate-500 leading-relaxed">
          Custom branding is protected: it applies inside your portal while keeping public landing and auth pages on official brand standards.
        </p>
      </div>
    </div>

    <!-- 5. TAB 3: CURRENCY & NUMBER FORMATS -->
    <div v-if="activeTab === 'currency'" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-5">
        <div>
          <h3 class="text-sm font-bold text-slate-900">Currency &amp; Accounting Standards</h3>
          <p class="text-xs text-slate-500 mt-0.5">
            Configure financial denominations, symbols, and comma numbering systems (South Asian Lakhs vs International Millions).
          </p>
        </div>

        <!-- Currency Presets Grid -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Preset Currencies</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <button
              v-for="curr in availableCurrencies"
              :key="curr.code"
              type="button"
              @click="handleCurrencyChange(curr.code)"
              :class="[
                'p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer',
                form.currency === curr.code ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700',
              ]"
            >
              <div class="flex items-center gap-2">
                <span class="text-base">{{ curr.flag }}</span>
                <div>
                  <span class="block text-xs font-bold leading-tight">{{ curr.code }}</span>
                  <span class="block text-[10px] text-slate-400">{{ curr.symbol }}</span>
                </div>
              </div>
              <Check v-if="form.currency === curr.code" :size="14" class="text-indigo-600" />
            </button>
          </div>
        </div>

        <!-- Custom Symbol & Placement Controls -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Custom Currency Symbol</label>
            <input
              v-model="form.currencySymbol"
              type="text"
              placeholder="e.g. Rs. or $ or AED"
              class="w-full px-3.5 py-2 text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Symbol Placement</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-50">
                <input type="radio" value="prefix" v-model="form.symbolPosition" class="text-indigo-600" />
                <span>Prefix (Rs. 500)</span>
              </label>
              <label class="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-50">
                <input type="radio" value="suffix" v-model="form.symbolPosition" class="text-indigo-600" />
                <span>Suffix (500 AED)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Numbering Grouping System -->
        <div class="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Comma Separation &amp; Grouping Style
            </label>
            <div class="space-y-2">
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-50">
                <input type="radio" value="lakh_crore" v-model="form.numberSystem" class="text-indigo-600" />
                <div>
                  <span class="font-bold text-slate-900 block">South Asian (Lakhs &amp; Crores)</span>
                  <span class="text-slate-400 text-[11px] block">e.g. 15,00,000 (15 Lakh)</span>
                </div>
              </label>
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 text-xs font-medium cursor-pointer hover:bg-slate-50">
                <input type="radio" value="million_billion" v-model="form.numberSystem" class="text-indigo-600" />
                <div>
                  <span class="font-bold text-slate-900 block">International (Thousands &amp; Millions)</span>
                  <span class="text-slate-400 text-[11px] block">e.g. 1,500,000 (1.5 Million)</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Decimal Places -->
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Decimal Precision
            </label>
            <div class="flex items-center gap-3 text-xs">
              <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="radio" :value="0" v-model="form.decimalPlaces" class="text-indigo-600" />
                <span>Zero decimals (75,000)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input type="radio" :value="2" v-model="form.decimalPlaces" class="text-indigo-600" />
                <span>Two decimals (75,000.00)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Calculation Display Callout -->
      <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100">
            Formatted Sample Output
          </h4>

          <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span class="text-xs text-slate-500 block">Sample 1.48M Spend Representation:</span>
            <span class="text-xl font-extrabold text-slate-900 block" :style="{ color: previewTheme.primary }">
              {{ sampleFormattedAmount }}
            </span>
          </div>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed border border-slate-100">
          All summary cards, ledger tables, budget progress bars, and CSV export records dynamically follow these precision and currency rules.
        </div>
      </div>
    </div>

    <!-- 6. PRE-FLIGHT REVIEW & OVERWRITE IMPACT SUMMARY -->
    <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <ShieldAlert :size="16" class="text-slate-600" />
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800">
            Configuration Review &amp; Target Overwrite Impact
          </h4>
        </div>

        <div class="flex items-center gap-2">
          <span
            v-if="willOverwriteCustom"
            class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1"
          >
            <AlertTriangle :size="12" class="text-amber-700" />
            <span>Caution: {{ affectedCustomProjects.length }} Custom Project(s) Will Be Replaced</span>
          </span>
          <span
            v-else
            class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
          >
            <CheckCircle2 :size="12" class="text-emerald-600" />
            <span>Safe: No Custom Projects Overwritten</span>
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-slate-400 block text-[11px]">Selected Target Scope</span>
          <span class="font-bold text-slate-900 mt-0.5 block truncate">
            {{ targetScope === 'all' ? (preserveCustomOnGlobalSave ? 'All (Preserving Custom)' : 'All Projects (Full Overwrite)') : targetScope === 'active' ? activeProject?.name : `${selectedMultiProjectIds.length} Projects Selected` }}
          </span>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-slate-400 block text-[11px]">Selected Color Skin</span>
          <span class="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: previewTheme.primary }"></span>
            <span>{{ previewTheme.name }}</span>
          </span>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-slate-400 block text-[11px]">Active Currency Setting</span>
          <span class="font-bold text-slate-900 mt-0.5 block">
            {{ form.currency }} ({{ form.currencySymbol }}) &bull; {{ form.numberSystem === 'lakh_crore' ? 'Lakhs' : 'Millions' }}
          </span>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-slate-400 block text-[11px]">Brand Identity Mode</span>
          <span class="font-bold text-slate-900 mt-0.5 block truncate">
            {{ form.logoMode === 'image' ? 'Uploaded Custom Logo' : form.logoMode === 'text' ? form.brandName : 'ExpensePro Default' }}
          </span>
        </div>
      </div>

      <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-xs text-slate-500">
          Clicking "Save Settings" immediately applies and persists your configuration according to the specified scope.
        </p>

        <button
          type="button"
          @click="handleSaveClick"
          class="w-full sm:w-auto px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition cursor-pointer flex items-center justify-center gap-2"
          :style="{ backgroundColor: previewTheme.primary }"
        >
          <Check :size="15" />
          <span>Save &amp; Apply Settings</span>
        </button>
      </div>
    </div>

    <!-- CONFIRMATION MODAL 1: OVERWRITE WARNING -->
    <ConfirmModal
      :show="isOverwriteConfirmModalOpen"
      title="Confirm Overwriting Custom Project Settings"
      :message="`You are about to overwrite custom styling and currency configurations for ${affectedCustomProjects.length} project(s): ${affectedCustomProjects.map((p) => p.name).join(', ')}. This operation will replace their existing customized settings. Are you sure you wish to proceed?`"
      confirmText="Yes, Overwrite Settings"
      cancelText="Cancel"
      variant="warning"
      @confirm="executeSave"
      @close="isOverwriteConfirmModalOpen = false"
    />

    <!-- CONFIRMATION MODAL 2: REVERT ACTIVE PROJECT TO GLOBAL -->
    <ConfirmModal
      :show="isRevertConfirmModalOpen"
      title="Revert to Global Defaults"
      :message="`Are you sure you want to remove all custom theme, logo, and currency overrides for '${activeProject?.name}' and revert it back to the Global Default settings?`"
      confirmText="Yes, Revert to Global"
      cancelText="Cancel"
      variant="warning"
      @confirm="handleConfirmRevertActiveProject"
      @close="isRevertConfirmModalOpen = false"
    />

    <!-- CONFIRMATION MODAL 3: FACTORY RESET -->
    <ConfirmModal
      :show="isResetModalOpen"
      title="Reset Settings to Defaults"
      :message="targetScope === 'active' ? `Are you sure you want to revert '${activeProject?.name}' back to Global Defaults?` : 'Are you sure you want to reset all themes, branding, and currency configurations across the entire portal back to factory defaults?'"
      confirmText="Yes, Reset Settings"
      cancelText="Cancel"
      variant="warning"
      @confirm="handleConfirmResetAll"
      @close="isResetModalOpen = false"
    />
  </AppLayout>
</template>
