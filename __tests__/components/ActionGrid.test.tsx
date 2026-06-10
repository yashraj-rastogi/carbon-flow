import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionGrid from '@/components/features/ActionGrid';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    li: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('li', props, children),
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}));

const mockActions = [
  {
    _id: 'action1',
    name: 'Set Thermostat -2°',
    category: 'gas',
    impactKg: -1.2,
    icon: 'Flame',
    description: 'Lower your thermostat by 2 degrees',
  },
  {
    _id: 'action2',
    name: 'Shortened Shower',
    category: 'water',
    impactKg: -0.4,
    icon: 'Droplet',
    description: 'Cut your shower time by 2 minutes',
  },
];

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

const defaultProps = {
  currentHabitStrength: 5,
  token: 'test-token',
  onActionLogged: jest.fn(),
  statusMessageSetter: jest.fn(),
};

describe('ActionGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ actions: mockActions }),
    });

    render(<ActionGrid {...defaultProps} />);
    expect(screen.getByText(/synching/i)).toBeInTheDocument();
  });

  it('renders action cards after fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ actions: mockActions }),
    });

    render(<ActionGrid {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Set Thermostat -2°')).toBeInTheDocument();
    });

    expect(screen.getByText('Shortened Shower')).toBeInTheDocument();
  });

  it('has accessible list structure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ actions: mockActions }),
    });

    render(<ActionGrid {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('has accessible log buttons with aria-labels', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ actions: mockActions }),
    });

    render(<ActionGrid {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /log completed action: set thermostat/i })
      ).toBeInTheDocument();
    });
  });

  it('calls API and callbacks when action is logged', async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ actions: mockActions }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          mdp: { reward: 15, currentStrength: 6 },
          carbonDeltaKg: -1.2,
        }),
      });

    render(<ActionGrid {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Set Thermostat -2°')).toBeInTheDocument();
    });

    const logButton = screen.getByRole('button', {
      name: /log completed action: set thermostat/i,
    });
    await user.click(logButton);

    await waitFor(() => {
      expect(defaultProps.onActionLogged).toHaveBeenCalled();
    });
  });
});
