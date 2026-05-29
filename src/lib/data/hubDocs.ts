export type HubDocCategory = 'build_guides' | 'diagrams' | 'regulatory' | 'maintenance' | 'rca_reports';

export interface HubDoc {
  id: string;
  name: string;
  category: HubDocCategory;
  type: 'pdf' | 'image' | 'video';
  version: string;
  lastUpdated: string;
  description: string;
  driveLink: string;
}

const FOLDER = 'https://drive.google.com/drive/folders/1XgYzQXGMM7RmnoE-pAQFZIqod1Q85CNl';

export const HUB_DOCS: HubDoc[] = [
  { id: 'D-001', name: 'V2 Block 2 Build Guide', category: 'build_guides', type: 'pdf', version: 'v2.3', lastUpdated: '2024-01-10', description: 'Complete build instructions for V2 Block 2 drone assembly. Includes corestack, gimbal, fuselage, and payload sections.', driveLink: FOLDER },
  { id: 'D-002', name: 'V2 HD Air G2 Build Guide', category: 'build_guides', type: 'pdf', version: 'v1.2', lastUpdated: '2024-01-05', description: 'Build guide for the V2 HD Air G2 configuration with gimbal specifications.', driveLink: FOLDER },
  { id: 'D-003', name: 'Corestack Assembly Diagram', category: 'diagrams', type: 'image', version: 'v2.1', lastUpdated: '2023-12-20', description: 'Wiring diagram and component placement for corestack assembly. Includes Xavier, SSD, and coreboard layout.', driveLink: FOLDER },
  { id: 'D-004', name: 'Gimbal Wiring Harness', category: 'diagrams', type: 'image', version: 'v3.0', lastUpdated: '2024-01-08', description: 'Complete wiring harness diagram for gimbal assembly including camera, lidar, and motor connections.', driveLink: FOLDER },
  { id: 'D-005', name: 'ERN-660 Coreboard Replacement', category: 'maintenance', type: 'pdf', version: 'v1.0', lastUpdated: '2023-11-15', description: 'Engineering Release Notice for coreboard replacement procedure. Applies to all V2 drones.', driveLink: FOLDER },
  { id: 'D-006', name: 'ERN-700 Hinge Replacement FR/FL', category: 'maintenance', type: 'pdf', version: 'v1.1', lastUpdated: '2023-12-01', description: 'Engineering Release Notice for front hinge assembly replacement. Required for V2 HD Air G2 units.', driveLink: FOLDER },
  { id: 'D-007', name: 'ECN-199 NDAA Compliance Upgrade', category: 'regulatory', type: 'pdf', version: 'v2.0', lastUpdated: '2024-01-12', description: 'NDAA compliance upgrade procedure for all deployed units. Field-applicable with standard tools.', driveLink: FOLDER },
  { id: 'D-008', name: 'FAA Registration Process', category: 'regulatory', type: 'pdf', version: 'v1.3', lastUpdated: '2023-10-20', description: 'Step-by-step FAA registration procedure for new drone units entering service.', driveLink: FOLDER },
  { id: 'D-009', name: 'ECT-52 (7075) Compliance Checklist', category: 'regulatory', type: 'pdf', version: 'v1.0', lastUpdated: '2023-09-15', description: 'Compliance checklist and verification steps for ECT-52 standard.', driveLink: FOLDER },
  { id: 'D-010', name: 'Motor Troubleshooting Guide', category: 'maintenance', type: 'pdf', version: 'v2.2', lastUpdated: '2024-01-03', description: 'Diagnosis and replacement procedures for PM4315 and PM4310 motors. Includes ESC diagnostics.', driveLink: FOLDER },
  { id: 'D-011', name: 'RCA Template - Crash Investigation', category: 'rca_reports', type: 'pdf', version: 'v1.5', lastUpdated: '2023-12-10', description: 'Standard template for root cause analysis of crash incidents. Covers flight log analysis, hardware inspection, and corrective actions.', driveLink: FOLDER },
  { id: 'D-012', name: 'RCA Report - FS-091 Motor Failure', category: 'rca_reports', type: 'pdf', version: 'v1.0', lastUpdated: '2024-01-18', description: 'Root cause analysis for FS-091 crash. Motor 2 overcurrent event confirmed. ESC replaced.', driveLink: FOLDER },
  { id: 'D-013', name: 'Payload System Assembly', category: 'build_guides', type: 'video', version: 'v1.0', lastUpdated: '2023-11-28', description: 'Video walkthrough of payload board base and cover installation, including radio shield placement.', driveLink: FOLDER },
  { id: 'D-014', name: 'TBS Backpack Firmware Update', category: 'maintenance', type: 'pdf', version: 'v2.0', lastUpdated: '2024-01-14', description: 'Step-by-step TBS backpack firmware update procedure. Required for all units prior to deployment.', driveLink: FOLDER },
  { id: 'D-015', name: 'Fuselage Assembly - Bottom Plate', category: 'diagrams', type: 'image', version: 'v2.0', lastUpdated: '2023-12-05', description: 'Diagram showing bottom plate assembly sequence, standoff positions, and torque specifications.', driveLink: FOLDER },
  { id: 'D-016', name: 'Pre-Flight Checklist', category: 'maintenance', type: 'pdf', version: 'v3.1', lastUpdated: '2024-01-15', description: 'Complete pre-flight inspection and verification checklist for all V2 drone variants.', driveLink: FOLDER },
];
