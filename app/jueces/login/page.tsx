'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface LoginForm {
  email: string;
  password?: string;
}

export default function JudgeLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // States for flow
  const [flowState, setFlowState] = useState<'EMAIL_ONLY' | 'EMAIL_VERIFIED' | 'PASSWORD_SETUP' | 'LOGIN'>('EMAIL_ONLY');
  const [judgeName, setJudgeName] = useState('');
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger
  } = useForm<LoginForm>();

  const emailValue = watch('email');

  const checkEmail = async () => {
    const isValid = await trigger('email');
    if (!isValid) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setRegistrationError(null);

      const response = await axios.post('/api/judges/check-auth-status', { email: emailValue });

      // Response: { exists: boolean, hasPassword: boolean, name: string }
      const { exists, hasPassword, name, message } = response.data;

      if (!exists) {
        setRegistrationError(message || 'Email no coincide con el suministrado para su registro como jurado.');
        setFlowState('EMAIL_ONLY');
      } else {
        setJudgeName(name);
        if (!hasPassword) {
          setFlowState('PASSWORD_SETUP');
        } else {
          setFlowState('LOGIN');
        }
      }

    } catch (err: any) {
      console.error(err);
      setError('Error al validar el email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    if (flowState === 'EMAIL_ONLY') {
      await checkEmail();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let response;

      if (flowState === 'PASSWORD_SETUP') {
        // Registro de password
        response = await axios.post('/api/judges/setup-password', {
          email: data.email,
          password: data.password
        });
      } else {
        // Login normal
        response = await axios.post('/api/judges/login', data);
      }

      if (response.data.success) {
        // Guardar token en localStorage
        localStorage.setItem('judge_token', response.data.data.token);
        localStorage.setItem('judge_name', response.data.data.judge.nombre);

        // Redirigir al panel
        router.push('/jueces/panel');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al iniciar sesión'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFlowState('EMAIL_ONLY');
    setRegistrationError(null);
    setError(null);
  }

  const handleRequestReset = async () => {
    const email = watch('email');
    if (!email) {
      setError('Por favor ingresa tu email primero.');
      return;
    }

    if (!confirm(`¿Deseas solicitar al administrador el restablecimiento de tu contraseña para ${email}?`)) return;

    try {
      setIsSubmitting(true);
      const res = await axios.post('/api/judges/request-reset', { email });
      alert(res.data.message);
    } catch (err) {
      alert('Hubo un error enviando la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-purple via-purple-600 to-brand-orange flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👨‍⚖️ Panel de Jueces</h1>
          <p className="text-white/80">Concurso Santa 3D Venezolano</p>
        </div>

        <Card title={flowState === 'PASSWORD_SETUP' ? "Crear Contraseña" : "Panel de Evaluación para Jueces"}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {registrationError && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg text-sm font-medium">
                {registrationError}
              </div>
            )}

            {/* Email Field - Always Visible but Disabled if verified */}
            <div className={`transition-all duration-300 ${flowState !== 'EMAIL_ONLY' ? 'opacity-70' : ''}`}>
              <Input
                label="Email Corporativo"
                type="email"
                {...register('email', { required: 'Email es requerido' })}
                error={errors.email?.message}
                placeholder="juez@ejemplo.com"
                disabled={flowState !== 'EMAIL_ONLY'}
              />
            </div>

            {flowState !== 'EMAIL_ONLY' && (
              <div className="text-center -mt-4 mb-4">
                <p className="text-sm text-green-600 font-bold mb-2">
                  Bienvenido(a), {judgeName}
                </p>
                <button type="button" onClick={handleReset} className="text-xs text-brand-purple hover:underline">
                  Cambiar cuenta
                </button>
              </div>
            )}

            {/* Password Field - Conditionall Rendered */}
            {flowState !== 'EMAIL_ONLY' && (
              <div className="relative animate-in fade-in slide-in-from-top-4 duration-300">
                <Input
                  label={flowState === 'PASSWORD_SETUP' ? "Cree su Contraseña" : "Contraseña"}
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Contraseña es requerida' })}
                  error={errors.password?.message}
                  placeholder={flowState === 'PASSWORD_SETUP' ? "Mínimo 6 caracteres" : "••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                {flowState === 'PASSWORD_SETUP' && (
                  <p className="text-xs text-gray-500 mt-1">Establezca una contraseña segura para su cuenta.</p>
                )}
              </div>
            )}

            {flowState === 'LOGIN' && (
              <div className="flex justify-end -mt-4 mb-2">
                <button
                  type="button"
                  onClick={handleRequestReset}
                  className="text-xs text-brand-purple hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {flowState === 'EMAIL_ONLY' ? 'Continuar' : (flowState === 'PASSWORD_SETUP' ? 'Registrar y Entrar' : 'Ingresar')}
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white transition-colors"
          >
            ← Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
