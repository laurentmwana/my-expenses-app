import { prisma } from "#/lib/prisma";
import { auth } from "#/lib/auth";
import { faker } from "@faker-js/faker";

const DEFAULT_EMAIL = process.env.SEED_EMAIL ?? "laurentmwn@gmail.com";
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? "@Labeya123";


async function authSeeder() {
	const result = await auth.api.signUpEmail({
		body: {
			name: "Labeya",
			email: DEFAULT_EMAIL,
			password: DEFAULT_PASSWORD,
		},
	});

	await prisma.user.update({
		where: { id: result.user.id },
		data: { emailVerified: true },
	});

	return result.user.id;
}

// ============================================================
// DATA
// ============================================================

const WALLETS = [
	{ name: "Cash", type: "CASH", currency: "USD", initialBalance: 150 },
	{ name: "Mobile Money", type: "MOBILE_MONEY", currency: "USD", initialBalance: 80 },
	{ name: "Bank Account", type: "BANK_ACCOUNT", currency: "USD", initialBalance: 1200 },
	{ name: "Emergency Fund", type: "SAVINGS", currency: "USD", initialBalance: 500 },
] as const;

type CategorySeed = {
	name: string;
	type: "INCOME" | "EXPENSE";
	icon: string;
	color: string;
	subs: string[];
};

const EXPENSE_CATEGORIES: CategorySeed[] = [
	{ name: "Salary", type: "INCOME", icon: "briefcase", color: "#16a34a", subs: [] },
	{ name: "Freelance", type: "INCOME", icon: "laptop", color: "#22c55e", subs: [] },
	{ name: "Gifts", type: "INCOME", icon: "gift", color: "#84cc16", subs: [] },
	{ name: "Food", type: "EXPENSE", icon: "utensils", color: "#f97316", subs: ["Groceries", "Restaurants", "Street food"] },
	{ name: "Transport", type: "EXPENSE", icon: "bus", color: "#3b82f6", subs: ["Taxi", "Fuel", "Public transport"] },
	{ name: "Rent", type: "EXPENSE", icon: "home", color: "#8b5cf6", subs: [] },
	{ name: "Utilities", type: "EXPENSE", icon: "zap", color: "#eab308", subs: ["Electricity", "Water"] },
	{ name: "Airtime & Internet", type: "EXPENSE", icon: "wifi", color: "#06b6d4", subs: [] },
	{ name: "Health", type: "EXPENSE", icon: "heart-pulse", color: "#ef4444", subs: ["Pharmacy", "Consultation"] },
	{ name: "Entertainment", type: "EXPENSE", icon: "film", color: "#ec4899", subs: ["Cinema", "Outings"] },
	{ name: "Education", type: "EXPENSE", icon: "book", color: "#14b8a6", subs: [] },
];

const BUDGETS = [
	{ category: "Food", limitAmount: 200, alertThreshold: 80 },
	{ category: "Transport", limitAmount: 80, alertThreshold: 75 },
	{ category: "Entertainment", limitAmount: 60, alertThreshold: 90 },
	{ category: null, limitAmount: 700, alertThreshold: 85 }, // global budget
] as const;

type TxSeed = {
	amount: number;
	type: "INCOME" | "EXPENSE" | "TRANSFER";
	date: Date;
	description: string;
	walletId: string;
	destinationWalletId?: string;
	categoryId?: string;
	subCategoryId?: string;
};

// ============================================================
// SEEDERS
// ============================================================

async function walletSeeder(userId: string) {
	return Promise.all(WALLETS.map((w) => prisma.wallet.create({ data: { ...w, userId } })));
}

async function expenseCategorySeeder(userId: string) {
	return Promise.all(
		EXPENSE_CATEGORIES.map((c) =>
			prisma.expenseCategory.create({
				data: {
					name: c.name,
					type: c.type,
					icon: c.icon,
					color: c.color,
					userId,
					subCategories: { create: c.subs.map((name) => ({ name })) },
				},
				include: { subCategories: true },
			})
		)
	);
}

type SeededWallet = Awaited<ReturnType<typeof walletSeeder>>[number];
type SeededCategory = Awaited<ReturnType<typeof expenseCategorySeeder>>[number];

function monthDate(monthsAgo: number, day: number) {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 9, 0, 0);
}

async function transactionSeeder(wallets: SeededWallet[], categories: SeededCategory[]) {
	const wallet = (name: string) => wallets.find((w) => w.name === name)!;
	const category = (name: string) => categories.find((c) => c.name === name)!;

	const cash = wallet("Cash");
	const mobile = wallet("Mobile Money");
	const bank = wallet("Bank Account");

	const rows: TxSeed[] = [];

	// 1. Monthly entries for the last 3 months, recorded as plain transactions
	for (let m = 0; m < 3; m++) {
		rows.push({
			amount: 900,
			type: "INCOME",
			date: monthDate(m, 1),
			description: "Monthly salary",
			walletId: bank.id,
			categoryId: category("Salary").id,
		});

		rows.push({
			amount: 250,
			type: "EXPENSE",
			date: monthDate(m, 3),
			description: "Rent",
			walletId: bank.id,
			categoryId: category("Rent").id,
		});

		rows.push({
			amount: 20,
			type: "EXPENSE",
			date: monthDate(m, 5),
			description: "Internet subscription",
			walletId: mobile.id,
			categoryId: category("Airtime & Internet").id,
		});

		// Transfer: bank -> mobile money (no category)
		rows.push({
			amount: 150,
			type: "TRANSFER",
			date: monthDate(m, 6),
			description: "Top up mobile money",
			walletId: bank.id,
			destinationWalletId: mobile.id,
		});

		rows.push({
			amount: faker.number.int({ min: 50, max: 250 }),
			type: "INCOME",
			date: monthDate(m, faker.number.int({ min: 10, max: 25 })),
			description: "Freelance mission",
			walletId: mobile.id,
			categoryId: category("Freelance").id,
		});
	}

	const variableCategories = categories.filter(
		(c) => c.type === "EXPENSE" && !["Rent", "Airtime & Internet"].includes(c.name)
	);

	for (const w of [cash, mobile]) {
		for (let i = 0; i < 25; i++) {
			const cat = faker.helpers.arrayElement(variableCategories);
			const sub = cat.subCategories.length > 0 ? faker.helpers.arrayElement(cat.subCategories) : undefined;

			rows.push({
				amount: faker.number.int({ min: 2, max: 40 }),
				type: "EXPENSE",
				date: faker.date.recent({ days: 90 }),
				description: faker.lorem.words(3),
				walletId: w.id,
				categoryId: cat.id,
				subCategoryId: sub?.id,
			});
		}
	}

	await prisma.transaction.createMany({ data: rows });
}

async function budgetSeeder(userId: string, categories: SeededCategory[]) {
	const now = new Date();
	const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
	const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

	return Promise.all(
		BUDGETS.map((b) =>
			prisma.budget.create({
				data: {
					userId,
					limitAmount: b.limitAmount,
					alertThreshold: b.alertThreshold,
					period: "MONTHLY",
					startDate,
					endDate,
					categoryId: b.category ? categories.find((c) => c.name === b.category)!.id : null,
				},
			})
		)
	);
}

async function savingsGoalSeeder(userId: string, wallets: SeededWallet[]) {
	const savings = wallets.find((w) => w.name === "Emergency Fund")!;
	const inSixMonths = new Date();
	inSixMonths.setMonth(inSixMonths.getMonth() + 6);

	await prisma.savingsGoal.createMany({
		data: [
			{ userId, title: "New laptop", targetAmount: 800, currentAmount: 250, deadline: inSixMonths },
			{ userId, title: "Emergency fund", targetAmount: 2000, currentAmount: 500, walletId: savings.id },
		],
	});
}

async function debtSeeder(userId: string) {
	const inDays = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

	await prisma.debt.create({
		data: {
			userId,
			person: faker.person.fullName(),
			amount: 120,
			direction: "OWED_TO_ME",
			dueDate: inDays(30),
			repayments: { create: [{ amount: 40, date: inDays(-5) }] },
		},
	});

	await prisma.debt.create({
		data: {
			userId,
			person: faker.person.fullName(),
			amount: 60,
			direction: "I_OWE",
			dueDate: inDays(14),
		},
	});

	await prisma.debt.create({
		data: {
			userId,
			person: faker.person.fullName(),
			amount: 30,
			direction: "I_OWE",
			status: "SETTLED",
			repayments: { create: [{ amount: 30, date: inDays(-20) }] },
		},
	});
}

async function notificationSeeder(userId: string, budgets: Awaited<ReturnType<typeof budgetSeeder>>) {
	await prisma.notification.createMany({
		data: [
			{
				userId,
				budgetId: budgets[0]?.id,
				type: "BUDGET_EXCEEDED",
				message: "You have reached 80% of your monthly Food budget.",
			},
			{ userId, type: "DEBT_DUE", message: "A debt is due in 14 days." },
			{ userId, type: "REMINDER", message: "Don't forget to record today's expenses.", isRead: true },
		],
	});
}

// ============================================================
// MAIN
// ============================================================

async function main() {
	const userId = await authSeeder();

	const wallets = await walletSeeder(userId);
	const categories = await expenseCategorySeeder(userId);

	await transactionSeeder(wallets, categories);

	const budgets = await budgetSeeder(userId, categories);

	await savingsGoalSeeder(userId, wallets);
	await debtSeeder(userId);
	await notificationSeeder(userId, budgets);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
