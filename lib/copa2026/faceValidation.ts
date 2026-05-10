interface FaceValidationResult {
  isValid: boolean;
  reason?: string;
}

export async function validateProfilePhoto(base64Image: string): Promise<FaceValidationResult> {
  // Nota: La validación de rostro basada en Anthropic ha sido removida
  // para evitar dependencias externas. Se asume como válido por defecto, 
  // y será revisado manualmente en el administrador si es necesario.
  
  return { 
    isValid: true,
    reason: "Validación de rostro delegada a revisión manual." 
  };
}
