'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Drone, DroneStatus } from '@/lib/types';
import { getUserDrones, saveUserDrones } from '@/lib/userDataStore';

interface Props {
  onAdd: (drone: Drone) => void;
  onClose: () => void;
}

export default function AddDroneModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('V2');
  const [status, setStatus] = useState<DroneStatus>('wip_redress');
  const [serialNumber, setSerialNumber] = useState('');
  const [buildVersion, setBuildVersion] = useState('');
  const [location, setLocation] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [deploymentRegion, setDeploymentRegion] = useState('');
  const [ectCompliance, setEctCompliance] = useState(false);
  const [ecnCompliance, setEcnCompliance] = useState(false);
  const [faaRegistration, setFaaRegistration] = useState(false);
  const [notes, setNotes] = useState('');

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDrone: Drone = {
      id: name.trim(),
      name: name.trim(),
      version,
      status,
      serialNumber: serialNumber.trim(),
      buildVersion: buildVersion.trim() || 'V2.1',
      location: location.trim() || 'Unknown',
      assignedTech: assignedTech.trim() || undefined,
      deploymentRegion: deploymentRegion.trim() || undefined,
      ectCompliance,
      ecnCompliance,
      faaRegistration,
      workOrders: [],
      totalFlightHours: 0,
      crashHistory: 0,
      rcaCompleted: false,
      notes: notes.trim() || undefined,
      sfSyncStatus: 'pending',
      sfObject: 'Asset',
    };

    const existing = getUserDrones();
    saveUserDrones([...existing, newDrone]);
    onAdd(newDrone);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> Add Drone
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name / ID <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              placeholder="FS-049"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Version</label>
            <select
              value={version}
              onChange={e => setVersion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="V2">V2</option>
              <option value="V2 HD Air G2">V2 HD Air G2</option>
              <option value="V2 Block 2">V2 Block 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as DroneStatus)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="wip_redress">WIP / Redress</option>
              <option value="ready_for_deployment">Ready for Deployment</option>
              <option value="flight_status">Flight Status</option>
              <option value="returning_field">Returning from Field</option>
              <option value="field">In Field</option>
              <option value="in_maintenance">In Maintenance</option>
              <option value="rca">RCA</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Serial Number</label>
            <input
              type="text"
              placeholder="SN-XXXX"
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Build Version</label>
            <input
              type="text"
              placeholder="V2.1"
              value={buildVersion}
              onChange={e => setBuildVersion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Location</label>
            <input
              type="text"
              placeholder="Warehouse / Field"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Assigned Tech</label>
            <input
              type="text"
              placeholder="Tech name"
              value={assignedTech}
              onChange={e => setAssignedTech(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Deployment Region</label>
            <input
              type="text"
              placeholder="US / UK / EU / Canada"
              value={deploymentRegion}
              onChange={e => setDeploymentRegion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs text-gray-400 mb-1">Compliance</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-500"
                checked={ectCompliance}
                onChange={e => setEctCompliance(e.target.checked)}
              />
              <span className="text-xs text-gray-300">ECT-52 Compliance</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-500"
                checked={ecnCompliance}
                onChange={e => setEcnCompliance(e.target.checked)}
              />
              <span className="text-xs text-gray-300">ECN-199 (NDAA) Compliance</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-500"
                checked={faaRegistration}
                onChange={e => setFaaRegistration(e.target.checked)}
              />
              <span className="text-xs text-gray-300">FAA Registration</span>
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-xs text-white font-medium hover:bg-blue-500"
            >
              Add Drone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
