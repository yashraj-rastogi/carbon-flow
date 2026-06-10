import React from 'react';
import { render, screen } from '@testing-library/react';
import TelemetryPanel from '@/components/features/TelemetryPanel';
import type { TelemetryData } from '@/types';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

const defaultTelemetry: TelemetryData = {
  lastLatencyMs: null,
  totalPromptTokens: 0,
  totalOutputTokens: 0,
  flashCallsCount: 0,
  proCallsCount: 0,
  totalRequestsCount: 0,
};

describe('TelemetryPanel', () => {
  it('renders with default/zero telemetry values', () => {
    render(<TelemetryPanel telemetry={defaultTelemetry} />);
    expect(screen.getByText('System Telemetry Log')).toBeInTheDocument();
    expect(screen.getByText('0 ms')).toBeInTheDocument();
  });

  it('displays correct latency value', () => {
    render(<TelemetryPanel telemetry={{ ...defaultTelemetry, lastLatencyMs: 1234 }} />);
    expect(screen.getByText('1234 ms')).toBeInTheDocument();
  });

  it('displays correct token counts', () => {
    render(
      <TelemetryPanel
        telemetry={{
          ...defaultTelemetry,
          totalPromptTokens: 5000,
          totalOutputTokens: 1500,
        }}
      />
    );
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('6,500')).toBeInTheDocument(); // total
  });

  it('displays cascade ratio labels', () => {
    render(
      <TelemetryPanel
        telemetry={{
          ...defaultTelemetry,
          flashCallsCount: 8,
          proCallsCount: 2,
        }}
      />
    );
    expect(screen.getByText('8 Flash / 2 Pro')).toBeInTheDocument();
  });

  it('has accessible region role', () => {
    render(<TelemetryPanel telemetry={defaultTelemetry} />);
    expect(screen.getByRole('region', { name: /system telemetry/i })).toBeInTheDocument();
  });

  it('has accessible progressbar roles for cascade bars', () => {
    render(
      <TelemetryPanel
        telemetry={{
          ...defaultTelemetry,
          flashCallsCount: 7,
          proCallsCount: 3,
        }}
      />
    );
    const progressbars = screen.getAllByRole('progressbar');
    expect(progressbars.length).toBe(2);
  });
});
