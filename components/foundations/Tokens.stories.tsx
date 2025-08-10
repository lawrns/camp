import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Foundations/Tokens',
};

export default meta;

type Story = StoryObj;

const ColorSwatch = ({ name, className }: { name: string; className: string }) => (
  <div className="flex items-center gap-3">
    <div className={`h-8 w-8 rounded ${className}`} />
    <code className="text-sm">{name}</code>
  </div>
);

export const Colors: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="font-medium mb-2">Core</h3>
        <div className="space-y-2">
          <ColorSwatch name="bg-background" className="bg-background" />
          <ColorSwatch name="text-foreground" className="bg-foreground" />
          <ColorSwatch name="bg-card" className="bg-card" />
          <ColorSwatch name="bg-popover" className="bg-popover" />
          <ColorSwatch name="bg-muted" className="bg-muted" />
          <ColorSwatch name="bg-accent" className="bg-accent" />
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Primary</h3>
        <div className="grid grid-cols-6 gap-2">
          {['50','100','200','300','400','500','600','700','800','900','950'].map(s => (
            <div key={s} className={`h-8 rounded bg-primary-${s}`} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Secondary</h3>
        <div className="grid grid-cols-6 gap-2">
          {['50','100','200','300','400','500','600','700','800','900','950'].map(s => (
            <div key={s} className={`h-8 rounded bg-secondary-${s}`} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Status</h3>
        <div className="grid grid-cols-6 gap-2">
          {['success','warning','error','info'].map(n => (
            <div key={n} className={`h-8 rounded bg-${n}`} />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="text-xs">Text XS</div>
      <div className="text-sm">Text SM</div>
      <div className="text-base">Text Base</div>
      <div className="text-lg">Text LG</div>
      <div className="text-xl">Text XL</div>
      <div className="text-2xl">Text 2XL</div>
      <div className="text-3xl">Text 3XL</div>
      <div className="text-4xl">Text 4XL</div>
    </div>
  ),
};

export const RadiusAndSpacing: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Radius (ds-*)</h3>
        <div className="flex items-center gap-2">
          {['none','xs','sm','md','lg','xl','2xl','3xl','full'].map(r => (
            <div key={r} className={`h-10 w-10 bg-muted rounded-ds-${r}`} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Spacing (ds-*)</h3>
        <div className="space-y-2">
          {['0','1','2','3','4','5','6','8','10','12','16','20','24','32'].map(s => (
            <div key={s} className={`bg-muted p-ds-${s}`}>p-ds-{s}</div>
          ))}
        </div>
      </div>
    </div>
  ),
};

