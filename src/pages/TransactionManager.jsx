import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { sourceService } from '../services/sourceService'
import { useNavigate } from 'react-router-dom'

export default function TransactionManager() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    source_id: '',
    category_id: ''
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [transactionsRes, categoriesRes, sourcesRes] = await Promise.all([
        transactionService.getTransactions(100),
        categoryService.getCategories(),
        sourceService.getSources()
      ])

      if (transactionsRes.error) {
        setError(`Error fetching transactions: ${transactionsRes.error.message || transactionsRes.error}`)
        setTransactions([])
      } else {
        setTransactions(transactionsRes.data || [])
      }

      if (categoriesRes.error) {
        setError(`Error fetching categories: ${categoriesRes.error.message || categoriesRes.error}`)
        setCategories([])
      } else {
        setCategories(categoriesRes.data || [])
      }

      if (sourcesRes.error) {
        setError(`Error fetching sources: ${sourcesRes.error.message || sourcesRes.error}`)
        setSources([])
      } else {
        setSources(sourcesRes.data || [])
      }
    } catch (error) {
      setError(error.message || 'An error occurred while fetching data')
      setTransactions([])
      setCategories([])
      setSources([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result
      if (editingTransaction) {
        result = await transactionService.updateTransaction(editingTransaction.id, {
          ...formData,
          amount: parseFloat(formData.amount),
          category_id: formData.category_id || null,
          source_id: formData.source_id || null
        })
      } else {
        result = await transactionService.createTransaction({
          ...formData,
          amount: parseFloat(formData.amount),
          category_id: formData.category_id || null,
          source_id: formData.source_id || null
        })
      }

      if (result.error) {
        setError(result.error.message || result.error)
      } else {
        setFormData({
          type: 'expense',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          source_id: '',
          category_id: ''
        })
        setEditingTransaction(null)
        setShowForm(false)
        fetchAllData()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (transaction) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description || '',
      date: transaction.date.split('T')[0],
      source_id: transaction.source_id || '',
      category_id: transaction.category_id || ''
    })
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      try {
        const result = await transactionService.deleteTransaction(id)
        if (result.error) {
          setError(`Error deleting transaction: ${result.error.message || result.error}`)
        } else {
          fetchAllData()
        }
      } catch (error) {
        setError(error.message || 'An error occurred while deleting transaction')
      }
    }
  }

  const handleCancel = () => {
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      source_id: '',
      category_id: ''
    })
    setEditingTransaction(null)
    setShowForm(false)
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

  const incomeCategories = categories.filter(cat => cat.type === 'income')
  const expenseCategories = categories.filter(cat => cat.type === 'expense')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Transaction Management</h1>
          <p className="text-sm text-gray-600 mt-1">View, add, edit, and delete your financial transactions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 sm:mt-0 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Add Transaction
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={handleInputChange}
                      className="text-green-500 focus:ring-amber-500 h-4 w-4"
                    />
                    <span className="ml-2 text-green-600 font-medium">Income</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={handleInputChange}
                      className="text-red-500 focus:ring-amber-500 h-4 w-4"
                    />
                    <span className="ml-2 text-red-600 font-medium">Expense</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
                  required
                >
                  <option value="">Select category...</option>
                  {formData.type === 'income' && incomeCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                  {formData.type === 'expense' && expenseCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="source_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  id="source_id"
                  name="source_id"
                  value={formData.source_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
                >
                  <option value="">Select source...</option>
                  {sources.map(source => (
                    <option key={source.id} value={source.id}>
                      {source.name} ({source.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    $
                  </div>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
                placeholder="Example: Monthly salary, Grocery shopping"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
                required
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-500 text-white py-3 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium transition duration-200 shadow-md"
              >
                {loading ? 'Saving...' : (editingTransaction ? 'Update Transaction' : 'Save Transaction')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 font-medium transition duration-200 shadow-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction List</h2>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions yet. Add your first transaction!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {transaction.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.categories?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.sources?.name || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}