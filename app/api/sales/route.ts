import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";


const ORG_ID = process.env.DEMO_ORG_ID ?? "demo";


// Create a sale with lines: { soldAt?, customer?, items: [{ itemId, qty, unitPriceCents }] }
export async function POST(req: Request) {
const body = await req.json();
const { items, customer, soldAt } = body as { items: { itemId: string; qty: string | number; unitPriceCents: number }[]; customer?: string; soldAt?: string };


const sale = await prisma.$transaction(async (tx) => {
const created = await tx.sale.create({ data: { orgId: ORG_ID, customer: customer ?? null, soldAt: soldAt ? new Date(soldAt) : undefined } });


for (const line of items) {
const qtyNum = typeof line.qty === 'string' ? parseFloat(line.qty) : line.qty;
await tx.saleItem.create({ data: { saleId: created.id, orgId: ORG_ID, itemId: line.itemId, qty: qtyNum, unitPriceCents: line.unitPriceCents, lineTotalCents: Math.round(qtyNum * line.unitPriceCents) } });
// stock down
await tx.stockMove.create({ data: { orgId: ORG_ID, itemId: line.itemId, qty: -Math.abs(qtyNum), reason: 'sale' } });
}


return created;
});


return NextResponse.json(sale, { status: 201 });
}