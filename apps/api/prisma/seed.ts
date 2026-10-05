import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const password = await argon2.hash('password123');

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice', passwordHash: password }
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob', passwordHash: password }
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: { email: 'carol@example.com', name: 'Carol', passwordHash: password }
  });

  const group = await prisma.group.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Weekend Trip',
      description: 'Group for weekend trip',
      currency: 'INR',
      createdById: alice.id
    }
  });

  await prisma.groupMember.createMany({ data: [
    { userId: alice.id, groupId: group.id, role: 'ADMIN' },
    { userId: bob.id, groupId: group.id, role: 'MEMBER' },
    { userId: carol.id, groupId: group.id, role: 'MEMBER' }
  ]});

  console.log('Seed complete');
}

main().catch(e => { console.error(e); process.exit(1); })
  .finally(() => process.exit());
