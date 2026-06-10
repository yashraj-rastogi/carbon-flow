import React from 'react';
import { render, screen } from '@testing-library/react';
import Odometer from '@/components/ui/Odometer';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('span', props, children),
  },
}));

describe('Odometer', () => {
  it('renders the correct aria-label for the numeric value', () => {
    render(<Odometer value={42.5} />);
    const element = screen.getByRole('text');
    expect(element).toHaveAttribute('aria-label', '42.5 kilograms');
  });

  it('renders with value 0', () => {
    render(<Odometer value={0} />);
    const element = screen.getByRole('text');
    expect(element).toHaveAttribute('aria-label', '0.0 kilograms');
  });

  it('renders the decimal point', () => {
    render(<Odometer value={3.7} />);
    expect(screen.getByText('.')).toBeInTheDocument();
  });

  it('formats value to 1 decimal place', () => {
    render(<Odometer value={123.456} />);
    const element = screen.getByRole('text');
    expect(element).toHaveAttribute('aria-label', '123.5 kilograms');
  });
});
