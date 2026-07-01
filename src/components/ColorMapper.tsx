import { Plus, X, Paintbrush, RotateCcw, Flame, Sparkles, Compass } from 'lucide-react';
import { useState } from 'react';

interface ColorMapperProps {
  detectedColors: string[];
  replacementMap: Record<string, string[]>;
  setReplacementMap: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

// Preset color palettes
const PRESETS = [
  {
    name: 'Cyber Neon',
    icon: Flame,
    colors: ['#FF007F', '#00F5FF', '#9B51E0', '#FFCC00', '#10B981'],
    bg: 'from-pink-500/10 to-cyan-500/10 border-pink-500/20 text-pink-300',
  },
  {
    name: 'Retro Sunset',
    icon: Compass,
    colors: ['#FE3B6F', '#FF5E36', '#FFAE33', '#4A154B', '#FFD166'],
    bg: 'from-orange-500/10 to-purple-500/10 border-orange-500/20 text-orange-300',
  },
  {
    name: 'Sweet Pastel',
    icon: Sparkles,
    colors: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA'],
    bg: 'from-teal-500/10 to-indigo-500/10 border-teal-500/20 text-teal-300',
  },
  {
    name: 'Earthy Forest',
    icon: Paintbrush,
    colors: ['#2C5E3B', '#8FBC8F', '#D2B48C', '#556B2F', '#E6C229'],
    bg: 'from-emerald-500/10 to-yellow-500/10 border-emerald-500/20 text-emerald-300',
  },
];

export default function ColorMapper({ detectedColors, replacementMap, setReplacementMap }: ColorMapperProps) {
  const [newColorInputs, setNewColorInputs] = useState<Record<string, string>>({});
  const [activePicker, setActivePicker] = useState<string | null>(null);

  const addAlternativeColor = (sourceColor: string, colorToAdd: string) => {
    const cleaned = colorToAdd.trim().toUpperCase();
    if (!cleaned) return;
    
    // Simple validation (must start with # and be 4, 7, or 9 characters including #)
    let validatedColor = cleaned;
    if (!validatedColor.startsWith('#')) {
      validatedColor = '#' + validatedColor;
    }
    
    if (!/^#[0-9A-F]{3,8}$/i.test(validatedColor)) {
      return; // Invalid format
    }

    setReplacementMap(prev => {
      const current = prev[sourceColor] || [sourceColor];
      if (current.includes(validatedColor)) return prev; // avoid duplicates
      return {
        ...prev,
        [sourceColor]: [...current, validatedColor]
      };
    });

    setNewColorInputs(prev => ({ ...prev, [sourceColor]: '' }));
  };

  const removeAlternativeColor = (sourceColor: string, colorToRemove: string) => {
    // Prevent removing the original color unless there is at least one other color
    setReplacementMap(prev => {
      const current = prev[sourceColor] || [sourceColor];
      if (current.length <= 1) return prev; // Must keep at least one
      return {
        ...prev,
        [sourceColor]: current.filter(c => c !== colorToRemove)
      };
    });
  };

  const resetAllReplacements = () => {
    const resetMap: Record<string, string[]> = {};
    detectedColors.forEach(color => {
      resetMap[color] = [color];
    });
    setReplacementMap(resetMap);
  };

  const applyPresetToAll = (presetColors: string[]) => {
    setReplacementMap(prev => {
      const updated = { ...prev };
      detectedColors.forEach(color => {
        const current = prev[color] || [color];
        const newSet = new Set([...current]);
        presetColors.forEach(pc => newSet.add(pc));
        updated[color] = Array.from(newSet);
      });
      return updated;
    });
  };

  // Calculate combinations
  const totalCombinations = detectedColors.reduce((acc, color) => {
    const optionsCount = replacementMap[color]?.length || 1;
    return acc * optionsCount;
  }, 1);

  return (
    <div className="space-y-6">
      {/* Preset Section & Options */}
      <div className="glass-panel p-5 bg-slate-900/35 border-white/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-200 font-display flex items-center gap-2">
              <Paintbrush className="h-4 w-4 text-violet-400" />
              Combinations Dashboard
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add alternative colors to multiply the output options.
            </p>
          </div>
          <button
            onClick={resetAllReplacements}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-lg transition-all self-start md:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset all to Default
          </button>
        </div>

        {/* Global Preset Buttons */}
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-2">
            Quick Multi-Color Presets
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPresetToAll(preset.colors)}
                  className={`flex flex-col items-start p-3 bg-gradient-to-br rounded-xl border text-left group hover:scale-[1.02] active:scale-[0.98] transition-all ${preset.bg}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {preset.colors.slice(0, 3).map((col, idx) => (
                        <div
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-slate-950 shrink-0 shadow-sm"
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-semibold mt-2.5 text-slate-200 group-hover:text-white transition-colors">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info stats */}
        <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            Detected Colors: <span className="font-bold text-slate-200">{detectedColors.length}</span>
          </span>
          <span className="text-slate-400">
            Combinations count:{" "}
            <span
              className={`font-extrabold font-mono text-sm ${
                totalCombinations > 100
                  ? totalCombinations > 500
                    ? 'text-red-400'
                    : 'text-amber-400'
                  : 'text-violet-400'
              }`}
            >
              {totalCombinations}
            </span>
          </span>
        </div>

        {totalCombinations > 500 && (
          <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 rounded-xl text-xs flex gap-2">
            <span className="font-bold">Warning:</span> Combinations exceed the 500 cap. Only the first 500 will be generated. Reduce alternatives to stay within limits.
          </div>
        )}
      </div>

      {/* Colors Grid list */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Color Mapping List
        </h4>
        
        {detectedColors.map((color, index) => {
          const alternatives = replacementMap[color] || [color];
          const inputVal = newColorInputs[color] || '';
          
          return (
            <div
              key={color}
              className="glass-panel p-4 bg-slate-900/10 border-white/5 hover:bg-slate-900/20 transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
            >
              {/* Source color preview */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500 font-mono w-4">#{index + 1}</span>
                <div
                  className="w-10 h-10 rounded-xl border border-white/10 shadow-inner shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase font-mono block">
                    Original
                  </span>
                  <span className="text-sm font-semibold text-slate-200 font-mono select-all">
                    {color}
                  </span>
                </div>
              </div>

              {/* Target alternatives display */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {alternatives.map((altColor) => {
                  const isOriginal = altColor === color;
                  return (
                    <div
                      key={altColor}
                      className={`inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg border text-xs font-semibold font-mono ${
                        isOriginal
                          ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                          : 'bg-violet-500/5 border-violet-500/20 text-violet-300'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: altColor }}
                      />
                      <span>{altColor}</span>
                      
                      {/* Only allow removing if we have alternatives, original can be deleted only if others exist */}
                      {alternatives.length > 1 && (
                        <button
                          onClick={() => removeAlternativeColor(color, altColor)}
                          className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Remove color option"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add new replacement color inline form */}
                <div className="relative inline-flex items-center border border-slate-800 hover:border-slate-700 bg-slate-950/40 rounded-lg overflow-hidden shrink-0">
                  <button
                    onClick={() => setActivePicker(activePicker === color ? null : color)}
                    className="w-7 h-7 flex items-center justify-center border-r border-slate-800 hover:bg-slate-900 transition-colors"
                    title="Choose from color picker"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: inputVal || color }}
                    />
                  </button>

                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) =>
                      setNewColorInputs((prev) => ({ ...prev, [color]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addAlternativeColor(color, inputVal);
                      }
                    }}
                    placeholder="Hex code..."
                    className="w-20 px-2 py-1 text-xs bg-transparent text-slate-200 focus:outline-none font-mono"
                  />

                  <button
                    onClick={() => addAlternativeColor(color, inputVal)}
                    className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-violet-600 transition-all border-l border-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  {/* Hidden native color picker activation */}
                  {activePicker === color && (
                    <div className="absolute top-8 left-0 z-10 p-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl">
                      <input
                        type="color"
                        value={inputVal.startsWith('#') && /^#[0-9A-F]{6}$/i.test(inputVal) ? inputVal : color.slice(0, 7)}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setNewColorInputs((prev) => ({ ...prev, [color]: val }));
                        }}
                        onBlur={() => setTimeout(() => setActivePicker(null), 200)}
                        className="w-10 h-10 border-0 rounded cursor-pointer bg-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
