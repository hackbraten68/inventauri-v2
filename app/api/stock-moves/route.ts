import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";


const ORG_ID = process.env.DEMO_ORG_ID ?? "demo";


export async function POST(req: Request) {
const { itemId, qty, reason } = await req.json();
// qty can be positive (in) or negative (out)
const move = await prisma.stockMove.create({ data: { orgId: ORG_ID, itemId, qty, reason } });
return NextResponse.json(move, { status: 201 });
}