'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { vendors as baseVendors, vendorParts as baseVendorParts } from '@/lib/data/vendors';
import { inventoryItems as baseInventoryItems } from '@/lib/data/inventory';
import { Vendor, VendorPart, InventoryItem } from '@/lib/types';
import { getUserVendors, getUserVendorParts, getUserInventory } from '@/lib/userDataStore';
import { cn } from '@/lib/utils';
import { Search, Truck, Flag, Plus, ExternalLink, Zap } from 'lucide-react';
import AddVendorModal from '@/components/modals/AddVendorModal';
import AddVendorPartModal from '@/components/modals/AddVendorPartModal';
import { useAuth } from '@/contexts/AuthContext';

export default function VendorsPage() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [redFlagOnly, setRedFlagOnly] = useState(false);
  const [userVendors, setUserVendors] = useState<Vendor[]>([]);
  const [userVendorParts, setUserVendorParts] = useState<VendorPart[]>([]);
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddVendorPart, setShowAddVendorPart] = useState(false);

  useEffect(() => {
    setUserVendors(getUserVendors());
    setUserVendorParts(getUserVendorParts());
    setUserInventory(getUserInventory());
  }, []);

  const vendors = useMemo(() => [...baseVendors, ...userVendors], [userVendors]);
  const vendorParts = useMemo(() => [...baseVendorParts, ...userVendorParts], [userVendorParts]);
  const inventoryItems = useMemo(() => [...baseInventoryItems, ...userInventory], [userInventory]);

  const rows = useMemo(() => vendorParts.map(vp => ({
    vp,
    vendor: vendors.find(v => v.id === vp.vendorId),
    item: inventoryItems.find(i => i.id === vp.inventoryItemId),
  })).filter(r => r.vendor && r.item), [vendorParts, vendors, inventoryItems]);

  const filtered = rows.filter(r => {
    const matchSearch = !search ||
      r.vendor!.name.toLowerCase().includes(search.toLowerCase()) ||
      r.item!.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.vp.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFlag = !redFlagOnly || r.vendor!.redFlag;
    return matchSearch && matchFlag;
  });

  const redFlagCount = rows.filter(r => r.vendor!.redFlag).length;

  return (
    <div>
      <Header title="Vendors" subtitle="Vendor relationships, procurement costs, and lead times" />
      <div className="p-6 space-y-5">

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{vendors.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Vendors</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{rows.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Vendor Parts</p>
          </div>
          <button onClick={() => setRedFlagOnly(f => !f)} className={cn('bg-gray-900 border rounded-xl p-4 text-center transition-all hover:border-red-500/50', redFlagOnly ? 'border-red-500/50 bg-red-500/5' : 'border-gray-800')}>
            <p className="text-2xl font-bold text-red-400">{redFlagCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Red Flagged</p>
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by vendor, part, SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            {can('add_inventory') && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddVendor(true)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 hover:border-gray-500 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Vendor
                </button>
                <button
                  onClick={() => setShowAddVendorPart(true)}
                  disabled={vendors.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg text-xs font-medium text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Vendor Part
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Vendor</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Part</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">SKU</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Unit Cost</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Lead Time</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Expedite</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium uppercase tracking-wide whitespace-nowrap">Alternate Vendor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ vp, vendor, item }) => {
                  const qtyPerAssembly = item!.qtyPerAssembly ?? 1;
                  const expediteCostPerBOM = vp.expediteCostPerPiece !== undefined
                    ? vp.expediteCostPerPiece * qtyPerAssembly
                    : undefined;
                  return (
                    <tr key={vp.id} className="border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {vendor!.redFlag && <Flag className="w-3 h-3 text-red-400 flex-shrink-0" />}
                          <span className="text-white font-medium">{vendor!.name}</span>
                        </div>
                        {vendor!.location && <p className="text-gray-500 mt-0.5">{vendor!.location}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-300">{item!.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono">{vp.sku ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-300">{vp.unitCost !== undefined ? `$${vp.unitCost.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-gray-300">{vp.leadTimeDays !== undefined ? `${vp.leadTimeDays}d` : '—'}</td>
                      <td className="px-4 py-3">
                        {vp.expediteCostPerPiece !== undefined ? (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Zap className="w-3 h-3 flex-shrink-0" />
                            <div>
                              <p>${vp.expediteCostPerPiece.toFixed(2)}/pc · ${expediteCostPerBOM?.toFixed(2)}/BOM</p>
                              {vp.expediteLeadTimeDays !== undefined && <p className="text-gray-500">{vp.expediteLeadTimeDays}d lead</p>}
                            </div>
                          </div>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {(vp.alternateVendorSourceLink || vp.alternateVendorPartLink) ? (
                          <div className="flex flex-col gap-0.5">
                            {vp.alternateVendorSourceLink && (
                              <a href={vp.alternateVendorSourceLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Source
                              </a>
                            )}
                            {vp.alternateVendorPartLink && (
                              <a href={vp.alternateVendorPartLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Part
                              </a>
                            )}
                          </div>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No vendor parts match your filters.</p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 text-right">{filtered.length} of {rows.length} vendor parts</p>
      </div>

      {showAddVendor && (
        <AddVendorModal
          onAdd={v => { setUserVendors(prev => [...prev, v]); setShowAddVendor(false); }}
          onClose={() => setShowAddVendor(false)}
        />
      )}
      {showAddVendorPart && (
        <AddVendorPartModal
          vendors={vendors}
          inventoryItems={inventoryItems}
          onAdd={vp => { setUserVendorParts(prev => [...prev, vp]); setShowAddVendorPart(false); }}
          onClose={() => setShowAddVendorPart(false)}
        />
      )}
    </div>
  );
}
