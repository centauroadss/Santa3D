import { PrismaConfig } from '@prisma/config'

export default {
  seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
} satisfies PrismaConfig
