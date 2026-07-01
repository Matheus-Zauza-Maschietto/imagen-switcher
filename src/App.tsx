import { useState, useEffect, useMemo } from 'react';
import { Download, Sparkles, FolderArchive, Layers, Sliders, RefreshCcw, HelpCircle } from 'lucide-react';
import JSZip from 'jszip';

import UploadZone from './components/UploadZone';
import ColorMapper from './components/ColorMapper';
import CombinationGallery from './components/CombinationGallery';
import { extractColorsFromSvg, replaceColorsInSvg } from './utils/svgColorParser';

interface SvgVariation {
  id: string;
  filename: string;
  svgContent: string;
  colorMap: Record<string, string>;
}

export default function App() {
  // SVG upload states
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Colors states
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [replacementMap, setReplacementMap] = useState<Record<string, string[]>>({});

  // Export options
  const [exportPrefix, setExportPrefix] = useState<string>('variation');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Zipping states
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Handle new SVG loaded
  const handleSvgLoaded = (content: string, name: string) => {
    setSvgContent(content);
    
    // Clean name for prefix default
    const baseName = name.replace(/\.svg$/i, '');
    setFileName(name);
    setExportPrefix(`${baseName}-swapped`);

    // Extract colors
    const colors = extractColorsFromSvg(content);
    setDetectedColors(colors);

    // Initialize map
    const initialMap: Record<string, string[]> = {};
    colors.forEach(col => {
      initialMap[col] = [col];
    });
    setReplacementMap(initialMap);
  };

  // Clear current SVG
  const handleClear = () => {
    setSvgContent(null);
    setFileName(null);
    setDetectedColors([]);
    setReplacementMap({});
    setSelectedIds(new Set());
  };

  // Generate Cartesian Product of options
  const { variations, totalCombinations } = useMemo(() => {
    if (!svgContent || detectedColors.length === 0) {
      return { variations: [], totalCombinations: 0 };
    }

    // Collect arrays of choices
    const choices = detectedColors.map(color => replacementMap[color] || [color]);

    // Compute Cartesian product
    // Helper to calculate product
    const getCartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, val) => acc.flatMap(d => val.map(e => [...d, e])),
        [[]]
      );
    };

    const combinations = getCartesian(choices);

    // Filter out combinations that have duplicate colors (meaning two original colors map to the same replacement color)
    const validCombinations = combinations.filter(
      combo => new Set(combo).size === combo.length
    );

    const totalCount = validCombinations.length;

    // Limit combinations to 500 for safety
    const maxCombinations = Math.min(totalCount, 500);
    const limitedCombos = validCombinations.slice(0, maxCombinations);

    const generatedVariations = limitedCombos.map((combo, index) => {
      // Build replacement map for this variation
      const currentMap: Record<string, string> = {};
      detectedColors.forEach((color, idx) => {
        currentMap[color] = combo[idx];
      });

      // Replace colors in the SVG content
      const modifiedSvg = replaceColorsInSvg(svgContent, currentMap);
      const variationName = `${exportPrefix}-${index + 1}.svg`;

      return {
        id: `var-${index}`,
        filename: variationName,
        svgContent: modifiedSvg,
        colorMap: currentMap,
      };
    });

    return {
      variations: generatedVariations,
      totalCombinations: totalCount,
    };
  }, [svgContent, detectedColors, replacementMap, exportPrefix]);

  // Sync selectedIds with variations when variations count changes
  useEffect(() => {
    const ids = new Set(variations.map(v => v.id));
    setSelectedIds(ids);
  }, [variations]);

  // Toggle selection for an item
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select/deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === variations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(variations.map(v => v.id)));
    }
  };

  // Download a single SVG file directly
  const handleIndividualDownload = (variation: SvgVariation) => {
    const blob = new Blob([variation.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = variation.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download selected variations in a ZIP file
  const handleZipExport = async () => {
    if (selectedIds.size === 0) return;

    setIsZipping(true);
    setZipProgress(0);

    try {
      const zip = new JSZip();
      const selectedItems = variations.filter(v => selectedIds.has(v.id));

      selectedItems.forEach(item => {
        zip.file(item.filename, item.svgContent);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setZipProgress(Math.round(metadata.percent));
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportPrefix || 'hueswitch'}-variations.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP package:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header Banner */}
      <header className="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-slate-100 m-0 tracking-tight leading-none">
                HueSwitch
              </h1>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1 block">
                SVG Color Swapper
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <HelpCircle className="h-4 w-4 text-slate-500" />
            <span>Permute, Swatch & Bulk Export</span>
          </div>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {!svgContent ? (
          // Upload view (Centered Landing)
          <div className="flex-1 flex flex-col items-center justify-center py-12 max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient">
                Recolor SVGs in Seconds
              </h2>
              <p className="text-sm md:text-base text-slate-400 max-w-lg leading-relaxed">
                Upload any vector graphic, instantly extract its entire color palette, map alternative hex codes, and download every generated combination as a single ZIP archive.
              </p>
            </div>
            
            <UploadZone
              onSvgLoaded={handleSvgLoaded}
              svgContent={svgContent}
              fileName={fileName}
              onClear={handleClear}
            />

            {/* Quick Demo instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 w-full text-center">
              <div className="glass-panel p-4 bg-slate-900/5">
                <div className="text-violet-400 font-bold font-display text-lg mb-1">1. Import</div>
                <p className="text-xs text-slate-400 leading-snug">Drag & drop or paste raw SVG markup code.</p>
              </div>
              <div className="glass-panel p-4 bg-slate-900/5">
                <div className="text-fuchsia-400 font-bold font-display text-lg mb-1">2. Mix</div>
                <p className="text-xs text-slate-400 leading-snug">Map color slots or click preset palettes.</p>
              </div>
              <div className="glass-panel p-4 bg-slate-900/5">
                <div className="text-pink-400 font-bold font-display text-lg mb-1">3. Export</div>
                <p className="text-xs text-slate-400 leading-snug">Generate combinatorics and export ZIP.</p>
              </div>
            </div>
          </div>
        ) : (
          // Application recoloing view (Split Pane)
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls Column (40% width on desktop) */}
            <div className="lg:col-span-5 space-y-6">
              {/* File summary */}
              <div className="space-y-4">
                <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Configurations
                </h2>
                <UploadZone
                  onSvgLoaded={handleSvgLoaded}
                  svgContent={svgContent}
                  fileName={fileName}
                  onClear={handleClear}
                />
              </div>

              {/* Color Swapper lists */}
              <ColorMapper
                detectedColors={detectedColors}
                replacementMap={replacementMap}
                setReplacementMap={setReplacementMap}
                totalCombinations={totalCombinations}
              />

              {/* Export Panel Options */}
              <div className="glass-panel p-5 bg-gradient-to-b from-slate-900/40 to-slate-950/40 border-white/5 space-y-5">
                <h3 className="text-sm font-semibold text-slate-200 font-display flex items-center gap-2">
                  <FolderArchive className="h-4.5 w-4.5 text-violet-400" />
                  Bulk Export Pack
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      File Naming Prefix
                    </label>
                    <input
                      type="text"
                      value={exportPrefix}
                      onChange={(e) => setExportPrefix(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                      placeholder="e.g. logo-variant"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500/50 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Files will download as <code className="text-slate-400">{exportPrefix || 'hueswitch'}-1.svg</code>, <code className="text-slate-400">{exportPrefix || 'hueswitch'}-2.svg</code>, etc.
                    </span>
                  </div>
                </div>

                {isZipping ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-violet-400 flex items-center gap-2 animate-pulse">
                        <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                        Generating zip package...
                      </span>
                      <span className="text-slate-300 font-mono">{zipProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-pink-500 h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${zipProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleZipExport}
                    disabled={selectedIds.size === 0}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:from-slate-900 disabled:to-slate-900 disabled:border-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed border border-white/5 text-white font-semibold text-sm rounded-xl shadow-lg shadow-violet-600/10 hover:shadow-violet-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="h-4.5 w-4.5" />
                    Export {selectedIds.size} Selected as ZIP
                  </button>
                )}
              </div>
            </div>

            {/* Right Variations Column (60% width on desktop) */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Swapped Combinations Output ({variations.length})
              </h2>

              <CombinationGallery
                variations={variations}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                toggleSelectAll={toggleSelectAll}
                onIndividualDownload={handleIndividualDownload}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500 bg-slate-950/20">
        <p className="flex items-center justify-center gap-1">
          Made with <span className="text-red-500">♥</span> using React, TailwindCSS and JSZip.
        </p>
      </footer>
    </div>
  );
}
