// @vitest-environment jsdom
/**
 * Tests de componente para InscripcionFormB.
 *
 * Valida:
 *   ★ Sugerencia auto-llena el concepto con "nombre apellido cédula".
 *   ★ Indicador en vivo: verde ✓ si concepto contiene nombre+cédula, rojo si falta.
 *   ★ Botón "Confirmar" deshabilitado si conceptoCheck.ok = false.
 *   ★ Monto Bs se calcula correctamente para categoría única vs ambas.
 *
 * Resultado esperado: 6/6 PASS.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InscripcionFormB from '@/components/copa2026/forms/InscripcionFormB';

const baseProps = {
  onBack: vi.fn(),
  onSubmit: vi.fn(),
  isLoading: false,
  tasaBcv: 515.18,
  costoUnaCategoria: 5,
  costoAmbasCategorias: 10,
  configPago: { banco: 'Banesco', cedula: 'J-123456789', telefono: '04141111111' },
  participante: {
    nombre: 'Juan',
    apellido: 'Pérez',
    cedulaIdentidad: 'V-12345678',
  },
};

describe('InscripcionFormB', () => {
  it('precarga el concepto sugerido con nombre + apellido + cédula', () => {
    render(<InscripcionFormB {...baseProps} categoria="RENDER" />);
    const input = screen.getByTestId('input-concepto') as HTMLInputElement;
    expect(input.value).toContain('Juan');
    expect(input.value).toContain('Pérez');
    expect(input.value).toContain('12345678');
  });

  it('muestra ✓ concepto válido cuando contiene nombre + cédula', () => {
    render(<InscripcionFormB {...baseProps} categoria="RENDER" />);
    expect(screen.getByTestId('concepto-ok')).toBeTruthy();
  });

  it('si el usuario borra la cédula del concepto, muestra error rojo', async () => {
    const user = userEvent.setup();
    render(<InscripcionFormB {...baseProps} categoria="RENDER" />);
    const input = screen.getByTestId('input-concepto');
    await user.clear(input);
    await user.type(input, 'Juan Pérez sin cedula');
    expect(screen.getByTestId('concepto-error').textContent).toMatch(/cédula/i);
  });

  it('si concepto inválido, el botón Confirmar queda disabled', async () => {
    const user = userEvent.setup();
    render(<InscripcionFormB {...baseProps} categoria="RENDER" />);
    const input = screen.getByTestId('input-concepto');
    await user.clear(input);
    await user.type(input, 'concepto basura');
    const btn = screen.getByTestId('submit-step-b') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('monto en USD muestra 5 si categoría es única (RENDER)', () => {
    render(<InscripcionFormB {...baseProps} categoria="RENDER" />);
    expect(screen.getByTestId('monto-usd').textContent).toContain('5.00');
    expect(screen.getByTestId('monto-bs').textContent).toContain((515.18 * 5).toFixed(2));
  });

  it('monto en USD muestra 10 si categoría es AMBAS', () => {
    render(<InscripcionFormB {...baseProps} categoria="AMBAS" />);
    expect(screen.getByTestId('monto-usd').textContent).toContain('10.00');
    expect(screen.getByTestId('monto-bs').textContent).toContain((515.18 * 10).toFixed(2));
  });
});
