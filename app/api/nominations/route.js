// app/api/nominations/route.js
/**
 * Nominations API Route
 * Speichert Spieler-Nominierungen für Events (Startelf, Bank, etc.)
 * Integriert Rückennummern-Zuweisung pro Event
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================================================
// GET /api/nominations
// Ruft Nominierungen ab (optional gefiltert nach eventId)
// ============================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status'); // FIELD, BENCH, NOT_NOMINATED

    const where = {};
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    const nominations = await prisma.nomination.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            date: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { jerseyNumber: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: nominations,
      count: nominations.length,
    });
  } catch (error) {
    console.error('Error fetching nominations:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen der Nominierungen',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/nominations
// Erstellt oder aktualisiert eine Nominierung
// Body: { eventId, playerId, status, jerseyNumber?, position? }
// ============================================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const { eventId, playerId, status, jerseyNumber, position } = body;

    // Validierung
    if (!eventId) {
      return NextResponse.json(
        { success: false, message: 'eventId erforderlich' },
        { status: 400 }
      );
    }

    if (!playerId) {
      return NextResponse.json(
        { success: false, message: 'playerId erforderlich' },
        { status: 400 }
      );
    }

    if (!['FIELD', 'BENCH', 'NOT_NOMINATED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Ungültiger Status' },
        { status: 400 }
      );
    }

    // Validiere Rückennummer wenn vorhanden
    if (jerseyNumber && (jerseyNumber < 1 || jerseyNumber > 99)) {
      return NextResponse.json(
        { success: false, message: 'Rückennummer muss zwischen 1 und 99 sein' },
        { status: 400 }
      );
    }

    // Prüfe ob Event existiert
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfe ob Spieler existiert
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, message: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfe ob Rückennummer bereits verwendet wird
    if (jerseyNumber && status !== 'NOT_NOMINATED') {
      const existingNomination = await prisma.nomination.findFirst({
        where: {
          eventId,
          jerseyNumber,
          id: { not: (await prisma.nomination.findUnique({
            where: { eventId_playerId: { eventId, playerId } },
            select: { id: true },
          }))?.id },
        },
      });

      if (existingNomination) {
        return NextResponse.json(
          {
            success: false,
            message: `Rückennummer ${jerseyNumber} ist bereits vergeben`,
          },
          { status: 409 }
        );
      }
    }

    // Upsert Nominierung
    const nomination = await prisma.nomination.upsert({
      where: {
        eventId_playerId: { eventId, playerId },
      },
      update: {
        status,
        jerseyNumber: status === 'NOT_NOMINATED' ? null : jerseyNumber,
        position,
      },
      create: {
        eventId,
        playerId,
        status,
        jerseyNumber: status === 'NOT_NOMINATED' ? null : jerseyNumber,
        position,
      },
      include: {
        player: true,
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: nomination,
        message: `${player.firstName} ${player.lastName} nominiert`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating nomination:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Erstellen der Nominierung',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/nominations
// Bulk-Nominierungen für Event (z.B. alle Spieler auf einmal setzen)
// Body: { eventId, nominations: [{ playerId, status, jerseyNumber }, ...] }
// ============================================================================
export async function PUT(request) {
  try {
    const body = await request.json();
    const { eventId, nominations } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, message: 'eventId erforderlich' },
        { status: 400 }
      );
    }

    if (!Array.isArray(nominations)) {
      return NextResponse.json(
        { success: false, message: 'nominations muss ein Array sein' },
        { status: 400 }
      );
    }

    // Lösche alte Nominierungen für dieses Event
    await prisma.nomination.deleteMany({
      where: { eventId },
    });

    // Erstelle neue Nominierungen
    const created = [];
    for (const nom of nominations) {
      const nomination = await prisma.nomination.create({
        data: {
          eventId,
          playerId: nom.playerId,
          status: nom.status,
          jerseyNumber: nom.status === 'NOT_NOMINATED' ? null : nom.jerseyNumber,
          position: nom.position,
        },
        include: {
          player: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      created.push(nomination);
    }

    return NextResponse.json({
      success: true,
      data: created,
      count: created.length,
      message: `${created.length} Nominierungen erstellt`,
    });
  } catch (error) {
    console.error('Error bulk creating nominations:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Erstellen der Nominierungen',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/nominations
// Löscht eine Nominierung
// Query: ?eventId=X&playerId=Y
// ============================================================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const playerId = searchParams.get('playerId');

    if (!eventId || !playerId) {
      return NextResponse.json(
        { success: false, message: 'eventId und playerId erforderlich' },
        { status: 400 }
      );
    }

    const nomination = await prisma.nomination.delete({
      where: {
        eventId_playerId: { eventId, playerId },
      },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${nomination.player.firstName} ${nomination.player.lastName} Nominierung gelöscht`,
    });
  } catch (error) {
    console.error('Error deleting nomination:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Nominierung nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Löschen der Nominierung',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
