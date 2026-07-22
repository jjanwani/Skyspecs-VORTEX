'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Vendor, VendorPart, InventoryItem } from '@/lib/types';
import { getUserVendorParts, saveUserVendorParts } from '@/lib/userDataStore';

interface Props {
  vendors: Vendor[];
  inventoryItems: InventoryItem[];
  initialInventoryItemId?: string;
  onAdd: (vp: VendorPart) => void;
  onClose: () => void;
}

export default function AddVendorPartModal({ vendors, inventoryItems, initialInventoryItemId, onAdd, onClose }: Props) {
  const [vendorId, setVendorId] = useState(vendors[0]?.id ?? '');
  const [inventoryItemId, setInventoryItemId] = useState(initialInventoryItemId ?? '');
  const [sku, setSku] = useState('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [leadTimeDays, setLeadTimeDays] = useState<number | ''>('');
  const [expediteCostPerPiece, setExpediteCostPerPiece] = useState<number | ''>('');
  const [expediteLeadTimeDays, setExpediteLeadTimeDays] = useState<number | ''>('');
  const [altSourceLink, setAltSourceLink] = useState('');
  const [altPartLink, setAltPartLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || !inventoryItemId) return;

    const newVP: VendorPart = {
      id: `VP-U-${Date.now().toString().slice(-6)}`,
      vendorId,
      inventoryItemId,
      sku: sku.trim() || undefined,
      unitCost: unitCost === '' ? undefined : unitCost,
      leadTimeDays: leadTimeDays === '' ? undefined : leadTimeDays,
      expediteCostPerPiece: expediteCostPerPiece === '' ? undefined : expediteCostPerPiece,
      expediteLeadTimeDays: expediteLeadTimeDays === '' ? undefined : expediteLeadTimeDays,
      alternateVendorSourceLink: altSourceLink.trim() || undefined,
      alternateVendorPartLink: altPartLink.trim() || undefined,
    };

    const existing = getUserVendorParts();
    saveUserVendorParts([...existing, newVP]);
    onAdd(newVP);
  };

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500';
  const selectCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> Add Vendor Part
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Vendor <span className="text-red-400">*</span></label>
            <select required value={vendorId} onChange={e => setVendorId(e.target.value)} className={selectCls}>
              <option value="">— Select vendor —</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Part <span className="text-red-400">*</span></label>
            <select required value={inventoryItemId} onChange={e => setInventoryItemId(e.target.value)} className={selectCls}>
              <option value="">— Select part —</option>
              {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">SKU</label>
            <input type="text" value={sku} onChange={e => setSku(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Unit Cost ($)</label>
              <input type="number" min={0} step={0.01} value={unitCost} onChange={e => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Lead Time (days)</label>
              <input type="number" min={0} value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
            </div>
          </div>
          <div className="border-t border-gray-800 pt-3">
            <p className="text-xs font-medium text-gray-300 mb-2">Expedite Option</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cost / Piece ($)</label>
                <input type="number" min={0} step={0.01} value={expediteCostPerPiece} onChange={e => setExpediteCostPerPiece(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Lead Time (days)</label>
                <input type="number" min={0} value={expediteLeadTimeDays} onChange={e => setExpediteLeadTimeDays(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-3">
            <p className="text-xs font-medium text-gray-300 mb-2">Alternate Vendor <span className="text-gray-600 font-normal">(optional)</span></p>
            <div className="space-y-2">
              <input type="url" placeholder="Source link (alternate vendor site)" value={altSourceLink} onChange={e => setAltSourceLink(e.target.value)} className={inputCls} />
              <input type="url" placeholder="Part link (alternate part listing)" value={altPartLink} onChange={e => setAltPartLink(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-xs text-white font-medium hover:bg-blue-500">
              Add Vendor Part
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
