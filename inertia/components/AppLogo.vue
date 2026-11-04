<script setup>
import { computed } from 'vue'
import { Link, usePage } from '@inertiajs/vue3'
import { Wallet } from 'lucide-vue-next'
import { useSettings, isPortalComponent } from '~/composables/useSettings'

const props = defineProps({
  // Size preset: 'xs', 'sm', 'md', 'lg', 'xl'
  size: {
    type: String,
    default: 'md',
  },
  // Whether to show the text label next to the icon badge
  showText: {
    type: Boolean,
    default: true,
  },
  // Target URL. If null or false, renders as non-link element
  href: {
    type: [String, Boolean, null],
    default: '/',
  },
  // Visual theme variant: 'default' | 'white' | 'dark'
  variant: {
    type: String,
    default: 'default',
  },
  // Brand name prefix & suffix
  prefix: {
    type: String,
    default: 'Expense',
  },
  suffix: {
    type: String,
    default: 'Pro',
  },
  // Optional secondary subtitle or tagline under the logo
  subtitle: {
    type: String,
    default: '',
  },
})

const page = usePage()
const { effectiveSettings } = useSettings()

// Only enable custom tenant/project branding inside the authenticated portal
const isPortal = computed(() => {
  return isPortalComponent(page?.component, page?.url)
})

const isDefaultBrandProps = computed(() => {
  return props.prefix === 'Expense' && props.suffix === 'Pro'
})

const customLogoUrl = computed(() => {
  if (isPortal.value && isDefaultBrandProps.value && effectiveSettings.value?.logoMode === 'image' && effectiveSettings.value?.logoUrl) {
    return effectiveSettings.value.logoUrl
  }
  return null
})

const brandTitle = computed(() => {
  if (isPortal.value && isDefaultBrandProps.value && effectiveSettings.value?.brandName && effectiveSettings.value?.brandName !== 'ExpensePro') {
    return effectiveSettings.value.brandName
  }
  return null
})

const brandSubtitle = computed(() => {
  if (props.subtitle) return props.subtitle
  if (isPortal.value && isDefaultBrandProps.value && effectiveSettings.value?.brandSubtitle) {
    return effectiveSettings.value.brandSubtitle
  }
  return ''
})

// Size Presets Config
const sizeConfig = computed(() => {
  switch (props.size) {
    case 'xs':
      return {
        badge: 'w-7 h-7 rounded-lg',
        iconSize: 14,
        textSize: 'text-sm font-bold tracking-tight',
        subtextSize: 'text-[9px]',
        gap: 'gap-2',
      }
    case 'sm':
      return {
        badge: 'w-8 h-8 rounded-lg',
        iconSize: 16,
        textSize: 'text-base font-bold tracking-tight',
        subtextSize: 'text-[10px]',
        gap: 'gap-2',
      }
    case 'lg':
      return {
        badge: 'w-11 h-11 rounded-xl shadow-sm',
        iconSize: 22,
        textSize: 'text-2xl font-extrabold tracking-tight',
        subtextSize: 'text-xs',
        gap: 'gap-3',
      }
    case 'xl':
      return {
        badge: 'w-14 h-14 rounded-2xl shadow-md',
        iconSize: 28,
        textSize: 'text-3xl font-extrabold tracking-tight',
        subtextSize: 'text-sm',
        gap: 'gap-3.5',
      }
    case 'md':
    default:
      return {
        badge: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-xs',
        iconSize: 18,
        textSize: 'text-lg sm:text-xl font-bold tracking-tight',
        subtextSize: 'text-xs',
        gap: 'gap-2.5',
      }
  }
})

// Color Theme Variants Config
const variantConfig = computed(() => {
  switch (props.variant) {
    case 'white':
      return {
        badgeBg: 'bg-white text-indigo-600',
        textColor: 'text-white',
        suffixColor: 'text-indigo-200',
        subtitleColor: 'text-indigo-100',
      }
    case 'dark':
      return {
        badgeBg: 'bg-slate-900 text-white',
        textColor: 'text-slate-900',
        suffixColor: 'text-slate-500',
        subtitleColor: 'text-slate-400',
      }
    case 'default':
    default:
      return {
        badgeBg: 'bg-indigo-600 text-white shadow-indigo-600/20',
        textColor: 'text-slate-900',
        suffixColor: 'text-indigo-600',
        subtitleColor: 'text-slate-500',
      }
  }
})

const isClickable = computed(() => Boolean(props.href))
</script>

<template>
  <component
    :is="isClickable ? Link : 'div'"
    :href="isClickable ? href : undefined"
    :class="[
      'inline-flex items-center select-none group',
      sizeConfig.gap,
      isClickable ? 'cursor-pointer hover:opacity-95 transition-opacity' : '',
    ]"
  >
    <!-- Brand Icon or Uploaded Image Badge (Uploaded logo only inside portal) -->
    <div
      v-if="customLogoUrl"
      :class="[
        'flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-105 border border-slate-200/80 bg-white shadow-2xs',
        sizeConfig.badge,
      ]"
    >
      <img :src="customLogoUrl" alt="Brand Logo" class="w-full h-full object-contain p-0.5" />
    </div>

    <div
      v-else
      :class="[
        'flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
        sizeConfig.badge,
        variantConfig.badgeBg,
      ]"
    >
      <Wallet :size="sizeConfig.iconSize" />
    </div>

    <!-- Brand Text & Optional Subtitle -->
    <div v-if="showText" class="min-w-0">
      <div v-if="brandTitle" :class="[sizeConfig.textSize, variantConfig.textColor, 'leading-none font-bold tracking-tight truncate']">
        {{ brandTitle }}
      </div>
      <div v-else :class="[sizeConfig.textSize, variantConfig.textColor, 'leading-none flex items-center']">
        <span>{{ prefix }}</span><span :class="variantConfig.suffixColor">{{ suffix }}</span>
      </div>
      <p v-if="brandSubtitle" :class="[sizeConfig.subtextSize, variantConfig.subtitleColor, 'mt-0.5 leading-none font-medium truncate']">
        {{ brandSubtitle }}
      </p>
    </div>
  </component>
</template>
