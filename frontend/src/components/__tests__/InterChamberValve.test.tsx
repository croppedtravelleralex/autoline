import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InterChamberValve } from '../InterChamberValve';

describe('InterChamberValve', () => {
    it('renders correctly', () => {
        render(<InterChamberValve isOpen={false} state="closed" onClick={() => { }} />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<InterChamberValve isOpen={false} state="closed" onClick={handleClick} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies correct styles when open', () => {
        const { container } = render(<InterChamberValve isOpen={true} state="open" onClick={() => { }} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('text-emerald-500');
    });

    it('applies correct styles when moving', () => {
        const { container } = render(<InterChamberValve isOpen={false} state="opening" onClick={() => { }} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('text-amber-500');
    });
});
