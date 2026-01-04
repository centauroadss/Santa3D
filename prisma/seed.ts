// prisma/seed.ts - Script para poblar datos iniciales
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional - comentar en producción)
  // await prisma.criterionScore.deleteMany();
  // await prisma.evaluation.deleteMany();
  // await prisma.video.deleteMany();
  // await prisma.participant.deleteMany();
  // await prisma.evaluationCriterion.deleteMany();
  // await prisma.judge.deleteMany();
  // await prisma.admin.deleteMany();
  // await prisma.contestSetting.deleteMany();

  // ============================================
  // CREAR ADMINISTRADOR
  // ============================================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@centauroads.com' },
    update: {},
    create: {
      nombre: 'Administrador Centauro',
      email: 'admin@centauroads.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin creado:', admin.email);

  // ============================================
  // CREAR JUECES
  // ============================================
  const judgePassword = await bcrypt.hash('password123', 10);
  const judges = await Promise.all([
    prisma.judge.upsert({
      where: { email: 'juez1@centauroads.com' },
      update: {},
      create: {
        nombre: 'María González',
        email: 'juez1@centauroads.com',
        password: judgePassword,
        role: 'JUDGE',
      },
    }),
    prisma.judge.upsert({
      where: { email: 'juez2@centauroads.com' },
      update: {},
      create: {
        nombre: 'Carlos Ramírez',
        email: 'juez2@centauroads.com',
        password: judgePassword,
        role: 'JUDGE',
      },
    }),
    prisma.judge.upsert({
      where: { email: 'juez3@centauroads.com' },
      update: {},
      create: {
        nombre: 'Ana Martínez',
        email: 'juez3@centauroads.com',
        password: judgePassword,
        role: 'JUDGE',
      },
    }),
    prisma.judge.upsert({
      where: { email: 'juez4@centauroads.com' },
      update: {},
      create: {
        nombre: 'Luis Hernández',
        email: 'juez4@centauroads.com',
        password: judgePassword,
        role: 'JUDGE',
      },
    }),
    prisma.judge.upsert({
      where: { email: 'juez5@centauroads.com' },
      update: {},
      create: {
        nombre: 'Carmen Rodríguez',
        email: 'juez5@centauroads.com',
        password: judgePassword,
        role: 'JUDGE',
      },
    }),
  ]);
  console.log('✅ Jueces creados:', judges.length);

  // ============================================
  // CREAR CRITERIOS DE EVALUACIÓN
  // ============================================
  const criteria = await Promise.all([
    prisma.evaluationCriterion.upsert({
      where: { id: 'criterion1' },
      update: {},
      create: {
        id: 'criterion1',
        nombre: 'Creatividad y Originalidad',
        descripcion: 'Evalúa la creatividad del concepto y la originalidad de la propuesta',
        peso: 20.0,
        puntajeMaximo: 20.0,
        orden: 1,
      },
    }),
    prisma.evaluationCriterion.upsert({
      where: { id: 'criterion2' },
      update: {},
      create: {
        id: 'criterion2',
        nombre: 'Calidad Técnica 3D',
        descripcion: 'Evalúa la calidad del modelado, texturizado, iluminación y renderizado 3D',
        peso: 20.0,
        puntajeMaximo: 20.0,
        orden: 2,
      },
    }),
    prisma.evaluationCriterion.upsert({
      where: { id: 'criterion3' },
      update: {},
      create: {
        id: 'criterion3',
        nombre: 'Impacto Visual',
        descripcion: 'Evalúa el impacto visual y la capacidad de captar la atención en pantalla grande',
        peso: 20.0,
        puntajeMaximo: 20.0,
        orden: 3,
      },
    }),
    prisma.evaluationCriterion.upsert({
      where: { id: 'criterion4' },
      update: {},
      create: {
        id: 'criterion4',
        nombre: 'Identidad Cultural Venezolana',
        descripcion: 'Evalúa qué tan bien representa elementos y tradiciones venezolanas',
        peso: 20.0,
        puntajeMaximo: 20.0,
        orden: 4,
      },
    }),
    prisma.evaluationCriterion.upsert({
      where: { id: 'criterion5' },
      update: {},
      create: {
        id: 'criterion5',
        nombre: 'Storytelling y Narrativa',
        descripcion: 'Evalúa la narrativa y la capacidad de contar una historia en 15-20 segundos',
        peso: 20.0,
        puntajeMaximo: 20.0,
        orden: 5,
      },
    }),
  ]);
  console.log('✅ Criterios de evaluación creados:', criteria.length);

  // ============================================
  // CREAR CONFIGURACIÓN DEL CONCURSO
  // ============================================
  await prisma.contestSetting.upsert({
    where: { key: 'contest_name' },
    update: { value: 'Concurso Santa 3D Venezolano' },
    create: {
      key: 'contest_name',
      value: 'Concurso Santa 3D Venezolano',
    },
  });

  await prisma.contestSetting.upsert({
    where: { key: 'submission_deadline' },
    update: { value: '2024-12-26T23:59:59Z' },
    create: {
      key: 'submission_deadline',
      value: '2024-12-26T23:59:59Z',
    },
  });

  await prisma.contestSetting.upsert({
    where: { key: 'winner_announcement' },
    update: { value: '2024-12-30T12:00:00Z' },
    create: {
      key: 'winner_announcement',
      value: '2024-12-30T12:00:00Z',
    },
  });

  await prisma.contestSetting.upsert({
    where: { key: 'prize_amount' },
    update: { value: '$600 USD' },
    create: {
      key: 'prize_amount',
      value: '$600 USD',
    },
  });

  await prisma.contestSetting.upsert({
    where: { key: 'prize_description' },
    update: { value: 'Pantalla outdoor 10 metros - Chacao, Caracas' },
    create: {
      key: 'prize_description',
      value: 'Pantalla outdoor 10 metros - Chacao, Caracas',
    },
  });

  console.log('✅ Configuración del concurso creada');

  console.log('');
  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('📝 Credenciales creadas:');
  console.log('');
  console.log('👨‍💼 ADMIN:');
  console.log('   Email: admin@centauroads.com');
  console.log('   Password: admin123');
  console.log('');
  console.log('👨‍⚖️ JUECES:');
  console.log('   Email: juez1@centauroads.com | Password: password123');
  console.log('   Email: juez2@centauroads.com | Password: password123');
  console.log('   Email: juez3@centauroads.com | Password: password123');
  console.log('   Email: juez4@centauroads.com | Password: password123');
  console.log('   Email: juez5@centauroads.com | Password: password123');
  console.log('');
  console.log('⚠️  IMPORTANTE: Cambiar estas contraseñas en producción!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
