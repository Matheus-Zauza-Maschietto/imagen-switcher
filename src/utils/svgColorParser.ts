// Canvas context for browser-native color normalization
let ctx: CanvasRenderingContext2D | null = null;

/**
 * Converts any CSS color representation (e.g. red, rgb(), hsl(), hex) to uppercase HEX format.
 * If the color contains alpha transparency (a < 1), returns an 8-character hex code (#RRGGBBAA).
 */
export function normalizeColor(colorStr: string): string {
  const trimmed = colorStr.trim();
  if (
    !trimmed ||
    trimmed === 'none' ||
    trimmed === 'inherit' ||
    trimmed === 'currentColor' ||
    trimmed.startsWith('url(')
  ) {
    return '';
  }

  // Set up cached canvas context for color translation
  if (!ctx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    ctx = canvas.getContext('2d');
  }

  if (ctx) {
    // Reset context and apply style
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillStyle = trimmed;
    const computed = ctx.fillStyle;

    // Handle invalid colors which remain transparent
    if (computed === 'rgba(0, 0, 0, 0)') {
      if (trimmed.toLowerCase() === 'transparent' || trimmed.replace(/\s+/g, '') === 'rgba(0,0,0,0)') {
        return '#00000000';
      }
      return ''; // invalid color format
    }

    return computedColorToHex(computed);
  }

  return trimmed.toUpperCase();
}

/**
 * Helper to convert canvas-rendered computed style strings to HEX.
 */
function computedColorToHex(color: string): string {
  if (color.startsWith('#')) {
    return color.toUpperCase();
  }

  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+(\.\d+)?/g);
    if (!matches) return color.toUpperCase();

    const r = Math.round(parseFloat(matches[0]));
    const g = Math.round(parseFloat(matches[1]));
    const b = Math.round(parseFloat(matches[2]));
    const a = matches[3] ? parseFloat(matches[3]) : 1;

    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    if (a < 1) {
      const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
      return `#${rHex}${gHex}${bHex}${aHex}`.toUpperCase();
    }
    return `#${rHex}${gHex}${bHex}`.toUpperCase();
  }

  return color.toUpperCase();
}

/**
 * Parses SVG text content, traverses elements, looks inside <style> tags,
 * and compiles a unique, sorted list of normalized colors found.
 */
export function extractColorsFromSvg(svgText: string): string[] {
  const colors = new Set<string>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');

  // 1. Scan element attributes (fill, stroke, stop-color, flood-color, color)
  const colorAttrs = ['fill', 'stroke', 'stop-color', 'flood-color', 'color'];
  const elements = doc.querySelectorAll('*');

  elements.forEach((el) => {
    colorAttrs.forEach((attr) => {
      const val = el.getAttribute(attr);
      if (val) {
        const norm = normalizeColor(val);
        if (norm) colors.add(norm);
      }
    });

    // Check inline style rules
    const style = el.getAttribute('style');
    if (style) {
      const declarations = style.split(';');
      declarations.forEach((dec) => {
        const [prop, val] = dec.split(':').map((s) => s.trim());
        if (prop && val && colorAttrs.includes(prop)) {
          const norm = normalizeColor(val);
          if (norm) colors.add(norm);
        }
      });
    }
  });

  // 2. Scan style elements text contents using regexes
  const styles = doc.querySelectorAll('style');
  styles.forEach((styleEl) => {
    const text = styleEl.textContent || '';
    
    // Hex colors
    const hexMatches = text.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    hexMatches.forEach((m) => {
      const norm = normalizeColor(m);
      if (norm) colors.add(norm);
    });

    // rgb/rgba colors
    const rgbMatches = text.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi) || [];
    rgbMatches.forEach((m) => {
      const norm = normalizeColor(m);
      if (norm) colors.add(norm);
    });

    // hsl/hsla colors
    const hslMatches = text.match(/hsla?\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+\s*)?\)/gi) || [];
    hslMatches.forEach((m) => {
      const norm = normalizeColor(m);
      if (norm) colors.add(norm);
    });

    // Other color functions (display-p3, oklch, oklab, etc.)
    const funcMatches = text.match(/\b(color|oklch|oklab|lab|lch|hwb)\([^)]+\)/gi) || [];
    funcMatches.forEach((m) => {
      const norm = normalizeColor(m);
      if (norm) colors.add(norm);
    });
  });

  // Sort colors by hue (rough visual sort) or hex string
  return Array.from(colors).sort();
}

/**
 * Replaces occurrences of colors in CSS styling text based on a mapping object.
 */
function replaceColorsInCss(cssText: string, colorMap: Record<string, string>): string {
  let updatedCss = cssText;

  // Replace Hex
  updatedCss = updatedCss.replace(/#[0-9a-fA-F]{3,8}\b/g, (match) => {
    const norm = normalizeColor(match);
    if (norm && colorMap[norm]) {
      return colorMap[norm];
    }
    return match;
  });

  // Replace rgb/rgba
  updatedCss = updatedCss.replace(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi, (match) => {
    const norm = normalizeColor(match);
    if (norm && colorMap[norm]) {
      return colorMap[norm];
    }
    return match;
  });

  // Replace hsl/hsla
  updatedCss = updatedCss.replace(/hsla?\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+\s*)?\)/gi, (match) => {
    const norm = normalizeColor(match);
    if (norm && colorMap[norm]) {
      return colorMap[norm];
    }
    return match;
  });

  // Replace color functions (display-p3, oklch, oklab, etc.)
  updatedCss = updatedCss.replace(/\b(color|oklch|oklab|lab|lch|hwb)\([^)]+\)/gi, (match) => {
    const norm = normalizeColor(match);
    if (norm && colorMap[norm]) {
      return colorMap[norm];
    }
    return match;
  });

  return updatedCss;
}

/**
 * Swaps list of original colors with their chosen replacements in an SVG string.
 */
export function replaceColorsInSvg(svgText: string, colorMap: Record<string, string>): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');

  // Verify document is parsed correctly
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    console.error('DOMParser failed to parse SVG string:', parserError.textContent);
    return svgText; // return original as fallback
  }

  const elements = doc.querySelectorAll('*');
  const colorAttrs = ['fill', 'stroke', 'stop-color', 'flood-color', 'color'];

  elements.forEach((el) => {
    const propertyReplacements: Record<string, string> = {};

    // 1. Check presentation attributes
    colorAttrs.forEach((attr) => {
      const val = el.getAttribute(attr);
      if (val) {
        const norm = normalizeColor(val);
        if (norm && colorMap[norm]) {
          const replacement = colorMap[norm];
          el.setAttribute(attr, replacement);
          propertyReplacements[attr] = replacement;
        }
      }
    });

    // 2. Check inline style attributes
    const style = el.getAttribute('style');
    if (style) {
      const declarations = style.split(';');
      // Find style-defined color replacements
      declarations.forEach((dec) => {
        const index = dec.indexOf(':');
        if (index > 0) {
          const prop = dec.slice(0, index).trim();
          const val = dec.slice(index + 1).trim();
          if (colorAttrs.includes(prop)) {
            const norm = normalizeColor(val);
            if (norm && colorMap[norm]) {
              propertyReplacements[prop] = colorMap[norm];
            }
          }
        }
      });

      // Update style declarations using propertyReplacements
      const updatedDecs = declarations.map((dec) => {
        const index = dec.indexOf(':');
        if (index > 0) {
          const prop = dec.slice(0, index).trim();
          if (colorAttrs.includes(prop) && propertyReplacements[prop]) {
            return `${prop}: ${propertyReplacements[prop]}`;
          }
        }
        return dec;
      });
      el.setAttribute('style', updatedDecs.join(';'));
    }
  });

  // Replace inside stylesheet style blocks
  const styles = doc.querySelectorAll('style');
  styles.forEach((styleEl) => {
    const originalCss = styleEl.textContent || '';
    const newCss = replaceColorsInCss(originalCss, colorMap);
    styleEl.textContent = newCss;
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}
