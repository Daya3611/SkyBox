import { prisma } from './lib/db';

async function main() {
  const plans = [
    {
      name: 'FREE',
      storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
      price: 0,
      currency: 'INR',
      isDefault: true,
      isActive: true,
    },
    {
      name: 'PRO',
      storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
      price: 199,
      currency: 'INR',
      isDefault: false,
      isActive: true,
    },
    {
      name: 'PRO MAX',
      storageLimit: 1024 * 1024 * 1024 * 1024, // 1TB
      price: 999,
      currency: 'INR',
      isDefault: false,
      isActive: true,
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  console.log('Plans seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
