// components/judges/EvaluationForm.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { EvaluationInput } from '@/lib/validations';
interface EvaluationFormProps {
  videoId: string;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any; // Evaluation data for editing
}
interface Criterion {
  id: string;
  nombre: string;
  descripcion: string;
  peso: number;
  puntajeMaximo: number;
}
export default function EvaluationForm({ videoId, token, onSuccess, onCancel, initialData }: EvaluationFormProps) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<any>();
  useEffect(() => {
    // Cargar criterios de evaluación
    const fetchCriteria = async () => {
      try {
        // Fetch dynamic criteria from API
        const response = await axios.get('/api/admin/criteria', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setCriteria(response.data.data);
        } else {
          console.error('Failed to load criteria');
        }
        // Si hay datos iniciales (Edit Mode), poblar el formulario
        if (initialData) {
          setValue('observacionesGenerales', initialData.observacionesGenerales || '');
          const scores = initialData.criterionScores || [];
          // If we have initial data, we can rebuild the criteria list from it to ensure IDs match!
          if (scores.length > 0) {
            const criteriaFromEval = scores.map((cs: any) => ({
              id: cs.criterionId,
              nombre: cs.criterion.nombre,
              descripcion: cs.criterion.descripcion || '',
              peso: cs.criterion.peso,
              puntajeMaximo: cs.criterion.puntajeMaximo
            })).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre)); // Ensure order
            setCriteria(criteriaFromEval);
            // Populate values
            scores.forEach((cs: any) => {
              setValue(`score_${cs.criterionId}`, cs.puntaje);
            });
          }
        }
      } catch (err) {
        console.error('Error loading criteria:', err);
      }
    };
    fetchCriteria();
  }, [initialData, setValue]);
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const scores = criteria.map(criterion => ({
        criterionId: criterion.id,
        score: parseFloat(data[`score_${criterion.id}`]),
        observaciones: data[`obs_${criterion.id}`] || undefined,
      }));
      const payload: EvaluationInput = {
        videoId,
        scores,
        observacionesGenerales: data.observacionesGenerales || undefined,
      };
      await axios.post('/api/judges/evaluate', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onSuccess();
    } catch (err: any) {
      console.error('Error submitting evaluation:', err);
      setError(
        err.response?.data?.message ||
        'Error al enviar evaluación. Por favor, intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const calculateTotal = () => {
    let total = 0;
    criteria.forEach(criterion => {
      const value = watch(`score_${criterion.id}`);
      if (value) {
        total += parseFloat(value);
      }
    });
    return total.toFixed(1);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {/* Puntaje Total */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-brand-purple to-brand-orange text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Puntaje Total:</span>
          <span className="text-3xl font-bold">{calculateTotal()} / 100</span>
        </div>
      </div>
      {/* Criterios de Evaluación - Layout Compacto */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header de la Tabla */}
        <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50 p-4 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-7">Criterio de Evaluación</div>
          <div className="col-span-2 text-center border-l border-gray-200">Peso</div>
          <div className="col-span-3 text-center border-l border-gray-200">Puntaje</div>
        </div>
        <div className="divide-y divide-gray-100">
          {criteria.map((criterion, index) => (
            <div key={criterion.id} className="grid md:grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
              {/* Info Criterio */}
              <div className="col-span-7">
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{criterion.nombre}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{criterion.descripcion}</p>
                  </div>
                </div>
              </div>
              {/* Columna Peso */}
              <div className="col-span-2 text-center flex flex-col justify-center items-center">
                <span className="text-lg font-bold text-gray-400">{criterion.peso}%</span>
                <span className="text-[10px] text-gray-400 uppercase">Ponderación</span>
              </div>
              {/* Input Puntaje */}
              <div className="col-span-3 flex items-center justify-end">
                <div className="relative w-full">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={criterion.puntajeMaximo}
                    onInput={(e) => {
                      const input = e.currentTarget;
                      let val = parseInt(input.value);
                      // Forzar enteros
                      if (input.value.includes('.')) {
                        input.value = Math.floor(parseFloat(input.value)).toString();
                      }
                      // Clamp entre 0 y Max
                      if (val > criterion.puntajeMaximo) input.value = criterion.puntajeMaximo.toString();
                      if (val < 0) input.value = "0";
                    }}
                    onKeyDown={(e) => {
                      // Prevenir escritura de decimales y símbolos no numéricos
                      if (e.key === '.' || e.key === ',' || e.key === '-' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    {...register(`score_${criterion.id}`, {
                      required: 'Requerido',
                      min: { value: 0, message: 'Min 0' },
                      max: { value: criterion.puntajeMaximo, message: `Máximo ${criterion.puntajeMaximo}` },
                      valueAsNumber: true,
                      validate: (value) => Number.isInteger(value) || "Debe ser entero"
                    })}
                    className={`w-full text-right font-mono font-bold text-xl p-3 pr-12 rounded-lg border-2 focus:ring-4 focus:ring-brand-purple/20 outline-none transition-all ${errors[`score_${criterion.id}`]
                      ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500'
                      : 'border-gray-200 bg-white focus:border-brand-purple text-gray-900'
                      }`}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none bg-transparent">
                    / {criterion.puntajeMaximo}
                  </span>
                </div>
              </div>
              {/* Mobile Error Message */}
              {errors[`score_${criterion.id}`] && (
                <div className="md:col-span-12 text-xs text-red-600 text-right w-full mt-1 font-bold">
                  ⚠️ {errors[`score_${criterion.id}`]?.message as string}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Observaciones Generales */}
      <div className="card">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Observaciones Generales (opcional)
        </label>
        <textarea
          {...register('observacionesGenerales')}
          rows={4}
          className="input-field resize-none"
          placeholder="Comentarios generales sobre el video..."
        />
      </div>
      {/* Actions */}
      <div className="flex gap-4 sticky bottom-0 bg-white p-4 border-t border-gray-200 -mx-6 -mb-6">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isSubmitting}
        >
          {isSubmitting ? 'Guardando...' : '✅ Guardar Evaluación'}
        </Button>
      </div>
    </form>
  );
}
