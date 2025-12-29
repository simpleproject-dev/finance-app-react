import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

// Ikon SVG sederhana
const DashboardIcon = ({ isActive = false }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const AddTransactionIcon = ({ isActive = false }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TransactionIcon = ({ isActive = false }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CategoriesIcon = ({ isActive = false }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const SourcesIcon = ({ isActive = false }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ReportsIcon = ({ isActive = false }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const LogoutIcon = ({ isActive = false }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function Layout({ children }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // State untuk sidebar
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Efek untuk menyimpan dan memuat preferensi sidebar
  useEffect(() => {
    const savedExpanded = localStorage.getItem('sidebarExpanded')
    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === 'true')
    }
  }, [])

  const toggleSidebar = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    localStorage.setItem('sidebarExpanded', newExpanded.toString())
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: DashboardIcon },
    { path: '/add-transaction', label: 'Add Transaction', icon: AddTransactionIcon },
    { path: '/transactions', label: 'Transaction List', icon: TransactionIcon },
    { path: '/categories', label: 'Categories', icon: CategoriesIcon },
    { path: '/sources', label: 'Sources', icon: SourcesIcon },
    { path: '/reports', label: 'Reports', icon: ReportsIcon },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 text-gray-800 font-sans antialiased">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 h-screen bg-gradient-to-b from-amber-600 to-yellow-600 flex flex-col items-start py-6 shadow-xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:w-16 lg:hover:w-64'
        }`}
        onMouseEnter={() => {
          if (window.innerWidth >= 1024) { // lg breakpoint
            setIsExpanded(true)
          }
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 1024 && !isExpanded) { // lg breakpoint
            setIsExpanded(false)
          }
        }}
      >
        {/* Logo section */}
        <div className="mb-8 px-4 w-full">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 font-bold shadow-lg">
            <span className="text-xl font-bold">F</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 w-full px-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-start px-3 py-3 w-full rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-700 text-white'
                    : 'text-gray-900 hover:bg-amber-500 hover:text-white'
                }`}
                title={item.label}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileMenuOpen(false)
                  }
                }}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <IconComponent isActive={isActive} />
                </div>
                <span
                  className={`ml-4 overflow-hidden transition-all duration-300 ${
                    isExpanded || isMobileMenuOpen ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[200px] lg:opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto px-2 w-full">
          <button
            onClick={handleLogout}
            className="flex items-center justify-start px-3 py-3 w-full rounded-lg text-gray-900 hover:bg-amber-500 hover:text-white transition-all duration-200"
            title="Logout"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <LogoutIcon />
            </div>
            <span
              className={`ml-4 overflow-hidden transition-all duration-300 ${
                isExpanded || isMobileMenuOpen ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0 lg:max-w-[200px] lg:opacity-100'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="fixed top-0 right-0 h-16 bg-white/80 backdrop-blur-md flex items-center justify-between px-5 shadow-sm z-40 w-full lg:w-[calc(100%-4rem)] lg:ml-16">
          <div className="flex items-center gap-4">
            <button
              className="text-gray-600 hover:text-amber-600 lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative hidden md:block flex items-center">
              <h2 className="text-lg font-semibold text-gray-800">Finance App</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-amber-600 relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM16 3h5v5h-5V3zM4 3h6v6H4V3z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">3</span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer">
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-gray-200"
                src="https://ui-avatars.com/api/?name=U&background=amber&color=fff"
              />
              <span className="text-sm font-medium hidden md:block truncate max-w-xs text-gray-800">
                {user?.email?.split('@')[0] || 'User'}
              </span>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="pt-16 flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-br from-amber-50 to-yellow-50 p-6 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}