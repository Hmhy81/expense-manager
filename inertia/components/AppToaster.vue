<script setup>
import { watch } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { Toaster, toast } from 'vue-sonner'

const page = usePage()

watch(
  () => page.flash,
  (flash) => {
    if (flash?.error) toast.error(flash.error, { id: 'flash-error' })
    if (flash?.success) toast.success(flash.success, { id: 'flash-success' })
  },
  { immediate: true }
)
</script>

<template>
  <Toaster
    position="bottom-right"
    richColors
    closeButton
    :duration="3500"
    :toastOptions="{
      class: 'font-sans text-xs sm:text-sm rounded-xl shadow-lg border',
    }"
  />
</template>

