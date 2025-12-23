import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { transactionService } from '../services/transactionService'
import { categoryService } from '../services/categoryService'

export default function AddTransaction() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    source: '',
    category_id: ''
  })
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCategories()
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
        category_id: formData.category_id || null
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
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-xl font-bold text-text-light dark:text-text-dark uppercase tracking-wide">Tambah Transaksi Baru</h1>
        <nav className="flex text-sm text-text-muted-light dark:text-text-muted-dark mt-2 sm:mt-0">
          <a className="hover:text-primary" href="#">Tambah Transaksi</a>
          <span className="mx-2">/</span>
          <span className="text-text-light dark:text-text-dark font-medium">Form</span>
        </nav>
      </div>

      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        {error && (
          <div className="mb-6 bg-danger-bg-light text-danger-light px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                Tipe Transaksi
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === 'income'}
                    onChange={handleChange}
                    className="text-success-light focus:ring-primary"
                  />
                  <span className="ml-2 text-success-light font-medium">Pemasukan</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === 'expense'}
                    onChange={handleChange}
                    className="text-danger-light focus:ring-primary"
                  />
                  <span className="ml-2 text-danger-light font-medium">Pengeluaran</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                Kategori
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                required
              >
                <option value="">Pilih kategori...</option>
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
              <label htmlFor="source" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                Sumber
              </label>
              <select
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
              >
                <option value="">Pilih sumber...</option>
                <option value="Tunai">Tunai</option>
                <option value="Bank">Bank</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
                Jumlah
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-light dark:text-text-dark">
                  Rp
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Deskripsi
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
              placeholder="Contoh: Gaji bulanan, Belanja bulanan"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-text-light dark:text-text-dark mb-2">
              Tanggal
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text-light dark:text-text-dark"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover disabled:opacity-50 font-medium"
            >
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-text-light py-3 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-700 font-medium"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}