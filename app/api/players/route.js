// app/api/players/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { normalizePlayer, ValidationError } from '@/lib/player-validation';

// GET /api/players - alle Spieler, sortiert nach Gruppe, Nachname, Vorname
export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: [{ performanceGroup: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
    });
    return NextResponse.json({ success: true, data: players, count: players.length });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { success: false, message: 'Fehler beim Abrufen der Spieler', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/players - neuen Spieler anlegen (inkl. LaundryLog)
export async function POST(request) {
  try {
    const body = await request.json();
    const data = normalizePlayer(body);

    if (!data.firstName) {
      return NextResponse.json({ success: false, message: 'Vorname ist erforderlich' }, { status: 400 });
    }
    if (!data.lastName) {
      return NextResponse.json({ success: false, message: 'Nachname ist erforderlich' }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: { ...data, laundryLog: { create: {} } },
    });

    return NextResponse.json(
      { success: true, data: player, message: `Spieler ${player.firstName} ${player.lastName} erstellt` },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }
    console.error('Error creating player:', error);
    return NextResponse.json(
      { success: false, message: 'Fehler beim Erstellen des Spielers', error: error.message },
      { status: 500 }
    );
  }
}
