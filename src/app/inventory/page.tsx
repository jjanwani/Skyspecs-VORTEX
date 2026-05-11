'use client';

import { useState, useMemo, useEffect, Fragment } from 'react';
import Header from '@/components/layout/Header';
import { inventoryItems } from '@/lib/data/inventory';
import { InventoryCategory, InventoryItem, PIPOStatus } from '@/lib/types';
import { getPIPOStatusColor, getPIPOStatusLabel, formatDate, cn } from '@/lib/utils';
import {
  Search, Package, AlertTriangle, Filter, ChevronUp, ChevronDown,
  ArrowUpDown, TrendingDown, ShoppingCart, CheckCircle2, Pencil, ExternalLink, X, Check
} from 'lucide-react';
import InlineEdit, { InlineToggle } from '@/components/InlineEdit';

type SortKey = 'name' | 'category' | 'currentCount' | 'minQty' | 'usageRatePerWeek' | 'discrepancy';
type SortDir = 'asc' | 'desc';

const CATEGORIES: (InventoryCategory | 'all')[] = [
  'all', 'Corestack', 'Gimbal', 'Fuselage', 'Peripherals', 'GCS', 'RTK', 'Transmitters', 'Misc', '3D Printing'
];

const PIPO_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'on_order', label: 'On Order' },
  { value: 'depleted', label: 'Depleted' },
];

function StockBar({ current, min, max }: { current: number; min: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isLow = current < min;
  const isEmpty = current === 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden min-w-[48px]">
        <div
          className={cn('h-full rounded-full', isEmpty ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium tabular-nums', isEmpty ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white')}>
        {current}
      </span>
    </div>
  );
}

type ItemOverrides = Partial<Pick<InventoryItem, 'currentCount' | 'pipoStatus' | 'incoming' | 'assignedTech' | 'location' | 'notes' | 'repurchaseFlag'>>;

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | 'all'>('all');
  const [pipoFilter, setPipoFilter] = useState<PIPOStatus | 'all'>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'low' | 'repurchase' | 'on_order'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [minQtyOverrides, setMinQtyOverrides] = useState<Record<string, number>>({});
  const [editingMinQty, setEditingMinQty] = useState<string | null>(null);
  const [editMinQtyVal, setEditMinQtyVal] = useState('');
  const [purchaseLinks, setPurchaseLinks] = useState<Record<string, string>>({});
  const [editingPurchaseLink, setEditingPurchaseLink] = useState<string | null>(null);
  const [editPurchaseLinkVal, setEditPurchaseLinkVal] = useState('');
  const [itemOverrides, setItemOverrides] = useState<Record<string, ItemOverrides>>({});

  useEffect(() => {
    const savedMin = localStorage.getItem('inventory-min-qty');
    if (savedMin) setMinQtyOverrides(JSON.parse(savedMin));
    const savedLinks = localStorage.getItem('inventory-purchase-links');
    if (savedLinks) setPurchaseLinks(JSON.parse(savedLinks));
    const savedOverrides = localStorage.getItem('inventory-overrides');
    if (savedOverrides) setItemOverrides(JSON.parse(savedOverrides));
  }, []);

  const getEffectiveMinQty = (id: string, defaultMin: number) =>
    minQtyOverrides[id] ?? defaultMin;

  const getItem = (base: InventoryItem): InventoryItem => ({
    ...base,
    ...(itemOverrides[base.id] ?? {}),
    minQty: minQtyOverrides[base.id] ?? base.minQty,
    purchaseLink: purchaseLinks[base.id] ?? base.purchaseLink,
  });

  const updateItemField = (id: string, field: keyof ItemOverrides, value: unknown) => {
    setItemOverrides(prev => {
      const next = { ...prev, [id]: { ...(prev[id] ?? {}), [field]: value } };
      localStorage.setItem('inventory-overrides', JSON.stringify(next));
      return next;
    });
  };

  const saveMinQty = (id: string, val: string) => {
    const num = parseInt(val);
    if (isNaN(num) || num < 0) return;
    const next = { ...minQtyOverrides, [id]: num };
    setMinQtyOverrides(next);
    localStorage.setItem('inventory-min-qty', JSON.stringify(next));
    setEditingMinQty(null);
  };

  const savePurchaseLink = (id: string, val: string) => {
    const next = { ...purchaseLinks, [id]: val.trim() };
    setPurchaseLinks(next);
    localStorage.setItem('inventory-purchase-links', JSON.stringify(next));
    setEditingPurchaseLink(null);
  };

  const effectiveItems = useMemo(() => inventoryItems.map(getItem), [itemOverrides, minQtyOverrides, purchaseLinks]);

  const filtered = useMemo(() => {
    let items = effectiveItems.filter(item => {
      const matchSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        (item.assignedTech?.toLowerCase().includes(search.toLowerCase())) ||
        (item.location?.toLowerCase().includes(search.toLowerCase())) ||
        (item.ecn?.toLowerCase().includes(search.toLowerCase()));
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchPipo = pipoFilter === 'all' || item.pipoStatus === pipoFilter;
      const matchAlert =
        alertFilter === 'all' ? true :
          alertFilter === 'low' ? item.currentCount < item.minQty :
            alertFilter === 'repurchase' ? item.repurchaseFlag :
              item.pipoStatus === 'on_order';
      return matchSearch && matchCat && matchPipo && matchAlert;
    });

    items.sort((a, b) => {
      let aVal: string | number = a[sortKey] as string | number;
      let bVal: string | number = b[sortKey] as string | number;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, pipoFilter, alertFilter, sortKey, sortDir, effectiveItems]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />;
  };

  const belowMin = effectiveItems.filter(i => i.currentCount < i.minQty).length;
  const repurchaseCount = effectiveItems.filter(i => i.repurchaseFlag).length;
  const onOrderCount = effectiveItems.filter(i => i.pipoStatus === 'on_order').length;
  const inStockCount = effectiveItems.filter(i => i.pipoStatus === 'in_stock').length;

  return (
    <div>
      <Header title="Inventory" subtitle="Parts and components tracking" />
      <div className="p-6 space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => setAlertFilter(alertFilter === 'low' ? 'all' : 'low')} className={cn('bg-gray-900 border rounded-xl p-4 text-left transition-all hover:border-red-500/50', alertFilter === 'low' ? 'border-red-500/50 bg-red-500/5' : 'border-gray-800')}>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-red-400">{belowMin}</p>
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Below Minimum</p>
          </button>
          <button onClick={() => setAlertFilter(alertFilter === 'repurchase' ? 'all' : 'repurchase')} className={cn('bg-gray-900 border rounded-xl p-4 text-left transition-all hover:border-amber-500/50', alertFilter === 'repurchase' ? 'border-amber-500/50 bg-amber-500/5' : 'border-gray-800')}>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-amber-400">{repurchaseCount}</p>
              <ShoppingCart className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Flagged for Reorder</p>
          </button>
          <button onClick={() => setAlertFilter(alertFilter === 'on_order' ? 'all' : 'on_order')} className={cn('bg-gray-900 border rounded-xl p-4 text-left transition-all hover:border-blue-500/50', alertFilter === 'on_order' ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-800')}>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-blue-400">{onOrderCount}</p>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">On Order</p>
          </button>
          <button onClick={() => setAlertFilter('all')} className={cn('bg-gray-900 border rounded-xl p-4 text-left transition-all hover:border-green-500/50', alertFilter === 'all' ? 'border-green-500/50 bg-green-500/5' : 'border-gray-800')}>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-green-400">{inStockCount}</p>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">In Stock</p>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Filter & Search</span>
          </div>
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, category, tech, location, ECN..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as InventoryCategory | 'all')}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
            </select>
            <select
              value={pipoFilter}
              onChange={e => setPipoFilter(e.target.value as PIPOStatus | 'all')}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All PIPO Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="on_order">On Order</option>
              <option value="depleted">Depleted</option>
            </select>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => {
              const count = c === 'all' ? effectiveItems.length : effectiveItems.filter(i => i.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c as InventoryCategory | 'all')}
                  className={cn('px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                    categoryFilter === c ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:text-white'
                  )}
                >
                  {c === 'all' ? 'All' : c} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-white transition-colors">
                      Part Name <SortIcon k="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
                    <button onClick={() => toggleSort('category')} className="flex items-center gap-1 hover:text-white transition-colors">
                      Category <SortIcon k="category" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide">Tech</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
                    <button onClick={() => toggleSort('currentCount')} className="flex items-center gap-1 hover:text-white transition-colors">
                      Stock <SortIcon k="currentCount" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide">PIPO</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
                    <button onClick={() => toggleSort('discrepancy')} className="flex items-center gap-1 hover:text-white transition-colors">
                      Discrepancy <SortIcon k="discrepancy" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide">Incoming</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">
                    <button onClick={() => toggleSort('usageRatePerWeek')} className="flex items-center gap-1 hover:text-white transition-colors">
                      Usage/wk <SortIcon k="usageRatePerWeek" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide">Last Audit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const isLow = item.currentCount < item.minQty;
                  const expanded = expandedItem === item.id;
                  const purchaseLink = item.purchaseLink ?? '';
                  return (
                    <Fragment key={item.id}>
                      <tr
                        onClick={() => setExpandedItem(expanded ? null : item.id)}
                        className={cn(
                          'border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors',
                          isLow && 'bg-red-500/5',
                          item.repurchaseFlag && !isLow && 'bg-amber-500/5'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.repurchaseFlag && <ShoppingCart className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                            {isLow && !item.repurchaseFlag && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                            <span className={cn('font-medium', isLow ? 'text-red-300' : 'text-white')}>{item.name}</span>
                            {item.newRelease && <span className="bg-violet-500/20 text-violet-400 border border-violet-500/20 px-1 py-0.5 rounded text-xs">NEW</span>}
                          </div>
                          {item.ecn && <p className="text-gray-600 mt-0.5">{item.ecn}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400">{item.category}</span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <InlineEdit
                            value={item.assignedTech ?? ''}
                            onSave={v => updateItemField(item.id, 'assignedTech', v)}
                            displayClassName="text-gray-400"
                            emptyLabel="—"
                          />
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <div onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden min-w-[48px]">
                                <div
                                  className={cn('h-full rounded-full', item.currentCount === 0 ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500')}
                                  style={{ width: `${Math.min((item.currentCount / Math.max(item.qty, item.minQty * 1.5)) * 100, 100)}%` }}
                                />
                              </div>
                              <InlineEdit
                                value={item.currentCount}
                                type="number"
                                onSave={v => updateItemField(item.id, 'currentCount', Number(v))}
                                displayClassName={cn('text-xs font-medium tabular-nums', item.currentCount === 0 ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white')}
                              />
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {editingMinQty === item.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    autoFocus
                                    type="number"
                                    value={editMinQtyVal}
                                    onChange={e => setEditMinQtyVal(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') saveMinQty(item.id, editMinQtyVal);
                                      if (e.key === 'Escape') setEditingMinQty(null);
                                    }}
                                    className="w-14 px-1 py-0.5 bg-gray-700 border border-blue-500 rounded text-white text-xs"
                                  />
                                  <button onClick={() => saveMinQty(item.id, editMinQtyVal)} className="text-green-400 hover:text-green-300">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => setEditingMinQty(null)} className="text-gray-500 hover:text-gray-300">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="flex items-center gap-0.5 text-gray-600 hover:text-gray-400 group/min"
                                  onClick={e => { e.stopPropagation(); setEditingMinQty(item.id); setEditMinQtyVal(String(item.minQty)); }}
                                >
                                  <span>min: {item.minQty}</span>
                                  <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/min:opacity-100 transition-opacity" />
                                </button>
                              )}
                              {minQtyOverrides[item.id] !== undefined && (
                                <span className="text-blue-400 text-xs">*</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <InlineEdit
                            value={item.pipoStatus}
                            type="select"
                            options={PIPO_OPTIONS}
                            onSave={v => updateItemField(item.id, 'pipoStatus', v as PIPOStatus)}
                            displayClassName={cn('px-1.5 py-0.5 rounded border text-xs', getPIPOStatusColor(item.pipoStatus))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('font-medium',
                            item.discrepancy < 0 ? 'text-red-400' : item.discrepancy > 0 ? 'text-green-400' : 'text-gray-500'
                          )}>
                            {item.discrepancy === 0 ? '—' : item.discrepancy > 0 ? `+${item.discrepancy}` : item.discrepancy}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <InlineEdit
                            value={item.incoming}
                            type="number"
                            onSave={v => updateItemField(item.id, 'incoming', Number(v))}
                            displayClassName={cn(item.incoming > 0 ? 'text-blue-400' : 'text-gray-600')}
                            emptyLabel="—"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-400">{item.usageRatePerWeek}/wk</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-500">{formatDate(item.lastAudit)}</span>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-b border-gray-800 bg-gray-800/30">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
                              <div onClick={e => e.stopPropagation()}>
                                <p className="text-gray-500 mb-1">Location</p>
                                <InlineEdit
                                  value={item.location ?? ''}
                                  onSave={v => updateItemField(item.id, 'location', v)}
                                  displayClassName="text-white"
                                  emptyLabel="—"
                                />
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Qty per Assembly</p>
                                <p className="text-white">{item.qtyPerAssembly}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">In Stock (raw)</p>
                                <p className="text-white">{item.inStock}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Counted Inventory</p>
                                <p className="text-white">{item.countedInventory}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Last Audit Count</p>
                                <p className="text-white">{item.lastAuditCount}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Stock Since Audit</p>
                                <p className="text-white">+{item.stockAddedSinceAudit}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">Usage Since Audit</p>
                                <p className="text-white">-{item.usageSinceAudit}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-1">PIPO Plan</p>
                                <p className="text-white">{item.pipoPlan || '—'}</p>
                              </div>
                              {item.ecn && (
                                <div>
                                  <p className="text-gray-500 mb-1">ECN</p>
                                  <p className="text-blue-400">{item.ecn}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-gray-500 mb-1">Last Updated</p>
                                <p className="text-white">{formatDate(item.lastUpdated)}</p>
                              </div>
                              <div onClick={e => e.stopPropagation()}>
                                <p className="text-gray-500 mb-1">Reorder Flag</p>
                                <InlineToggle
                                  value={item.repurchaseFlag}
                                  onToggle={() => updateItemField(item.id, 'repurchaseFlag', !item.repurchaseFlag)}
                                  trueLabel="Flagged"
                                  falseLabel="Not flagged"
                                  trueClass="bg-amber-500/20 text-amber-400 border-amber-500/30"
                                />
                              </div>
                              {/* Purchase Link */}
                              <div className="col-span-2" onClick={e => e.stopPropagation()}>
                                <p className="text-gray-500 mb-1">Purchase Link</p>
                                {editingPurchaseLink === item.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      autoFocus
                                      type="url"
                                      value={editPurchaseLinkVal}
                                      onChange={e => setEditPurchaseLinkVal(e.target.value)}
                                      placeholder="https://..."
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') savePurchaseLink(item.id, editPurchaseLinkVal);
                                        if (e.key === 'Escape') setEditingPurchaseLink(null);
                                      }}
                                      className="flex-1 px-2 py-1 bg-gray-700 border border-blue-500 rounded text-white text-xs"
                                    />
                                    <button onClick={() => savePurchaseLink(item.id, editPurchaseLinkVal)} className="text-green-400 hover:text-green-300">
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setEditingPurchaseLink(null)} className="text-gray-500 hover:text-gray-300">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : purchaseLink ? (
                                  <div className="flex items-center gap-1">
                                    <a href={purchaseLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate max-w-[200px]">
                                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{purchaseLink}</span>
                                    </a>
                                    <button onClick={() => { setEditingPurchaseLink(item.id); setEditPurchaseLinkVal(purchaseLink); }} className="text-gray-600 hover:text-gray-400 ml-1">
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setEditingPurchaseLink(item.id); setEditPurchaseLinkVal(''); }}
                                    className="text-gray-600 hover:text-blue-400 flex items-center gap-1 transition-colors"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>Add purchase link</span>
                                  </button>
                                )}
                              </div>
                              <div className="col-span-2 md:col-span-4" onClick={e => e.stopPropagation()}>
                                <p className="text-gray-500 mb-1">Notes</p>
                                <InlineEdit
                                  value={item.notes ?? ''}
                                  type="textarea"
                                  onSave={v => updateItemField(item.id, 'notes', v)}
                                  placeholder="Add notes..."
                                  displayClassName={cn('leading-relaxed', item.notes ? 'text-amber-300' : 'text-gray-600')}
                                  emptyLabel="Click to add notes"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No items match your filters.</p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 text-right">{filtered.length} of {inventoryItems.length} items · Click a row to expand · Hover any field to edit</p>
      </div>
    </div>
  );
}
