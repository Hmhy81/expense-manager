import db from '@adonisjs/lucid/services/db'
import Project from '#models/project'
import Expense from '#models/expense'

export default class ProjectService {
  /**
   * Get all projects for a user with aggregated statistics directly from MySQL
   * Avoids preloading all expenses into RAM!
   */
  static async getUserProjectsWithStats(userId: number) {
    const projects = await Project.query()
      .where('userId', userId)
      .orderBy('createdAt', 'desc')

    if (projects.length === 0) {
      return []
    }

    // Run a single grouped aggregation query for all user's projects
    const statsRows = await db
      .from('expenses')
      .where('user_id', userId)
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
   * Get category breakdown grouped and summed in MySQL for dashboard visualization
   */
  static async getCategoryDistribution(projectId: number) {
    const rows = await db
      .from('expenses')
      .where('project_id', projectId)
      .select('category')
      .sum('amount as total_amount')
      .groupBy('category')
      .orderBy('total_amount', 'desc')

    const grandTotal = rows.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0)
    if (grandTotal === 0) return []

    const colorPalette = [
      'bg-indigo-600',
      'bg-emerald-600',
      'bg-purple-600',
      'bg-blue-600',
      'bg-amber-500',
      'bg-rose-500',
    ]

    return rows.map((r, idx) => {
      const amount = Number(r.total_amount || 0)
      const percent = Math.round((amount / grandTotal) * 100)
      return {
        name: r.category,
        amount,
        rawAmount: amount,
        percent,
        color: colorPalette[idx % colorPalette.length],
      }
    })
  }

  /**
   * Get top 5 recent expenses for Dashboard without pulling full table
   */
  static async getRecentExpenses(projectId: number, limit = 5) {
    const list = await Expense.query()
      .where('projectId', projectId)
      .orderBy('date', 'desc')
      .limit(limit)

    return list.map((e) => ({
      id: e.id,
      projectId: e.projectId,
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

