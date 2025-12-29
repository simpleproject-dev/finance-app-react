import React, { useState, useEffect } from 'react'
import { sourceService } from '../services/sourceService'

export default function SourceManager() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSource, setEditingSource] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
    color: '#3B82F6',
    icon: 'wallet'
  })

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await sourceService.getSources()
      if (result.error) {
        setError(`Error fetching sources: ${result.error.message || result.error}`)
        setSources([])
      } else {
        setSources(result.data || [])
      }
    } catch (error) {
      setError(error.message || 'An error occurred while fetching sources')
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
    
    try {
      let result
      if (editingSource) {
        result = await sourceService.updateSource(editingSource.id, formData)
      } else {
        result = await sourceService.createSource(formData)
      }

      if (result.error) {
        setError(`Error saving source: ${result.error.message || result.error}`)
      } else {
        setFormData({ name: '', type: 'cash', color: '#3B82F6', icon: 'wallet' })
        setEditingSource(null)
        setShowForm(false)
        fetchSources()
      }
    } catch (error) {
      setError(error.message || 'An error occurred while saving source')
    }
  }

  const handleEdit = (source) => {
    setFormData({
      name: source.name,
      type: source.type,
      color: source.color,
      icon: source.icon
    })
    setEditingSource(source)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      try {
        const result = await sourceService.deleteSource(id)
        if (result.error) {
          setError(`Error deleting source: ${result.error.message || result.error}`)
        } else {
          fetchSources()
        }
      } catch (error) {
        setError(error.message || 'An error occurred while deleting source')
      }
    }
  }

  const handleNewSource = () => {
    setFormData({ name: '', type: 'cash', color: '#3B82F6', icon: 'wallet' })
    setEditingSource(null)
    setShowForm(true)
  }

  const formatSourceType = (type) => {
    const typeMap = {
      'cash': 'Cash',
      'debit': 'Debit Card',
      'credit': 'Credit Card',
      'e-wallet': 'E-Wallet',
      'bank': 'Bank Transfer',
      'other': 'Other'
    }
    return typeMap[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Payment Sources</h2>
        <button
          onClick={handleNewSource}
          className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Add Source
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {editingSource ? 'Edit Source' : 'Add New Source'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="cash">Cash</option>
                <option value="debit">Debit Card</option>
                <option value="credit">Credit Card</option>
                <option value="e-wallet">E-Wallet</option>
                <option value="bank">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-600">{formData.color}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="wallet">Wallet</option>
                <option value="credit_card">Credit Card</option>
                <option value="account_balance">Bank</option>
                <option value="payment">Payment</option>
                <option value="account_balance_wallet">Wallet 2</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              {editingSource ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingSource(null)
                setFormData({ name: '', type: 'cash', color: '#3B82F6', icon: 'wallet' })
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => (
          <div
            key={source.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: source.color }}
                >
                  {source.icon === 'wallet' && '💰'}
                  {source.icon === 'credit_card' && '💳'}
                  {source.icon === 'account_balance' && '🏦'}
                  {source.icon === 'payment' && '💳'}
                  {source.icon === 'account_balance_wallet' && '💼'}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{source.name}</h3>
                  <p className="text-sm text-gray-600">{formatSourceType(source.type)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(source)}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(source.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sources.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-500">
          <p>No payment sources yet. Click "Add Source" to create one.</p>
        </div>
      )}
    </div>
  )
}