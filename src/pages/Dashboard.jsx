import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

 const fetchDashboardData = async () => {
  console.log('🔄 Starting to fetch dashboard data...')
  setLoading(true)
  setError(null)

  try {
    console.log('📊 1. Fetching transactions...')
    const transactionsRes = await transactionService.getTransactions(10)
    console.log('Transactions result:', transactionsRes)

    console.log('📊 2. Fetching categories...')
    const categoriesRes = await categoryService.getCategories()
    console.log('Categories result:', categoriesRes)

    console.log('📊 3. Fetching summary...')
    const summaryRes = await transactionService.getSummary()
    console.log('Summary result:', summaryRes)

    // Handle transactions
    if (transactionsRes.error) {
      console.error('Error fetching transactions:', transactionsRes.error)
      setError(`Error fetching transactions: ${transactionsRes.error.message || transactionsRes.error}`)
      setTransactions([])
    } else if (transactionsRes.data) {
      console.log('✅ Transactions data:', transactionsRes.data.length, 'items')
      setTransactions(transactionsRes.data)
    } else {
      console.log('❌ No transactions data')
      setTransactions([])
    }

    // Handle categories
    if (categoriesRes.error) {
      console.error('Error fetching categories:', categoriesRes.error)
      setError(`Error fetching categories: ${categoriesRes.error.message || categoriesRes.error}`)
      setCategories([])
    } else if (categoriesRes.data) {
      console.log('✅ Categories data:', categoriesRes.data.length, 'items')
      setCategories(categoriesRes.data)
    } else {
      console.log('❌ No categories data')
      setCategories([])
    }

    // Handle summary
    if (summaryRes.error) {
      console.error('Error fetching summary:', summaryRes.error)
      setError(`Error fetching summary: ${summaryRes.error.message || summaryRes.error}`)
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0
      })
    } else if (summaryRes.data) {
      console.log('✅ Summary data:', summaryRes.data)
      setSummary(summaryRes.data)
    } else {
      console.log('❌ No summary data')
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0
      })
    }

  } catch (error) {
    console.error('🔥 Error fetching dashboard data:', error)
    setError(error.message || 'An error occurred while fetching dashboard data')
    // Set default values in case of exception
    setTransactions([])
    setCategories([])
    setSummary({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0
    })
  } finally {
    console.log('🏁 Finished fetching data')
    setLoading(false)
  }
}

  const handleLogout = async () => {
    await signOut()
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
      month: 'short'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-muted-light dark:text-text-muted-dark">Memuat data keuangan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="max-w-md w-full bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-danger-light text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">Terjadi Kesalahan</h3>
            <p className="text-text-muted-light dark:text-text-muted-dark mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-md"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-xl font-bold text-text-light dark:text-text-dark uppercase tracking-wide">Dashboard</h1>
        <nav className="flex text-sm text-text-muted-light dark:text-text-muted-dark mt-2 sm:mt-0">
          <a className="hover:text-primary" href="#">Dashboard</a>
          <span className="mx-2">/</span>
          <span className="text-text-light dark:text-text-dark font-medium">Dashboard</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-text-muted-light dark:text-text-muted-dark text-sm font-medium mb-1">Saldo Saat Ini</h3>
              <div className="text-2xl font-bold text-text-light dark:text-text-dark">{formatCurrency(summary.balance || 0)}</div>
            </div>
            <div className="text-primary h-12 w-24">
              <svg className="w-full h-full stroke-current fill-none" stroke-width="2" viewBox="0 0 100 40">
                <path d="M0 30 L10 25 L20 32 L30 15 L40 20 L50 10 L60 25 L70 18 L80 30 L90 20 L100 25"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className={`px-1.5 py-0.5 rounded font-medium mr-2 ${summary.balance >= 0 ? 'bg-success-bg-light text-success-light' : 'bg-danger-bg-light text-danger-light'}`}>
              {summary.balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(summary.balance || 0))}
            </span>
            <span className="text-text-muted-light dark:text-text-muted-dark">Saldo terkini</span>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-text-muted-light dark:text-text-muted-dark text-sm font-medium mb-1">Total Pemasukan</h3>
              <div className="text-2xl font-bold text-text-light dark:text-text-dark">{formatCurrency(summary.totalIncome || 0)}</div>
            </div>
            <div className="text-primary h-12 w-24 opacity-80">
              <svg className="w-full h-full stroke-current fill-none" stroke-width="2" viewBox="0 0 100 40">
                <path d="M0 25 L15 30 L30 20 L45 35 L60 15 L75 25 L90 10 L100 20"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="bg-success-bg-light text-success-light px-1.5 py-0.5 rounded font-medium mr-2">+{formatCurrency(summary.totalIncome || 0)}</span>
            <span className="text-text-muted-light dark:text-text-muted-dark">Total pemasukan</span>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-text-muted-light dark:text-text-muted-dark text-sm font-medium mb-1">Total Pengeluaran</h3>
              <div className="text-2xl font-bold text-text-light dark:text-text-dark">{formatCurrency(summary.totalExpense || 0)}</div>
            </div>
            <div className="text-primary h-12 w-24">
              <svg className="w-full h-full stroke-current fill-none" stroke-width="2" viewBox="0 0 100 40">
                <path d="M0 20 L10 25 L25 10 L40 25 L55 15 L70 30 L85 20 L100 15"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="bg-danger-bg-light text-danger-light px-1.5 py-0.5 rounded font-medium mr-2">-{formatCurrency(summary.totalExpense || 0)}</span>
            <span className="text-text-muted-light dark:text-text-muted-dark">Total pengeluaran</span>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-text-muted-light dark:text-text-muted-dark text-sm font-medium mb-1">Jumlah Transaksi</h3>
              <div className="text-2xl font-bold text-text-light dark:text-text-dark">{summary.transactionCount || 0}</div>
            </div>
            <div className="text-primary h-12 w-24 opacity-80">
              <svg className="w-full h-full stroke-current fill-none" stroke-width="2" viewBox="0 0 100 40">
                <path d="M0 35 L15 25 L30 30 L45 15 L60 25 L75 10 L90 20 L100 15"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="bg-success-bg-light text-success-light px-1.5 py-0.5 rounded font-medium mr-2">+{summary.transactionCount || 0}</span>
            <span className="text-text-muted-light dark:text-text-muted-dark">Transaksi tercatat</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-text-light dark:text-text-dark">Transaksi Terbaru</h2>
            <button
              onClick={() => navigate('/add-transaction')}
              className="bg-primary text-white py-1.5 px-3 rounded text-sm hover:bg-primary-hover transition-colors"
            >
              Tambah
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Deskripsi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(!transactions || transactions.length === 0) ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-text-muted-light dark:text-text-muted-dark">
                      Belum ada transaksi
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map((transaction) => {
                    const category = categories.find(cat => cat.id === transaction.category_id)
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-text-light dark:text-text-dark">
                          {transaction.description || 'Tanpa deskripsi'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-muted-light dark:text-text-muted-dark">
                          {transaction.date ? formatDate(transaction.date) : 'Tanggal tidak valid'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-muted-light dark:text-text-muted-dark">
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
                        <td className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${transaction.type === 'income' ? 'text-success-light' : 'text-danger-light'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-text-light dark:text-text-dark mb-6">Ringkasan Kategori</h2>

          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-text-light dark:text-text-dark">Pemasukan</h3>
            {categories && categories.filter(cat => cat.type === 'income').length > 0 ? (
              categories
                .filter(cat => cat.type === 'income')
                .slice(0, 3)
                .map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-text-light dark:text-text-dark">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium text-success-light">{formatCurrency(
                      transactions
                        .filter(t => t.category_id === category.id && t.type === 'income')
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                    )}</span>
                  </div>
                ))
            ) : (
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Tidak ada kategori pemasukan</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-text-light dark:text-text-dark">Pengeluaran</h3>
            {categories && categories.filter(cat => cat.type === 'expense').length > 0 ? (
              categories
                .filter(cat => cat.type === 'expense')
                .slice(0, 3)
                .map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-text-light dark:text-text-dark">{category.name}</span>
                    </div>
                    <span className="text-sm font-medium text-danger-light">{formatCurrency(
                      transactions
                        .filter(t => t.category_id === category.id && t.type === 'expense')
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                    )}</span>
                  </div>
                ))
            ) : (
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Tidak ada kategori pengeluaran</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}