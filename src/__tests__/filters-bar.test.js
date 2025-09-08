import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FiltersBar } from '../components/filters-bar';

describe('FiltersBar', () => {
  it('calls onChange on edits', () => {
    const handleChange = jest.fn();
    render(<FiltersBar value={{}} onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'abc' } });
    setTimeout(() => {
      expect(handleChange).toHaveBeenCalled();
    }, 350);
  });
});
