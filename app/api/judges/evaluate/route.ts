// app/api/judges/evaluate/route.ts - Evaluar un video
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { evaluationSchema } from '@/lib/validations';
export async function POST(request: NextRequest) {
  try {
    // Autenticar juez
    const user = await authenticateRequest(request);
    if (!user || user.role !== 'JUDGE') {
      return NextResponse.json(
        { success: false, error: 'UNAUTHORIZED', message: 'No autorizado' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const validatedData = evaluationSchema.parse(body);
    // Verificar que el video existe y está validado
    const video = await prisma.video.findUnique({
      where: { id: validatedData.videoId },
    });
    if (!video) {
      return NextResponse.json(
        { success: false, error: 'VIDEO_NOT_FOUND', message: 'Video no encontrado' },
        { status: 404 }
      );
    }
    if (video.status !== 'VALIDATED') {
      return NextResponse.json(
        { success: false, error: 'VIDEO_NOT_VALIDATED', message: 'El video no está validado para evaluación' },
        { status: 400 }
      );
    }
    // Verificar si ya existe evaluación para actualizarla o crear una nueva
    const existingEvaluation = await prisma.evaluation.findUnique({
      where: {
        videoId_judgeId: {
          videoId: validatedData.videoId,
          judgeId: user.id,
        },
      },
      include: { criterionScores: true }
    });
    const puntajeTotal = validatedData.scores.reduce((sum, score) => sum + score.score, 0);
    let evaluation;
    if (existingEvaluation) {
      // ACTUALIZAR (EDITAR)
      evaluation = await prisma.$transaction(async (tx) => {
        await tx.evaluation.update({
          where: { id: existingEvaluation.id },
          data: {
            observacionesGenerales: validatedData.observacionesGenerales,
            puntajeTotal,
            evaluatedAt: new Date(),
          }
        });
        for (const cs of existingEvaluation.criterionScores) {
          await tx.criterionScore.delete({ where: { id: cs.id } });
        }
        await tx.criterionScore.createMany({
          data: validatedData.scores.map(score => ({
            evaluationId: existingEvaluation.id,
            criterionId: score.criterionId,
            puntaje: score.score,
            observaciones: score.observaciones,
          }))
        });
        return await tx.evaluation.findUnique({
          where: { id: existingEvaluation.id },
          include: { criterionScores: { include: { criterion: true } } }
        });
      });
    } else {
      // CREAR (NUEVO)
      evaluation = await prisma.evaluation.create({
        data: {
          videoId: validatedData.videoId,
          judgeId: user.id,
          observacionesGenerales: validatedData.observacionesGenerales,
          puntajeTotal,
          criterionScores: {
            create: validatedData.scores.map(score => ({
              criterionId: score.criterionId,
              puntaje: score.score,
              observaciones: score.observaciones,
            })),
          },
        },
        include: {
          criterionScores: {
            include: {
              criterion: true,
            },
          },
        },
      });
    }
    // 🔥 FIX: Validación explícita para calmar a TypeScript
    if (!evaluation) {
      throw new Error('Error crítico: La evaluación no pudo ser procesada.');
    }
    return NextResponse.json(
      {
        success: true,
        data: {
          evaluationId: evaluation.id,
          videoId: evaluation.videoId,
          totalScore: evaluation.puntajeTotal,
          criteriaScores: evaluation.criterionScores.map(score => ({
            criterionName: score.criterion.nombre,
            score: score.puntaje,
            maxScore: score.criterion.puntajeMaximo,
            observaciones: score.observaciones,
          })),
          evaluatedAt: evaluation.evaluatedAt,
        },
        message: 'Evaluación guardada exitosamente',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating evaluation:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'INTERNAL_SERVER_ERROR', message: 'Error al guardar evaluación' },
      { status: 500 }
    );
  }
}
