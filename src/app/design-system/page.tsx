import { Metadata } from 'next';
import DesignSystemLayout from './_components/DesignSystemLayout';
import { DesignSystemOverview } from './_components/DesignSystemOverview';

export const metadata: Metadata = {
  title: 'Campfire Design System',
  description: 'Comprehensive design system for Campfire applications',
};

export default function DesignSystemPage() {
  return (
    <DesignSystemLayout>
      <DesignSystemOverview />
    </DesignSystemLayout>
  );
}
