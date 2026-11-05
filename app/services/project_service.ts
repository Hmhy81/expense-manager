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
      .select(
        db.raw(
          'COUNT(CASE WHEN receipt_url IS NOT NULL AND receipt_url != "" THEN 1 WHEN receipt_name IS NOT NULL AND receipt_name != "" THEN 1 ELSE NULL END) as receipts_count'
        )
      )
      .groupBy('project_id')

    const statsMap = new Map<number, { totalSpent: number; entriesCount: number; receiptsCount: number }>()
    for (const row of statsRows) {
      statsMap.set(Number(row.project_id), {
        totalSpent: Number(row.total_spent || 0),
        entriesCount: Number(row.entries_count || 0),
        receiptsCount: Number(row.receipts_count || 0),
      })
    }

    return projects.map((proj) => {
      const stats = statsMap.get(proj.id) || { totalSpent: 0, entriesCount: 0, receiptsCount: 0 }
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
        createdAt: proj.createdAt ? proj.createdAt.toISO() : null,
      }
    })
  }

  /**
   * Get simple list of users (for Superadmin/Admin filtering)
   */
  static async getUsersListForFilter() {
    const users = await db
      .from('users')
      .select('id', 'full_name', 'email', 'role')
      .orderBy('full_name', 'asc')

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
        db.raw('COUNT(*) as total_count'),
        db.raw(
          'COUNT(CASE WHEN receipt_url IS NOT NULL AND receipt_url != "" THEN 1 WHEN receipt_name IS NOT NULL AND receipt_name != "" THEN 1 ELSE NULL END) as receipts_count'
        )
      )
      .first()

    const project = await Project.find(projectId)
    const targetBudget = project?.targetBudget ? Number(project.targetBudget) : null
    const grandTotal = Number(row?.grand_total || 0)
    const totalSpent = Number(row?.total_spent || 0)
    const pendingTotal = Number(row?.pending_total || 0)
    const totalCount = Number(row?.total_count || 0)
    const receiptsCount = Number(row?.receipts_count || 0)

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
      .orderBy('date', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)

    return expenses.map((e) => ({
      id: e.id,
      title: e.title,
      vendor: e.vendor || '',
      category: e.category,
      amount: Number(e.amount),
      date: e.date,
      paymentMethod: e.paymentMethod || 'Cash',
      status: e.status || 'Paid',
      receiptUrl: e.receiptUrl || '',
      receiptName: e.receiptName || '',
      notes: e.notes || '',
      hasReceipt: Boolean(e.receiptUrl || e.receiptName),
    }))
  }
}
