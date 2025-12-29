import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import AccountBreakdownChart from '../components/AccountBreakdownChart'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
    sourcesSummary: {} // Added for sources summary
  })
  const [selectedMonth, setSelectedMonth] = useState('current') // Added for month filter
  const [showSourcesDetail, setShowSourcesDetail] = useState(false) // Added for sources detail modal
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [selectedMonth])

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value)
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      const transactionsRes = await transactionService.getTransactions(100) // Increased to allow for filtering
      const categoriesRes = await categoryService.getCategories()
      const summaryRes = await transactionService.getSummary()

      // Handle transactions
      if (transactionsRes.error) {
        setError(`Error fetching transactions: ${transactionsRes.error.message || transactionsRes.error}`)
        setTransactions([])
      } else {
        // Filter transactions based on selected month
        let filteredTransactions = transactionsRes.data || [];

        if (selectedMonth !== 'all') {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();

          if (selectedMonth === 'current') {
            // Filter for current month
            filteredTransactions = (transactionsRes.data || []).filter(t => {
              const transactionDate = new Date(t.date);
              return transactionDate.getMonth() === currentMonth &&
                     transactionDate.getFullYear() === currentYear;
            });
          } else if (selectedMonth === 'last_month') {
            // Filter for last month
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            filteredTransactions = (transactionsRes.data || []).filter(t => {
              const transactionDate = new Date(t.date);
              return transactionDate.getMonth() === lastMonth &&
                     transactionDate.getFullYear() === lastMonthYear;
            });
          }
        }

        setTransactions(filteredTransactions);
      }

      // Handle categories
      if (categoriesRes.error) {
        setError(`Error fetching categories: ${categoriesRes.error.message || categoriesRes.error}`)
        setCategories([])
      } else {
        setCategories(categoriesRes.data || [])
      }

      // Handle summary - we'll calculate based on filtered transactions
      if (summaryRes.error) {
        setError(`Error fetching summary: ${summaryRes.error.message || summaryRes.error}`)
        setSummary({
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0,
          sourcesSummary: {}
        })
      } else {
        // Calculate summary based on filtered transactions
        const filteredIncome = (transactionsRes.data || [])
          .filter(t => {
            if (selectedMonth === 'current') {
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth();
              const transactionDate = new Date(t.date);
              return t.type === 'income' &&
                     transactionDate.getMonth() === currentMonth &&
                     transactionDate.getFullYear() === currentYear;
            } else if (selectedMonth === 'last_month') {
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth();
              const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
              const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
              const transactionDate = new Date(t.date);
              return t.type === 'income' &&
                     transactionDate.getMonth() === lastMonth &&
                     transactionDate.getFullYear() === lastMonthYear;
            } else {
              return t.type === 'income';
            }
          })
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const filteredExpense = (transactionsRes.data || [])
          .filter(t => {
            if (selectedMonth === 'current') {
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth();
              const transactionDate = new Date(t.date);
              return t.type === 'expense' &&
                     transactionDate.getMonth() === currentMonth &&
                     transactionDate.getFullYear() === currentYear;
            } else if (selectedMonth === 'last_month') {
              const now = new Date();
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth();
              const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
              const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
              const transactionDate = new Date(t.date);
              return t.type === 'expense' &&
                     transactionDate.getMonth() === lastMonth &&
                     transactionDate.getFullYear() === lastMonthYear;
            } else {
              return t.type === 'expense';
            }
          })
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        const filteredBalance = filteredIncome - filteredExpense;
        const filteredTransactionCount = (transactionsRes.data || []).filter(t => {
          if (selectedMonth === 'current') {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
          } else if (selectedMonth === 'last_month') {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === lastMonth &&
                   transactionDate.getFullYear() === lastMonthYear;
          } else {
            return true;
          }
        }).length;

        // Calculate sources summary for filtered transactions
        const filteredTransactionsForSources = (transactionsRes.data || []).filter(t => {
          if (selectedMonth === 'current') {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
          } else if (selectedMonth === 'last_month') {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === lastMonth &&
                   transactionDate.getFullYear() === lastMonthYear;
          } else {
            return true;
          }
        });

        const allSourceIds = [
          ...(filteredTransactionsForSources.filter(t => t.type === 'income').map(t => t.source_id).filter(id => id) || []),
          ...(filteredTransactionsForSources.filter(t => t.type === 'expense').map(t => t.source_id).filter(id => id) || [])
        ];

        let sourcesSummary = {};
        if (allSourceIds.length > 0) {
          const { data: sourcesData, error: sourcesError } = await supabase
            .from('sources')
            .select('id, name')
            .in('id', [...new Set(allSourceIds)])
            .eq('user_id', user.id);

          if (!sourcesError && sourcesData) {
            sourcesData.forEach(source => {
              sourcesSummary[source.id] = {
                name: source.name,
                income: 0,
                expense: 0
              };
            });
          }
        }

        // Calculate income by source
        filteredTransactionsForSources.filter(t => t.type === 'income').forEach(t => {
          if (t.source_id && sourcesSummary[t.source_id]) {
            sourcesSummary[t.source_id].income += parseFloat(t.amount);
          }
        });

        // Calculate expense by source
        filteredTransactionsForSources.filter(t => t.type === 'expense').forEach(t => {
          if (t.source_id && sourcesSummary[t.source_id]) {
            sourcesSummary[t.source_id].expense += parseFloat(t.amount);
          }
        });

        setSummary({
          totalIncome: filteredIncome,
          totalExpense: filteredExpense,
          balance: filteredBalance,
          transactionCount: filteredTransactionCount,
          sourcesSummary: sourcesSummary
        });
      }

    } catch (error) {
      setError(error.message || 'An error occurred while fetching dashboard data')
      setTransactions([])
      setCategories([])
      setSummary({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
        sourcesSummary: {}
      })
    } finally {
      setLoading(false)
    }
  }

  // Draw the wallet chart after data is loaded
  const drawWalletChart = () => {
    const canvas = document.getElementById('walletChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate totals for income and expense categories
    const incomeCategories = categories.filter(cat => cat.type === 'income');
    const expenseCategories = categories.filter(cat => cat.type === 'expense');

    // Combine income and expense for the chart
    const allCategories = [...incomeCategories, ...expenseCategories];
    const categoryTotals = allCategories.map(category => {
      const categoryTransactions = transactions.filter(t => t.category_id === category.id);
      const total = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      return {
        ...category,
        total
      };
    }).filter(cat => cat.total > 0); // Only include categories with transactions

    if (categoryTotals.length === 0) {
      // Draw empty state
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 8;
      ctx.stroke();
      return;
    }

    // Calculate total amount
    const totalAmount = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);

    if (totalAmount === 0) {
      // Draw empty state
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 8;
      ctx.stroke();
      return;
    }

    // Draw the doughnut chart
    let currentAngle = -Math.PI / 2; // Start from top
    const strokeWidth = 15;

    categoryTotals.forEach((category, index) => {
      const sliceAngle = (category.total / totalAmount) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.strokeStyle = category.color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw center circle to create doughnut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - strokeWidth, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
  };

  useEffect(() => {
    // Set canvas dimensions
    const canvas = document.getElementById('walletChart');
    if (canvas) {
      canvas.width = 224; // 56 * 4
      canvas.height = 224; // 56 * 4
    }

    // Wait for data to load then draw the chart
    const chartTimer = setTimeout(() => {
      drawWalletChart();
    }, 100);

    return () => clearTimeout(chartTimer);
  }, [categories, transactions]); // Depend on categories and transactions to redraw when they change

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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data keuangan...</p>
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
              onClick={fetchDashboardData}
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
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Finance Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back to your financial overview</p>
        </div>
        <nav className="flex text-sm text-gray-500 mt-4 sm:mt-0 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
          <a className="hover:text-amber-600 transition-colors" href="#">Home</a>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-amber-600 font-medium">Dashboard</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div
          className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 cursor-pointer"
          onClick={() => setShowSourcesDetail(!showSourcesDetail)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Account Balance</h3>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(summary.balance || 0)}</div>
            </div>
            <div className="text-amber-500 h-10 w-24">
              <svg className="w-full h-full stroke-current fill-none" stroke-width="2.5" viewBox="0 0 100 40">
                <path d="M0 30 L10 25 L20 32 L30 15 L40 20 L50 10 L60 25 L70 18 L80 30 L90 20 L100 25" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold mr-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] font-bold">arrow_upward</span>
              {formatCurrency(Math.abs(summary.balance || 0))}
            </span>
            <span className="text-gray-500 opacity-80">vs last month</span>
          </div>
        </div>

        {/* Sources Detail Modal */}
        {showSourcesDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Source Details</h3>
                  <button
                    onClick={() => setShowSourcesDetail(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(summary.sourcesSummary || {}).map(([sourceId, sourceData]) => (
                    <div key={sourceId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="font-medium text-gray-700">{sourceData.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-800">
                          {formatCurrency(Math.max(0, (sourceData.income || 0) - (sourceData.expense || 0)))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(sourceData.income || 0)} masuk, {formatCurrency(sourceData.expense || 0)} keluar
                        </div>
                      </div>
                    </div>
                  ))}

                  {Object.keys(summary.sourcesSummary || {}).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p>No source data available.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Link
                    to="/sources"
                    className="w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all text-sm font-semibold text-center inline-block"
                    onClick={() => setShowSourcesDetail(false)}
                  >
                    Manage Sources
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Number of Transactions</h3>
              <div className="text-2xl font-bold text-gray-800">{summary.transactionCount || 0}</div>
            </div>
            <div className="text-blue-500 h-10 w-24 opacity-80">
              <svg className="w-full h-full stroke-current fill-none" stroke-width="2.5" viewBox="0 0 100 40">
                <path d="M0 25 L15 30 L30 20 L45 35 L60 15 L75 25 L90 10 L100 20" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold mr-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] font-bold">arrow_downward</span>
              12
            </span>
            <span className="text-gray-500 opacity-80">vs last week</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Spending</h3>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(summary.totalExpense || 0)}</div>
            </div>
            <div className="text-purple-500 h-10 w-24">
              <svg className="w-full h-full stroke-current fill-none" stroke-width="2.5" viewBox="0 0 100 40">
                <path d="M0 20 L10 25 L25 10 L40 25 L55 15 L70 30 L85 20 L100 15" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold mr-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] font-bold">trending_up</span>
              {formatCurrency(280)}
            </span>
            <span className="text-gray-500 opacity-80">Higher than avg</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Savings Rate</h3>
              <div className="text-2xl font-bold text-gray-800">
                {summary.totalIncome > 0
                  ? `${((Math.max(0, summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
            </div>
            <div className="text-teal-400 h-10 w-24 opacity-90">
              <svg className="w-full h-full stroke-current fill-none" stroke-width="2.5" viewBox="0 0 100 40">
                <path d="M0 35 L15 25 L30 30 L45 15 L60 25 L75 10 L90 20 L100 15" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </div>
          </div>
          <div className="flex items-center text-xs">
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold mr-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] font-bold">arrow_upward</span>
              1.2%
            </span>
            <span className="text-gray-500 opacity-80">vs last month</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 flex flex-col">
          <AccountBreakdownChart categories={categories} transactions={transactions} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Spending Overview</h2>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="text-xs border-gray-200 rounded-lg bg-gray-50 text-gray-800 focus:ring-amber-500 focus:border-amber-500 py-1 px-2 outline-none cursor-pointer"
            >
              <option value="current">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="flex items-center justify-center mb-8 gap-8">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-gray-100" cx="72" cy="72" fill="transparent" r="60" stroke="currentColor" stroke-width="12"></circle>
                {summary.totalIncome > 0 ? (
                  <circle
                    className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    cx="72"
                    cy="72"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    stroke-dasharray="376.99"
                    stroke-dashoffset={376.99 - (376.99 * summary.totalExpense / summary.totalIncome)}
                    stroke-linecap="round"
                    stroke-width="12"
                  ></circle>
                ) : (
                  <circle
                    className="text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    cx="72"
                    cy="72"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    stroke-dasharray="376.99"
                    stroke-dashoffset="376.99"
                    stroke-linecap="round"
                    stroke-width="12"
                  ></circle>
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-gray-800">
                  {summary.totalIncome > 0 ? `${((summary.totalExpense / summary.totalIncome) * 100).toFixed(1)}%` : '0%'}
                </span>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">of Budget</span>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <div className="flex flex-col items-center">
              <h3 className="text-sm text-gray-500 mb-1">Total Spending</h3>
              <div className="text-3xl font-bold text-gray-800 mb-1">{formatCurrency(summary.totalExpense || 0)}</div>
              <div className="text-xs text-red-500 flex items-center bg-red-100 px-2 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm mr-1">arrow_upward</span>
                + {formatCurrency(0)} ( 0.0 % )
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-transparent">
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Income</div>
              <div className="text-lg font-bold text-gray-800 text-emerald-600">{formatCurrency(summary.totalIncome || 0)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-transparent">
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Expenses</div>
              <div className="text-lg font-bold text-gray-800 text-rose-500">- {formatCurrency(summary.totalExpense || 0)}</div>
            </div>
          </div>
          <Link to="/reports" className="w-full py-3 bg-gray-900 text-white rounded-lg hover:opacity-90 transition-all text-sm font-semibold flex items-center justify-center gap-2 group shadow-lg shadow-amber-500/20">
            View budget details
            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Source Distribution</h2>
          <div className="space-y-4">
            {Object.entries(summary.sourcesSummary || {}).slice(0, 5).map(([sourceId, sourceData]) => (
              <div key={sourceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="font-medium text-gray-700">{sourceData.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800">
                    {formatCurrency(Math.max(0, (sourceData.income || 0) - (sourceData.expense || 0)))}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(sourceData.income || 0)} in, {formatCurrency(sourceData.expense || 0)} out
                  </div>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(summary.sourcesSummary || {}).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions with specified sources yet.</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link to="/sources" className="w-full py-3 bg-gray-900 text-white rounded-lg hover:opacity-90 transition-all text-sm font-semibold flex items-center justify-center gap-2 group shadow-lg">
              Manage Sources
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}