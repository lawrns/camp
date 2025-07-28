import { Metadata } from 'next';
import DesignSystemLayout from '../_components/DesignSystemLayout';
import { ColorPalette, ColorUsage } from './_components/ColorComponents';

export const metadata: Metadata = {
  title: 'Colors - Campfire Design System',
  description: 'Color palette and usage guidelines for Campfire applications',
};

export default function ColorsPage() {
  return (
    <DesignSystemLayout>
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-ds-color-text">Colors</h1>
          <p className="text-ds-color-text-muted">
            Our color system is built with accessibility in mind, ensuring sufficient contrast and clear visual hierarchy.
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-ds-color-text">Primary Palette</h2>
          <ColorPalette 
            colorName="Primary" 
            colorPrefix="primary" 
            description="Used for primary actions, links, and important elements." 
          />
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-ds-color-text">Neutral Palette</h2>
          <ColorPalette 
            colorName="Neutral" 
            colorPrefix="neutral" 
            description="Used for text, backgrounds, and borders." 
          />
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-ds-color-text">Semantic Colors</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ColorPalette 
              colorName="Success" 
              colorPrefix="success" 
              description="Used for success states and positive actions." 
            />
            <ColorPalette 
              colorName="Warning" 
              colorPrefix="warning" 
              description="Used for warning states and potentially destructive actions." 
            />
            <ColorPalette 
              colorName="Error" 
              colorPrefix="error" 
              description="Used for error states and destructive actions." 
            />
            <ColorPalette 
              colorName="Info" 
              colorPrefix="info" 
              description="Used for informational states and neutral actions." 
            />
          </div>
        </section>

        <ColorUsage />
      </div>
    </DesignSystemLayout>
  );
}
