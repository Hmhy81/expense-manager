<script setup>
import { usePage } from '@inertiajs/vue3'
import { useSettings } from '~/composables/useSettings'

const props = defineProps({
  voucher: {
    type: Object,
    required: true,
  },
})

const page = usePage()
const { formatCurrency, effectiveSettings } = useSettings()
</script>

<template>
  <div id="voucher-print-area" class="voucher-print-only text-slate-900 bg-white">
    <!-- Voucher Header -->
    <div class="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-slate-900 uppercase">
          {{ effectiveSettings?.brandName || 'ExpensePro' }}
        </h1>
        <p class="text-xs text-slate-500 mt-1">Official Expense &amp; Disbursement Voucher</p>
      </div>
      <div class="text-right">
        <span class="inline-block px-3 py-1 text-xs font-bold uppercase rounded border border-slate-900 mb-1">
          {{ voucher.status || 'PAID' }}
        </span>
        <p class="text-xs text-slate-500">Date: <strong class="text-slate-900">{{ voucher.date }}</strong></p>
        <p class="text-[11px] text-slate-400">Ref: VCH-{{ String(voucher.id || '001').padStart(5, '0') }}</p>
      </div>
    </div>

    <!-- Voucher Details Table -->
    <table class="w-full text-xs mb-6 border-collapse">
      <tbody>
        <tr class="border-b border-slate-200">
          <td class="py-2.5 font-bold text-slate-500 uppercase w-1/4">Payee:</td>
          <td class="py-2.5 font-semibold text-slate-900 text-sm">{{ voucher.vendor || 'Direct Purchase' }}</td>
        </tr>
        <tr class="border-b border-slate-200">
          <td class="py-2.5 font-bold text-slate-500 uppercase">Description:</td>
          <td class="py-2.5 font-medium text-slate-900">{{ voucher.title }}</td>
        </tr>
        <tr class="border-b border-slate-200">
          <td class="py-2.5 font-bold text-slate-500 uppercase">Category:</td>
          <td class="py-2.5 font-medium text-slate-900">{{ voucher.category || 'General' }}</td>
        </tr>
        <tr class="border-b border-slate-200">
          <td class="py-2.5 font-bold text-slate-500 uppercase">Payment Method:</td>
          <td class="py-2.5 font-medium text-slate-900">{{ voucher.paymentMethod || 'Cash' }}</td>
        </tr>
        <tr v-if="voucher.notes" class="border-b border-slate-200">
          <td class="py-2.5 font-bold text-slate-500 uppercase">Notes:</td>
          <td class="py-2.5 text-slate-700 italic">{{ voucher.notes }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Amount Highlight Card -->
    <div class="bg-slate-50 border border-slate-300 rounded-lg p-4 mb-8 flex justify-between items-center">
      <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">Total Disbursed Amount:</span>
      <span class="text-2xl font-black text-slate-900">{{ formatCurrency(voucher.amount) }}</span>
    </div>

    <!-- Signatures & Authorization Blocks -->
    <div class="grid grid-cols-3 gap-6 pt-10 mt-6 border-t border-slate-200 text-center text-xs text-slate-600">
      <div>
        <div class="border-b border-slate-400 mb-2 h-10"></div>
        <p class="font-bold text-slate-800">Prepared By</p>
        <p class="text-[10px] text-slate-400 mt-0.5">{{ page.props.user?.fullName || 'Accountant' }}</p>
      </div>
      <div>
        <div class="border-b border-slate-400 mb-2 h-10"></div>
        <p class="font-bold text-slate-800">Verified &amp; Checked</p>
        <p class="text-[10px] text-slate-400 mt-0.5">Auditor / Manager</p>
      </div>
      <div>
        <div class="border-b border-slate-400 mb-2 h-10"></div>
        <p class="font-bold text-slate-800">Authorized Signature</p>
        <p class="text-[10px] text-slate-400 mt-0.5">Project Director</p>
      </div>
    </div>

    <!-- Footer Note -->
    <div class="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
      Generated automatically by ExpensePro Portal &bull; Official Record Slip
    </div>
  </div>
</template>

<style>
.voucher-print-only {
  display: none;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  body * {
    visibility: hidden !important;
  }

  #voucher-print-area,
  #voucher-print-area * {
    visibility: visible !important;
  }

  #voucher-print-area {
    display: block !important;
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 20mm !important;
    background: #ffffff !important;
    z-index: 99999999 !important;
    box-sizing: border-box !important;
  }
}
</style>

