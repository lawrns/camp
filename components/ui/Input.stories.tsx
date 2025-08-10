import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  args: { placeholder: 'Type here', 'aria-label': 'Example input' as unknown as string },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = { args: {} };
export const Disabled: Story = { args: { disabled: true } };

