import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusLED } from '../ChamberCard';

describe('StatusLED', () => {
    it('renders with label', () => {
        render(<StatusLED active={false} label="Test LED" />);
        expect(screen.getByText('Test LED')).toBeInTheDocument();
    });

    it('shows active color', () => {
        const { container } = render(<StatusLED active={true} label="Active" />);
        // first div inside the wrapper
        const led = container.firstChild?.firstChild;
        expect(led).toHaveClass('bg-emerald-500');
    });

    it('shows error color', () => {
        const { container } = render(<StatusLED active={false} error={true} label="Error" />);
        const led = container.firstChild?.firstChild;
        expect(led).toHaveClass('bg-red-500');
    });

    it('handles click', () => {
        const handleClick = vi.fn();
        render(<StatusLED active={false} label="Click" onClick={handleClick} />);
        fireEvent.click(screen.getByText('Click'));
        expect(handleClick).toHaveBeenCalled();
    });
});
