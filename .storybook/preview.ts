import type { Preview } from '@storybook/react';
import React from 'react';
import '../app/globals.css';
import { ThemeProvider } from '../components/ThemeProvider';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    actions: { argTypesRegex: '^on[A-Z].*' },
    a11y: {
      // Keep defaults; we can tweak later
    },
    layout: 'fullscreen', // Changed from 'centered' to match app layout
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  decorators: [
    (Story) => React.createElement(
      ThemeProvider,
      null,
      React.createElement(
        'div',
        { style: { minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' } },
        React.createElement(Story)
      )
    ),
  ],
};

export default preview;

