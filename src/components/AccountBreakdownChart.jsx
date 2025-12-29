import React, { useState } from 'react';

const AccountBreakdownChart = ({ categories, transactions }) => {
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'

  // Calculate totals for income and expense categories
  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  // Filter categories based on selected type
  let filteredCategories = [];
  if (filterType === 'income') {
    filteredCategories = incomeCategories;
  } else if (filterType === 'expense') {
    filteredCategories = expenseCategories;
  } else {
    filteredCategories = [...incomeCategories, ...expenseCategories];
  }

  // Combine income and expense for the chart
  const categoryTotals = filteredCategories.map(category => {
    const categoryTransactions = transactions.filter(t => t.category_id === category.id && t.type === category.type);
    const total = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    return {
      ...category,
      total
    };
  }).filter(cat => cat.total > 0); // Only include categories with transactions

  // Calculate total amount
  const totalAmount = categoryTotals.reduce((sum, cat) => sum + cat.total, 0);

  // Calculate angles for pie chart
  let currentAngle = -90; // Start from top
  const strokeWidth = 15;

  return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="flex justify-between items-center mb-6 w-full">
        <h2 className="text-lg font-bold text-gray-800">Account Breakdown</h2>
        {/* Filter buttons */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilterType('income')}
            className={`p-2 rounded-md transition-colors ${
              filterType === 'income'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title="Income"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`p-2 rounded-md transition-colors ml-1 ${
              filterType === 'expense'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title="Expense"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      <div className="w-56 h-56 relative mb-8">
        {categoryTotals.length > 0 ? (
          <svg width="224" height="224" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="112"
              cy="112"
              r="100"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Category slices */}
            {categoryTotals.map((category, index) => {
              const sliceAngle = (category.total / totalAmount) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + sliceAngle;

              // Convert angles to radians
              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;

              // Calculate start and end points
              const x1 = 112 + 100 * Math.cos(startAngleRad);
              const y1 = 112 + 100 * Math.sin(startAngleRad);
              const x2 = 112 + 100 * Math.cos(endAngleRad);
              const y2 = 112 + 100 * Math.sin(endAngleRad);

              // Determine if the arc is large (>180 degrees)
              const largeArcFlag = sliceAngle > 180 ? 1 : 0;

              const pathData = [
                `M ${x1} ${y1}`,
                `A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2}`
              ].join(' ');

              currentAngle = endAngle;

              return (
                <path
                  key={index}
                  d={pathData}
                  stroke={category.color}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Center circle to create doughnut effect */}
            <circle
              cx="112"
              cy="112"
              r={100 - strokeWidth}
              fill="white"
            />
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="mt-2 text-sm">No data</p>
            </div>
          </div>
        )}
      </div>
      <div className="w-full space-y-4 px-2">
        {filterType !== 'expense' && incomeCategories.slice(0, 3).map((category, index) => {
          const categoryTransactions = transactions.filter(t => t.category_id === category.id && t.type === 'income');
          const categoryTotal = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          return (
            <div key={index} className="flex items-center justify-between text-sm group cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></span>
                <span className="text-gray-500 font-medium">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">Active</div>
                <div className="text-xs text-gray-500 font-mono">
                  {categoryTotal > 0 ? `Rp${categoryTotal.toLocaleString()}` : 'Rp0'}
                </div>
              </div>
            </div>
          )
        })}
        {filterType !== 'income' && expenseCategories.slice(0, 3).map((category, index) => {
          const categoryTransactions = transactions.filter(t => t.category_id === category.id && t.type === 'expense');
          const categoryTotal = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          return (
            <div key={`expense-${index}`} className="flex items-center justify-between text-sm group cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></span>
                <span className="text-gray-500 font-medium">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">Active</div>
                <div className="text-xs text-gray-500 font-mono">
                  {categoryTotal > 0 ? `Rp${categoryTotal.toLocaleString()}` : 'Rp0'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default AccountBreakdownChart;