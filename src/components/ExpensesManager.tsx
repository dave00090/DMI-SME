import React, { useState, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Expense } from '../types';
import {
  Wallet,
  Plus,
  DollarSign,
  Calendar,
  Zap,
  Home,
  Truck,
  Users,
  Smartphone,
  ShieldAlert,
  Package,
  X,
  TrendingDown,
  Tag,
  Check,
  Fuel,
  Droplets,
  Shield,
  Wrench,
  Sparkles,
  Coffee,
  Search,
  Filter,
  Trash2,
} from 'lucide-react';

export const ExpensesManager: React.FC = () => {
  const {
    expenses,
    expenseCategories,
    addExpense,
    addExpenseCategory,
    deleteExpenseCategory,
    metricsToday,
  } = useBusiness();

  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  const [newExp, setNewExp] = useState({
    category: (expenseCategories && expenseCategories[0]) || 'Casual Labour',
    amount: 0,
    description: '',
    paymentMethod: 'mpesa' as Expense['paymentMethod'],
  });

  const totalAllExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const openNewExpenseModal = () => {
    setIsAddingNewCategory(false);
    setCustomCategoryName('');
    setCategoryFeedback(null);
    setNewExp({
      category: newExp.category || (expenseCategories && expenseCategories[0]) || 'Casual Labour',
      amount: 0,
      description: '',
      paymentMethod: 'mpesa',
    });
    setIsNewExpenseModalOpen(true);
  };

  const handleAddNewCategory = () => {
    const trimmed = customCategoryName.trim();
    if (!trimmed) return;
    const addedCat = addExpenseCategory(trimmed);
    setNewExp((prev) => ({ ...prev, category: addedCat }));
    setCustomCategoryName('');
    setIsAddingNewCategory(false);
    setCategoryFeedback(`Added "${addedCat}" and selected in Expense Category dropdown!`);
    setTimeout(() => setCategoryFeedback(null), 3500);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (!catToDelete) return;
    if (expenseCategories.length <= 1) {
      setCategoryFeedback('Cannot delete the only remaining category.');
      setTimeout(() => setCategoryFeedback(null), 3000);
      return;
    }

    const remaining = expenseCategories.filter(
      (c) => c.toLowerCase() !== catToDelete.toLowerCase()
    );
    const nextCategory = remaining[0] || 'Miscellaneous';

    deleteExpenseCategory(catToDelete);
    setNewExp((prev) => ({ ...prev, category: nextCategory }));

    if (selectedCategoryFilter === catToDelete) {
      setSelectedCategoryFilter('All');
    }

    setCategoryFeedback(`Deleted category "${catToDelete}". Selected "${nextCategory}".`);
    setTimeout(() => setCategoryFeedback(null), 3500);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExp.amount <= 0) return;

    let finalCategory = newExp.category;
    // If user typed a new category in the inline form and submitted without clicking "Add"
    if (isAddingNewCategory && customCategoryName.trim()) {
      finalCategory = addExpenseCategory(customCategoryName.trim());
    }

    const resolvedCategory = finalCategory || 'Miscellaneous';
    // Description is now optional: defaults to category name if left blank
    const resolvedDescription = newExp.description.trim() || resolvedCategory;

    addExpense({
      date: new Date().toISOString().split('T')[0],
      category: resolvedCategory,
      amount: Number(newExp.amount),
      description: resolvedDescription,
      paymentMethod: newExp.paymentMethod,
    });

    setIsNewExpenseModalOpen(false);
    setIsAddingNewCategory(false);
    setCustomCategoryName('');
    setCategoryFeedback(null);
    setNewExp({
      category: resolvedCategory,
      amount: 0,
      description: '',
      paymentMethod: 'mpesa',
    });
  };

  const getCategoryIcon = (category: string) => {
    const lower = (category || '').toLowerCase();
    if (
      lower.includes('electric') ||
      lower.includes('kplc') ||
      lower.includes('power') ||
      lower.includes('token')
    ) {
      return <Zap className="w-4 h-4 text-amber-500" />;
    }
    if (lower.includes('rent') || lower.includes('lease')) {
      return <Home className="w-4 h-4 text-blue-500" />;
    }
    if (
      lower.includes('transport') ||
      lower.includes('boda') ||
      lower.includes('delivery') ||
      lower.includes('pickup') ||
      lower.includes('truck')
    ) {
      return <Truck className="w-4 h-4 text-emerald-500" />;
    }
    if (
      lower.includes('labour') ||
      lower.includes('loader') ||
      lower.includes('casual') ||
      lower.includes('wage') ||
      lower.includes('salary')
    ) {
      return <Users className="w-4 h-4 text-indigo-500" />;
    }
    if (
      lower.includes('airtime') ||
      lower.includes('internet') ||
      lower.includes('bundle') ||
      lower.includes('data') ||
      lower.includes('wifi') ||
      lower.includes('phone')
    ) {
      return <Smartphone className="w-4 h-4 text-rose-500" />;
    }
    if (
      lower.includes('licence') ||
      lower.includes('license') ||
      lower.includes('kanjo') ||
      lower.includes('county') ||
      lower.includes('permit') ||
      lower.includes('tax')
    ) {
      return <ShieldAlert className="w-4 h-4 text-amber-600" />;
    }
    if (
      lower.includes('packaging') ||
      lower.includes('sack') ||
      lower.includes('polythene') ||
      lower.includes('box')
    ) {
      return <Package className="w-4 h-4 text-purple-500" />;
    }
    if (
      lower.includes('fuel') ||
      lower.includes('diesel') ||
      lower.includes('petrol') ||
      lower.includes('generator')
    ) {
      return <Fuel className="w-4 h-4 text-orange-500" />;
    }
    if (
      lower.includes('water') ||
      lower.includes('meter') ||
      lower.includes('plumb')
    ) {
      return <Droplets className="w-4 h-4 text-cyan-500" />;
    }
    if (
      lower.includes('security') ||
      lower.includes('guard') ||
      lower.includes('alarm')
    ) {
      return <Shield className="w-4 h-4 text-sky-600" />;
    }
    if (
      lower.includes('repair') ||
      lower.includes('maintenance') ||
      lower.includes('tool') ||
      lower.includes('service')
    ) {
      return <Wrench className="w-4 h-4 text-teal-600" />;
    }
    if (
      lower.includes('tea') ||
      lower.includes('lunch') ||
      lower.includes('food') ||
      lower.includes('meal') ||
      lower.includes('snack')
    ) {
      return <Coffee className="w-4 h-4 text-amber-700" />;
    }
    if (
      lower.includes('clean') ||
      lower.includes('soap') ||
      lower.includes('detergent') ||
      lower.includes('sanit')
    ) {
      return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
    return <Tag className="w-4 h-4 text-slate-500" />;
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesCategory =
        selectedCategoryFilter === 'All' || exp.category === selectedCategoryFilter;
      const q = (searchQuery || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        (exp.description || '').toLowerCase().includes(q) ||
        (exp.category || '').toLowerCase().includes(q) ||
        (exp.paymentMethod || '').toLowerCase().includes(q) ||
        (exp.date || '').includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [expenses, selectedCategoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-600" />
            <span>Store Operating Expenses</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log daily operational overheads (KPLC tokens, casual loaders, transport, rent, kanjo) to calculate true net profit.
          </p>
        </div>

        <button
          onClick={openNewExpenseModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Today's Total Expenses
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono mt-1">
            KSh {metricsToday.expenses.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Deducted from today's gross profit</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Today's Net Profit Impact
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            KSh {metricsToday.netProfit.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Gross profit (KSh {metricsToday.grossProfit.toLocaleString()}) minus expenses
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Month-to-Date Logged
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            KSh {totalAllExpenses.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {expenses.length} operating records ({expenseCategories.length} categories)
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description, category, or date..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Category:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-blue-600 font-medium"
          >
            <option value="All">All Categories ({expenses.length})</option>
            {expenseCategories.map((cat) => {
              const count = expenses.filter((e) => e.category === cat).length;
              return (
                <option key={cat} value={cat}>
                  {cat} {count > 0 ? `(${count})` : ''}
                </option>
              );
            })}
          </select>
          {selectedCategoryFilter !== 'All' && expenseCategories.length > 1 && (
            <button
              onClick={() => handleDeleteCategory(selectedCategoryFilter)}
              title={`Delete category "${selectedCategoryFilter}"`}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md border border-rose-200 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-600 uppercase bg-slate-50 border-b border-slate-100 font-bold">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4 text-right">Amount (KSh)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No expense records found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500">{exp.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-2 text-slate-800 font-medium">
                        {getCategoryIcon(exp.category)}
                        <span>{exp.category}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{exp.description}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                          exp.paymentMethod === 'mpesa'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {exp.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-red-600 text-right text-sm">
                      KSh {exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Expense */}
      {isNewExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Log Daily Store Expense</h3>
                <p className="text-xs text-slate-500">Record cash or M-Pesa business expenditure</p>
              </div>
              <button
                onClick={() => setIsNewExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              {/* Category Selection & New Category Option */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-medium">Expense Category *</label>
                  {!isAddingNewCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(true);
                        setCustomCategoryName('');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Category</span>
                    </button>
                  )}
                </div>

                {/* Inline New Category Creator */}
                {isAddingNewCategory ? (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 space-y-2.5 mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        Add New Expense Name / Category
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCategory(false);
                          setCustomCategoryName('');
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Type the new expense name below (e.g. <em>Generator Fuel / Diesel</em>, <em>Water Bill</em>, <em>Security Guard</em>, <em>Welding Gas</em>, <em>Machine Repair</em>). It will immediately show in the Expense Category dropdown box.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customCategoryName || ''}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewCategory();
                          }
                        }}
                        placeholder="e.g. Generator Fuel / Diesel"
                        className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        disabled={!customCategoryName.trim()}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Add & Select</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={newExp.category}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsAddingNewCategory(true);
                          setCustomCategoryName('');
                        } else {
                          setNewExp({ ...newExp, category: e.target.value });
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                    >
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option disabled className="text-slate-400">
                        ──────────────
                      </option>
                      <option value="__ADD_NEW__" className="text-blue-600 font-bold bg-blue-50">
                        ➕ + Add New Expense Category / Name...
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(newExp.category)}
                      disabled={expenseCategories.length <= 1}
                      title={`Delete "${newExp.category}" category`}
                      className="px-2.5 py-2 border border-rose-200 hover:border-rose-300 bg-rose-50/70 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">Delete</span>
                    </button>
                  </div>
                )}

                {categoryFeedback && (
                  <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-medium flex items-center gap-1.5 animate-fadeIn">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{categoryFeedback}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Amount Spent (KSh) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newExp.amount || ''}
                  onChange={(e) => setNewExp({ ...newExp, amount: Number(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-base focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Description <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newExp.description || ''}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  placeholder={`e.g. ${newExp.category} details (or leave empty)`}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Paid Via</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewExp({ ...newExp, paymentMethod: 'mpesa' })}
                    className={`py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      newExp.paymentMethod === 'mpesa'
                        ? 'bg-green-50 border-green-500 text-green-700 font-bold'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExp({ ...newExp, paymentMethod: 'cash' })}
                    className={`py-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      newExp.paymentMethod === 'cash'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewExpenseModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManager;
