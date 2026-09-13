// app/api/players/route.js
/**
 * Players API Route
 * ÜBERARBEITETE VERSION für neue Felder
 * 
 * Entfernt: jerseyNumber, status
 * Hinzugefügt: firstName, lastName, parentName
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================================================
// GET /api/players
// Gibt alle Spieler zurück
// ============================================================================
export async function GET(request) {
  try {
    const players = await prisma.player.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
        attendances: {
          select: {
            eventId: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: players,
      count: players.length,
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen der Spieler',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/players
// Erstellt einen neuen Spieler
// ============================================================================
export async function POST(request) {
  try {
    const body = await request.json();

    // Validierung
    const { firstName, lastName, parentName, parentPhone, parentWhatsapp } = body;

    if (!firstName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vorname ist erforderlich' },
        { status: 400 }
      );
    }

    if (!lastName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Nachname ist erforderlich' },
        { status: 400 }
      );
    }

    if (!parentName?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Elternname ist erforderlich' },
        { status: 400 }
      );
    }

    if (!parentPhone?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Telefon ist erforderlich' },
        { status: 400 }
      );
    }

    if (!parentWhatsapp?.trim()) {
      return NextResponse.json(
        { success: false, message: 'WhatsApp ist erforderlich' },
        { status: 400 }
      );
    }

    // Erstelle Spieler
    const player = await prisma.player.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentWhatsapp: parentWhatsapp.trim(),
      },
    });

    // Erstelle auch LaundryLog für diesen Spieler
    await prisma.laundryLog.create({
      data: {
        playerId: player.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: player,
        message: `Spieler ${player.firstName} ${player.lastName} erstellt`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating player:', error);

    // Spezifische Fehler behandeln
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Spieler existiert bereits' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Erstellen des Spielers',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/players (Alternative: PATCH /api/players/[id])
// Aktualisiert mehrere Spieler oder führt Bulk-Operationen durch
// ============================================================================
export async function PUT(request) {
  try {
    const body = await request.json();
    const { operation, playerIds, data } = body;

    if (operation === 'updateMany') {
      // Bulk-Update mehrerer Spieler
      const result = await prisma.player.updateMany({
        where: { id: { in: playerIds } },
        data,
      });

      return NextResponse.json({
        success: true,
        message: `${result.count} Spieler aktualisiert`,
        count: result.count,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Ungültige Operation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating players:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Aktualisieren',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/players (für Bulk-Delete)
// ============================================================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json(
        { success: false, message: 'IDs erforderlich' },
        { status: 400 }
      );
    }

    const playerIds = ids.split(',');

    const result = await prisma.player.deleteMany({
      where: { id: { in: playerIds } },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} Spieler gelöscht`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error deleting players:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Löschen',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
