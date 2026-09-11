// app/api/players/route.js
/**
 * API Route für Spieler-Management (CRUD)
 * GET  - Alle Spieler laden (mit Filter/Search)
 * POST - Neuen Spieler erstellen
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/players
 * Alle Spieler laden mit optional Filtering und Searching
 * Query Parameters:
 *   - search: Suche nach Namen oder Nummer
 *   - status: Filter nach Status (ACTIVE, SICK, INJURED)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build where clause for filtering
    let where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        {
          jerseyNumber: {
            equals: isNaN(parseInt(search)) ? undefined : parseInt(search),
          },
        },
      ];
      // Remove undefined values
      where.OR = where.OR.filter(
        (item) => Object.values(item)[0]?.equals !== undefined || item.name
      );
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const players = await prisma.player.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        laundryLog: true,
        attendances: {
          include: {
            event: true,
          },
        },
      },
      orderBy: { jerseyNumber: 'asc' },
    });

    return NextResponse.json(
      {
        success: true,
        data: players,
        count: players.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/players] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch players',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players
 * Neuen Spieler erstellen
 * Body:
 *   - jerseyNumber: (required, unique)
 *   - name: (required)
 *   - status: (optional, default: ACTIVE)
 *   - parentPhone: (optional)
 *   - parentWhatsapp: (optional)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { jerseyNumber, name, status, parentPhone, parentWhatsapp } = body;

    // Validation
    if (!jerseyNumber || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: jerseyNumber and name',
        },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(jerseyNumber))) {
      return NextResponse.json(
        {
          success: false,
          error: 'jerseyNumber must be a number',
        },
        { status: 400 }
      );
    }

    // Check if jersey number already exists
    const existingPlayer = await prisma.player.findUnique({
      where: { jerseyNumber: parseInt(jerseyNumber) },
    });

    if (existingPlayer) {
      return NextResponse.json(
        {
          success: false,
          error: `Jersey number ${jerseyNumber} already exists`,
        },
        { status: 409 }
      );
    }

    // Create player
    const player = await prisma.player.create({
      data: {
        jerseyNumber: parseInt(jerseyNumber),
        name: name.trim(),
        status: status?.toUpperCase() || 'ACTIVE',
        parentPhone: parentPhone?.trim() || null,
        parentWhatsapp: parentWhatsapp?.trim() || null,
      },
      include: {
        laundryLog: true,
      },
    });

    // Create laundry log for new player
    try {
      await prisma.laundryLog.create({
        data: {
          playerId: player.id,
          count: 0,
        },
      });
    } catch (err) {
      console.warn('Warning: Could not create laundry log for player:', err);
    }

    return NextResponse.json(
      {
        success: true,
        data: player,
        message: `Player ${player.name} created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/players] Error:', error);

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Jersey number already exists',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create player',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
