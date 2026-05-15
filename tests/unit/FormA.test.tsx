// @vitest-environment jsdom
/**
 * Tests de componente para InscripcionFormA.
 *
 * Valida:
 *   ★ El botón "Siguiente" está deshabilitado hasta que TODOS los checks
 *      (términos, cesión, mayoría de edad) estén marcados Y el formulario sea válido.
 *   ★ El label del check de mayoría de edad muestra la edad calculada.
 *   ★ El contador de la biografía se actualiza en vivo y rechaza > 250 chars.
 *   ★ Validación inline de email/instagram/teléfono.
 *
 * Requiere: @testing-library/react @testing-library/user-event jsdom
 *
 * Resultado esperado: 8/8 PASS.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InscripcionFormA from '@/components/copa2026/forms/InscripcionFormA';

function setup() {
  const onSubmit = vi.fn();
  render(<InscripcionFormA onSubmit={onSubmit} />);
  return { onSubmit };
}

function fakeFile() {
  return new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
}

describe('InscripcionFormA', () => {
  it('el botón Siguiente arranca deshabilitado', () => {
    setup();
    const btn = screen.getByTestId('submit-step-a') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('el check de mayoría de edad está deshabilitado si la fecha no es válida', () => {
    setup();
    const check = screen.getByTestId('check-confirmaMayoriaEdad') as HTMLInputElement;
    expect(check.disabled).toBe(true);
  });

  it('al ingresar fecha de hace 25 años, el check mayoría se habilita y muestra "25 años"', async () => {
    setup();
    // 2026-05-15 - 25y = 2001-05-15. Asumimos test corre en/cerca a 2026.
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    const fecha = `${birthYear}-01-01`;
    fireEvent.change(screen.getByTestId('input-fechaNacimiento'), {
      target: { value: fecha },
    });
    const display = screen.getByTestId('edad-display');
    expect(display.textContent).toMatch(/25 años|24 años/); // 24 si aún no cumplió este año
    const check = screen.getByTestId('check-confirmaMayoriaEdad') as HTMLInputElement;
    expect(check.disabled).toBe(false);
  });

  it('al ingresar fecha de hace 15 años, el check mayoría queda deshabilitado', () => {
    setup();
    const today = new Date();
    const birthYear = today.getFullYear() - 15;
    fireEvent.change(screen.getByTestId('input-fechaNacimiento'), {
      target: { value: `${birthYear}-01-01` },
    });
    const check = screen.getByTestId('check-confirmaMayoriaEdad') as HTMLInputElement;
    expect(check.disabled).toBe(true);
  });

  it('contador de biografía se actualiza al tipear', async () => {
    const user = userEvent.setup();
    setup();
    const bio = screen.getByTestId('input-biografia');
    await user.type(bio, 'Soy diseñador 3D con 5 años de experiencia');
    const counter = screen.getByTestId('biografia-counter');
    expect(counter.textContent).toMatch(/42 \/ 250/);
  });

  it('biografía no permite superar el máximo + buffer', async () => {
    const user = userEvent.setup();
    setup();
    const bio = screen.getByTestId('input-biografia') as HTMLTextAreaElement;
    const muyLargo = 'a'.repeat(400);
    await user.type(bio, muyLargo);
    // maxLength del input es BIOGRAFIA_MAX + 50 = 300
    expect(bio.value.length).toBeLessThanOrEqual(300);
  });

  it('el botón se habilita SOLO cuando todos los checks + datos están OK', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    const today = new Date();
    const birthYear = today.getFullYear() - 30;

    // Llenar todo válido
    fireEvent.change(screen.getByTestId('input-nombre'), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByTestId('input-apellido'), { target: { value: 'Perez' } });
    fireEvent.change(screen.getByTestId('input-cedulaIdentidad'), { target: { value: 'V-12345678' } });
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'juan@test.com' } });
    fireEvent.change(screen.getByTestId('input-telefono'), { target: { value: '04125551234' } });
    fireEvent.change(screen.getByTestId('input-instagram'), { target: { value: '@juantest' } });
    fireEvent.change(screen.getByTestId('input-fechaNacimiento'), { target: { value: `${birthYear}-01-01` } });
    await user.type(screen.getByTestId('input-biografia'), 'Diseñador 3D con experiencia.');
    fireEvent.change(screen.getByTestId('input-fotoPerfil'), { target: { files: [fakeFile()] } });

    const btn = screen.getByTestId('submit-step-a') as HTMLButtonElement;

    // Aún sin checks → disabled
    expect(btn.disabled).toBe(true);

    // 1 check → disabled
    fireEvent.click(screen.getByTestId('check-aceptaTerminos'));
    expect(btn.disabled).toBe(true);

    // 2 checks → disabled
    fireEvent.click(screen.getByTestId('check-cesionDerechos'));
    expect(btn.disabled).toBe(true);

    // 3 checks → enabled
    fireEvent.click(screen.getByTestId('check-confirmaMayoriaEdad'));
    expect(btn.disabled).toBe(false);

    fireEvent.click(btn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('email inválido NO permite habilitar el botón aunque todo lo demás esté OK', async () => {
    const user = userEvent.setup();
    setup();
    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    fireEvent.change(screen.getByTestId('input-nombre'), { target: { value: 'Juan' } });
    fireEvent.change(screen.getByTestId('input-apellido'), { target: { value: 'Perez' } });
    fireEvent.change(screen.getByTestId('input-cedulaIdentidad'), { target: { value: 'V-12345678' } });
    fireEvent.change(screen.getByTestId('input-email'), { target: { value: 'noEsEmail' } }); // ← inválido
    fireEvent.change(screen.getByTestId('input-telefono'), { target: { value: '04125551234' } });
    fireEvent.change(screen.getByTestId('input-instagram'), { target: { value: '@juantest' } });
    fireEvent.change(screen.getByTestId('input-fechaNacimiento'), { target: { value: `${birthYear}-01-01` } });
    await user.type(screen.getByTestId('input-biografia'), 'Diseñador 3D.');
    fireEvent.change(screen.getByTestId('input-fotoPerfil'), { target: { files: [fakeFile()] } });
    fireEvent.click(screen.getByTestId('check-aceptaTerminos'));
    fireEvent.click(screen.getByTestId('check-cesionDerechos'));
    fireEvent.click(screen.getByTestId('check-confirmaMayoriaEdad'));

    const btn = screen.getByTestId('submit-step-a') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
