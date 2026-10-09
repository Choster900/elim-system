export const DENOMINATION_SEEDS = [
    { code: 'BIL-100', name: 'Billete de $100', value: 100, kind: 'BILL', sortOrder: 1 },
    { code: 'BIL-050', name: 'Billete de $50', value: 50, kind: 'BILL', sortOrder: 2 },
    { code: 'BIL-020', name: 'Billete de $20', value: 20, kind: 'BILL', sortOrder: 3 },
    { code: 'BIL-010', name: 'Billete de $10', value: 10, kind: 'BILL', sortOrder: 4 },
    { code: 'BIL-005', name: 'Billete de $5', value: 5, kind: 'BILL', sortOrder: 5 },
    { code: 'BIL-001', name: 'Billete de $1', value: 1, kind: 'BILL', sortOrder: 6 },
    { code: 'MON-100', name: 'Moneda de $1', value: 1, kind: 'COIN', sortOrder: 7 },
    { code: 'MON-025', name: 'Cora (25¢)', value: 0.25, kind: 'COIN', sortOrder: 9 },
    { code: 'MON-010', name: 'Moneda de 10¢', value: 0.1, kind: 'COIN', sortOrder: 10 },
    { code: 'MON-005', name: 'Moneda de 5¢', value: 0.05, kind: 'COIN', sortOrder: 11 },
    { code: 'MON-001', name: 'Moneda de 1¢', value: 0.01, kind: 'COIN', sortOrder: 12 },
]

export async function seedDenominations(prisma) {
    const denominations = await prisma.$transaction(
        DENOMINATION_SEEDS.map((seed) =>
            prisma.denomination.upsert({
                where: { code: seed.code },
                create: { ...seed, isActive: true },
                update: seed,
            }),
        ),
    )

    return new Map(denominations.map((denomination) => [denomination.code, denomination]))
}
