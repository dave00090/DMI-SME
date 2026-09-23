import React, { useState, useMemo, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { Product, StockAdjustment } from '../types';
import {
  Package,
  Plus,
  AlertTriangle,
  RotateCcw,
  Search,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
  FileText,
  Wrench,
} from 'lucide-react';
import {
  getCategoriesByIndustry,
  getIndustryDefinition,
  INDUSTRY_TYPES,
} from '../data/industryCategories';

export { getCategoriesByIndustry };

export const InventoryManager: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    restockProduct,
    adjustStock,
    stockAdjustments,
    lowStockProducts,
    slowMovingProducts,
    totalStockCostValue,
    totalStockRetailValue,
    storeProfile,
  } = useBusiness();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterView, setFilterView] = useState<'all' | 'low' | 'slow' | 'adjustments'>('all');

  // Modals
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(20);
  const [restockCost, setRestockCost] = useState<number>(0);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedProductForAdj, setSelectedProductForAdj] = useState<Product | null>(null);
  const [adjQty, setAdjQty] = useState<number>(-1);
  const [adjReason, setAdjReason] = useState<StockAdjustment['reason']>('damaged');
  const [adjNotes, setAdjNotes] = useState<string>('');

  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isServiceItem, setIsServiceItem] = useState(false);

  // Industry-specific categories based on registered business type
  const currentIndustryDef = useMemo(() => {
    return getIndustryDefinition(storeProfile?.industry);
  }, [storeProfile?.industry]);

  const dynamicCategories = useMemo(() => {
    return currentIndustryDef.categories;
  }, [currentIndustryDef]);

  const [newProd, setNewProd] = useState({
    name: '',
    category: '',
    sku: '',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 10,
    unit: 'pieces',
    lowStockThreshold: 10,
    lastRestockedDate: new Date().toISOString().split('T')[0],
    lastSoldDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Sync default category when dynamic categories change
  useEffect(() => {
    if (dynamicCategories.length > 0 && !newProd.category) {
      setNewProd((prev) => ({ ...prev, category: dynamicCategories[0] }));
    }
  }, [dynamicCategories]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q);
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;

      if (filterView === 'low') {
        return matchSearch && matchCat && p.stockQuantity <= p.lowStockThreshold;
      }
      if (filterView === 'slow') {
        const isSlow = slowMovingProducts.some((s) => s.product.id === p.id);
        return matchSearch && matchCat && isSlow;
      }
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory, filterView, slowMovingProducts]);

  const handleOpenRestock = (product: Product) => {
    setSelectedProductForRestock(product);
    setRestockQty(25);
    setRestockCost(product.costPrice);
    setIsRestockModalOpen(true);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForRestock) return;
    restockProduct(selectedProductForRestock.id, restockQty, restockCost);
    setIsRestockModalOpen(false);
    setSelectedProductForRestock(null);
  };

  const handleOpenAdjustment = (product: Product) => {
    setSelectedProductForAdj(product);
    setAdjQty(-1);
    setAdjReason('damaged');
    setAdjNotes('');
    setIsAdjustmentModalOpen(true);
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdj) return;
    adjustStock({
      productId: selectedProductForAdj.id,
      productName: selectedProductForAdj.name,
      quantityChange: adjQty,
      reason: adjReason,
      notes: adjNotes,
    });
    setIsAdjustmentModalOpen(false);
    setSelectedProductForAdj(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name) return;
    if (!isServiceItem && !newProd.sellingPrice) return;

    const costPrice = isServiceItem ? 0 : Number(newProd.costPrice) || 0;
    const sellingPrice = Number(newProd.sellingPrice) || 0;
    const stockQty = isServiceItem ? 999999 : Number(newProd.stockQuantity) || 0;

    addProduct({
      ...newProd,
      category: newProd.category || dynamicCategories[0] || 'General Retail',
      sku: newProd.sku || (isServiceItem ? `SRV-${Date.now().toString().slice(-5)}` : `SKU-${Date.now().toString().slice(-5)}`),
      costPrice,
      sellingPrice,
      stockQuantity: stockQty,
      isService: isServiceItem,
      unit: isServiceItem ? 'service' : (newProd.unit || 'units'),
    });
    setIsNewProductModalOpen(false);
    setIsServiceItem(false);
    setNewProd({
      name: '',
      category: dynamicCategories[0] || 'General Retail',
      sku: '',
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 10,
      unit: 'pieces',
      lowStockThreshold: 10,
      lastRestockedDate: new Date().toISOString().split('T')[0],
      lastSoldDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Valuation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Stock & Inventory Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track stock in, stock out, damage write-offs, dead inventory, and total stock valuation.
          </p>
        </div>

        <button
          onClick={() => setIsNewProductModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Stock Valuation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Stock Value (Cost)
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            KSh {totalStockCostValue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Your real working capital tied up in inventory
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Stock Value (Retail)
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono mt-1">
            KSh {totalStockRetailValue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Potential gross sales value at current selling prices
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Potential Gross Margin
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono mt-1">
            KSh {(totalStockRetailValue - totalStockCostValue).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Expected gross profit once entire stock turns over
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterView('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            filterView === 'all'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All Items ({products.length})
        </button>

        <button
          onClick={() => setFilterView('low')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            filterView === 'low'
              ? 'bg-red-600 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Alerts ({lowStockProducts.length})</span>
        </button>

        <button
          onClick={() => setFilterView('slow')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            filterView === 'slow'
              ? 'bg-amber-500 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Slow / Dead Stock ({slowMovingProducts.length})</span>
        </button>

        <button
          onClick={() => setFilterView('adjustments')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            filterView === 'adjustments'
              ? 'bg-slate-800 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Damaged & Adjustment Log ({stockAdjustments.length})</span>
        </button>
      </div>

      {filterView === 'adjustments' ? (
        /* Adjustment Audit Log */
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Stock Adjustment & Damage Log</h3>
              <p className="text-xs text-slate-500">
                Audit trail for broken pipes, split cement bags, expired items, or inventory reconciliation.
              </p>
            </div>
          </div>

          {stockAdjustments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No stock damage or adjustments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-600 uppercase bg-slate-50 border-b border-slate-100 font-bold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Quantity Change</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {(stockAdjustments || []).map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-500">{adj.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{adj.productName}</td>
                      <td className="py-3 px-4 font-bold font-mono text-red-600">
                        {adj.quantityChange}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] uppercase font-bold">
                          {adj.reason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{adj.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Products Table & Grid */
        <div className="space-y-4">
          {/* Search and Category Chips */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stock..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-600 uppercase bg-slate-50 border-b border-slate-100 font-bold">
                  <tr>
                    <th className="py-3 px-4">Product & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Cost Price</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Stock Valuation (Cost)</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredProducts.map((p) => {
                    const isLow = p.stockQuantity <= p.lowStockThreshold;
                    const isOut = p.stockQuantity === 0;
                    const stockCostVal = p.stockQuantity * p.costPrice;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          KSh {p.costPrice.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          KSh {p.sellingPrice.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isOut
                                ? 'bg-red-100 text-red-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stockQuantity} {p.unit}
                          </span>
                          {isLow && (
                            <div className="text-[10px] text-red-600 mt-0.5">
                              Alert: threshold is {p.lowStockThreshold}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                          KSh {stockCostVal.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenRestock(p)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs"
                            >
                              + Restock
                            </button>
                            <button
                              onClick={() => handleOpenAdjustment(p)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer border border-slate-200"
                            >
                              Damage/Loss
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              title={`Delete ${p.name}`}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-transparent hover:border-red-200"
                              aria-label={`Delete ${p.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Restock / Stock In */}
      {isRestockModalOpen && selectedProductForRestock && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Restock Product (Stock In)</h3>
                <p className="text-xs text-slate-500">{selectedProductForRestock.name}</p>
              </div>
              <button
                onClick={() => setIsRestockModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Additional Quantity to Add ({selectedProductForRestock.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty ?? 1}
                  onChange={(e) => setRestockQty(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Unit Cost / Buying Price (KSh) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={restockCost ?? 0}
                  onChange={(e) => setRestockCost(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Current Stock:</span>
                  <span>
                    {selectedProductForRestock.stockQuantity} {selectedProductForRestock.unit}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>New Stock Total:</span>
                  <span>
                    {selectedProductForRestock.stockQuantity + restockQty}{' '}
                    {selectedProductForRestock.unit}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Batch Cost:</span>
                  <span className="font-mono">
                    KSh {(restockQty * restockCost).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Stock Adjustment / Damaged */}
      {isAdjustmentModalOpen && selectedProductForAdj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Record Damaged / Lost Goods</h3>
                <p className="text-xs text-slate-500">{selectedProductForAdj.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Reason for Adjustment
                </label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                >
                  <option value="damaged">Damaged Goods (Broken in transit / cracked)</option>
                  <option value="expired">Expired / Hardened (e.g. wet cement)</option>
                  <option value="theft_loss">Theft / Unaccounted Stock Leakage</option>
                  <option value="audit_correction">Stock Count Audit Correction</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">
                  Quantity Adjustment (Negative to reduce stock) *
                </label>
                <input
                  type="number"
                  required
                  value={adjQty ?? -1}
                  onChange={(e) => setAdjQty(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Notes / Description</label>
                <input
                  type="text"
                  value={adjNotes || ''}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="e.g. 2 bags hardened due to roof leak during rain"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add New Product */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Register New Product</h3>
                <p className="text-xs text-slate-500">Add an item to the store catalog</p>
              </div>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              {/* Business Industry & Service Option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-600 font-medium text-[11px]">
                  Business Type: <strong className="text-slate-900">{currentIndustryDef.name}</strong>
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-blue-700 font-semibold text-xs">
                  <input
                    type="checkbox"
                    checked={isServiceItem}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsServiceItem(checked);
                      if (checked) {
                        setNewProd((p) => ({ ...p, costPrice: 0, stockQuantity: 999999, unit: 'service' }));
                      } else {
                        setNewProd((p) => ({ ...p, costPrice: 0, stockQuantity: 10, unit: 'pieces' }));
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>This is a Service (Labor / Repair)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-slate-700 block mb-1 font-medium">
                    {isServiceItem ? 'Service Name *' : 'Product Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newProd.name || ''}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder={isServiceItem ? 'e.g. Consultation, Wheel Alignment, Key Cutting' : 'e.g. Rhino Cement 50kg, Wire Nails 2.5inch'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Category</label>
                  <select
                    value={newProd.category || dynamicCategories[0] || 'General Retail'}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:border-blue-600"
                  >
                    {dynamicCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-medium">SKU / Service Code</label>
                  <input
                    type="text"
                    value={newProd.sku || ''}
                    onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                    placeholder={isServiceItem ? 'SRV-001' : 'e.g. CEM-RHN-50'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-600"
                  />
                </div>

                {isServiceItem ? (
                  <div className="col-span-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                    ℹ️ <strong>Services do not have a buying price.</strong> Cost is set to KSh 0 automatically.
                  </div>
                ) : (
                  <div>
                    <label className="text-slate-700 block mb-1 font-medium">
                      Cost / Buying Price (KSh) *
                    </label>
                    <input
                      type="number"
                      required={!isServiceItem}
                      value={newProd.costPrice ?? 0}
                      onChange={(e) =>
                        setNewProd({ ...newProd, costPrice: Number(e.target.value) || 0 })
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:border-blue-600"
                    />
                  </div>
                )}

                <div className={isServiceItem ? 'col-span-2' : ''}>
                  <label className="text-slate-700 block mb-1 font-medium">
                    {isServiceItem ? 'Service Fee / Charge (KSh) *' : 'Selling Price (KSh) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={newProd.sellingPrice ?? 0}
                    onChange={(e) =>
                      setNewProd({ ...newProd, sellingPrice: Number(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:border-blue-600"
                  />
                </div>

                {!isServiceItem && (
                  <>
                    <div>
                      <label className="text-slate-700 block mb-1 font-medium">Initial Stock Qty</label>
                      <input
                        type="number"
                        value={newProd.stockQuantity ?? 0}
                        onChange={(e) =>
                          setNewProd({ ...newProd, stockQuantity: Number(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-700 block mb-1 font-medium">Unit of Measure</label>
                      <input
                        type="text"
                        value={newProd.unit || ''}
                        onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })}
                        placeholder="bags, buckets, kg, pieces"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-slate-700 block mb-1 font-medium">
                        Low Stock Warning Level
                      </label>
                      <input
                        type="number"
                        value={newProd.lowStockThreshold ?? 10}
                        onChange={(e) =>
                          setNewProd({ ...newProd, lowStockThreshold: Number(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Product */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Delete Product</h3>
                <p className="text-xs text-slate-500">Are you sure you want to remove this item?</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-900">{productToDelete.name}</div>
              <div className="text-slate-500 font-mono text-[11px]">
                {productToDelete.sku} • Stock: {productToDelete.stockQuantity} {productToDelete.unit} • Price: KSh {productToDelete.sellingPrice.toLocaleString()}
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 space-y-0.5">
              <p className="font-bold">Safe Soft-Delete Protection:</p>
              <p>
                This item is never permanently destroyed. It will be archived in the DMi Soft-Delete Vault with full audit history and can be restored anytime from Cloud & Devices.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Product</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
