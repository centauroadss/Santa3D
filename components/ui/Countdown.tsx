// components/ui/Countdown.tsx
'use client';

import { useState, useEffect } from 'react';
import { getTimeRemaining } from '@/lib/utils';

interface CountdownProps {
  deadline: string | Date;
}

export default function Countdown({ deadline }: CountdownProps) {
  /* eslint-disable react-hooks/exhaustive-deps */
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof getTimeRemaining> | null>(null);

  useEffect(() => {
    // Calcular tiempo inmediatamente al montar en el cliente
    setTimeRemaining(getTimeRemaining(deadline));

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(deadline);
      setTimeRemaining(remaining);

      if (remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  // Evitar renderizado en el servidor para prevenir Hydration Mismatch
  if (!timeRemaining) {
    return (
      <div className="grid grid-cols-4 gap-4 text-center animate-pulse opacity-50">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 p-4 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (timeRemaining.total <= 0) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg border-2 border-red-200">
        <p className="text-xl font-bold text-red-600">⏰ Concurso Finalizado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      <div className="bg-gradient-to-br from-brand-purple to-purple-600 text-white p-4 rounded-lg shadow-lg">
        <div className="text-3xl font-bold">{timeRemaining.days}</div>
        <div className="text-sm opacity-90">Días</div>
      </div>
      <div className="bg-gradient-to-br from-brand-orange to-orange-600 text-white p-4 rounded-lg shadow-lg">
        <div className="text-3xl font-bold">{timeRemaining.hours}</div>
        <div className="text-sm opacity-90">Horas</div>
      </div>
      <div className="bg-gradient-to-br from-purple-600 to-brand-purple text-white p-4 rounded-lg shadow-lg">
        <div className="text-3xl font-bold">{timeRemaining.minutes}</div>
        <div className="text-sm opacity-90">Minutos</div>
      </div>
      <div className="bg-gradient-to-br from-orange-600 to-brand-orange text-white p-4 rounded-lg shadow-lg">
        <div className="text-3xl font-bold">{timeRemaining.seconds}</div>
        <div className="text-sm opacity-90">Segundos</div>
      </div>
    </div>
  );
}
