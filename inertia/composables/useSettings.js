import { ref, computed, watch } from 'vue'
import { usePage, router } from '@inertiajs/vue3'
import { toast } from '~/composables/useToast'
import { useActiveProject } from '~/composables/useActiveProject'

export const availableThemes = [
  {
    id: 'indigo',
    name: 'Royal Indigo',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    light: '#EEF2FF',
    text: '#312E81',
    ring: '#6366F1',
    shades: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    bgClass: 'bg-indigo-600',
    hoverClass: 'hover:bg-indigo-700',
    lightClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    tag: 'Default Modern',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    primary: '#059669',
    primaryHover: '#047857',
    light: '#ECFDF5',
    text: '#064E3B',
    ring: '#10B981',
    shades: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    bgClass: 'bg-emerald-600',
    hoverClass: 'hover:bg-emerald-700',
    lightClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    tag: 'Construction & Agri',
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    light: '#EFF6FF',
    text: '#1E40AF',
    ring: '#3B82F6',
    shades: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#172554',
    },
    bgClass: 'bg-blue-600',
    hoverClass: 'hover:bg-blue-700',
    lightClass: 'bg-blue-50 text-blue-700 border-blue-200/60',
    tag: 'Corporate & Tech',
  },
  {
    id: 'purple',
    name: 'Imperial Violet',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    light: '#F5F3FF',
    text: '#5B21B6',
    ring: '#8B5CF6',
    shades: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      500: '#a855f7',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#3b0764',
    },
    bgClass: 'bg-purple-600',
    hoverClass: 'hover:bg-purple-700',
    lightClass: 'bg-purple-50 text-purple-700 border-purple-200/60',
    tag: 'Retail & Commercial',
  },
  {
    id: 'amber',
    name: 'Sunset Gold & Amber',
    primary: '#D97706',
    primaryHover: '#B45309',
    light: '#FFFBEB',
    text: '#78350F',
    ring: '#F59E0B',
    shades: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    bgClass: 'bg-amber-600',
    hoverClass: 'hover:bg-amber-700',
    lightClass: 'bg-amber-50 text-amber-700 border-amber-200/60',
    tag: 'Real Estate & Luxury',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    primary: '#E11D48',
    primaryHover: '#BE123C',
    light: '#FFF1F2',
    text: '#881337',
    ring: '#F43F5E',
    shades: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
    },
    bgClass: 'bg-rose-600',
    hoverClass: 'hover:bg-rose-700',
    lightClass: 'bg-rose-50 text-rose-700 border-rose-200/60',
    tag: 'Priority Portfolios',
  },
  {
    id: 'slate',
    name: 'Classic Slate',
    primary: '#334155',
    primaryHover: '#1E293B',
    light: '#F8FAFC',
    text: '#0F172A',
    ring: '#64748B',
    shades: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      500: '#64748b',
      600: '#334155',
      700: '#1e293b',
      800: '#0f172a',
      900: '#020617',
    },
    bgClass: 'bg-slate-700',
    hoverClass: 'hover:bg-slate-800',
    lightClass: 'bg-slate-100 text-slate-800 border-slate-300',
    tag: 'Minimalist Clean',
  },
]

export const availableCurrencies = [
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee', flag: '🇵🇰', defaultPosition: 'prefix', defaultSystem: 'lakh_crore' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', defaultPosition: 'suffix', defaultSystem: 'million_billion' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', defaultPosition: 'suffix', defaultSystem: 'million_billion' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', defaultPosition: 'prefix', defaultSystem: 'million_billion' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', defaultPosition: 'prefix', defaultSystem: 'million_billion' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', defaultPosition: 'prefix', defaultSystem: 'million_billion' },
]

export const defaultSettings = {
  themeId: 'indigo',
  logoMode: 'default', // 'default' | 'text' | 'image'
  brandName: 'ExpensePro',
  brandSubtitle: 'Smart Ledger & Financials',
  logoUrl: '',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  symbolPosition: 'prefix', // 'prefix' | 'suffix'
  numberSystem: 'lakh_crore', // 'lakh_crore' | 'million_billion'
  decimalPlaces: 0,
  dateFormat: 'DD MMM YYYY',
  receiptSlipHeader: 'ExpensePro Official Proof Slip',
}

export const PUBLIC_PAGES = ['Home', 'Auth/Login', 'Auth/Signup', 'errors/not_found', 'errors/server_error']

export function isPortalComponent(componentName, url = '') {
  if (componentName && PUBLIC_PAGES.includes(componentName)) {
    return false
  }
  const path = (url || (typeof window !== 'undefined' ? window.location.pathname : '')).toLowerCase()
  if (path === '/' || path === '/login' || path === '/signup' || path === '/home') {
    return false
  }
  return true
}

export function updateFavicon(url) {
  if (typeof document === 'undefined') return
  let link = document.querySelector("link[rel*='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'shortcut icon'
    document.head.appendChild(link)
  }
  if (url) {
    link.href = url
  }
}

export function resetFavicon() {
  if (typeof document === 'undefined') return
  let link = document.querySelector("link[rel*='icon']")
  if (link) {
    link.href = '/favicon.svg'
  }
}

export function applyThemeCSS(themeObj) {
  if (typeof document === 'undefined' || !themeObj) return
  const root = document.documentElement
  const shades = themeObj.shades || {}

  // Update brand shades mapped to Tailwind v4 @theme --color-indigo-*
  if (shades['50']) root.style.setProperty('--brand-50', shades['50'])
  if (shades['100']) root.style.setProperty('--brand-100', shades['100'])
  if (shades['200']) root.style.setProperty('--brand-200', shades['200'])
  if (shades['500']) root.style.setProperty('--brand-500', shades['500'])
  if (shades['600']) root.style.setProperty('--brand-600', shades['600'])
  if (shades['700']) root.style.setProperty('--brand-700', shades['700'])
  if (shades['800']) root.style.setProperty('--brand-800', shades['800'])
  if (shades['900']) root.style.setProperty('--brand-900', shades['900'])

  // Also update direct custom properties
  root.style.setProperty('--brand-primary', themeObj.primary || shades['600'])
  root.style.setProperty('--brand-primary-hover', themeObj.primaryHover || shades['700'])
  root.style.setProperty('--brand-primary-light', themeObj.light || shades['50'])
  root.style.setProperty('--brand-primary-text', themeObj.text || shades['900'])
  root.style.setProperty('--brand-primary-ring', themeObj.ring || shades['500'])

  root.setAttribute('data-theme', themeObj.id)
}

export function resetThemeToDefault() {
  applyThemeCSS(availableThemes[0])
  resetFavicon()
}

export function applyPortalTheme(pageProps = null) {
  const global = pageProps?.globalSettings || defaultSettings
  const map = pageProps?.projectSettingsMap || {}
  const activeId = pageProps?.activeProjectId || pageProps?.projects?.[0]?.id || null
  const active = (activeId && map && map[activeId]) ? { ...global, ...map[activeId] } : global

  const theme = availableThemes.find((t) => t.id === active?.themeId) || availableThemes[0]
  applyThemeCSS(theme)

  if (active?.logoUrl) {
    updateFavicon(active.logoUrl)
  } else {
    resetFavicon()
  }
}

export function initTheme() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!isPortalComponent(undefined, window.location.pathname)) {
    resetThemeToDefault()
  }
}

// Router listener: Automatically isolate public landing / auth routes from portal custom themes
if (typeof window !== 'undefined') {
  initTheme()

  router.on('navigate', (event) => {
    const page = event.detail.page
    const comp = page?.component
    const url = page?.url
    if (isPortalComponent(comp, url)) {
      applyPortalTheme(page?.props)
    } else {
      resetThemeToDefault()
    }
  })
}

export function formatAmountWithSettings(amount, settings = defaultSettings) {
  const num = Number(amount || 0)
  const decimals = settings.decimalPlaces ?? 0
  let formatted = ''

  if (settings.numberSystem === 'lakh_crore') {
    const parts = num.toFixed(decimals).split('.')
    let integerPart = parts[0]
    const decimalPart = parts[1] ? '.' + parts[1] : ''

    const lastThree = integerPart.substring(integerPart.length - 3)
    const otherNumbers = integerPart.substring(0, integerPart.length - 3)
    if (otherNumbers !== '') {
      formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree + decimalPart
    } else {
      formatted = lastThree + decimalPart
    }
  } else {
    formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const sym = settings.currencySymbol || 'Rs.'
  if (settings.symbolPosition === 'suffix') {
    return `${formatted} ${sym}`
  }
  return `${sym} ${formatted}`
}

export function useSettings() {
  const page = usePage()
  const { activeProjectId } = useActiveProject()

  // Live global settings loaded directly from MySQL via Inertia props
  const globalSettings = computed(() => {
    return page.props.globalSettings || defaultSettings
  })

  // Live project settings overrides map loaded directly from MySQL via Inertia props
  const projectSettingsMap = computed(() => {
    return page.props.projectSettingsMap || {}
  })

  // Effective settings for the current active project
  const effectiveSettings = computed(() => {
    const pid = activeProjectId?.value
    if (pid && projectSettingsMap.value && projectSettingsMap.value[pid]) {
      return {
        ...globalSettings.value,
        ...projectSettingsMap.value[pid],
        isOverridden: true,
      }
    }
    return {
      ...globalSettings.value,
      isOverridden: false,
    }
  })

  // Theme object for currently active settings
  const currentTheme = computed(() => {
    return availableThemes.find((t) => t.id === effectiveSettings.value.themeId) || availableThemes[0]
  })

  // Live CSS variables update (only applied when inside authenticated portal)
  watch(
    currentTheme,
    (theme) => {
      if (isPortalComponent(undefined, typeof window !== 'undefined' ? window.location.pathname : '')) {
        applyThemeCSS(theme)
      }
    },
    { immediate: true }
  )

  // Watch for custom logo changes to update favicon (only when on portal page)
  watch(
    () => effectiveSettings.value.logoUrl,
    (url) => {
      if (isPortalComponent(undefined, typeof window !== 'undefined' ? window.location.pathname : '')) {
        if (url) updateFavicon(url)
        else resetFavicon()
      }
    },
    { immediate: true }
  )

  const formatCurrency = (amount) => {
    return formatAmountWithSettings(amount, effectiveSettings.value)
  }

  // Retrieve complete configuration state for any given project
  const getProjectConfigDetails = (projectId) => {
    const pid = Number(projectId)
    const isOverridden = Boolean(projectSettingsMap.value && projectSettingsMap.value[pid])
    const settings = isOverridden
      ? { ...globalSettings.value, ...projectSettingsMap.value[pid] }
      : globalSettings.value
    const theme = availableThemes.find((t) => t.id === settings.themeId) || availableThemes[0]
    const currency = availableCurrencies.find((c) => c.code === settings.currency) || availableCurrencies[0]
    return {
      isOverridden,
      settings,
      theme,
      currency,
    }
  }

  // Save settings with scope direct to MySQL database
  const applySettings = (scope, payload, selectedIds = [], preserveOverrides = false) => {
    router.post('/settings', {
      scope,
      payload,
      selectedProjectIds: selectedIds,
      preserveOverrides,
      activeProjectId: activeProjectId.value,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        const msg = scope === 'all'
          ? (preserveOverrides ? 'Global settings updated! Custom project overrides preserved.' : 'Global settings applied to all projects!')
          : (scope === 'active' ? 'Custom settings saved for active project!' : `Settings updated for ${selectedIds.length} project(s)!`)
        toast.success(msg)
      },
      onError: () => toast.error('Failed to save settings.'),
    })
  }

  // Reset custom overrides for a specific project in MySQL
  const resetProjectSettings = (pid) => {
    router.post('/settings/reset', {
      scope: 'active',
      projectId: pid,
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success('Project settings reset to global defaults!'),
      onError: () => toast.error('Failed to reset project settings.'),
    })
  }

  // Reset all settings to original defaults in MySQL
  const resetAllToDefaults = () => {
    router.post('/settings/reset', {
      scope: 'all',
    }, {
      preserveScroll: true,
      onSuccess: () => toast.success('All settings reset to original defaults!'),
      onError: () => toast.error('Failed to reset settings.'),
    })
  }

  return {
    globalSettings,
    projectSettingsMap,
    effectiveSettings,
    currentTheme,
    availableThemes,
    availableCurrencies,
    formatCurrency,
    getProjectConfigDetails,
    applySettings,
    resetProjectSettings,
    resetAllToDefaults,
  }
}
