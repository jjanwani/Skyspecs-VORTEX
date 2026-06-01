import { SubsystemType, Subsystem, SubsetDefinition, SubsetAsset, SubsetHistoryEvent } from '@/lib/types';

export const SUBSYSTEM_TYPES: SubsystemType[] = [
  {
    id: 'gimbal',
    name: 'Gimbals',
    icon: '⚙',
    fields: [
      {
        id: 'motor1', label: 'Motor 1', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', 'PM4310', 'PM4315'],
      },
      {
        id: 'motor2', label: 'Motor 2', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', 'PM4310', 'PM4315'],
      },
      {
        id: 'motor3', label: 'Motor 3', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', 'PM4310', 'PM4315'],
      },
      {
        id: 'armBoard1', label: 'Arm Board 1', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', '1v1 Board', '1v2 Board'],
      },
      {
        id: 'armBoard2', label: 'Arm Board 2', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', '1v1 Board', '1v2 Board'],
      },
      {
        id: 'arm1', label: 'Arm 1', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware'],
      },
      {
        id: 'arm2', label: 'Arm 2', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware'],
      },
      {
        id: 'encoder1', label: 'Encoder 1', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', 'Black Encoder', 'Green Encoder'],
      },
      {
        id: 'encoder2', label: 'Encoder 2', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', 'Black Encoder', 'Green Encoder'],
      },
      {
        id: 'encoder3', label: 'Encoder 3', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', 'Black Encoder', 'Green Encoder'],
      },
      {
        id: 'pin6', label: '6-pin', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'New Hardware'],
      },
      {
        id: 'pin7', label: '7-pin', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'New Hardware'],
      },
      {
        id: 'bridgeHarness', label: 'Bridge Harness', type: 'dropdown',
        options: ['—', 'No change', 'Replaced', 'Redressed', 'New Hardware', 'Prefab Harness'],
      },
      { id: 'm1ac', label: 'M1 AC', type: 'number' },
      { id: 'm2ac', label: 'M2 AC', type: 'number' },
      { id: 'm3ac', label: 'M3 AC', type: 'number' },
    ],
  },
];

export const SEED_GIMBALS: Subsystem[] = [
  {
    id: 'GMB1-001',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-001',
    currentConfig: {
      motor1: 'PM4310', motor2: 'PM4310', motor3: 'PM4310',
      armBoard1: '1v2 Board', armBoard2: '1v2 Board',
      arm1: 'No change', arm2: 'No change',
      encoder1: 'Black Encoder', encoder2: 'Black Encoder', encoder3: 'Black Encoder',
      pin6: 'No change', pin7: 'No change',
      bridgeHarness: 'Prefab Harness',
      m1ac: '87', m2ac: '92', m3ac: '79',
    },
    history: [
      {
        id: 'h-001-3', timestamp: '2025-11-14T10:22:00Z', changedBy: 'Tyler', reason: 'Upgraded arm boards to 1v2',
        changes: [
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '1v1 Board', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '1v1 Board', newValue: '1v2 Board' },
        ],
      },
      {
        id: 'h-001-2', timestamp: '2025-09-03T14:05:00Z', changedBy: 'Alex', reason: 'Bridge harness wear replacement',
        changes: [
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: 'Replaced', newValue: 'Prefab Harness' },
        ],
      },
      {
        id: 'h-001-1', timestamp: '2025-06-20T08:45:00Z', changedBy: 'Sarah', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Black Encoder' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-002',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-002',
    currentConfig: {
      motor1: 'PM4315', motor2: 'PM4310', motor3: 'PM4315',
      armBoard1: '1v2 Board', armBoard2: '1v2 Board',
      arm1: 'No change', arm2: 'No change',
      encoder1: 'Green Encoder', encoder2: 'Black Encoder', encoder3: 'Green Encoder',
      pin6: 'No change', pin7: 'No change',
      bridgeHarness: 'Prefab Harness',
      m1ac: '94', m2ac: '88', m3ac: '101',
    },
    history: [
      {
        id: 'h-002-2', timestamp: '2025-12-01T09:15:00Z', changedBy: 'Alex', reason: 'Upgraded M1 and M3 to PM4315',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: 'PM4310', newValue: 'PM4315' },
        ],
        notes: 'Testing new motor batch performance',
      },
      {
        id: 'h-002-1', timestamp: '2025-07-10T11:30:00Z', changedBy: 'Tyler', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Green Encoder' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-003',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-003',
    currentConfig: {
      motor1: 'PM4310', motor2: 'PM4310', motor3: 'PM4310',
      armBoard1: '1v1 Board', armBoard2: '1v1 Board',
      arm1: 'Redressed', arm2: 'No change',
      encoder1: 'Black Encoder', encoder2: 'Black Encoder', encoder3: 'Black Encoder',
      pin6: 'No change', pin7: 'Replaced',
      bridgeHarness: 'No change',
      m1ac: '76', m2ac: '81', m3ac: '73',
    },
    history: [
      {
        id: 'h-003-2', timestamp: '2025-10-20T13:00:00Z', changedBy: 'Sarah', reason: 'Harness wear — 7-pin replaced, arm redress',
        changes: [
          { fieldId: 'pin7', fieldLabel: '7-pin', oldValue: 'No change', newValue: 'Replaced' },
          { fieldId: 'arm1', fieldLabel: 'Arm 1', oldValue: 'No change', newValue: 'Redressed' },
        ],
      },
      {
        id: 'h-003-1', timestamp: '2025-06-28T09:00:00Z', changedBy: 'Tyler', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Black Encoder' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-004',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-004',
    currentConfig: {
      motor1: 'PM4315', motor2: 'PM4315', motor3: 'PM4315',
      armBoard1: '1v2 Board', armBoard2: '1v2 Board',
      arm1: 'No change', arm2: 'No change',
      encoder1: 'Green Encoder', encoder2: 'Green Encoder', encoder3: 'Green Encoder',
      pin6: 'Replaced', pin7: 'No change',
      bridgeHarness: 'Prefab Harness',
      m1ac: '112', m2ac: '98', m3ac: '105',
    },
    history: [
      {
        id: 'h-004-3', timestamp: '2026-01-08T15:20:00Z', changedBy: 'Alex', reason: '6-pin replacement — intermittent signal loss',
        changes: [
          { fieldId: 'pin6', fieldLabel: '6-pin', oldValue: 'No change', newValue: 'Replaced' },
        ],
        notes: 'Signal drop observed during flight test FT-204',
      },
      {
        id: 'h-004-2', timestamp: '2025-11-22T10:45:00Z', changedBy: 'Tyler', reason: 'Full motor upgrade to PM4315',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: 'PM4310', newValue: 'PM4315' },
        ],
      },
      {
        id: 'h-004-1', timestamp: '2025-07-15T08:30:00Z', changedBy: 'Sarah', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Green Encoder' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-005',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-005',
    currentConfig: {
      motor1: 'PM4310', motor2: 'PM4315', motor3: 'PM4310',
      armBoard1: '1v2 Board', armBoard2: '1v1 Board',
      arm1: 'No change', arm2: 'Redressed',
      encoder1: 'Black Encoder', encoder2: 'Green Encoder', encoder3: 'Black Encoder',
      pin6: 'No change', pin7: 'No change',
      bridgeHarness: 'Redressed',
      m1ac: '65', m2ac: '70', m3ac: '68',
    },
    history: [
      {
        id: 'h-005-2', timestamp: '2025-12-15T11:00:00Z', changedBy: 'Sarah', reason: 'Full redress — routine maintenance',
        changes: [
          { fieldId: 'arm2', fieldLabel: 'Arm 2', oldValue: 'No change', newValue: 'Redressed' },
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: 'No change', newValue: 'Redressed' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: 'PM4310', newValue: 'PM4315' },
        ],
      },
      {
        id: 'h-005-1', timestamp: '2025-08-05T10:15:00Z', changedBy: 'Alex', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Black Encoder' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-006',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-006',
    currentConfig: {
      motor1: 'PM4310', motor2: 'PM4310', motor3: 'PM4310',
      armBoard1: '1v2 Board', armBoard2: '1v2 Board',
      arm1: 'No change', arm2: 'No change',
      encoder1: 'Green Encoder', encoder2: 'Green Encoder', encoder3: 'Black Encoder',
      pin6: 'No change', pin7: 'Replaced',
      bridgeHarness: 'Prefab Harness',
      m1ac: '83', m2ac: '79', m3ac: '88',
    },
    history: [
      {
        id: 'h-006-2', timestamp: '2025-11-05T14:30:00Z', changedBy: 'Tyler', reason: '7-pin harness replacement — fraying detected',
        changes: [
          { fieldId: 'pin7', fieldLabel: '7-pin', oldValue: 'No change', newValue: 'Replaced' },
        ],
      },
      {
        id: 'h-006-1', timestamp: '2025-08-18T09:00:00Z', changedBy: 'Sarah', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: '—', newValue: 'Prefab Harness' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-007',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-007',
    currentConfig: {
      motor1: 'PM4315', motor2: 'PM4310', motor3: 'PM4310',
      armBoard1: '1v1 Board', armBoard2: '1v2 Board',
      arm1: 'Replaced', arm2: 'No change',
      encoder1: 'Black Encoder', encoder2: 'Black Encoder', encoder3: 'Green Encoder',
      pin6: 'Replaced', pin7: 'No change',
      bridgeHarness: 'No change',
      m1ac: '95', m2ac: '90', m3ac: '84',
    },
    history: [
      {
        id: 'h-007-2', timestamp: '2026-01-20T10:00:00Z', changedBy: 'Alex', reason: 'Motor failure — replaced M1 with PM4315',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'arm1', fieldLabel: 'Arm 1', oldValue: 'No change', newValue: 'Replaced' },
          { fieldId: 'pin6', fieldLabel: '6-pin', oldValue: 'No change', newValue: 'Replaced' },
        ],
        notes: 'Bearing failure on M1 during descent profile',
      },
      {
        id: 'h-007-1', timestamp: '2025-09-12T11:00:00Z', changedBy: 'Tyler', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Green Encoder' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-008',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-008',
    currentConfig: {
      motor1: 'PM4310', motor2: 'PM4310', motor3: 'PM4315',
      armBoard1: '1v2 Board', armBoard2: '1v2 Board',
      arm1: 'No change', arm2: 'Redressed',
      encoder1: 'Green Encoder', encoder2: 'Black Encoder', encoder3: 'Green Encoder',
      pin6: 'No change', pin7: 'No change',
      bridgeHarness: 'Prefab Harness',
      m1ac: '71', m2ac: '85', m3ac: '92',
    },
    history: [
      {
        id: 'h-008-2', timestamp: '2025-12-08T13:45:00Z', changedBy: 'Sarah', reason: 'Arm 2 redress and M3 upgrade',
        changes: [
          { fieldId: 'arm2', fieldLabel: 'Arm 2', oldValue: 'No change', newValue: 'Redressed' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: 'PM4310', newValue: 'PM4315' },
        ],
      },
      {
        id: 'h-008-1', timestamp: '2025-09-25T09:30:00Z', changedBy: 'Alex', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: '—', newValue: 'Prefab Harness' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-009',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-009',
    currentConfig: {
      motor1: 'PM4310', motor2: 'PM4310', motor3: 'PM4310',
      armBoard1: '1v1 Board', armBoard2: '1v1 Board',
      arm1: 'No change', arm2: 'No change',
      encoder1: 'Black Encoder', encoder2: 'Black Encoder', encoder3: 'Black Encoder',
      pin6: 'No change', pin7: 'No change',
      bridgeHarness: 'No change',
      m1ac: '58', m2ac: '62', m3ac: '55',
    },
    history: [
      {
        id: 'h-009-2', timestamp: '2025-10-10T12:00:00Z', changedBy: 'Tyler', reason: 'Encoder 2 replacement — vibration damage',
        changes: [
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: 'Green Encoder', newValue: 'Black Encoder' },
        ],
        notes: 'Swapped to Black Encoder — matching existing config',
      },
      {
        id: 'h-009-1', timestamp: '2025-08-30T10:00:00Z', changedBy: 'Sarah', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Black Encoder' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-010',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-010',
    currentConfig: {
      motor1: 'PM4315', motor2: 'PM4315', motor3: 'PM4310',
      armBoard1: '1v2 Board', armBoard2: '1v2 Board',
      arm1: 'Replaced', arm2: 'Replaced',
      encoder1: 'Green Encoder', encoder2: 'Green Encoder', encoder3: 'Green Encoder',
      pin6: 'Replaced', pin7: 'Replaced',
      bridgeHarness: 'Prefab Harness',
      m1ac: '143', m2ac: '137', m3ac: '129',
    },
    history: [
      {
        id: 'h-010-3', timestamp: '2026-02-14T09:00:00Z', changedBy: 'Alex', reason: 'Full redress — exceeded service interval',
        changes: [
          { fieldId: 'arm1', fieldLabel: 'Arm 1', oldValue: 'Redressed', newValue: 'Replaced' },
          { fieldId: 'arm2', fieldLabel: 'Arm 2', oldValue: 'Redressed', newValue: 'Replaced' },
          { fieldId: 'pin6', fieldLabel: '6-pin', oldValue: 'No change', newValue: 'Replaced' },
          { fieldId: 'pin7', fieldLabel: '7-pin', oldValue: 'No change', newValue: 'Replaced' },
        ],
        notes: 'Arms at 100% wear threshold — full replacement',
      },
      {
        id: 'h-010-2', timestamp: '2025-11-30T14:00:00Z', changedBy: 'Tyler', reason: 'Motor M1+M2 upgraded to PM4315',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: 'PM4310', newValue: 'PM4315' },
        ],
      },
      {
        id: 'h-010-1', timestamp: '2025-07-22T11:00:00Z', changedBy: 'Sarah', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: '—', newValue: 'Prefab Harness' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-013',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-013',
    currentConfig: {
      motor1: 'PM4315', motor2: 'PM4315', motor3: 'PM4315',
      armBoard1: '1v2 Board', armBoard2: '1v2 Board',
      arm1: 'No change', arm2: 'No change',
      encoder1: 'Green Encoder', encoder2: 'Black Encoder', encoder3: 'Green Encoder',
      pin6: 'No change', pin7: 'No change',
      bridgeHarness: 'Prefab Harness',
      m1ac: '109', m2ac: '123', m3ac: '162',
    },
    history: [
      {
        id: 'h-013-3', timestamp: '2026-01-15T10:30:00Z', changedBy: 'Tyler', reason: 'Full motor upgrade to PM4315 — performance tuning',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: 'PM4310', newValue: 'PM4315' },
        ],
        notes: 'High AC counts warranted full upgrade before next deployment',
      },
      {
        id: 'h-013-2', timestamp: '2025-10-05T09:15:00Z', changedBy: 'Alex', reason: 'Upgraded arm boards to 1v2',
        changes: [
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '1v1 Board', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '1v1 Board', newValue: '1v2 Board' },
        ],
      },
      {
        id: 'h-013-1', timestamp: '2025-06-10T08:00:00Z', changedBy: 'Sarah', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: '—', newValue: 'Prefab Harness' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-038',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-038',
    notes: 'Crashed',
    currentConfig: {
      motor1: 'New Hardware', motor2: 'New Hardware', motor3: 'New Hardware',
      armBoard1: 'New Hardware', armBoard2: '1v2 Board',
      arm1: 'New Hardware', arm2: 'New Hardware',
      encoder1: 'New Hardware', encoder2: 'New Hardware', encoder3: 'New Hardware',
      pin6: 'New Hardware', pin7: 'New Hardware',
      bridgeHarness: 'New Hardware',
      m1ac: '105', m2ac: '125', m3ac: '115',
    },
    history: [
      {
        id: 'h-038-3', timestamp: '2026-03-12T14:00:00Z', changedBy: 'Tyler', reason: 'Post-crash remediation — full hardware replacement',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4315', newValue: 'New Hardware' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: 'PM4310', newValue: 'New Hardware' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: 'PM4315', newValue: 'New Hardware' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '1v2 Board', newValue: 'New Hardware' },
          { fieldId: 'arm1', fieldLabel: 'Arm 1', oldValue: 'No change', newValue: 'New Hardware' },
          { fieldId: 'arm2', fieldLabel: 'Arm 2', oldValue: 'No change', newValue: 'New Hardware' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: 'Black Encoder', newValue: 'New Hardware' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: 'Black Encoder', newValue: 'New Hardware' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: 'Black Encoder', newValue: 'New Hardware' },
          { fieldId: 'pin6', fieldLabel: '6-pin', oldValue: 'No change', newValue: 'New Hardware' },
          { fieldId: 'pin7', fieldLabel: '7-pin', oldValue: 'No change', newValue: 'New Hardware' },
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: 'Prefab Harness', newValue: 'New Hardware' },
        ],
        notes: 'Gimbal impacted terrain at speed. All structural components replaced.',
      },
      {
        id: 'h-038-2', timestamp: '2025-12-20T11:00:00Z', changedBy: 'Alex', reason: 'Motor M1+M3 upgraded to PM4315',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: 'PM4310', newValue: 'PM4315' },
        ],
      },
      {
        id: 'h-038-1', timestamp: '2025-09-05T09:00:00Z', changedBy: 'Sarah', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v2 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: '—', newValue: 'Prefab Harness' },
        ],
      },
    ],
  },
  {
    id: 'GMB1-039',
    typeId: 'gimbal',
    crossRef: 'SS-FS-GMB1-039',
    notes: 'Rebuilt from crash',
    currentConfig: {
      motor1: 'New Hardware', motor2: 'PM4315', motor3: 'New Hardware',
      armBoard1: '1v2 Board', armBoard2: 'New Hardware',
      arm1: 'New Hardware', arm2: 'Replaced',
      encoder1: 'New Hardware', encoder2: 'Green Encoder', encoder3: 'New Hardware',
      pin6: 'New Hardware', pin7: 'No change',
      bridgeHarness: 'New Hardware',
      m1ac: '128', m2ac: '98', m3ac: '119',
    },
    history: [
      {
        id: 'h-039-3', timestamp: '2026-03-25T15:30:00Z', changedBy: 'Alex', reason: 'Partial rebuild from crash — salvaged M2 and encoders',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4315', newValue: 'New Hardware' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: 'PM4310', newValue: 'New Hardware' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '1v1 Board', newValue: 'New Hardware' },
          { fieldId: 'arm1', fieldLabel: 'Arm 1', oldValue: 'No change', newValue: 'New Hardware' },
          { fieldId: 'arm2', fieldLabel: 'Arm 2', oldValue: 'No change', newValue: 'Replaced' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: 'Black Encoder', newValue: 'New Hardware' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: 'Black Encoder', newValue: 'New Hardware' },
          { fieldId: 'pin6', fieldLabel: '6-pin', oldValue: 'No change', newValue: 'New Hardware' },
          { fieldId: 'bridgeHarness', fieldLabel: 'Bridge Harness', oldValue: 'No change', newValue: 'New Hardware' },
        ],
        notes: 'M2 encoder and arm board 1 survived impact intact. Rebuilt around salvaged components.',
      },
      {
        id: 'h-039-2', timestamp: '2025-11-18T10:00:00Z', changedBy: 'Tyler', reason: 'M1 upgraded to PM4315, arm board upgrades',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: 'PM4310', newValue: 'PM4315' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '1v1 Board', newValue: '1v2 Board' },
        ],
      },
      {
        id: 'h-039-1', timestamp: '2025-08-12T09:30:00Z', changedBy: 'Sarah', reason: 'Initial full build',
        changes: [
          { fieldId: 'motor1', fieldLabel: 'Motor 1', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'motor2', fieldLabel: 'Motor 2', oldValue: '—', newValue: 'PM4315' },
          { fieldId: 'motor3', fieldLabel: 'Motor 3', oldValue: '—', newValue: 'PM4310' },
          { fieldId: 'armBoard1', fieldLabel: 'Arm Board 1', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'armBoard2', fieldLabel: 'Arm Board 2', oldValue: '—', newValue: '1v1 Board' },
          { fieldId: 'encoder1', fieldLabel: 'Encoder 1', oldValue: '—', newValue: 'Black Encoder' },
          { fieldId: 'encoder2', fieldLabel: 'Encoder 2', oldValue: '—', newValue: 'Green Encoder' },
          { fieldId: 'encoder3', fieldLabel: 'Encoder 3', oldValue: '—', newValue: 'Black Encoder' },
        ],
      },
    ],
  },
];

// ── Flexible subset / asset grid seed data ────────────────────────────────────

export const DEFAULT_STATUS_OPTIONS: string[] = [
  'No change', 'Redress', 'Replaced', 'New Hardware',
  'PM4310', 'PM4315', '1v1 Board', '1v2 Board',
  'Black Encoder', 'Green Encoder', 'Prefab Harness',
];

export const SEED_SUBSET_DEFS: SubsetDefinition[] = [
  {
    id: 'gimbal-redress',
    name: 'Gimbal Redress',
    createdAt: '2025-01-01T00:00:00Z',
    parts: [
      { id: 'motor1', label: 'Motor 1', type: 'status' },
      { id: 'motor2', label: 'Motor 2', type: 'status' },
      { id: 'motor3', label: 'Motor 3', type: 'status' },
      { id: 'armBoard1', label: 'Arm Board 1', type: 'status' },
      { id: 'armBoard2', label: 'Arm Board 2', type: 'status' },
      { id: 'arm1', label: 'Arm 1', type: 'status' },
      { id: 'arm2', label: 'Arm 2', type: 'status' },
      { id: 'encoder1', label: 'Encoder 1', type: 'status' },
      { id: 'encoder2', label: 'Encoder 2', type: 'status' },
      { id: 'encoder3', label: 'Encoder 3', type: 'status' },
      { id: 'pin6', label: '6-pin', type: 'status' },
      { id: 'pin7', label: '7-pin', type: 'status' },
      { id: 'bridgeHarness', label: 'Bridge Harness', type: 'status' },
    ],
  },
  {
    id: 'motor-cycles',
    name: 'Motor Cycles',
    createdAt: '2025-01-01T00:00:00Z',
    parts: [
      { id: 'm1ac', label: 'M1 AC', type: 'text' },
      { id: 'm2ac', label: 'M2 AC', type: 'text' },
      { id: 'm3ac', label: 'M3 AC', type: 'text' },
    ],
  },
];

export const SEED_SUBSET_ASSETS: SubsetAsset[] = SEED_GIMBALS.map(g => ({
  id: g.id,
  crossRef: g.crossRef,
  notes: g.notes,
}));

// Cell values per subset → asset → part
export const SEED_SUBSET_CELLS: Record<string, Record<string, Record<string, string>>> = {
  'gimbal-redress': Object.fromEntries(
    SEED_GIMBALS.map(g => [
      g.id,
      {
        motor1: g.currentConfig.motor1 ?? '',
        motor2: g.currentConfig.motor2 ?? '',
        motor3: g.currentConfig.motor3 ?? '',
        armBoard1: g.currentConfig.armBoard1 ?? '',
        armBoard2: g.currentConfig.armBoard2 ?? '',
        arm1: g.currentConfig.arm1 ?? '',
        arm2: g.currentConfig.arm2 ?? '',
        encoder1: g.currentConfig.encoder1 ?? '',
        encoder2: g.currentConfig.encoder2 ?? '',
        encoder3: g.currentConfig.encoder3 ?? '',
        pin6: g.currentConfig.pin6 ?? '',
        pin7: g.currentConfig.pin7 ?? '',
        bridgeHarness: g.currentConfig.bridgeHarness ?? '',
      },
    ])
  ),
  'motor-cycles': Object.fromEntries(
    SEED_GIMBALS.map(g => [
      g.id,
      {
        m1ac: g.currentConfig.m1ac ?? '',
        m2ac: g.currentConfig.m2ac ?? '',
        m3ac: g.currentConfig.m3ac ?? '',
      },
    ])
  ),
};

// History per asset, migrated from old model
export const SEED_SUBSET_HISTORY: Record<string, SubsetHistoryEvent[]> = Object.fromEntries(
  SEED_GIMBALS.map(g => [
    g.id,
    g.history.map(evt => ({
      id: evt.id,
      timestamp: evt.timestamp,
      changedBy: evt.changedBy,
      reason: evt.reason,
      notes: evt.notes,
      subsetId: 'gimbal-redress',
      subsetName: 'Gimbal Redress',
      changes: evt.changes.map(ch => ({
        partId: ch.fieldId,
        partLabel: ch.fieldLabel,
        oldValue: ch.oldValue,
        newValue: ch.newValue,
      })),
    })),
  ])
);
