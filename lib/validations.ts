import { z } from 'zod';
// ==========================================
// REGISTRO DE PARTICIPANTES
// ==========================================
export const participantRegistrationSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(50),
  apellido: z.string().min(2, 'Apellido debe tener al menos 2 caracteres').max(50),
  alias: z.string().max(50).optional(),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  instagram: z.string().regex(/^@[\w.]+$/, 'Instagram debe comenzar con @ y contener solo letras, números, puntos y guiones bajos'),
  
  fechaNacimiento: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    // Ajuste simple de edad, suficiente para validación rápida
    return age >= 18;
  }, 'Debes ser mayor de 18 años'),
  // CORRECCIÓN CRÍTICA: Pre-procesar input para asegurar salida BOOLEAN pura
  aceptaTerminos: z.preprocess((val) => val === true || val === 'true', z.boolean().refine(val => val === true, 'Debes aceptar los términos')),
  sigueCuenta: z.preprocess((val) => val === true || val === 'true', z.boolean().refine(val => val === true, 'Debes seguir la cuenta')),
});
export type ParticipantRegistrationInput = z.infer<typeof participantRegistrationSchema>;
// ==========================================
// URL PRE-FIRMADA
// ==========================================
export const presignedUrlRequestSchema = z.object({
  fileName: z.string().regex(/^[\w.-]+$/i, 'Nombre de archivo inválido. Solo letras, números, guiones y puntos.'),
  fileType: z.enum(['video/mp4', 'video/quicktime'], {
    errorMap: () => ({ message: 'Tipo de archivo debe ser video/mp4 o video/quicktime' }),
  }),
  fileSize: z.number().max(524288000, 'Archivo no puede superar 500MB'),
});
export type PresignedUrlRequestInput = z.infer<typeof presignedUrlRequestSchema>;
// ==========================================
// CONFIRMACIÓN DE VIDEO (Con Metadatos)
// ==========================================
export const videoConfirmSchema = z.object({
  videoId: z.string().cuid(),
  fileName: z.string(),
  duration: z.number().optional(),
  resolution: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
});
export type VideoConfirmInput = z.infer<typeof videoConfirmSchema>;
// ==========================================
// LOGIN DE JUEZ
// ==========================================
export const judgeLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});
export type JudgeLoginInput = z.infer<typeof judgeLoginSchema>;
// ==========================================
// EVALUACIÓN DE JUEZ
// ==========================================
export const evaluationSchema = z.object({
  videoId: z.string().cuid(),
  scores: z.array(
    z.object({
      criterionId: z.string().cuid(),
      score: z.number().min(0).max(20),
      observaciones: z.string().optional(),
    })
  ).min(1, 'Debe incluir al menos un criterio de evaluación'),
  observacionesGenerales: z.string().optional(),
});
export type EvaluationInput = z.infer<typeof evaluationSchema>;
// ==========================================
// LOGIN DE ADMIN
// ==========================================
export const adminLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
// ==========================================
// UTILIDADES DE VALIDACIÓN
// ==========================================
export interface VideoValidationResult {
  format: string;
  resolution: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec: string;
  isValid: boolean;
  errors: string[];
}
export function validateVideoSpecs(metadata: any): VideoValidationResult {
  const errors: string[] = [];
  const validFormats = ['mp4', 'mov', 'quicktime'];
  if (!validFormats.includes(metadata.format?.toLowerCase())) {
    errors.push(`Formato inválido: ${metadata.format}. Debe ser MP4 o MOV.`);
  }
  return {
    format: metadata.format,
    resolution: `${metadata.width}x${metadata.height}`,
    width: metadata.width,
    height: metadata.height,
    duration: metadata.duration,
    fps: metadata.fps,
    codec: metadata.codec,
    isValid: errors.length === 0,
    errors,
  };
}
