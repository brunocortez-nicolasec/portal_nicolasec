// node-api/prisma/seed.js (Versão com sintaxe de Módulo ES)

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding do banco de dados...');

  // --- 1. Cria as Funções (Roles) Padrão ---
  console.log('Criando funções padrão...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  const memberRole = await prisma.role.upsert({
    where: { name: 'Membro' },
    update: {},
    create: { name: 'Membro' },
  });
  console.log('Funções criadas:', { adminRole, memberRole });

  // --- 2. Cria as Plataformas Fixas ---
  console.log('Criando plataformas padrão...');
  const truim = await prisma.platform.upsert({
    where: { key: 'truim' },
    update: {},
    create: {
      name: 'TruIM',
      key: 'truim',
      route: '/tas/truim',
      icon: 'fact_check',
    },
  });

  const trupam = await prisma.platform.upsert({
    where: { key: 'trupam' },
    update: {},
    create: {
      name: 'TruPAM',
      key: 'trupam',
      route: '/tas/trupam',
      icon: 'shield',
    },
  });

  const truam = await prisma.platform.upsert({
    where: { key: 'truam' },
    update: {},
    create: {
      name: 'TruAM',
      key: 'truam',
      route: '/tas/truam',
      icon: 'hub',
    },
  });
  console.log('Plataformas criadas:', { truim, trupam, truam });

  console.log('Seeding concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error('Ocorreu um erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });