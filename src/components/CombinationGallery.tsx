import { useState } from 'react';
import { Download, Check, Eye, ChevronLeft, ChevronRight, CheckSquare, Square, X } from 'lucide-react';

interface SvgVariation {
  id: string;
  filename: string;
  svgContent: string;
  colorMap: Record<string, string>;
}

interface CombinationGalleryProps {
  variations: SvgVariation[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  onIndividualDownload: (variation: SvgVariation) => void;
}

const ITEMS_PER_PAGE = 12;

export default function CombinationGallery({
  variations,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  onIndividualDownload,
}: CombinationGalleryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [previewItem, setPreviewItem] = useState<SvgVariation | null>(null);

  if (variations.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400 bg-slate-900/10 border-white/5">
        No combinations generated yet. Make sure your SVG is loaded and has color alternatives.
      </div>
    );
  }

  // Pagination calculation
  const totalPages = Math.ceil(variations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = variations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const allSelectedOnPage = paginatedItems.every(item => selectedIds.has(item.id));
  
  const togglePageSelection = () => {
    paginatedItems.forEach(item => {
      const isSelected = selectedIds.has(item.id);
      if (allSelectedOnPage && isSelected) {
        toggleSelect(item.id);
      } else if (!allSelectedOnPage && !isSelected) {
        toggleSelect(item.id);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20 p-4 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all font-semibold"
          >
            {selectedIds.size === variations.length ? (
              <>
                <Square className="h-3.5 w-3.5 text-violet-400" />
                Deselect All ({selectedIds.size})
              </>
            ) : (
              <>
                <CheckSquare className="h-3.5 w-3.5 text-violet-400" />
                Select All ({variations.length})
              </>
            )}
          </button>
          
          <button
            onClick={togglePageSelection}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-300 hover:text-white transition-all font-semibold"
          >
            {allSelectedOnPage ? 'Deselect Page' : 'Select Current Page'}
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-200">{startIndex + 1}</span> -{' '}
          <span className="font-semibold text-slate-200">
            {Math.min(startIndex + ITEMS_PER_PAGE, variations.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-200">{variations.length}</span> variations
        </div>
      </div>

      {/* Grid of variations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {paginatedItems.map((item) => {
          const isSelected = selectedIds.has(item.id);
          
          return (
            <div
              key={item.id}
              className={`glass-panel overflow-hidden bg-slate-900/10 flex flex-col justify-between group transition-all duration-300 ${
                isSelected
                  ? 'border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/20'
                  : 'border-white/5 hover:border-slate-700'
              }`}
            >
              {/* Preview Box */}
              <div className="checkerboard-bg aspect-square relative flex items-center justify-center p-6 border-b border-white/5 select-none">
                {/* SVG Render (isolated via image source to prevent global CSS collisions) */}
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(item.svgContent)}`}
                  alt={item.filename}
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Card hover Overlay actions */}
                <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-violet-500 hover:scale-105 active:scale-95 transition-all"
                    title="View Enlarged & Map Details"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onIndividualDownload(item)}
                    className="p-2.5 bg-violet-600 rounded-xl text-white hover:bg-violet-500 hover:scale-105 active:scale-95 shadow-lg shadow-violet-600/20 transition-all"
                    title="Download this SVG"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>

                {/* Selection indicator pill */}
                <button
                  onClick={() => toggleSelect(item.id)}
                  className={`absolute top-3 right-3 h-6 w-6 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-violet-500 border-violet-400 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                      : 'bg-slate-950/80 border-slate-700 text-transparent hover:border-slate-500'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </button>
              </div>

              {/* Info section */}
              <div className="p-4 space-y-3">
                <span className="text-xs font-semibold text-slate-200 block truncate">
                  {item.filename}
                </span>

                {/* Map Mini swatch colors */}
                <div className="flex flex-wrap gap-1">
                  {Object.entries(item.colorMap).map(([orig, replacement], idx) => {
                    if (orig === replacement) return null; // Only show altered colors to save space
                    return (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-400"
                        title={`Changed ${orig} to ${replacement}`}
                      >
                        <div
                          className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: orig }}
                        />
                        <span>➔</span>
                        <div
                          className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: replacement }}
                        />
                      </div>
                    );
                  })}
                  {Object.entries(item.colorMap).every(([o, r]) => o === r) && (
                    <span className="text-[10px] text-slate-500 italic">No colors changed</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Only render up to 5 page buttons to prevent crowded layout
            if (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1
            ) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    currentPage === page
                      ? 'bg-violet-600 border-violet-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              );
            } else if (
              (page === 2 && currentPage > 3) ||
              (page === totalPages - 1 && currentPage < totalPages - 2)
            ) {
              return (
                <span key={page} className="text-slate-600 text-xs px-1 select-none">
                  ...
                </span>
              );
            }
            return null;
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-40 disabled:hover:border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Detail Modal Overlay */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-2xl bg-slate-900 border-slate-800 p-6 space-y-6 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-200 font-display">
                Variation Details: {previewItem.filename}
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Preview Panel */}
              <div className="checkerboard-bg aspect-square rounded-2xl border border-white/5 p-8 flex items-center justify-center">
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(previewItem.svgContent)}`}
                  alt={previewItem.filename}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Color Maps list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Swapped Color Log
                </h4>
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {Object.entries(previewItem.colorMap).map(([orig, rep], idx) => {
                    const altered = orig !== rep;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border ${
                          altered
                            ? 'bg-violet-950/20 border-violet-500/20 text-violet-300'
                            : 'bg-slate-950/40 border-slate-900 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: orig }}
                          />
                          <span className="text-xs font-mono">{orig}</span>
                        </div>
                        <span className="text-xs font-semibold">➔</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: rep }}
                          />
                          <span className="text-xs font-mono">{rep}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => {
                      onIndividualDownload(previewItem);
                      setPreviewItem(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    Download SVG
                  </button>
                  
                  <button
                    onClick={() => {
                      toggleSelect(previewItem.id);
                    }}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
                      selectedIds.has(previewItem.id)
                        ? 'bg-slate-950 border-slate-800 text-red-400 hover:text-red-300'
                        : 'bg-slate-950 border-slate-800 text-violet-400 hover:text-violet-300'
                    }`}
                  >
                    {selectedIds.has(previewItem.id) ? 'Deselect from Export' : 'Select for Export'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
