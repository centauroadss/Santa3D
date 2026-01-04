'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ParticipantRegistrationInput } from '@/lib/validations';
interface RegistrationFormProps {
  onSuccess: (data: any) => void;
}
export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ParticipantRegistrationInput>();
  const onSubmit = async (data: ParticipantRegistrationInput) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const response = await axios.post('/api/participants/register', data);
      if (response.data.success) {
        onSuccess(response.data.data);
      }
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(
        err.response?.data?.message ||
        'Error al registrarse. Por favor, intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="Nombre"
          {...register('nombre', {
            required: 'El nombre es requerido',
            minLength: { value: 2, message: 'Mínimo 2 caracteres' },
          })}
          error={errors.nombre?.message}
          placeholder="Juan"
        />
        <Input
          label="Apellido"
          {...register('apellido', {
            required: 'El apellido es requerido',
            minLength: { value: 2, message: 'Mínimo 2 caracteres' },
          })}
          error={errors.apellido?.message}
          placeholder="Pérez"
        />
      </div>
      <Input
        label="Alias / Nombre Artístico"
        {...register('alias')}
        error={errors.alias?.message}
        placeholder="juanp3d"
        helperText="El nombre que aparecerá en el concurso"
      />
      <Input
        label="Email"
        type="email"
        {...register('email', {
          required: 'El email es requerido',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Email inválido',
          },
        })}
        error={errors.email?.message}
        placeholder="juan@example.com"
      />
      <Input
        label="Teléfono"
        type="tel"
        {...register('telefono', {
          required: 'El teléfono es requerido',
          pattern: {
            value: /^\+?[0-9]{10,14}$/,
            message: 'Formato inválido. Ej: +584121234567',
          },
        })}
        error={errors.telefono?.message}
        placeholder="+584121234567"
        helperText="Incluye código de país (+58)"
      />
      <Input
        label="Instagram"
        {...register('instagram', {
          required: 'El Instagram es requerido',
          pattern: {
            value: /^@[\w.]+$/,
            message: 'Debe comenzar con @ (Ej: @juanp3d)',
          },
        })}
        error={errors.instagram?.message}
        placeholder="@juanp3d"
      />
      <Input
        label="Fecha de Nacimiento"
        type="date"
        {...register('fechaNacimiento', {
          required: 'La fecha de nacimiento es requerida',
          validate: (value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            return age >= 18 || 'Debes ser mayor de 18 años';
          },
        })}
        error={errors.fechaNacimiento?.message}
        helperText="Debes ser mayor de 18 años"
      />
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('aceptaTerminos', {
              required: 'Debes aceptar los términos y condiciones',
            })}
            className="mt-1 h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">
            Acepto los{' '}
            <a href="/condiciones" className="text-brand-purple underline" target="_blank">
              términos y condiciones
            </a>{' '}
            del concurso
            {errors.aceptaTerminos && (
              <span className="block text-red-600 mt-1">{errors.aceptaTerminos.message}</span>
            )}
          </span>
        </label>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('sigueCuenta', {
              required: 'Debes seguir la cuenta @centauroads',
            })}
            className="mt-1 h-5 w-5 text-brand-purple focus:ring-brand-purple border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">
            Confirmo que sigo a{' '}
            <a
              href="https://instagram.com/centauroads"
              className="text-brand-purple underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              @centauroads
            </a>{' '}
            en Instagram
            {errors.sigueCuenta && (
              <span className="block text-red-600 mt-1">{errors.sigueCuenta.message}</span>
            )}
          </span>
        </label>
      </div>
      <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
        {isSubmitting ? 'Registrando...' : '🚀 Registrarse y Continuar'}
      </Button>
    </form>
  );
}
