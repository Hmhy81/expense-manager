<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { TrendingUp, PieChart, BarChart3, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  monthlyTrend: {
    type: Array,
    default: () => [],
  },
  categoryDistribution: {
    type: Array,
    default: () => [],
  },
  paymentStatusStats: {
    type: Array,
    default: () => [],
  },
  currencySymbol: {
    type: String,
    default: 'Rs.',
  },
})

// Canvas DOM references
const trendCanvasRef = ref(null)
const categoryCanvasRef = ref(null)
const statusCanvasRef = ref(null)

// Chart.js instances
let trendChartInstance = null
let categoryChartInstance = null
let statusChartInstance = null

// Palette for Category Doughnut
const categoryColors = [
  '#4f46e5', // indigo-600
  '#059669', // emerald-600
  '#7c3aed', // purple-600
  '#2563eb', // blue-600
  '#d97706', // amber-600
  '#e11d48', // rose-600
  '#0891b2', // cyan-600
  '#475569', // slate-600
]

const formatNumber = (val) => Number(val || 0).toLocaleString()

// 1. Initialize Monthly Outflow Trend (Area Chart)
const renderTrendChart = () => {
  if (!trendCanvasRef.value) return
  if (trendChartInstance) trendChartInstance.destroy()

  const labels = props.monthlyTrend.length > 0
    ? props.monthlyTrend.map((d) => d.label)
    : ['No Data']
  const data = props.monthlyTrend.length > 0
    ? props.monthlyTrend.map((d) => d.amount)
    : [0]

  const ctx = trendCanvasRef.value.getContext('2d')
  let gradient = null
  if (ctx) {
    gradient = ctx.createLinearGradient(0, 0, 0, 240)
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.35)')
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.00)')
  }

  trendChartInstance = new Chart(trendCanvasRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Monthly Outflow',
          data,
          borderColor: '#4f46e5',
          borderWidth: 2.5,
          backgroundColor: gradient || 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#4f46e5',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` Outflow: ${props.currencySymbol} ${formatNumber(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#64748b' },
        },
        y: {
          border: { dash: [4, 4] },
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { size: 10.5 },
            color: '#64748b',
            callback: (val) => `${props.currencySymbol} ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
          },
        },
      },
    },
  })
}

// 2. Initialize Category Allocation (Doughnut Chart)
const renderCategoryChart = () => {
  if (!categoryCanvasRef.value) return
  if (categoryChartInstance) categoryChartInstance.destroy()

  const labels = props.categoryDistribution.length > 0
    ? props.categoryDistribution.map((c) => c.name)
    : ['No Expenses']
  const data = props.categoryDistribution.length > 0
    ? props.categoryDistribution.map((c) => c.rawAmount || c.amount || 0)
    : [1]
  const backgroundColors = props.categoryDistribution.length > 0
    ? props.categoryDistribution.map((_, i) => categoryColors[i % categoryColors.length])
    : ['#e2e8f0']

  categoryChartInstance = new Chart(categoryCanvasRef.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            borderRadius: 3,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 11 },
            color: '#334155',
            padding: 14,
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              if (props.categoryDistribution.length === 0) return ' No expense recorded'
              const percent = props.categoryDistribution[ctx.dataIndex]?.percent || 0
              return ` ${ctx.label}: ${props.currencySymbol} ${formatNumber(ctx.raw)} (${percent}%)`
            },
          },
        },
      },
    },
  })
}

// 3. Initialize Payment Status & Settlement (Bar Chart)
const renderStatusChart = () => {
  if (!statusCanvasRef.value) return
  if (statusChartInstance) statusChartInstance.destroy()

  const statusColorMap = {
    'Full Paid': { bg: 'rgba(16, 185, 129, 0.85)', border: '#059669' },
    'Partial Paid': { bg: 'rgba(59, 130, 246, 0.85)', border: '#2563eb' },
    'Advance Paid': { bg: 'rgba(139, 92, 246, 0.85)', border: '#7c3aed' },
    'Pending': { bg: 'rgba(245, 158, 11, 0.85)', border: '#d97706' },
  }

  const labels = props.paymentStatusStats.length > 0
    ? props.paymentStatusStats.map((s) => s.status)
    : ['Full Paid', 'Partial Paid', 'Advance Paid', 'Pending']

  const data = props.paymentStatusStats.length > 0
    ? props.paymentStatusStats.map((s) => s.amount)
    : [0, 0, 0, 0]

  const bgColors = labels.map((l) => statusColorMap[l]?.bg || 'rgba(100, 116, 139, 0.85)')
  const borderColors = labels.map((l) => statusColorMap[l]?.border || '#475569')

  statusChartInstance = new Chart(statusCanvasRef.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Amount',
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 38,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` Amount: ${props.currencySymbol} ${formatNumber(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: '600' }, color: '#475569' },
        },
        y: {
          border: { dash: [4, 4] },
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { size: 10.5 },
            color: '#64748b',
            callback: (val) => `${props.currencySymbol} ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
          },
        },
      },
    },
  })
}

const renderAllCharts = () => {
  nextTick(() => {
    renderTrendChart()
    renderCategoryChart()
    renderStatusChart()
  })
}

onMounted(() => {
  renderAllCharts()
})

onBeforeUnmount(() => {
  if (trendChartInstance) trendChartInstance.destroy()
  if (categoryChartInstance) categoryChartInstance.destroy()
  if (statusChartInstance) statusChartInstance.destroy()
})

watch(
  [() => props.monthlyTrend, () => props.categoryDistribution, () => props.paymentStatusStats],
  () => {
    renderAllCharts()
  },
  { deep: true }
)
</script>

<template>
  <div class="space-y-6">
    <!-- Top Row: Monthly Trend (2 Cols) & Category Donut (1 Col) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 1. Monthly Outflow Trend (Area Chart) -->
      <div class="lg:col-span-2 bg-white border border-slate-200/90 p-5 sm:p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp :size="16" />
              </span>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900">Monthly Expenditure Trend</h3>
                <p class="text-xs text-slate-500">Cumulative outflow timeline across project months</p>
              </div>
            </div>
            <span class="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Timeline Analysis
            </span>
          </div>
        </div>

        <div class="relative h-64 mt-4 w-full">
          <canvas ref="trendCanvasRef"></canvas>
        </div>
      </div>

      <!-- 2. Category Distribution (Donut Chart) -->
      <div class="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-2xl shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <PieChart :size="16" />
              </span>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900">Cost by Category</h3>
                <p class="text-xs text-slate-500">Expenditure allocation share</p>
              </div>
            </div>
          </div>
        </div>

        <div class="relative h-64 mt-4 w-full flex items-center justify-center">
          <canvas ref="categoryCanvasRef"></canvas>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Payment Settlement & Status Bar Chart -->
    <div class="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-2xl shadow-2xs">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <span class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <BarChart3 :size="16" />
          </span>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900">Payment Status & Settlement Flow</h3>
            <p class="text-xs text-slate-500">Cleared funds, partial dues, advances and pending disbursements</p>
          </div>
        </div>
        <div class="hidden sm:flex items-center gap-3 text-xs font-medium text-slate-500">
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Full Paid</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Partial</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Advance</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending</span>
        </div>
      </div>

      <div class="relative h-56 mt-4 w-full">
        <canvas ref="statusCanvasRef"></canvas>
      </div>
    </div>
  </div>
</template>

