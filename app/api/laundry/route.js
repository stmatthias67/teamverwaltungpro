// app/api/laundry/route.js
/**
 * API Route für Trikotwäsche-Tracking
 * GET  - Laundry-Logs laden (sortiert nach Count ASC)
 * PATCH - Wäschezähler erhöhen (+1) und lastWashedAt aktualisieren
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/laundry
 * Laundry-Logs laden, sortiert nach Anzahl (aufsteigend)
 * Query Parameters:
 *   - playerId: (optional) Filter nach Spieler
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    let where = {};

    if (playerId) {
      where.playerId = playerId;
    }

    const laundryLogs = await prisma.laundryLog.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        player: true,
      },
      orderBy: [{ count: 'asc' }, { lastWashedAt: 'asc' }],
    });

    return NextResponse.json(
      {
        success: true,
        data: laundryLogs,
        count: laundryLogs.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/laundry] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch laundry logs',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/laundry
 * Wäschezähler erhöhen und lastWashedAt auf JETZT setzen
 * Body:
 *   - playerId: (required)
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { playerId } = body;

    // Validation
    if (!playerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: playerId',
        },
        { status: 400 }
      );
    }

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        {
          success: false,
          error: `Player with ID ${playerId} not found`,
        },
        { status: 404 }
      );
    }

    // Update laundry log
    const laundryLog = await prisma.laundryLog.update({
      where: { playerId },
      data: {
        count: {
          increment: 1,
        },
        lastWashedAt: new Date(),
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: laundryLog,
        message: `Laundry count increased to ${laundryLog.count} for ${player.name}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/laundry] Error:', error);

    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Laundry log not found for this player',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update laundry log',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
