import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverdueTable } from '../components/overdue-table';

describe('OverdueTable', () => {
  const rows = [
    { id: '1', borrower: 'A', daysOverdue: 5, owner: 'X', severity: 'low' },
    { id: '2', borrower: 'B', daysOverdue: 10, owner: 'Y', severity: 'high' },
  ];
  it('sorts by Days Overdue', () => {
    render(
      <OverdueTable
        rows={rows}
        onOpen={() => {}}
        onAssign={() => {}}
        onSnooze={() => {}}
      />
    );
    const header = screen.getByText(/Days Overdue/);
    fireEvent.click(header);
    // After click, first row should be borrower A (5 days)
    expect(screen.getAllByText(/A|B/)[0]).toHaveTextContent('A');
    fireEvent.click(header);
    // After second click, first row should be borrower B (10 days)
    expect(screen.getAllByText(/A|B/)[0]).toHaveTextContent('B');
  });
});
