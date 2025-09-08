import * as React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '../components/stat-card';

describe('StatCard', () => {
  it('renders value and delta', () => {
    render(
      <StatCard
        id="test"
        title="Test KPI"
        value="42%"
        delta={5}
        trend={[]}
      />
    );
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByLabelText(/up 5/)).toBeInTheDocument();
  });
});
