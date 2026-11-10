<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Data rows to render in table
  rows: {
    type: Array,
    default: () => [],
  },

  // Currency
  currencySymbol: {
    type: String,
    default: 'PKR',
  },

  // 1. Header Configurations (Optional via Props)
  showHeader: {
    type: Boolean,
    default: true,
  },
  brandName: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  metaText: {
    type: String,
    default: '',
  },
  statementDate: {
    type: String,
    default: '',
  },
  filterText: {
    type: String,
    default: '',
  },
  showRecordCount: {
    type: Boolean,
    default: true,
  },

  // 2. KPI Summary Banner Configurations (Optional via Props)
  showKpiSummary: {
    type: Boolean,
    default: true,
  },
  stats: {
    type: Object,
    default: () => null, // e.g. { filteredOutflow: 0, totalPaid: 0, totalPending: 0 }
  },

  // 3. Table Column Configurations (Optional via Props)
  showNotes: {
    type: Boolean,
    default: true,
  },
  showCategory: {
    type: Boolean,
    default: true,
  },
  showPaymentMethod: {
    type: Boolean,
    default: true,
  },
  showStatus: {
    type: Boolean,
    default: true,
  },
  totalAmount: {
    type: [Number, String],
    default: null,
  },

  // 4. Signatures Configurations (Optional via Props)
  showSignatures: {
    type: Boolean,
    default: true,
  },
  signatures: {
    type: Array,
    default: () => [
      { title: 'Prepared By', subtitle: 'Site Accountant / Cashier' },
      { title: 'Verified & Checked', subtitle: 'Project Manager / Auditor' },
      { title: 'Authorized Signature', subtitle: 'Managing Director / Client' },
    ],
  },

  // 5. Bottom System Footer Configurations (Optional via Props)
  showFooter: {
    type: Boolean,
    default: true,
  },
  footerNote: {
    type: String,
    default: '',
  },
})

// Calculate total statement outflow
const computedTotalAmount = computed(() => {
  if (props.totalAmount !== null && props.totalAmount !== undefined) {
    return Number(props.totalAmount)
  }
  if (props.stats?.filteredOutflow !== undefined) {
    return Number(props.stats.filteredOutflow)
  }
  return props.rows.reduce((sum, r) => sum + Number(r.amount || 0), 0)
})

// Number of verified receipts/slips attached
const verifiedSlipsCount = computed(() => {
  return props.rows.filter((r) => Boolean(r.hasReceipt || (r.receipts && r.receipts.length > 0) || r.receiptsCount > 0)).length
})

// Dynamic colspan for table footer
const footerColspan = computed(() => {
  let count = 4 // # + Date + Description + Vendor
  if (props.showCategory) count += 1
  if (props.showPaymentMethod) count += 1
  if (props.showStatus) count += 1
  return count
})

const formatAmount = (val) => {
  return Number(val || 0).toLocaleString()
}

const formatStatusLabel = (status) => {
  if (status === 'Paid') return 'Full Paid'
  return status || 'Full Paid'
}
</script>

<template>
  <div id="ledger-print-area" class="hidden">
    <!-- 1. OPTIONAL HEADER SECTION -->
    <div
      v-if="showHeader && (brandName || title || subtitle || metaText || statementDate || filterText)"
      class="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start"
    >
      <div>
        <h1 v-if="brandName || title" class="text-2xl font-black tracking-tight text-slate-900 uppercase">
          <span v-if="brandName">{{ brandName }}</span>
          <span v-if="brandName && title"> &bull; </span>
          <span v-if="title">{{ title }}</span>
        </h1>
        <p v-if="subtitle" class="text-xs text-slate-600 mt-1 font-medium">
          {{ subtitle }}
        </p>
        <p v-if="metaText" class="text-[11px] text-slate-500 mt-0.5">
          {{ metaText }}
        </p>
      </div>

      <div class="text-right">
        <p v-if="statementDate" class="text-xs font-bold text-slate-900">
          Statement Date: {{ statementDate }}
        </p>
        <p v-if="filterText" class="text-xs text-slate-600 mt-0.5">
          Period: {{ filterText }}
        </p>
        <p v-if="showRecordCount" class="text-[11px] text-slate-500 mt-0.5">
          Total Records: {{ rows.length }}
        </p>
      </div>
    </div>

    <!-- 2. OPTIONAL FINANCIAL METRICS SUMMARY BANNER -->
    <div
      v-if="showKpiSummary && stats"
      class="grid grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-300 rounded-lg mb-4 text-xs"
    >
      <div v-if="stats.filteredOutflow !== undefined">
        <span class="text-[10px] font-bold text-slate-500 uppercase block">Total Filtered Outflow</span>
        <span class="text-sm font-extrabold text-indigo-700">{{ currencySymbol }} {{ formatAmount(stats.filteredOutflow) }}</span>
      </div>
      <div v-if="stats.totalPaid !== undefined">
        <span class="text-[10px] font-bold text-slate-500 uppercase block">Settled / Paid Out</span>
        <span class="text-sm font-extrabold text-emerald-700">{{ currencySymbol }} {{ formatAmount(stats.totalPaid) }}</span>
      </div>
      <div v-if="stats.totalPending !== undefined">
        <span class="text-[10px] font-bold text-slate-500 uppercase block">Pending Balance Due</span>
        <span class="text-sm font-extrabold text-amber-700">{{ currencySymbol }} {{ formatAmount(stats.totalPending) }}</span>
      </div>
      <div>
        <span class="text-[10px] font-bold text-slate-500 uppercase block">Receipt Proofs</span>
        <span class="text-sm font-extrabold text-slate-800">{{ verifiedSlipsCount }} Verified Slips</span>
      </div>
    </div>

    <!-- 3. FULL ITEM DETAIL TABLE -->
    <table class="w-full text-xs border border-slate-300 border-collapse mb-5">
      <thead>
        <tr class="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
          <th class="py-2 px-2 text-center border-r border-slate-300 w-8">#</th>
          <th class="py-2 px-2 text-left border-r border-slate-300 w-24">Date</th>
          <th class="py-2 px-3 text-left border-r border-slate-300">Description / Title</th>
          <th class="py-2 px-3 text-left border-r border-slate-300">Vendor / Payee</th>
          <th v-if="showCategory" class="py-2 px-2 text-left border-r border-slate-300">Category</th>
          <th v-if="showPaymentMethod" class="py-2 px-2 text-left border-r border-slate-300">Method</th>
          <th v-if="showStatus" class="py-2 px-2 text-center border-r border-slate-300 w-16">Status</th>
          <th class="py-2 px-3 text-right">Amount ({{ currencySymbol }})</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="'print-' + (row.id || idx)"
          class="border-b border-slate-200"
        >
          <td class="py-1.5 px-2 text-center border-r border-slate-200 font-medium text-slate-500">{{ idx + 1 }}</td>
          <td class="py-1.5 px-2 border-r border-slate-200 whitespace-nowrap text-slate-700">{{ row.date }}</td>
          <td class="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-900">
            {{ row.title }}
            <span v-if="showNotes && row.notes" class="block text-[10px] font-normal text-slate-500 italic">{{ row.notes }}</span>
          </td>
          <td class="py-1.5 px-3 border-r border-slate-200 text-slate-700">{{ row.vendor || 'Direct Purchase' }}</td>
          <td v-if="showCategory" class="py-1.5 px-2 border-r border-slate-200 text-slate-700">{{ row.category }}</td>
          <td v-if="showPaymentMethod" class="py-1.5 px-2 border-r border-slate-200 text-slate-700">{{ row.paymentMethod || 'Cash' }}</td>
          <td v-if="showStatus" class="py-1.5 px-2 border-r border-slate-200 text-center font-semibold text-slate-800">
            {{ formatStatusLabel(row.status) }}
          </td>
          <td class="py-1.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
            {{ formatAmount(row.amount) }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
          <td :colspan="footerColspan" class="py-2 px-3 text-right uppercase tracking-wider">
            Total Statement Outflow:
          </td>
          <td class="py-2 px-3 text-right font-black text-sm text-indigo-700">
            {{ currencySymbol }} {{ formatAmount(computedTotalAmount) }}
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- 4. OPTIONAL OFFICIAL SIGNATURES SECTION -->
    <div
      v-if="showSignatures && signatures?.length > 0"
      :class="`grid grid-cols-${signatures.length} gap-8 pt-6 mt-4 border-t border-slate-300 text-center text-xs text-slate-700`"
    >
      <div v-for="(sig, sIdx) in signatures" :key="'sig-' + sIdx">
        <div class="border-b border-slate-400 mb-1.5 h-10"></div>
        <p class="font-bold text-slate-900">{{ sig.title }}</p>
        <p v-if="sig.subtitle" class="text-[10px] text-slate-500">{{ sig.subtitle }}</p>
      </div>
    </div>

    <!-- 5. OPTIONAL SYSTEM FOOTER -->
    <div
      v-if="showFooter"
      class="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400"
    >
      {{ footerNote || `${brandName || 'ExpensePro'} Digital Financial Ledger Statement • Official System Record` }}
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 landscape;
    margin: 8mm;
  }

  body.print-mode-ledger * {
    visibility: hidden !important;
  }

  body.print-mode-ledger #ledger-print-area,
  body.print-mode-ledger #ledger-print-area * {
    visibility: visible !important;
  }

  body.print-mode-ledger #ledger-print-area {
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 5mm !important;
    background: #ffffff !important;
    color: #0f172a !important;
    z-index: 99999999 !important;
    box-sizing: border-box !important;
  }

  body.print-mode-ledger #ledger-print-area table {
    page-break-inside: auto;
  }

  body.print-mode-ledger #ledger-print-area tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  body.print-mode-ledger #ledger-print-area thead {
    display: table-header-group;
  }

  body.print-mode-ledger #ledger-print-area tfoot {
    display: table-footer-group;
  }
}
</style>

