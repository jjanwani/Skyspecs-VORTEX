'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Search, BookOpen, FileText, Video, Image, ExternalLink, FolderOpen, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type DocCategory = 'all' | 'build_guides' | 'diagrams' | 'regulatory' | 'maintenance' | 'rca_reports';

const DOCS = [
  { id: 'D-001', title: 'V2 Block 2 Build Guide', category: 'build_guides' as DocCategory, type: 'pdf', version: 'v2.3', lastUpdated: '2024-01-10', description: 'Complete build instructions for V2 Block 2 drone assembly. Includes corestack, gimbal, fuselage, and payload sections.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-002', title: 'V2 HD Air G2 Build Guide', category: 'build_guides' as DocCategory, type: 'pdf', version: 'v1.2', lastUpdated: '2024-01-05', description: 'Build guide for the V2 HD Air G2 configuration with gimbal specifications.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-003', title: 'Corestack Assembly Diagram', category: 'diagrams' as DocCategory, type: 'image', version: 'v2.1', lastUpdated: '2023-12-20', description: 'Wiring diagram and component placement for corestack assembly. Includes Xavier, SSD, and coreboard layout.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-004', title: 'Gimbal Wiring Harness', category: 'diagrams' as DocCategory, type: 'image', version: 'v3.0', lastUpdated: '2024-01-08', description: 'Complete wiring harness diagram for gimbal assembly including camera, lidar, and motor connections.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-005', title: 'ERN-660 Coreboard Replacement', category: 'maintenance' as DocCategory, type: 'pdf', version: 'v1.0', lastUpdated: '2023-11-15', description: 'Engineering Release Notice for coreboard replacement procedure. Applies to all V2 drones.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-006', title: 'ERN-700 Hinge Replacement FR/FL', category: 'maintenance' as DocCategory, type: 'pdf', version: 'v1.1', lastUpdated: '2023-12-01', description: 'Engineering Release Notice for front hinge assembly replacement. Required for V2 HD Air G2 units.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-007', title: 'ECN-199 NDAA Compliance Upgrade', category: 'regulatory' as DocCategory, type: 'pdf', version: 'v2.0', lastUpdated: '2024-01-12', description: 'NDAA compliance upgrade procedure for all deployed units. Field-applicable with standard tools.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-008', title: 'FAA Registration Process', category: 'regulatory' as DocCategory, type: 'pdf', version: 'v1.3', lastUpdated: '2023-10-20', description: 'Step-by-step FAA registration procedure for new drone units entering service.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-009', title: 'ECT-52 (7075) Compliance Checklist', category: 'regulatory' as DocCategory, type: 'pdf', version: 'v1.0', lastUpdated: '2023-09-15', description: 'Compliance checklist and verification steps for ECT-52 standard.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-010', title: 'Motor Troubleshooting Guide', category: 'maintenance' as DocCategory, type: 'pdf', version: 'v2.2', lastUpdated: '2024-01-03', description: 'Diagnosis and replacement procedures for PM4315 and PM4310 motors. Includes ESC diagnostics.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-011', title: 'RCA Template - Crash Investigation', category: 'rca_reports' as DocCategory, type: 'pdf', version: 'v1.5', lastUpdated: '2023-12-10', description: 'Standard template for root cause analysis of crash incidents. Covers flight log analysis, hardware inspection, and corrective actions.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-012', title: 'RCA Report - FS-091 Motor Failure', category: 'rca_reports' as DocCategory, type: 'pdf', version: 'v1.0', lastUpdated: '2024-01-18', description: 'Root cause analysis for FS-091 crash. Motor 2 overcurrent event confirmed. ESC replaced.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-013', title: 'Payload System Assembly', category: 'build_guides' as DocCategory, type: 'video', version: 'v1.0', lastUpdated: '2023-11-28', description: 'Video walkthrough of payload board base and cover installation, including radio shield placement.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-014', title: 'TBS Backpack Firmware Update', category: 'maintenance' as DocCategory, type: 'pdf', version: 'v2.0', lastUpdated: '2024-01-14', description: 'Step-by-step TBS backpack firmware update procedure. Required for all units prior to deployment.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-015', title: 'Fuselage Assembly - Bottom Plate', category: 'diagrams' as DocCategory, type: 'image', version: 'v2.0', lastUpdated: '2023-12-05', description: 'Diagram showing bottom plate assembly sequence, standoff positions, and torque specifications.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
  { id: 'D-016', title: 'Pre-Flight Checklist', category: 'maintenance' as DocCategory, type: 'pdf', version: 'v3.1', lastUpdated: '2024-01-15', description: 'Complete pre-flight inspection and verification checklist for all V2 drone variants.', driveLink: 'https://drive.google.com/drive/folders/skyspecs-builds' },
];

const DEFAULT_FAVORITES = ['D-001', 'D-002', 'D-005', 'D-006', 'D-007', 'D-016'];

const CATEGORY_LABELS: Record<DocCategory, string> = {
  all: 'All Documents',
  build_guides: 'Build Guides',
  diagrams: 'Diagrams & Schematics',
  regulatory: 'Regulatory / Compliance',
  maintenance: 'Maintenance / ERN',
  rca_reports: 'RCA Reports',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  image: Image,
  video: Video,
};

const TYPE_COLORS: Record<string, string> = {
  pdf: 'text-red-400 bg-red-500/10 border-red-500/20',
  image: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  video: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

export default function InformationHubPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DocCategory>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(DEFAULT_FAVORITES));

  useEffect(() => {
    const saved = localStorage.getItem('ihub-favorites');
    if (saved) setFavorites(new Set(JSON.parse(saved)));
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('ihub-favorites', JSON.stringify([...next]));
      return next;
    });
  };

  const filtered = DOCS.filter(doc => {
    const matchSearch = !search ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || doc.category === category;
    const matchFav = !showFavoritesOnly || favorites.has(doc.id);
    return matchSearch && matchCat && matchFav;
  });

  const favoriteDocs = DOCS.filter(d => favorites.has(d.id));

  return (
    <div>
      <Header title="Information Hub" subtitle="Drone builds, diagrams, and technical documentation from Google Drive" />
      <div className="p-6 space-y-5">

        {/* Integration Banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <FolderOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-300">Connected to Google Drive</p>
            <p className="text-xs text-blue-400/70 mt-0.5">Documents are synced from the SkySpecs shared drive. Click any document to open in Google Drive.</p>
          </div>
          <a
            href="https://drive.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
          >
            Open Drive <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Quick Access / Favorites */}
        {favoriteDocs.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h2 className="text-sm font-semibold text-white">Quick Access</h2>
              <span className="text-xs text-gray-500">· {favoriteDocs.length} favorited</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {favoriteDocs.map(doc => {
                const Icon = TYPE_ICONS[doc.type] || FileText;
                return (
                  <a
                    key={doc.id}
                    href={doc.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 p-3 bg-gray-800 rounded-lg hover:border-blue-500/30 border border-transparent transition-all group"
                  >
                    <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate group-hover:text-blue-400 transition-colors">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.version}</p>
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(doc.id, e)}
                      className="text-amber-400 hover:text-gray-400 transition-colors"
                      title="Remove from favorites"
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search documents, guides, ERNs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(s => !s)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors',
              showFavoritesOnly ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'border-gray-700 text-gray-400 hover:text-white'
            )}
          >
            <Star className="w-3.5 h-3.5" />
            Favorites only
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(CATEGORY_LABELS) as DocCategory[]).map(cat => {
            const count = cat === 'all' ? DOCS.length : DOCS.filter(d => d.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  category === cat ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:text-white'
                )}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const Icon = TYPE_ICONS[doc.type] || FileText;
            const isFav = favorites.has(doc.id);
            return (
              <a
                key={doc.id}
                href={doc.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/40 transition-all group block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('flex items-center gap-2 px-2 py-1 rounded-lg border text-xs font-medium', TYPE_COLORS[doc.type])}>
                    <Icon className="w-3.5 h-3.5" />
                    {doc.type.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => toggleFavorite(doc.id, e)}
                      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      className={cn('p-1 rounded transition-colors', isFav ? 'text-amber-400 hover:text-gray-400' : 'text-gray-600 hover:text-amber-400')}
                    >
                      <Star className={cn('w-3.5 h-3.5', isFav && 'fill-current')} />
                    </button>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors mb-2">{doc.title}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{doc.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="bg-gray-800 px-2 py-0.5 rounded">{CATEGORY_LABELS[doc.category]}</span>
                  <div className="flex items-center gap-2">
                    <span>{doc.version}</span>
                    <span>·</span>
                    <span>{doc.lastUpdated}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No documents match your search.</p>
          </div>
        )}

        <p className="text-xs text-gray-600 text-right">{filtered.length} of {DOCS.length} documents · Click ★ to favorite</p>
      </div>
    </div>
  );
}
