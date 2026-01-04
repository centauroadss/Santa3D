// lib/utils.ts - Funciones utilitarias
import { type ClassValue, clsx } from 'clsx';

// Combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Calcular edad a partir de fecha de nacimiento
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Formatear fecha
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Formatear fecha y hora
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calcular tiempo restante hasta una fecha
export function getTimeRemaining(deadline: Date | string): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const total = new Date(deadline).getTime() - new Date().getTime();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return {
    total,
    days,
    hours,
    minutes,
    seconds,
  };
}

// Formatear tamaño de archivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Validar si el concurso está activo
export function isContestActive(deadline: Date | string): boolean {
  return new Date() < new Date(deadline);
}

// Truncar texto
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Generar nombre de archivo sanitizado
export function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .toLowerCase();
}

// Calcular promedio
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

// Calcular desviación estándar
export function calculateStandardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const avg = calculateAverage(numbers);
  const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

// Generar ID aleatorio
export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
