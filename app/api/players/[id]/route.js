// app/api/players/[id]/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { normalizePlayer, ValidationError } from '@/lib/player-validation';

// GET /api/players/[id]
export async function GET(request, { params }) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: params.id },
      include: { laundryLog: true },
    });
    if (!player) {
      return NextResponse.json({ success: false, message: 'Spieler nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: player });
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Abrufen', error: error.message }, { status: 500 });
  }
}

// PATCH /api/players/[id] - nur übermittelte Felder werden geändert
export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const data = normalizePlayer(body);

    if ('firstName' in data && !data.firstName) {
      return NextResponse.json({ success: false, message: 'Vorname ist erforderlich' }, { status: 400 });
    }
    if ('lastName' in data && !data.lastName) {
      return NextResponse.json({ success: false, message: 'Nachname ist erforderlich' }, { status: 400 });
    }

    const player = await prisma.player.update({ where: { id: params.id }, data });
    return NextResponse.json({ success: true, data: player, message: 'Spieler aktualisiert' });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Spieler nicht gefunden' }, { status: 404 });
    }
    console.error('Error updating player:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Aktualisieren', error: error.message }, { status: 500 });
  }
}

// DELETE /api/players/[id] - Spieler inkl. Anwesenheit/Nominierungen (Cascade)
export async function DELETE(request, { params }) {
  try {
    await prisma.player.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Spieler gelöscht' });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Spieler nicht gefunden' }, { status: 404 });
    }
    console.error('Error deleting player:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Löschen', error: error.message }, { status: 500 });
  }
}
