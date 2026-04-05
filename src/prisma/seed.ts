import { PrismaClient, Role, RecordType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { subMonths, startOfMonth, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive database seeding...');

    // Check if data already exists — skip seeding if users are present
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
        console.log('✅ Database already has data. Skipping seed.');
        return;
    }

    const saltRounds = 12;
    const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
    const analystPassword = await bcrypt.hash('Analyst@123', saltRounds);
    const viewerPassword = await bcrypt.hash('Viewer@123', saltRounds);

    // 1. Create Users
    const admin = await prisma.user.upsert({
        where: { email: 'director@zorvyn-ngo.org' },
        update: {},
        create: {
            email: 'director@zorvyn-ngo.org',
            name: 'Priya Sharma',
            passwordHash: adminPassword,
            role: Role.ADMIN,
        },
    });

    const analyst = await prisma.user.upsert({
        where: { email: 'coordinator@zorvyn-ngo.org' },
        update: {},
        create: {
            email: 'coordinator@zorvyn-ngo.org',
            name: 'Rahul Mehta',
            passwordHash: analystPassword,
            role: Role.ANALYST,
        },
    });

    const viewer = await prisma.user.upsert({
        where: { email: 'volunteer@zorvyn-ngo.org' },
        update: {},
        create: {
            email: 'volunteer@zorvyn-ngo.org',
            name: 'Anita Desai',
            passwordHash: viewerPassword,
            role: Role.ANALYST,
        },
    });

    console.log('✅ Users created: director, coordinator, volunteer');

    // 3. Create Sample Records for the last 6 months
    const categories = {
        [RecordType.INCOME]: ['Individual Donations', 'Corporate CSR', 'Government Grant', 'Fundraising Event', 'International Aid'],
        [RecordType.EXPENSE]: ['Education Program', 'Healthcare Camp', 'Field Operations', 'Staff Salaries', 'Office Rent', 'Logistics', 'Community Kitchen', 'Awareness Campaign']
    };

    const notes: Record<string, string[]> = {
        'Individual Donations': ['Donation from monthly supporter', 'One-time gift for education', 'Legacy gift for healthcare'],
        'Corporate CSR': ['CSR grant from Tata Trust', 'Microsoft Philanthropy fund', 'Reliance Foundation support'],
        'Government Grant': ['State education department grant', 'Central healthcare initiative funding'],
        'Fundraising Event': ['Proceeds from charity gala', 'Online crowdfunding campaign'],
        'International Aid': ['Global Health Organization grant', 'UNESCO education project support'],
        'Education Program': ['School supplies for rural kids', 'Digital literacy camp expenses', 'Scholarships for high schoolers'],
        'Healthcare Camp': ['Medical supplies for mobile clinic', 'Vaccination drive equipment', 'Community health checkup costs'],
        'Field Operations': ['Remote area survey tools', 'Operations team travel expenses'],
        'Staff Salaries': ['Monthly stipend for field workers', 'Administrative staff payroll'],
        'Office Rent': ['Regional office monthly rent', 'Utility bills for community center'],
        'Logistics': ['Truck rental for food distribution', 'Supply chain management costs'],
        'Community Kitchen': ['Bulk grocery purchase for soup kitchen', 'New stove for community center'],
        'Awareness Campaign': ['Flyer printing for climate change', 'Social media ad spend for donation drive']
    };

    const records = [];

    for (let i = 0; i < 6; i++) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);

        // Add 6-10 random donations per month
        const incomeCount = 6 + Math.floor(Math.random() * 5);
        for (let j = 0; j < incomeCount; j++) {
            const category = categories[RecordType.INCOME][Math.floor(Math.random() * categories[RecordType.INCOME].length)];
            const catNotes = notes[category] || [`Sample ${category} fund`];
            records.push({
                userId: admin.id,
                amount: 500 + Math.random() * 5000,
                type: RecordType.INCOME,
                category,
                date: addDays(monthStart, 1 + Math.floor(Math.random() * 25)),
                notes: catNotes[Math.floor(Math.random() * catNotes.length)],
            });
        }

        // Add 5-8 random expenditures per month
        const expenseCount = 5 + Math.floor(Math.random() * 4);
        for (let j = 0; j < expenseCount; j++) {
            const category = categories[RecordType.EXPENSE][Math.floor(Math.random() * categories[RecordType.EXPENSE].length)];
            const catNotes = notes[category] || [`Sample ${category} expenditure`];
            records.push({
                userId: admin.id,
                amount: 300 + Math.random() * 4500,
                type: RecordType.EXPENSE,
                category,
                date: addDays(monthStart, 1 + Math.floor(Math.random() * 25)),
                notes: catNotes[Math.floor(Math.random() * catNotes.length)],
            });
        }
    }

    await prisma.financialRecord.createMany({
        data: records,
    });

    console.log(`✅ ${records.length} fund records seeded across 6 months.`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
