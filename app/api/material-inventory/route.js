// app/api/material-inventory/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const CONDITIONS = ['GOOD', 'USED', 'DAMAGED'];

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

// Nur erlaubte Felder übernehmen und typisieren
function normalize(body) {
  const d = {};
  if ('name' in body) d.name = String(body.name ?? '').trim();
  if ('category' in body) d.category = String(body.category ?? '').trim();
  if ('shouldQuantity' in body) d.shouldQuantity = toInt(body.shouldQuantity);
  if ('quantity' in body) d.quantity = toInt(body.quantity);
  if ('condition' in body) {
    if (!CONDITIONS.includes(body.condition)) throw new Error('Zustand muss GOOD, USED oder DAMAGED sein');
    d.condition = body.condition;
  }
  if ('location' in body) d.location = body.location ? String(body.location).trim() : null;
  if ('lastInspection' in body) d.lastInspection = body.lastInspection ? new Date(body.lastInspection) : null;
  if ('complete' in body) d.complete = Boolean(body.complete);
  if ('missingItems' in body) d.missingItems = body.missingItems ? String(body.missingItems).trim() : null;
  if ('notes' in body) d.notes = body.notes ? String(body.notes).trim() : null;
  return d;
}

// GET /api/material-inventory
export async function GET() {
  try {
    const items = await prisma.materialInventory.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ success: true, data: items, count: items.length });
  } catch (error) {
    console.error('Error fetching material:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Abrufen', error: error.message }, { status: 500 });
  }
}

// POST /api/material-inventory
export async function POST(request) {
  try {
    const data = normalize(await request.json());
    if (!data.name) return NextResponse.json({ success: false, message: 'Name ist erforderlich' }, { status: 400 });
    if (!data.category) return NextResponse.json({ success: false, message: 'Kategorie ist erforderlich' }, { status: 400 });

    const item = await prisma.materialInventory.create({ data });
    return NextResponse.json({ success: true, data: item, message: `"${item.name}" hinzugefügt` }, { status: 201 });
  } catch (error) {
    console.error('Error creating material:', error);
    const status = error.message?.includes('Zustand') ? 400 : 500;
    return NextResponse.json({ success: false, message: error.message || 'Fehler beim Erstellen' }, { status });
  }
}

// PATCH /api/material-inventory  Body: { id, ...felder }
export async function PATCH(request) {
  try {
    const { id, ...rest } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: 'ID erforderlich' }, { status: 400 });

    const item = await prisma.materialInventory.update({ where: { id }, data: normalize(rest) });
    return NextResponse.json({ success: true, data: item, message: 'Aktualisiert' });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Material nicht gefunden' }, { status: 404 });
    }
    console.error('Error updating material:', error);
    const status = error.message?.includes('Zustand') ? 400 : 500;
    return NextResponse.json({ success: false, message: error.message || 'Fehler beim Aktualisieren' }, { status });
  }
}

// DELETE /api/material-inventory?id=...
export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID erforderlich' }, { status: 400 });

    const item = await prisma.materialInventory.delete({ where: { id } });
    return NextResponse.json({ success: true, message: `"${item.name}" gelöscht` });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Material nicht gefunden' }, { status: 404 });
    }
    console.error('Error deleting material:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Löschen', error: error.message }, { status: 500 });
  }
}
