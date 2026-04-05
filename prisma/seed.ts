import { PrismaClient, Role, Status, RecordType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Hash password for all seed users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Clear existing data (in reverse order of dependencies)
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');

  // Create users for each role
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
      status: Status.ACTIVE,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: 'Analyst User',
      email: 'analyst@example.com',
      password: hashedPassword,
      role: Role.ANALYST,
      status: Status.ACTIVE,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: hashedPassword,
      role: Role.VIEWER,
      status: Status.ACTIVE,
    },
  });

  // Create an inactive user for testing
  await prisma.user.create({
    data: {
      name: 'Inactive User',
      email: 'inactive@example.com',
      password: hashedPassword,
      role: Role.VIEWER,
      status: Status.INACTIVE,
    },
  });

  console.log('Creating financial records...');

  // Create sample financial records
  const records = [
    // Income records
    { amount: 5000.0, type: RecordType.INCOME, category: 'salary', notes: 'Monthly salary', daysAgo: 30 },
    { amount: 5000.0, type: RecordType.INCOME, category: 'salary', notes: 'Monthly salary', daysAgo: 0 },
    { amount: 1500.0, type: RecordType.INCOME, category: 'freelance', notes: 'Web development project', daysAgo: 15 },
    { amount: 250.0, type: RecordType.INCOME, category: 'investment', notes: 'Dividend payment', daysAgo: 20 },
    { amount: 1000.0, type: RecordType.INCOME, category: 'bonus', notes: 'Performance bonus', daysAgo: 5 },

    // Expense records
    { amount: 800.0, type: RecordType.EXPENSE, category: 'food', notes: 'Monthly groceries', daysAgo: 25 },
    { amount: 150.0, type: RecordType.EXPENSE, category: 'transport', notes: 'Gas and parking', daysAgo: 22 },
    { amount: 200.0, type: RecordType.EXPENSE, category: 'utilities', notes: 'Electricity bill', daysAgo: 18 },
    { amount: 100.0, type: RecordType.EXPENSE, category: 'utilities', notes: 'Internet bill', daysAgo: 18 },
    { amount: 50.0, type: RecordType.EXPENSE, category: 'entertainment', notes: 'Movie tickets', daysAgo: 10 },
    { amount: 300.0, type: RecordType.EXPENSE, category: 'healthcare', notes: 'Doctor visit', daysAgo: 8 },
    { amount: 450.0, type: RecordType.EXPENSE, category: 'food', notes: 'Dining out', daysAgo: 3 },
    { amount: 75.0, type: RecordType.EXPENSE, category: 'transport', notes: 'Uber rides', daysAgo: 1 },
  ];

  for (const record of records) {
    const date = new Date();
    date.setDate(date.getDate() - record.daysAgo);

    await prisma.financialRecord.create({
      data: {
        amount: record.amount,
        type: record.type,
        category: record.category,
        notes: record.notes,
        date: date,
        createdBy: admin.id,
      },
    });
  }

  // Summary
  const userCount = await prisma.user.count();
  const recordCount = await prisma.financialRecord.count();

  console.log('');
  console.log('Seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`   Users created: ${userCount}`);
  console.log(`   Records created: ${recordCount}`);
  console.log('');
  console.log('Login credentials (password: password123):');
  console.log(`   Admin:   ${admin.email}`);
  console.log(`   Analyst: ${analyst.email}`);
  console.log(`   Viewer:  ${viewer.email}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
