import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // Theme toggle function
  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');

    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: 'home' },
    { path: '/add-transaction', label: 'Tambah Data', icon: 'add' },
    { path: '/reports', label: 'Laporan', icon: 'analytics' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-sans antialiased transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-16 md:w-15 bg-[#2a3042] dark:bg-[#1f2336] flex flex-col items-center py-6 shadow-lg z-20 flex-shrink-0">
        <div className="mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-6 w-full items-center">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-icon ${location.pathname === item.path ? 'text-primary dark:text-primary' : ''}`}
              title={item.label}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="sidebar-icon"
            title="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface-light dark:bg-surface-dark flex items-center justify-between px-5 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button
              className="text-text-muted-light dark:text-text-muted-dark hover:text-primary"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
            </button>
            <div className="relative hidden md:block">
              <h2 class="text-lg font-semibold text-text-light dark:text-text-dark">Finance app</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-text-muted-light dark:text-text-muted-dark hover:text-primary relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">3</span>
            </button>
            <button className="text-text-muted-light dark:text-text-muted-dark hover:text-primary">
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              onClick={toggleTheme}
              className="text-text-muted-light dark:text-text-muted-dark hover:text-primary"
              id="theme-toggle"
            >
              <span className="material-symbols-outlined dark:hidden">dark_mode</span>
              <span className="material-symbols-outlined hidden dark:block">light_mode</span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer">
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600"
                src="https://ui-avatars.com/api/?name=U&background=5156be&color=fff"
              />
              <span className="text-sm font-medium hidden md:block truncate max-w-xs">{user?.email?.split('@')[0] || 'User'}</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background-light dark:bg-background-dark p-6">
          {children}
        </main>
      </div>
    </div>
  )
}