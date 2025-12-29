import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'
import { sourceService } from '../services/sourceService'

export default function AddTransaction() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    source_id: '', // Changed from 'source' to 'source_id' to match database
    category_id: ''
  })

  const [categories, setCategories] = useState([])
  const [sources, setSources] = useState([]) // Added sources state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchSources() // Added to fetch sources
  }, [])

  const fetchCategories = async () => {
    try {
      const result = await categoryService.getCategories()
      if (result.error) {
        setError(result.error)
      } else {
        setCategories(result.data || [])
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchSources = async () => {
    try {
      const result = await sourceService.getSources()
      if (result.error) {
        setError(result.error)
      } else {
        setSources(result.data || [])
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleChange = (e) => {
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
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id || null,
        source_id: formData.source_id || null // Include source_id in transaction data
      }

      const result = await transactionService.createTransaction(transactionData)

      if (result.error) {
        setError(result.error.message || result.error)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  const incomeCategories = categories.filter(cat => cat.type === 'income')
  const expenseCategories = categories.filter(cat => cat.type === 'expense')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Add New Transaction</h1>
          <p className="text-sm text-gray-600 mt-1">Record your financial transactions</p>
        </div>
        <nav className="flex text-sm text-gray-500 mt-4 sm:mt-0 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
          <a className="hover:text-amber-600 transition-colors" href="#">Add Transaction</a>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-amber-600 font-medium">Form</span>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-100 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

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
                    onChange={handleChange}
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
                    onChange={handleChange}
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-800 transition duration-200"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 text-white py-3 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium transition duration-200 shadow-md"
            >
              {loading ? 'Saving...' : 'Save Transaction'}
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
    </div>
  )
}