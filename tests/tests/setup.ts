import { beforeEach, vi } from 'vitest';

// Cada test arranca con timers reales
beforeEach(() => {
  vi.useRealTimers();
});
