<script setup>
import { Head, Link } from '@inertiajs/vue3'
import { AlertTriangle, ArrowLeft } from 'lucide-vue-next'
</script>

<template>
  <Head title="Server Error" />

  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
    <div class="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
        <AlertTriangle :size="24" />
      </div>
      <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">500 - Server Error</h2>
      <p class="text-sm text-slate-500 leading-relaxed">
        Something went wrong on our end. Please try again in a few moments.
      </p>
      <div class="pt-2">
        <Link
          href="/"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-xs transition"
        >
          <ArrowLeft :size="15" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  </div>
</template>
