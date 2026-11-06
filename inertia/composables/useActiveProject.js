import { computed } from 'vue'
import { usePage, router } from '@inertiajs/vue3'
import { toast } from '~/composables/useToast'
import { Building2, Store, Briefcase, Sprout, Car, Layers } from 'lucide-vue-next'

// Category lists per project type
const categoryMap = {
  Construction: ['Raw Materials', 'Labour & Wages', 'Architecture & 3D Design', 'Machinery & Rental', 'Hardware & Sanitary'],
  'Retail Business': ['Shop Interior & Racks', 'Refrigeration & AC', 'Drug Licensing & Legal', 'Initial Medicine Stock', 'POS Hardware & Computer'],
  Agriculture: ['Tube-well & Solar Bore', 'Fertilizer & Pesticides', 'Seeds & Saplings', 'Tractor Fuel & Repair', 'Farm Labour Wages'],
  'Business Venture': ['Office Renovation & Interior', 'IT Hardware & Servers', 'Legal Registration & Licensing', 'Marketing & Branding', 'Working Capital'],
  'Vehicle & Fleet': ['Vehicle Purchase Price', 'Engine & Mechanical Overhaul', 'Insurance & Registration', 'Fuel & Maintenance', 'Driver Advance'],
  'Other Ledger': ['Equipment & Tools', 'Contractor Fees', 'Licenses & Permits', 'Consumables & Supplies', 'Miscellaneous'],
}

// Icon helper
const projectIconMap = {
  Construction: Building2,
  'Retail Business': Store,
  'Business Venture': Briefcase,
  Agriculture: Sprout,
  'Vehicle & Fleet': Car,
  'Other Ledger': Layers,
}

export function useActiveProject() {
  const page = usePage()

  const getProjectIcon = (type) => projectIconMap[type] || Building2

  // Live projects list loaded directly from MySQL via Inertia props
  const projects = computed(() => {
    return page.props.projects || []
  })

  // Live active project ID determined by server session/query
  const activeProjectId = computed(() => {
    if (page.props.activeProjectId) {
      return Number(page.props.activeProjectId)
    }
    return projects.value[0]?.id || null
  })

  // Live active project model object
  const activeProject = computed(() => {
    if (page.props.activeProject) {
      return page.props.activeProject
    }
    if (!projects.value || projects.value.length === 0) return null
    if (activeProjectId.value) {
      return projects.value.find((p) => p.id === activeProjectId.value) || projects.value[0] || null
    }
    return projects.value[0] || null
  })

  // Live expenses for the currently active project
  const activeExpenses = computed(() => {
    if (page.props.expenses && Array.isArray(page.props.expenses.data)) {
      return page.props.expenses.data
    }
    return page.props.activeExpenses || []
  })

  // Specific categories for active project type
  const activeCategories = computed(() => {
    const type = activeProject.value?.type || 'Construction'
    return categoryMap[type] || categoryMap['Other Ledger']
  })

  // Dynamic live stats for active project (Uses backend SQL aggregate if available)
  const activeStats = computed(() => {
    if (page.props.activeStats) {
      const s = page.props.activeStats
      return {
        totalSpent: s.totalSpent,
        grandTotal: s.grandTotal,
        pendingTotal: s.pendingTotal,
        totalCount: s.totalCount,
        receiptsCount: s.receiptsCount,
        targetBudget: s.targetBudget,
        budgetPercent: s.budgetPercent,
        totalSpentFormatted: `Rs. ${Number(s.totalSpent || 0).toLocaleString()}`,
        pendingTotalFormatted: `Rs. ${Number(s.pendingTotal || 0).toLocaleString()}`,
        targetBudgetFormatted: s.targetBudget ? `Rs. ${Number(s.targetBudget).toLocaleString()}` : null,
      }
    }

    const list = activeExpenses.value
    const totalSpent = list.filter((e) => e.status !== 'Pending').reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    const grandTotal = list.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    const pendingTotal = list.filter((e) => e.status === 'Pending').reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    const receiptsCount = list.filter((e) => Boolean(e.hasReceipt || e.receiptName || e.receiptUrl)).length

    const budget = activeProject.value?.targetBudget || null
    const budgetPercent = budget && budget > 0 ? Math.min(Math.round((grandTotal / budget) * 100), 100) : null

    return {
      totalSpent,
      grandTotal,
      pendingTotal,
      totalCount: list.length,
      receiptsCount,
      targetBudget: budget,
      budgetPercent,
      totalSpentFormatted: `Rs. ${grandTotal.toLocaleString()}`,
      pendingTotalFormatted: `Rs. ${pendingTotal.toLocaleString()}`,
      targetBudgetFormatted: budget ? `Rs. ${Number(budget).toLocaleString()}` : null,
    }
  })

  // Category distribution calculation for dashboard charts (Uses backend pre-aggregated SQL if available)
  const categoryDistribution = computed(() => {
    if (page.props.categoryDistribution && Array.isArray(page.props.categoryDistribution)) {
      return page.props.categoryDistribution
    }

    const list = activeExpenses.value
    const total = list.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    if (total === 0) return []

    const colorPalette = ['bg-indigo-600', 'bg-emerald-600', 'bg-purple-600', 'bg-blue-600', 'bg-amber-500', 'bg-rose-500']
    const grouped = {}

    list.forEach((item) => {
      const cat = item.category || 'Other'
      grouped[cat] = (grouped[cat] || 0) + Number(item.amount || 0)
    })

    return Object.entries(grouped)
      .map(([name, amount], index) => {
        const percent = Math.round((amount / total) * 100)
        return {
          name,
          rawAmount: amount,
          amount: `Rs. ${amount.toLocaleString()}`,
          percent,
          color: colorPalette[index % colorPalette.length],
        }
      })
      .sort((a, b) => b.percent - a.percent)
  })

  // Projects list decorated with icons
  const projectsWithStats = computed(() => {
    return projects.value.map((proj) => ({
      ...proj,
      icon: getProjectIcon(proj.type),
    }))
  })

  // Server Actions (Direct MySQL Persistence via Inertia)
  const switchProject = (id) => {
    const pathname = window.location.pathname
    router.get(pathname, { projectId: id }, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const createProject = (projectData) => {
    router.post('/projects', projectData, {
      preserveScroll: true,
      onSuccess: () => toast.success(`Project '${projectData.name}' created successfully!`),
      onError: () => toast.error('Failed to create project. Please check required fields.'),
    })
  }

  const updateProject = (projectData) => {
    router.put(`/projects/${projectData.id}`, projectData, {
      preserveScroll: true,
      onSuccess: () => toast.success(`Project '${projectData.name}' updated successfully!`),
      onError: () => toast.error('Failed to update project.'),
    })
  }

  const deleteProject = (id) => {
    router.delete(`/projects/${id}`, {
      preserveScroll: true,
      onSuccess: () => toast.success('Project deleted successfully!'),
      onError: () => toast.error('Failed to delete project.'),
    })
  }

  const addExpense = (expenseData) => {
    const formData = new FormData()
    formData.append('projectId', String(activeProjectId.value))
    formData.append('title', expenseData.title)
    formData.append('category', expenseData.category)
    formData.append('amount', String(expenseData.amount))
    formData.append('date', expenseData.date)
    formData.append('paymentMethod', expenseData.paymentMethod || 'Cash')
    formData.append('status', expenseData.status || 'Paid')
    if (expenseData.vendor) formData.append('vendor', expenseData.vendor)
    if (expenseData.notes) formData.append('notes', expenseData.notes)

    // Multiple receipts support
    if (Array.isArray(expenseData.receiptFiles) && expenseData.receiptFiles.length > 0) {
      expenseData.receiptFiles.forEach((file) => {
        formData.append('receipts', file)
      })
    } else if (expenseData.receiptFile) {
      formData.append('receipt', expenseData.receiptFile)
    }

    if (expenseData.existingReceipts) {
      formData.append('existingReceipts', JSON.stringify(expenseData.existingReceipts))
    }

    if (expenseData.receiptUrl) {
      formData.append('receiptUrl', expenseData.receiptUrl)
      if (expenseData.receiptName) formData.append('receiptName', expenseData.receiptName)
    }

    router.post('/expenses', formData, {
      preserveScroll: true,
      onSuccess: () => toast.success(`Payment voucher '${expenseData.title}' recorded!`),
      onError: () => toast.error('Failed to record payment voucher.'),
    })
  }

  const updateExpense = (expenseData) => {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    formData.append('title', expenseData.title)
    formData.append('category', expenseData.category)
    formData.append('amount', String(expenseData.amount))
    formData.append('date', expenseData.date)
    formData.append('paymentMethod', expenseData.paymentMethod || 'Cash')
    formData.append('status', expenseData.status || 'Paid')
    if (expenseData.vendor) formData.append('vendor', expenseData.vendor)
    if (expenseData.notes) formData.append('notes', expenseData.notes)

    // Multiple receipts support
    if (Array.isArray(expenseData.receiptFiles) && expenseData.receiptFiles.length > 0) {
      expenseData.receiptFiles.forEach((file) => {
        formData.append('receipts', file)
      })
    } else if (expenseData.receiptFile) {
      formData.append('receipt', expenseData.receiptFile)
    }

    if (expenseData.existingReceipts !== undefined) {
      formData.append('existingReceipts', JSON.stringify(expenseData.existingReceipts))
    }

    if (expenseData.receiptUrl) {
      formData.append('receiptUrl', expenseData.receiptUrl)
      if (expenseData.receiptName) formData.append('receiptName', expenseData.receiptName)
    }

    router.post(`/expenses/${expenseData.id}`, formData, {
      preserveScroll: true,
      onSuccess: () => toast.success('Expense updated successfully!'),
      onError: () => toast.error('Failed to update expense.'),
    })
  }

  const deleteExpense = (id) => {
    router.delete(`/expenses/${id}`, {
      preserveScroll: true,
      onSuccess: () => toast.success('Expense record deleted!'),
      onError: () => toast.error('Failed to delete expense.'),
    })
  }

  return {
    projects,
    activeProjectId,
    activeProject,
    activeExpenses,
    activeCategories,
    activeStats,
    categoryDistribution,
    projectsWithStats,
    getProjectIcon,
    switchProject,
    createProject,
    updateProject,
    deleteProject,
    addExpense,
    updateExpense,
    deleteExpense,
  }
}
