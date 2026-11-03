<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3'
import {
  Wallet,
  ArrowRight,
  TrendingUp,
  PieChart,
  Zap,
  Lock,
  Receipt,
  CheckCircle2,
} from 'lucide-vue-next'

const features = [
  {
    icon: Zap,
    color: 'text-amber-500 bg-amber-50',
    title: 'Fast Expense Logging',
    description: 'Add and categorize expenses in seconds. Keep track of every single rupee or dollar seamlessly.',
  },
  {
    icon: PieChart,
    color: 'text-indigo-600 bg-indigo-50',
    title: 'Visual Insights & Analytics',
    description: 'Understand spending patterns across categories with intuitive stats and automated summaries.',
  },
  {
    icon: TrendingUp,
    color: 'text-emerald-600 bg-emerald-50',
    title: 'Smart Budget Control',
    description: 'Stay ahead of monthly limits and plan future finances with real-time budget tracking.',
  },
  {
    icon: Lock,
    color: 'text-purple-600 bg-purple-50',
    title: 'Bank-Grade Privacy',
    description: 'Your financial data is encrypted and protected with secure session management and authentication.',
  },
]
</script>

<template>
  <Head title="ExpensePro - Modern Financial & Expense Tracker" />

  <div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
    <!-- Top Navigation -->
    <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <Link href="/" class="flex items-center gap-2.5 font-bold text-xl tracking-tight text-slate-900 group">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Wallet :size="20" />
          </div>
          <span class="text-slate-900">Expense<span class="text-indigo-600">Pro</span></span>
        </Link>

        <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" class="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#preview" class="hover:text-indigo-600 transition-colors">Preview</a>
          <a href="#security" class="hover:text-indigo-600 transition-colors">Security</a>
        </nav>

        <div class="flex items-center gap-3">
          <Link
            href="/login"
            class="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-xl hover:bg-slate-100 transition"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            class="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4.5 py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 hover:shadow transition-all"
          >
            <span>Get Started</span>
            <ArrowRight :size="16" />
          </Link>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <main class="flex-1">
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <!-- Tag Pill -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
          <span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          Smart & Effortless Financial Management
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Take complete control of your <span class="text-indigo-600">expenses</span> in one place.
        </h1>

        <p class="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Track day-to-day spending, monitor category budgets, and make smarter financial decisions with real-time analytics designed for clarity.
        </p>

        <!-- CTA Buttons -->
        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-7 py-3.5 rounded-2xl shadow-md shadow-indigo-600/20 transition hover:-translate-y-0.5"
          >
            <span>Create Free Account</span>
            <ArrowRight :size="18" />
          </Link>
          <Link
            href="/login"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300/80 font-semibold px-7 py-3.5 rounded-2xl shadow-xs transition"
          >
            <span>Existing User? Sign In</span>
          </Link>
        </div>

        <!-- Product Trust & Feature Badges -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div class="flex items-center gap-1.5">
            <CheckCircle2 :size="16" class="text-emerald-500" />
            <span>Instant Receipt & Invoice Logging</span>
          </div>
          <div class="flex items-center gap-1.5">
            <CheckCircle2 :size="16" class="text-emerald-500" />
            <span>Multi-Category Budget Tracking</span>
          </div>
          <div class="flex items-center gap-1.5">
            <CheckCircle2 :size="16" class="text-emerald-500" />
            <span>256-bit Encrypted Financial Vault</span>
          </div>
        </div>

        <!-- Dashboard UI Mockup Preview -->
        <div id="preview" class="mt-16 relative mx-auto max-w-5xl rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-5 shadow-xl shadow-slate-200/50">
          <div class="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
            <div class="flex items-center justify-between pb-5 border-b border-slate-200/70">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-rose-400"></div>
                <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span class="text-xs font-mono text-slate-400 ml-2">https://app.expensepro.com/dashboard</span>
              </div>
              <div class="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Ledger Active
              </div>
            </div>

            <!-- Mini stats row in preview -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div class="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
                <span class="text-xs text-slate-500 font-medium">Total Spent (Nov)</span>
                <p class="text-xl font-bold text-slate-900 mt-1">Rs. 45,200</p>
                <p class="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp :size="12" /> -12% vs last month
                </p>
              </div>
              <div class="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
                <span class="text-xs text-slate-500 font-medium">Monthly Budget</span>
                <p class="text-xl font-bold text-indigo-600 mt-1">Rs. 80,000</p>
                <div class="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                  <div class="bg-indigo-600 h-1.5 rounded-full" style="width: 56.5%"></div>
                </div>
              </div>
              <div class="bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
                <span class="text-xs text-slate-500 font-medium">Top Category</span>
                <p class="text-xl font-bold text-purple-600 mt-1">Software & Cloud</p>
                <p class="text-[11px] text-slate-500 mt-1">Rs. 27,000 recorded</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200/70">
        <div class="text-center max-w-2xl mx-auto mb-16">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-2">Designed for Efficiency</h2>
          <p class="text-3xl font-extrabold text-slate-900 tracking-tight">Everything you need to track spending</p>
          <p class="text-slate-600 mt-3 text-base">Simple enough for personal use, powerful enough for small businesses and freelance teams.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="(feat, idx) in features"
            :key="idx"
            class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all group"
          >
            <div :class="['w-12 h-12 rounded-xl flex items-center justify-center mb-5', feat.color]">
              <component :is="feat.icon" :size="24" />
            </div>
            <h3 class="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {{ feat.title }}
            </h3>
            <p class="text-sm text-slate-600 mt-2 leading-relaxed">
              {{ feat.description }}
            </p>
          </div>
        </div>
      </section>

      <!-- CTA Banner -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div class="bg-indigo-600 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-lg shadow-indigo-600/25">
          <div class="relative z-10 max-w-2xl mx-auto">
            <h2 class="text-3xl font-extrabold sm:text-4xl tracking-tight">Ready to streamline your expense tracking?</h2>
            <p class="mt-4 text-indigo-100 text-base sm:text-lg">
              Start managing your money today with seamless speed and full control over your data.
            </p>
            <div class="mt-8 flex justify-center">
              <Link
                href="/signup"
                class="inline-flex items-center gap-2 bg-white text-indigo-600 font-semibold px-8 py-3.5 rounded-2xl shadow-sm hover:bg-slate-50 transition"
              >
                <span>Get Started Now</span>
                <ArrowRight :size="18" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
        <div class="flex items-center gap-2">
          <Receipt :size="18" class="text-indigo-600" />
          <span class="font-semibold text-slate-800">ExpensePro</span>
          <span>&copy; {{ new Date().getFullYear() }} All rights reserved.</span>
        </div>
        <div class="flex items-center gap-6">
          <Link href="/login" class="hover:text-indigo-600 transition">Sign In</Link>
          <Link href="/signup" class="hover:text-indigo-600 transition">Sign Up</Link>
          <Link href="/dashboard" class="hover:text-indigo-600 transition">Dashboard</Link>
        </div>
      </div>
    </footer>
  </div>
</template>
