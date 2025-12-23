import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { useNavigate } from 'react-router-dom'

export default function Reports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({
    period: 'current_month',
    startDate: '',
    endDate: ''
  })

  const [transactionFilter, setTransactionFilter] = useState({
    type: 'all', // 'all', 'income', 'expense'
    categoryId: ''
  })

  useEffect(() => {
    fetchReportData()
  }, [filter])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch transactions
      const transactionsRes = await transactionService.getTransactions(100) // Get more transactions for report
      if (transactionsRes.error) {
        throw new Error(transactionsRes.error.message || transactionsRes.error)
      }
      
      // Apply date filter
      let filteredTransactions = transactionsRes.data || []
      
      if (filter.period === 'custom' && filter.startDate && filter.endDate) {
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date)
          const startDate = new Date(filter.startDate)
          const endDate = new Date(filter.endDate)
          return transactionDate >= startDate && transactionDate <= endDate
        })
      } else if (filter.period === 'current_month') {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfMonth && transactionDate <= endOfMonth
        })
      } else if (filter.period === 'last_month') {
        const now = new Date()
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth
        })
      } else if (filter.period === 'current_year') {
        const now = new Date()
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const endOfYear = new Date(now.getFullYear(), 11, 31)
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date)
          return transactionDate >= startOfYear && transactionDate <= endOfYear
        })
      }

      setTransactions(filteredTransactions)

      // Fetch categories
      const categoriesRes = await categoryService.getCategories()
      if (categoriesRes.error) {
        throw new Error(categoriesRes.error.message || categoriesRes.error)
      }
      setCategories(categoriesRes.data || [])

      // Calculate summary
      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      
      const expense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      
      setSummary({
        totalIncome: income,
        totalExpense: expense,
        balance: income - expense,
        transactionCount: filteredTransactions.length
      })

      // Calculate monthly data for chart
      const monthlyIncome = {}
      const monthlyExpense = {}

      filteredTransactions.forEach(t => {
        const date = new Date(t.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (t.type === 'income') {
          monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + parseFloat(t.amount || 0)
        } else {
          monthlyExpense[monthKey] = (monthlyExpense[monthKey] || 0) + parseFloat(t.amount || 0)
        }
      })

      const months = Object.keys({ ...monthlyIncome, ...monthlyExpense })
        .sort()
        .slice(-12) // Last 12 months

      const monthlyDataFormatted = months.map(month => ({
        month,
        income: monthlyIncome[month] || 0,
        expense: monthlyExpense[month] || 0,
        balance: (monthlyIncome[month] || 0) - (monthlyExpense[month] || 0)
      }))

      setMonthlyData(monthlyDataFormatted)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const exportReport = () => {
    // Filter transactions based on transactionFilter
    let filteredTransactions = transactions;

    if (transactionFilter.type !== 'all') {
      filteredTransactions = filteredTransactions.filter(t => t.type === transactionFilter.type);
    }

    if (transactionFilter.categoryId) {
      filteredTransactions = filteredTransactions.filter(t => t.category_id === transactionFilter.categoryId);
    }

    const filteredTransactionsLimited = filteredTransactions.slice(0, 10);

    // Create CSV content
    let csvContent = 'Tanggal,Deskripsi,Kategori,Jumlah,Tipe\n';

    filteredTransactionsLimited.forEach(transaction => {
      const category = categories.find(cat => cat.id === transaction.category_id);
      const categoryName = category ? category.name : 'Tanpa kategori';
      const amount = transaction.type === 'income' ?
        'Rp' + parseFloat(transaction.amount || 0).toLocaleString('id-ID') :
        '-Rp' + parseFloat(transaction.amount || 0).toLocaleString('id-ID');
      const type = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

      csvContent += '"' + formatDate(transaction.date) + '","' + (transaction.description || 'Tanpa deskripsi') + '","' + categoryName + '","' + amount + '","' + type + '"\n';
    });

    // Create summary data
    const summaryContent = '\n\nRingkasan:\n';
    const summaryData = [
      'Total Transaksi: ' + summary.transactionCount,
      'Total Pemasukan: ' + formatCurrency(summary.totalIncome),
      'Total Pengeluaran: ' + formatCurrency(summary.totalExpense),
      'Saldo: ' + formatCurrency(summary.balance)
    ].join('\n');

    csvContent += summaryData;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'laporan-keuangan-' + new Date().toISOString().split('T')[0] + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const categoryTotals = categories.map(category => {
    const categoryTransactions = transactions.filter(t => t.category_id === category.id)
    const total = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
    return {
      ...category,
      total,
      transactionCount: categoryTransactions.length
    }
  }).filter(cat => cat.total > 0) // Only show categories with transactions

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat laporan keuangan...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Terjadi Kesalahan</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchReportData}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-text-light dark:text-text-dark uppercase tracking-wide">Laporan Keuangan</h1>
          <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Analisis dan ringkasan transaksi keuangan Anda</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-md"
          >
            Kembali ke Dashboard
          </button>
          <button
            onClick={() => exportReport()}
            className="bg-success-light hover:bg-success-hover text-white py-2 px-4 rounded-md"
          >
            Export Laporan
          </button>
        </div>
      </div>

        {/* Filter Section */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Filter Laporan</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Periode</label>
              <select
                value={filter.period}
                onChange={(e) => setFilter({...filter, period: e.target.value})}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
              >
                <option value="current_month">Bulan Ini</option>
                <option value="last_month">Bulan Lalu</option>
                <option value="current_year">Tahun Ini</option>
                <option value="custom">Rentang Waktu</option>
              </select>
            </div>

            {filter.period === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Tanggal Awal</label>
                  <input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">Tanggal Akhir</label>
                  <input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="w-full bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-md"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 dark:bg-opacity-30">
                <span className="text-xl text-blue-600 dark:text-blue-400">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Total Transaksi</p>
                <p className="text-2xl font-bold text-text-light dark:text-text-dark">{summary.transactionCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-success-bg-light">
                <span className="text-xl text-success-light">⬆️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Total Pemasukan</p>
                <p className="text-2xl font-bold text-success-light">{formatCurrency(summary.totalIncome)}</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-danger-bg-light">
                <span className="text-xl text-danger-light">⬇️</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-danger-light">{formatCurrency(summary.totalExpense)}</p>
              </div>
            </div>
          </div>

          <div className={`bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 ${summary.balance >= 0 ? 'border-l-4 border-success-light' : 'border-l-4 border-danger-light'}`}>
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${summary.balance >= 0 ? 'bg-success-bg-light' : 'bg-danger-bg-light'}`}>
                <span className={`text-xl ${summary.balance >= 0 ? 'text-success-light' : 'text-danger-light'}`}>
                  {summary.balance >= 0 ? '💰' : '📉'}
                </span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Saldo</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-success-light' : 'text-danger-light'}`}>
                  {formatCurrency(summary.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section - Simplified version without external libraries */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-6">Grafik Pemasukan vs Pengeluaran</h2>
          {monthlyData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Bulan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Pemasukan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Pengeluaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Saldo</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {monthlyData.map((data, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-light dark:text-text-dark">{data.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success-light">{formatCurrency(data.income)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-danger-light">{formatCurrency(data.expense)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${data.balance >= 0 ? 'text-success-light' : 'text-danger-light'}`}>
                        {formatCurrency(data.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted-light dark:text-text-muted-dark">
              Tidak ada data untuk periode yang dipilih
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income by Category */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-6">Pemasukan Berdasarkan Kategori</h2>
            {categoryTotals.filter(cat => cat.type === 'income').length > 0 ? (
              <div className="space-y-4">
                {categoryTotals
                  .filter(cat => cat.type === 'income')
                  .map((category, index) => (
                    <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-text-light dark:text-text-dark">{category.name}</span>
                        </div>
                        <span className="font-semibold text-success-light">{formatCurrency(category.total)}</span>
                      </div>
                      <div className="text-sm text-text-muted-light dark:text-text-muted-dark">{category.transactionCount} transaksi</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-text-muted-light dark:text-text-muted-dark">
                Tidak ada transaksi pemasukan
              </div>
            )}
          </div>

          {/* Expense by Category */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-6">Pengeluaran Berdasarkan Kategori</h2>
            {categoryTotals.filter(cat => cat.type === 'expense').length > 0 ? (
              <div className="space-y-4">
                {categoryTotals
                  .filter(cat => cat.type === 'expense')
                  .map((category, index) => (
                    <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-text-light dark:text-text-dark">{category.name}</span>
                        </div>
                        <span className="font-semibold text-danger-light">{formatCurrency(category.total)}</span>
                      </div>
                      <div className="text-sm text-text-muted-light dark:text-text-muted-dark">{category.transactionCount} transaksi</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-text-muted-light dark:text-text-muted-dark">
                Tidak ada transaksi pengeluaran
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">Transaksi Terbaru</h2>
            <div className="flex space-x-4">
              <select
                value={transactionFilter.type}
                onChange={(e) => setTransactionFilter({...transactionFilter, type: e.target.value})}
                className="px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
              >
                <option value="all">Tipe</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
              <select
                value={transactionFilter.categoryId}
                onChange={(e) => setTransactionFilter({...transactionFilter, categoryId: e.target.value})}
                className="px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
              >
                <option value="">Kategori</option>
                {categories
                  .filter(category =>
                    transactionFilter.type === 'all' ||
                    category.type === transactionFilter.type
                  )
                  .map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(() => {
                    // Filter transactions based on transactionFilter
                    let filteredTransactions = transactions;

                    if (transactionFilter.type !== 'all') {
                      filteredTransactions = filteredTransactions.filter(t => t.type === transactionFilter.type);
                    }

                    if (transactionFilter.categoryId) {
                      filteredTransactions = filteredTransactions.filter(t => t.category_id === transactionFilter.categoryId);
                    }

                    return filteredTransactions.slice(0, 10).map((transaction) => {
                      const category = categories.find(cat => cat.id === transaction.category_id)
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted-light dark:text-text-muted-dark">{formatDate(transaction.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-light dark:text-text-dark">{transaction.description || 'Tanpa deskripsi'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted-light dark:text-text-muted-dark">
                            {category ? (
                              <span className="inline-flex items-center">
                                <div
                                  className="w-2 h-2 rounded-full mr-2"
                                  style={{ backgroundColor: category.color }}
                                ></div>
                                {category.name}
                              </span>
                            ) : 'Tanpa kategori'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${transaction.type === 'income' ? 'text-success-light' : 'text-danger-light'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted-light dark:text-text-muted-dark">
              Tidak ada transaksi untuk periode yang dipilih
            </div>
          )}
        </div>
      </div>
    
  )
}