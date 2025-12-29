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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat laporan keuangan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="text-amber-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Terjadi Kesalahan</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchReportData}
              className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-gray-600 mt-1">Analisis dan ringkasan transaksi keuangan Anda</p>
        </div>
        <div className="flex space-x-4 mt-4 sm:mt-0">
          <button
            onClick={() => exportReport()}
            className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md"
          >
            Export Laporan
          </button>
        </div>
      </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Laporan</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
              <select
                value={filter.period}
                onChange={(e) => setFilter({...filter, period: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Awal</label>
                  <input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
                  <input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <button
                onClick={fetchReportData}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg transition duration-200 shadow-md"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Transaksi</h3>
                <div className="text-2xl font-bold text-gray-800">{summary.transactionCount}</div>
              </div>
              <div className="text-blue-500 h-10 w-24">
                <svg className="w-full h-full stroke-current fill-none" stroke-width="2.5" viewBox="0 0 100 40">
                  <path d="M0 30 L10 25 L20 32 L30 15 L40 20 L50 10 L60 25 L70 18 L80 30 L90 20 L100 25" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center text-xs">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold mr-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px] font-bold">arrow_upward</span>
                +{summary.transactionCount}
              </span>
              <span className="text-gray-500 opacity-80">Transaksi tercatat</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Pemasukan</h3>
                <div className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalIncome)}</div>
              </div>
              <div className="text-green-500 h-10 w-24 opacity-80">
                <svg className="w-full h-full stroke-current fill-none" stroke-width="2.5" viewBox="0 0 100 40">
                  <path d="M0 25 L15 30 L30 20 L45 35 L60 15 L75 25 L90 10 L100 20" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center text-xs">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold mr-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px] font-bold">arrow_upward</span>
                +{formatCurrency(summary.totalIncome)}
              </span>
              <span className="text-gray-500 opacity-80">Total pemasukan</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Pengeluaran</h3>
                <div className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalExpense)}</div>
              </div>
              <div className="text-red-500 h-10 w-24">
                <svg className="w-full h-full stroke-current fill-none" stroke-width="2.5" viewBox="0 0 100 40">
                  <path d="M0 20 L10 25 L25 10 L40 25 L55 15 L70 30 L85 20 L100 15" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center text-xs">
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold mr-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px] font-bold">arrow_downward</span>
                -{formatCurrency(summary.totalExpense)}
              </span>
              <span className="text-gray-500 opacity-80">Total pengeluaran</span>
            </div>
          </div>

          <div className={`bg-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 ${summary.balance >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Saldo</h3>
                <div className="text-2xl font-bold text-gray-800">{formatCurrency(summary.balance)}</div>
              </div>
              <div className="text-teal-400 h-10 w-24 opacity-90">
                <svg className="w-full h-full stroke-current fill-none" stroke-width="2.5" viewBox="0 0 100 40">
                  <path d="M0 35 L15 25 L30 30 L45 15 L60 25 L75 10 L90 20 L100 15" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
            </div>
            <div className="flex items-center text-xs">
              <span className={`px-2 py-1 rounded-full font-semibold mr-2 flex items-center gap-1 ${summary.balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <span className="material-symbols-outlined text-[10px] font-bold">{summary.balance >= 0 ? 'arrow_upward' : 'arrow_downward'}</span>
                {summary.balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(summary.balance))}
              </span>
              <span className="text-gray-500 opacity-80">Saldo terkini</span>
            </div>
          </div>
        </div>

        {/* Chart Section - Simplified version without external libraries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Grafik Pemasukan vs Pengeluaran</h2>
          {monthlyData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bulan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemasukan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengeluaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{data.month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{formatCurrency(data.income)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(data.expense)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data untuk periode yang dipilih
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income by Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Pemasukan Berdasarkan Kategori</h2>
            {categoryTotals.filter(cat => cat.type === 'income').length > 0 ? (
              <div className="space-y-4">
                {categoryTotals
                  .filter(cat => cat.type === 'income')
                  .map((category, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 hover:bg-gray-50 transition duration-150 p-2 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-gray-800">{category.name}</span>
                        </div>
                        <span className="font-semibold text-green-600">{formatCurrency(category.total)}</span>
                      </div>
                      <div className="text-sm text-gray-500">{category.transactionCount} transaksi</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Tidak ada transaksi pemasukan
              </div>
            )}
          </div>

          {/* Expense by Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Pengeluaran Berdasarkan Kategori</h2>
            {categoryTotals.filter(cat => cat.type === 'expense').length > 0 ? (
              <div className="space-y-4">
                {categoryTotals
                  .filter(cat => cat.type === 'expense')
                  .map((category, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 hover:bg-gray-50 transition duration-150 p-2 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-gray-800">{category.name}</span>
                        </div>
                        <span className="font-semibold text-red-600">{formatCurrency(category.total)}</span>
                      </div>
                      <div className="text-sm text-gray-500">{category.transactionCount} transaksi</div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Tidak ada transaksi pengeluaran
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Transaksi Terbaru</h2>
            <div className="flex space-x-4">
              <select
                value={transactionFilter.type}
                onChange={(e) => setTransactionFilter({...transactionFilter, type: e.target.value})}
                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
              >
                <option value="all">Tipe</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
              <select
                value={transactionFilter.categoryId}
                onChange={(e) => setTransactionFilter({...transactionFilter, categoryId: e.target.value})}
                className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                        <tr key={transaction.id} className="hover:bg-gray-50 transition duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{transaction.description || 'Tanpa deskripsi'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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
            <div className="text-center py-8 text-gray-500">
              Tidak ada transaksi untuk periode yang dipilih
            </div>
          )}
        </div>
      </div>
  )
}