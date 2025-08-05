'use client';

import * as theme from '@/styles/theme';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import React from 'react';

export default function DesignSystemPreview() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold mb-8">Campfire V2 Design System Preview</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Colors</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(theme.colors).map(([category, shades]) => (
            typeof shades === 'object' && shades !== null ? (
              Object.entries(shades).map(([shade, color]) => (
                <div key={`${category}-${shade}`} className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-md shadow-md" style={{ backgroundColor: color as string }} />
                  <p className="mt-2 text-sm">{category}-{shade}</p>
                </div>
              ))
            ) : (
              <div key={category} className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-md shadow-md" style={{ backgroundColor: shades as string }} />
                <p className="mt-2 text-sm">{category}</p>
              </div>
            )
          ))}
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Spacing</h2>
        <div className="space-y-4">
          {Object.entries(theme.spacing).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <div className="w-16 text-right pr-4">{key}</div>
              <div className="h-8 bg-primary" style={{ width: value as string }} />
              <div className="ml-4">{value}</div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Typography</h2>
        <div className="space-y-4">
          {Object.entries(theme.typography.fontSize).map(([key, value]) => (
            <p key={key} style={{ fontSize: value as string, lineHeight: theme.typography.lineHeight.normal }}>
              {key} ({value}): The quick brown fox jumps over the lazy dog.
            </p>
          ))}
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Components</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-xl mb-2">Buttons</h3>
            <div className="flex space-x-4">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl mb-2">Card</h3>
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description</CardDescription>
              </CardHeader>
              <CardContent>Card content</CardContent>
              <CardFooter>Card footer</CardFooter>
            </Card>
          </div>
          
          <div>
            <h3 className="text-xl mb-2">Badge</h3>
            <div className="flex space-x-4">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl mb-2">Avatar</h3>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </section>
    </div>
  );
}