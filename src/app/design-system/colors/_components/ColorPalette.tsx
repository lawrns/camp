import React from 'react';

interface ColorPaletteProps {
  colorName: string;
  colorPrefix: string;
  description: string;
}

export function ColorPalette({ colorName, colorPrefix, description }: ColorPaletteProps) {
  const colorShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-ds-color-text">{colorName}</h3>
        <p className="text-sm text-ds-color-text-muted">{description}</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {colorShades.map((shade) => {
          const colorClass = `bg-ds-color-${colorPrefix}-${shade}`;
          const textClass = shade > 400 ? 'text-white' : 'text-ds-color-text';
          
          return (
            <div key={shade} className="space-y-2">
              <div 
                className={`h-16 rounded-lg border border-ds-color-border ${colorClass} flex items-end p-2`}
              >
                <span className={`text-xs font-mono ${textClass}`}>
                  {shade}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ds-color-text-muted">
                  {colorPrefix}-{shade}
                </span>
                <span className="text-xs text-ds-color-text-muted font-mono">
                  var(--ds-color-{colorPrefix}-{shade})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ColorPalette;
