import { Vendor, VendorPart } from '@/lib/types';

export const vendors: Vendor[] = [
  {
    id: 'VEN-001',
    name: 'Apex Circuit Supply',
    location: 'Austin, TX',
    redFlag: false,
    notes: 'Primary corestack board supplier.',
  },
  {
    id: 'VEN-002',
    name: 'Northline Hinge & Machining',
    location: 'Grand Rapids, MI',
    redFlag: true,
    notes: 'Repeated delays on hinge assemblies — monitor closely.',
  },
  {
    id: 'VEN-003',
    name: 'Summit Prop Works',
    location: 'Reno, NV',
    redFlag: false,
  },
];

export const vendorParts: VendorPart[] = [
  {
    id: 'VP-001',
    vendorId: 'VEN-001',
    inventoryItemId: 'INV-004', // Coreboards
    sku: 'ACS-CB-V2',
    unitCost: 84.5,
    leadTimeDays: 21,
    expediteCostPerPiece: 112,
    expediteLeadTimeDays: 7,
    alternateVendorSourceLink: 'https://example.com/vendors/circuitworks',
    alternateVendorPartLink: 'https://example.com/vendors/circuitworks/parts/cb-v2-alt',
  },
  {
    id: 'VP-002',
    vendorId: 'VEN-002',
    inventoryItemId: 'INV-015', // Hinge assys
    sku: 'NHM-HNG-FRFL',
    unitCost: 46,
    leadTimeDays: 35,
    expediteCostPerPiece: 68,
    expediteLeadTimeDays: 14,
    alternateVendorSourceLink: 'https://example.com/vendors/precision-hinge',
    alternateVendorPartLink: 'https://example.com/vendors/precision-hinge/parts/frfl',
  },
  {
    id: 'VP-003',
    vendorId: 'VEN-003',
    inventoryItemId: 'INV-013', // CCW Props
    sku: 'SPW-PROP-CCW',
    unitCost: 6.25,
    leadTimeDays: 10,
    expediteCostPerPiece: 8.5,
    expediteLeadTimeDays: 3,
  },
];
