'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { purchaseOrders as basePurchaseOrders } from '@/lib/data/purchaseOrders';
import { inventoryItems as baseInventoryItems } from '@/lib/data/inventory';
import { vendors as baseVendors } from '@/lib/data/vendors';
import { PurchaseOrder, InventoryItem, Vendor } from '@/lib/types';
import { getUserPurchaseOrders, getUserInventory, getUserVendors } from '@/lib/userDataStore';
import { getPurchaseOrderStatusColor, getPurchaseOrderStatusLabel, formatDate, cn } from '@/lib/utils';
import { ArrowLeft, Package, Plus, ShoppingCart } from 'lucide-react';
import AddPurchaseOrderModal from '@/components/modals/AddPurchaseOrderModal';
import { useAuth } from '@/contexts/AuthContext';

function PurchaseOrdersContent() {
  const { can } = useAuth();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item') ?? '';

  const [userPOs, setUserPOs] = useState<PurchaseOrder[]>([]);
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
  const [userVendors, setUserVendors] = useState<Vendor[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setUserPOs(getUserPurchaseOrders());
    setUserInventory(getUserInventory());
    setUserVendors(getUserVendors());
  }, []);

  const allInventory = useMemo(() => [...baseInventoryItems, ...userInventory], [userInventory]);
  const allVendors = useMemo(() => [...baseVendors, ...userVendors], [userVendors]);
  const allPOs = useMemo(() => [...basePurchaseOrders, ...userPOs], [userPOs]);

  const item = allInventory.find(i => i.id === itemId);
  const itemPOs = allPOs.filter(po => po.inventoryItemId === itemId);
  const inProgress = itemPOs.filter(po => po.status === 'in_progress' || po.status === 'shipped');
  const past = itemPOs.filter(po => po.status === 'delivered' || po.status === 'returned');

  if (!itemId) {
    return (
      <div className="p-6 text-center py-20">
        <ShoppingCart className="w-10 h-10 text-gray-700 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">No part selected</p>
        <p className="text-gray-500 text-sm mb-4">Open this page from an inventory item&apos;s Procurement tab.</p>
        <Link href="/inventory" className="text-blue-400 hover:text-blue-300 text-sm">← Back to Inventory</Link>
      </div>
    );
  }

  const poCard = (po: PurchaseOrder) => (
    <div key={po.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs text-gray-500 font-mono">{po.id}</p>
          <p className="text-sm font-medium text-white">{po.vendorName}</p>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded border', getPurchaseOrderStatusColor(po.status))}>
          {getPurchaseOrderStatusLabel(po.status)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-2">
        <p>Quote: <span className="text-white">{po.quote !== undefined ? `$${po.quote.toFixed(2)}` : '—'}</span></p>
        <p>Quantity: <span className="text-white">{po.quantity}</span></p>
        <p>Est. Delivery: <span className="text-white">{po.estimatedDeliveryDate ? formatDate(po.estimatedDeliveryDate) : '—'}</span></p>
        <p>Actual Delivery: <span className="text-white">{po.actualDeliveryDate ? formatDate(po.actualDeliveryDate) : '—'}</span></p>
      </div>
      {po.notes && <p className="text-xs text-gray-500 italic">{po.notes}</p>}
    </div>
  );

  return (
    <div>
      <Header title="Purchase Orders" subtitle={item ? item.name : itemId} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/inventory" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Inventory
          </Link>
          {can('add_inventory') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Purchase Order
            </button>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white mb-3">In Progress ({inProgress.length})</h2>
          {inProgress.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Package className="w-6 h-6 mx-auto mb-2 text-gray-700" />
              <p className="text-gray-500 text-xs">No purchase orders in progress for this part.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{inProgress.map(poCard)}</div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Past Orders ({past.length})</h2>
          {past.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-xs">No past purchase orders for this part.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{past.map(poCard)}</div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddPurchaseOrderModal
          inventoryItemId={itemId}
          vendors={allVendors}
          onAdd={po => { setUserPOs(prev => [...prev, po]); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500 text-sm">Loading...</div>}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
