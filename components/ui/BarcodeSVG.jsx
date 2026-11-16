'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeSVG({
  value,
  format = 'CODE128',
  height = 80,
  unitWidth = 2.5,
  className = '',
  showText = true,
  margin = 15,
  fontSize = 14,
  textMargin = 6,
  containerClassName = ''
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        const cleanValue = String(value).trim();
        if (cleanValue) {
          JsBarcode(svgRef.current, cleanValue, {
            format: format || 'CODE128',
            width: unitWidth,
            height: height,
            displayValue: showText,
            fontSize: fontSize,
            fontOptions: 'bold',
            font: 'monospace',
            textMargin: textMargin,
            margin: margin,
            background: '#ffffff',
            lineColor: '#000000'
          });
        }
      } catch (err) {
        console.error('JsBarcode render error:', err);
      }
    }
  }, [value, format, height, unitWidth, showText, margin, fontSize, textMargin]);

  if (!value) return null;

  const wrapperClass = containerClassName !== undefined && containerClassName !== ''
    ? containerClassName
    : `inline-flex flex-col items-center select-none bg-white p-3 rounded-xl shadow-xs border border-slate-200 ${className}`;

  return (
    <div className={wrapperClass}>
      <svg ref={svgRef} className="max-w-full overflow-visible" />
    </div>
  );
}
