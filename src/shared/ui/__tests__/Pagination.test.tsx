import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders correctly for single page', () => {
    render(<Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />);

    expect(screen.getByLabelText('Primeira página')).toBeDisabled();
    expect(screen.getByLabelText('Página anterior')).toBeDisabled();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Próxima página')).toBeDisabled();
    expect(screen.getByLabelText('Última página')).toBeDisabled();
  });

  it('renders correctly for first page of multiple pages', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);

    // On page 1, "Primeira página" is disabled (already there)
    expect(screen.getByLabelText('Primeira página')).toBeDisabled();
    expect(screen.getByLabelText('Página anterior')).toBeDisabled();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    // Last page is visible
    expect(screen.getByLabelText('Última página')).not.toBeDisabled();
    expect(screen.getByLabelText('Próxima página')).not.toBeDisabled();
  });

  it('renders correctly for middle page', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={() => {}} />);

    // On middle page, all navigation buttons are enabled
    expect(screen.getByLabelText('Primeira página')).not.toBeDisabled();
    expect(screen.getByLabelText('Página anterior')).not.toBeDisabled();
    expect(screen.getByLabelText('Última página')).not.toBeDisabled();
    expect(screen.getByLabelText('Próxima página')).not.toBeDisabled();
  });

  it('calls onPageChange when clicking next', () => {
    const mockOnPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={3} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByLabelText('Próxima página'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when clicking previous', () => {
    const mockOnPageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={3} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByLabelText('Página anterior'));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange when clicking first page', () => {
    const mockOnPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByLabelText('Primeira página'));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onPageChange when clicking last page', () => {
    const mockOnPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    fireEvent.click(screen.getByLabelText('Última página'));
    expect(mockOnPageChange).toHaveBeenCalledWith(5);
  });
});