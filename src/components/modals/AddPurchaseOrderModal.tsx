'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus, Vendor } from '@/lib/types';
import { getUserPurchaseOrders, saveUserPurchaseOrders } from '@/lib/userDataStore';

interface Props {
  inventoryItemId: string;
  vendors: Vendor[];
  onAdd: (po: PurchaseOrder) => void;
  onClose: () => void;
}

export default function AddPurchaseOrderModal({ inventoryItemId, vendors, onAdd, onClose }: Props) {
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [quote, setQuote] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [actualDeliveryDate, setActualDeliveryDate] = useState('');
  const [status, setStatus] = useState<PurchaseOrderStatus>('in_progress');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedVendorName = vendors.find(v => v.id === vendorId)?.name ?? vendorName.trim();
    if (!resolvedVendorName) return;

    const newPO: PurchaseOrder = {
      id: `PO-U-${Date.now().toString().slice(-6)}`,
      inventoryItemId,
      vendorId: vendorId || undefined,
      vendorName: resolvedVendorName,
      quote: quote === '' ? undefined : quote,
      quantity,
      estimatedDeliveryDate: estimatedDeliveryDate || undefined,
      actualDeliveryDate: actualDeliveryDate || undefined,
      status,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const existing = getUserPurchaseOrders();
    saveUserPurchaseOrders([...existing, newPO]);
    onAdd(newPO);
  };

  const inputCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500';
  const selectCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> New Purchase Order
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Vendor</label>
            {vendors.length > 0 ? (
              <select value={vendorId} onChange={e => setVendorId(e.target.value)} className={selectCls}>
                <option value="">— Select vendor —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            ) : (
              <input type="text" required placeholder="Vendor name" value={vendorName} onChange={e => setVendorName(e.target.value)} className={inputCls} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Quote ($)</label>
              <input type="number" min={0} step={0.01} value={quote} onChange={e => setQuote(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Quantity</label>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Est. Delivery</label>
              <input type="date" value={estimatedDeliveryDate} onChange={e => setEstimatedDeliveryDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Actual Delivery</label>
              <input type="date" value={actualDeliveryDate} onChange={e => setActualDeliveryDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as PurchaseOrderStatus)} className={selectCls}>
              <option value="in_progress">In Progress</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." className={`${inputCls} resize-none`} rows={3} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-xs text-white font-medium hover:bg-blue-500">
              Create Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
