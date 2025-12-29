import React, { useState, useEffect } from 'react'
import { categoryService } from '../services/categoryService'

export default function CategoryManager() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#EF4444'
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await categoryService.getCategories()
      if (result.error) {
        setError(`Error fetching categories: ${result.error.message || result.error}`)
        setCategories([])
      } else {
        setCategories(result.data || [])
      }
    } catch (error) {
      setError(error.message || 'An error occurred while fetching categories')
      setCategories([])
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
      if (editingCategory) {
        result = await categoryService.updateCategory(editingCategory.id, formData)
      } else {
        result = await categoryService.createCategory(formData)
      }

      if (result.error) {
        setError(`Error saving category: ${result.error.message || result.error}`)
      } else {
        setFormData({ name: '', type: 'expense', color: '#EF4444' })
        setEditingCategory(null)
        setShowForm(false)
        fetchCategories()
      }
    } catch (error) {
      setError(error.message || 'An error occurred while saving category')
    }
  }

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color
    })
    setEditingCategory(category)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const result = await categoryService.deleteCategory(id)
        if (result.error) {
          setError(`Error deleting category: ${result.error.message || result.error}`)
        } else {
          fetchCategories()
        }
      } catch (error) {
        setError(error.message || 'An error occurred while deleting category')
      }
    }
  }

  const handleNewCategory = () => {
    setFormData({ name: '', type: 'expense', color: '#EF4444' })
    setEditingCategory(null)
    setShowForm(true)
  }

  const formatCategoryType = (type) => {
    const typeMap = {
      'income': 'Pemasukan',
      'expense': 'Pengeluaran'
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
        <h2 className="text-xl font-bold text-gray-800">Categories</h2>
        <button
          onClick={handleNewCategory}
          className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
        >
          Add Category
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
            {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
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
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              {editingCategory ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingCategory(null)
                setFormData({ name: '', type: 'expense', color: '#EF4444' })
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-8">
        {/* Income Categories */}
        <div>
          <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Pemasukan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories
              .filter(category => category.type === 'income')
              .map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: category.color }}
                      >
                        +
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{category.name}</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {categories.filter(category => category.type === 'income').length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Belum ada kategori pemasukan
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Pengeluaran
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories
              .filter(category => category.type === 'expense')
              .map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: category.color }}
                      >
                        -
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{category.name}</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {categories.filter(category => category.type === 'expense').length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Belum ada kategori pengeluaran
            </div>
          )}
        </div>
      </div>

      {categories.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-500">
          <p>No categories yet. Click "Add Category" to create one.</p>
        </div>
      )}
    </div>
  )
}