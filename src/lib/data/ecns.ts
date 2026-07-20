import { EngineeringChangeNotice } from '@/lib/types';

export const ecns: EngineeringChangeNotice[] = [
  {
    id: 'ECN-660',
    title: 'Core Board & SSD Replacement',
    description: 'Replace core board and SSD on affected corestack assemblies due to moisture ingress and sector corruption reports.',
    actionType: 'replace',
    affectedSubsystemTypeIds: ['corestack'],
    partsAffected: [
      { name: 'Core Board V2', qty: 1, status: 'available' },
      { name: 'SSD 256GB', qty: 1, status: 'available' },
    ],
    createdBy: 'Kaj',
    createdAt: '2024-01-12T00:00:00Z',
    notes: 'See ERN-660 Coreboard Replacement doc in Information Hub. Applies to all V2 drones.',
  },
  {
    id: 'ERN-700',
    title: 'Front Hinge Replacement (FR/FL)',
    description: 'Replace front-right and front-left hinge assemblies. Required for V2 HD Air G2 units.',
    actionType: 'replace',
    affectedSubsystemTypeIds: ['fuselage'],
    partsAffected: [
      { name: 'Hinge Assembly', qty: 2, status: 'on_order' },
    ],
    createdBy: 'Olivia',
    createdAt: '2023-12-01T00:00:00Z',
    notes: 'Hinge assemblies currently back-ordered — see Inventory INV-015.',
  },
  {
    id: 'ECN-199',
    title: 'NDAA Compliance Upgrade',
    description: 'Replace non-NDAA-compliant gimbal motors with PM4315 units to bring the drone into NDAA compliance.',
    actionType: 'replace',
    affectedSubsystemTypeIds: ['gimbal'],
    partsAffected: [
      { name: 'Motor PM4315', qty: 2, status: 'available' },
    ],
    createdBy: 'Sarah',
    createdAt: '2024-01-12T00:00:00Z',
    notes: 'Field-applicable with standard tools. See ECN-199 NDAA Compliance Upgrade doc in Information Hub.',
  },
];
