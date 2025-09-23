import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// In a real app, derive orgId from session; for MVP we use a fixed demo org
const ORG_ID = process.env.DEMO_ORG_ID ?? "demo";

export async function GET() {
  const items = await prisma.item.findMany({ 
    where: { orgId: ORG_ID }, 
    orderBy: { createdAt: "desc" } 
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.item.create({ 
    data: { 
      orgId: ORG_ID, 
      name: body.name, 
      sku: body.sku ?? null, 
      category: body.category ?? null, 
      unit: body.unit ?? null, 
      priceCents: body.priceCents ?? 0 
    } 
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.item.update({ 
    where: { id: body.id }, 
    data: { 
      name: body.name, 
      priceCents: body.priceCents, 
      category: body.category, 
      unit: body.unit, 
      active: body.active 
    } 
  });
  return NextResponse.json(item);
}