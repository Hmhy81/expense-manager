<script setup>
import { ref } from 'vue'
import { Head, Link, useForm } from '@inertiajs/vue3'
import AppLogo from '~/components/AppLogo.vue'
import AppToaster from '~/components/AppToaster.vue'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-vue-next'

const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

const form = useForm({
  fullName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
})

const submit = () => {
  form.post('/signup', {
    onFinish: () => {
      form.reset('password', 'passwordConfirmation')
    },
  })
}
</script>

<template>
  <Head title="Create Account - ExpensePro" />

  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-600 selection:text-white">
    <!-- Header Logo -->
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <AppLogo href="/" size="lg" />
      <h2 class="mt-5 text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
      <p class="mt-1 text-sm text-slate-500">Join ExpensePro to track projects, expenses, and document proofs.</p>
    </div>

    <!-- Signup Card -->
    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
      <div class="bg-white py-8 px-6 sm:px-8 rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-200/50">
        <form @submit.prevent="submit" class="space-y-4">
          <!-- Full Name -->
          <div>
            <label for="fullName" class="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
              Full Name
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User :size="16" />
              </div>
              <input
                id="fullName"
                v-model="form.fullName"
                type="text"
                autocomplete="name"
                required
                placeholder="e.g. Alex Morgan"
                class="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                :class="{ 'border-rose-400 bg-rose-50/30': form.errors.fullName }"
              />
            </div>
            <p v-if="form.errors.fullName" class="mt-1.5 text-xs text-rose-500 font-medium">
              {{ form.errors.fullName }}
            </p>
          </div>

          <!-- Email Address -->
          <div>
            <label for="email" class="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
              Email Address
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail :size="16" />
              </div>
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                required
                placeholder="you@example.com"
                class="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                :class="{ 'border-rose-400 bg-rose-50/30': form.errors.email }"
              />
            </div>
            <p v-if="form.errors.email" class="mt-1.5 text-xs text-rose-500 font-medium">
              {{ form.errors.email }}
            </p>
          </div>

          <!-- Password with Toggle Visibility -->
          <div>
            <label for="password" class="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
              Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock :size="16" />
              </div>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                placeholder="At least 8 characters"
                class="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                :class="{ 'border-rose-400 bg-rose-50/30': form.errors.password }"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                :title="showPassword ? 'Hide password' : 'Show password'"
                tabindex="-1"
              >
                <Eye v-if="showPassword" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
            <p v-if="form.errors.password" class="mt-1.5 text-xs text-rose-500 font-medium">
              {{ form.errors.password }}
            </p>
          </div>

          <!-- Confirm Password with Toggle Visibility -->
          <div>
            <label for="passwordConfirmation" class="block text-xs font-bold text-slate-700 tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock :size="16" />
              </div>
              <input
                id="passwordConfirmation"
                v-model="form.passwordConfirmation"
                :type="showPasswordConfirmation ? 'text' : 'password'"
                autocomplete="new-password"
                required
                placeholder="Re-enter password"
                class="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                :class="{ 'border-rose-400 bg-rose-50/30': form.errors.passwordConfirmation }"
              />
              <button
                type="button"
                @click="showPasswordConfirmation = !showPasswordConfirmation"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
                :title="showPasswordConfirmation ? 'Hide password' : 'Show password'"
                tabindex="-1"
              >
                <Eye v-if="showPasswordConfirmation" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
            <p v-if="form.errors.passwordConfirmation" class="mt-1.5 text-xs text-rose-500 font-medium">
              {{ form.errors.passwordConfirmation }}
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="form.processing"
            class="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 hover:shadow transition disabled:opacity-60 cursor-pointer"
          >
            <span v-if="form.processing">Creating account...</span>
            <span v-else class="inline-flex items-center gap-2">
              Create Account <ArrowRight :size="16" />
            </span>
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-slate-100 text-center">
          <p class="text-xs text-slate-600">
            Already have an account?
            <Link href="/login" class="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
    <AppToaster />
  </div>
</template>
