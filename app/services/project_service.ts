import db from '@adonisjs/lucid/services/db'
import Project from '#models/project'
import Expense from '#models/expense'

export default class ProjectService {
  /**
   * Get all projects with aggregated statistics directly from MySQL
   * Superadmin & Admin see all projects across the system, while regular users see only their own.
   */
  static async getUserProjectsWithStats(
    userOrId: { id: number; role?: string } | number,
    filterUserId?: number | null
  ) {
    let userId: number
    let role = 'user'

    if (typeof userOrId === 'number') {
      userId = userOrId
    } else {
      userId = userOrId.id
      role = userOrId.role || 'user'
    }

    const isStaff = role === 'superadmin' || role === 'admin'
    const projectsQuery = Project.query().preload('user').orderBy('createdAt', 'desc')

    if (!isStaff) {
      projectsQuery.where('userId', userId)
    } else if (filterUserId) {
      projectsQuery.where('userId', filterUserId)
    }

    const projects = await projectsQuery

    if (projects.length === 0) {
      return []
    }

    const projectIds = projects.map((p) => p.id)

    // Run a single grouped aggregation query for these projects
    const statsRows = await db
      .from('expenses')
      .whereIn('project_id', projectIds)
      .select('project_id')
      .count('* as entries_count')
      .sum('amount as total_spent')
      .groupBy('project_id')

    const docStatsRows = await db
      .from('expense_documents')
      .whereIn('project_id', projectIds)
      .select('project_id')
      .count('* as total_documents')
      .countDistinct('expense_id as receipts_count')
      .groupBy('project_id')

    const docStatsMap = new Map<number, { receiptsCount: number; totalDocuments: number }>()
    for (const r of docStatsRows) {
      docStatsMap.set(Number(r.project_id), {
        receiptsCount: Number(r.receipts_count || 0),
        totalDocuments: Number(r.total_documents || 0),
      })
    }

    const statsMap = new Map<number, { totalSpent: number; entriesCount: number; receiptsCount: number; totalDocuments: number }>()
    for (const row of statsRows) {
      const pid = Number(row.project_id)
      const docStat = docStatsMap.get(pid) || { receiptsCount: 0, totalDocuments: 0 }
      statsMap.set(pid, {
        totalSpent: Number(row.total_spent || 0),
        entriesCount: Number(row.entries_count || 0),
        receiptsCount: docStat.receiptsCount,
        totalDocuments: docStat.totalDocuments,
      })
    }

    return projects.map((proj) => {
      const stats = statsMap.get(proj.id) || { totalSpent: 0, entriesCount: 0, receiptsCount: 0, totalDocuments: 0 }
      return {
        id: proj.id,
        userId: proj.userId,
        ownerName: proj.user?.fullName || proj.user?.email || 'Unknown User',
        ownerEmail: proj.user?.email || '',
        name: proj.name,
        type: proj.type || 'Construction',
        location: proj.location || '',
        targetBudget: proj.targetBudget ? Number(proj.targetBudget) : null,
        startDate: proj.startDate || '',
        status: proj.status || 'Active',
        description: proj.description || '',
        totalSpent: stats.totalSpent,
        entriesCount: stats.entriesCount,
        receiptsCount: stats.receiptsCount,
        totalDocuments: stats.totalDocuments,
        createdAt: proj.createdAt ? proj.createdAt.toISO() : null,
      }
    })
  }

  /**
   * Get simple list of users (for Superadmin/Admin filtering)
   * Shows only users with 'user' role so administrative accounts are not listed
   */
  static async getUsersListForFilter(currentUser?: { role?: string }) {
    const query = db
      .from('users')
      .select('id', 'full_name', 'email', 'role')
      .orderBy('full_name', 'asc')

    // Only include users with 'user' role
    if (!currentUser || currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      query.where('role', 'user')
    }

    const users = await query

    return users.map((u) => ({
      id: u.id,
      name: u.full_name || u.email,
      email: u.email,
      role: u.role || 'user',
    }))
  }

  /**
   * Get active project KPI summary metrics directly via optimized SQL aggregate query
   */
  static async getActiveProjectStats(projectId: number) {
    const row = await db
      .from('expenses')
      .where('project_id', projectId)
      .select(
        db.raw('COALESCE(SUM(amount), 0) as grand_total'),
        db.raw('COALESCE(SUM(CASE WHEN status != "Pending" THEN amount ELSE 0 END), 0) as total_spent'),
        db.raw('COALESCE(SUM(CASE WHEN status = "Pending" THEN amount ELSE 0 END), 0) as pending_total'),
        db.raw('COUNT(*) as total_count')
      )
      .first()

    const docRow = await db
      .from('expense_documents')
      .where('project_id', projectId)
      .select(
        db.raw('COUNT(DISTINCT expense_id) as receipts_count'),
        db.raw('COUNT(*) as total_documents')
      )
      .first()

    const project = await Project.find(projectId)
    const targetBudget = project?.targetBudget ? Number(project.targetBudget) : null
    const grandTotal = Number(row?.grand_total || 0)
    const totalSpent = Number(row?.total_spent || 0)
    const pendingTotal = Number(row?.pending_total || 0)
    const totalCount = Number(row?.total_count || 0)
    const receiptsCount = Number(docRow?.receipts_count || 0)
    const totalDocuments = Number(docRow?.total_documents || 0)

    const budgetPercent =
      targetBudget && targetBudget > 0
        ? Math.min(Math.round((grandTotal / targetBudget) * 100), 100)
        : null

    return {
      totalSpent,
      grandTotal,
      pendingTotal,
      totalCount,
      receiptsCount,
      totalDocuments,
      targetBudget,
      budgetPercent,
    }
  }

  /**
   * Get category distribution breakdown directly from MySQL
   */
  static async getCategoryDistribution(projectId: number) {
    const totalRow = await db
      .from('expenses')
      .where('project_id', projectId)
      .sum('amount as grand_total')
      .first()

    const grandTotal = Number(totalRow?.grand_total || 0)
    if (grandTotal === 0) {
      return []
    }

    const rows = await db
      .from('expenses')
      .where('project_id', projectId)
      .select('category')
      .sum('amount as total_amount')
      .groupBy('category')
      .orderBy('total_amount', 'desc')

    const colorPalette = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-blue-600',
      'bg-amber-500',
      'bg-rose-500',
    ]

    return rows.map((r, index) => {
      const rawAmount = Number(r.total_amount || 0)
      const percent = Math.round((rawAmount / grandTotal) * 100)
      return {
        name: r.category || 'General',
        rawAmount,
        amount: `Rs. ${rawAmount.toLocaleString()}`,
        percent,
        color: colorPalette[index % colorPalette.length],
      }
    })
  }

  /**
   * Get latest recent expenses for active project
   */
  static async getRecentExpenses(projectId: number, limit: number = 5) {
    const expenses = await Expense.query()
      .where('projectId', projectId)
      .preload('documents')
      .orderBy('date', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)

    return expenses.map((e) => {
      const docs = (e.documents || []).map((d) => ({
        id: d.id,
        url: d.filePath,
        name: d.fileName,
        type: d.fileType?.includes('pdf') || d.filePath.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
        size: d.fileSize ? Number(d.fileSize) : null,
        documentType: d.documentType || 'receipt',
      }))

      return {
        id: e.id,
        title: e.title,
        vendor: e.vendor || '',
        category: e.category,
        amount: Number(e.amount),
        date: e.date,
        paymentMethod: e.paymentMethod || 'Cash',
        status: e.status || 'Paid',
        receipts: docs,
        receiptsCount: docs.length,
        receiptUrl: docs[0]?.url || '',
        receiptName: docs[0]?.name || '',
        notes: e.notes || '',
        hasReceipt: docs.length > 0,
      }
    })
  }

  /**
   * Get monthly expense trend (outflow aggregated per month)
   */
  static async getMonthlyExpenseTrend(projectId: number) {
    const rows = await db
      .from('expenses')
      .where('project_id', projectId)
      .select(
        db.raw("SUBSTRING(date, 1, 7) as month_key"),
        db.raw("COALESCE(SUM(amount), 0) as total_amount"),
        db.raw("COUNT(*) as entry_count")
      )
      .groupBy('month_key')
      .orderBy('month_key', 'asc')

    return rows.map((r) => {
      const parts = String(r.month_key || '').split('-')
      let label = r.month_key
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10)
        const monthNum = parseInt(parts[1], 10)
        if (!isNaN(year) && !isNaN(monthNum)) {
          const dateObj = new Date(year, monthNum - 1, 1)
          label = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        }
      }
      return {
        key: r.month_key,
        label,
        amount: Number(r.total_amount || 0),
        count: Number(r.entry_count || 0),
      }
    })
  }

  /**
   * Get payment status aggregation breakdown (Full Paid, Partial Paid, Advance Paid, Pending)
   */
  static async getPaymentStatusBreakdown(projectId: number) {
    const rows = await db
      .from('expenses')
      .where('project_id', projectId)
      .select('status')
      .sum('amount as total_amount')
      .count('* as count')
      .groupBy('status')

    const statusOrder = ['Full Paid', 'Partial Paid', 'Advance Paid', 'Pending']

    return rows.map((r) => {
      let statusName = r.status || 'Full Paid'
      if (statusName === 'Paid') statusName = 'Full Paid'
      return {
        status: statusName,
        amount: Number(r.total_amount || 0),
        count: Number(r.count || 0),
      }
    }).sort((a, b) => {
      const idxA = statusOrder.indexOf(a.status)
      const idxB = statusOrder.indexOf(b.status)
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99)
    })
  }
}
