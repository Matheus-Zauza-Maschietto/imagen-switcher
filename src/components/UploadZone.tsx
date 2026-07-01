import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode, Trash2, Code, CheckCircle, AlertTriangle } from 'lucide-react';

interface UploadZoneProps {
  onSvgLoaded: (svgContent: string, fileName: string) => void;
  svgContent: string | null;
  fileName: string | null;
  onClear: () => void;
}

export default function UploadZone({ onSvgLoaded, svgContent, fileName, onClear }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type === "image/svg+xml" || file.name.endsWith('.svg')) {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text && text.includes('<svg')) {
          onSvgLoaded(text, file.name);
        } else {
          setError("File doesn't look like a valid SVG.");
        }
      };
      reader.readAsText(file);
    } else {
      setError("Please upload an SVG file (.svg format only).");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (pasteValue.trim() && pasteValue.includes('<svg')) {
      setError(null);
      onSvgLoaded(pasteValue, 'pasted-svg.svg');
      setPasteValue('');
      setShowPasteArea(false);
    } else {
      setError("Invalid SVG string. Make sure it contains an <svg> tag.");
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const svgByteSize = svgContent ? new Blob([svgContent]).size : 0;

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Upload Error</p>
            <p className="text-xs text-red-300/80">{error}</p>
          </div>
        </div>
      )}

      {!svgContent ? (
        <div className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`glass-panel glass-panel-hover group relative flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-violet-500 bg-violet-950/20 scale-[1.01]'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              className="hidden"
              onChange={handleFileInput}
            />
            
            <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl group-hover:scale-110 group-hover:border-violet-500/25 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all duration-300">
              <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-violet-400 transition-colors duration-300" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-200 font-display">Upload SVG Image</h3>
            <p className="mt-1 text-sm text-slate-400 text-center max-w-xs">
              Drag & drop your file here, or <span className="text-violet-400 font-medium hover:text-violet-300 transition-colors">browse files</span>.
            </p>
            <span className="mt-3 text-xs text-slate-500">Supports standard Vector graphics (.svg)</span>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setShowPasteArea(!showPasteArea)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-400 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
            >
              <Code className="h-3.5 w-3.5" />
              {showPasteArea ? 'Hide Raw Input' : 'Paste SVG Code'}
            </button>
          </div>

          {showPasteArea && (
            <div className="glass-panel p-4 space-y-3 bg-slate-900/30">
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="<svg xmlns='http://www.w3.org/2000/svg' ...> ... </svg>"
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPasteArea(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-lg hover:shadow-violet-600/10 transition-all"
                >
                  Load Code
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-5 bg-slate-900/20 border-white/5 flex flex-col md:flex-row gap-5 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="checkerboard-bg w-16 h-16 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center p-2 shrink-0">
              <div
                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-violet-400 shrink-0" />
                <span className="font-semibold text-slate-200 text-sm truncate max-w-[200px] md:max-w-[300px]">
                  {fileName}
                </span>
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Size: <span className="font-semibold text-slate-300">{formatFileSize(svgByteSize)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 text-xs font-semibold rounded-xl transition-all w-full md:w-auto justify-center"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Upload Different SVG
          </button>
        </div>
      )}
    </div>
  );
}
