import { render, screen } from '@testing-library/react';
import { App } from '../App';

test('informa como configurar o banco quando não há ambiente', () => {
  render(<App />);
  expect(screen.getByText(/banco não conectado/i)).toBeInTheDocument();
});
