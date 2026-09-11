// app/api/attendance/route.js
/**
 * API Route für Anwesenheitsverfolgung (Check-In)
 * GET  - Anwesenheitsrekorde laden
 * POST - Anwesenheit erfassen / aktualisieren
 * DELETE - Anwesenheit löschen
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/attendance
 * Anwesenheitsrekorde laden
 * Query Parameters:
 *   - eventId: Filter nach Event
 *   - playerId: Filter nach Spieler
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const playerId = searchParams.get('playerId');

    let where = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (playerId) {
      where.playerId = playerId;
    }

    const attendance = await prisma.attendance.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        player: true,
        event: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate statistics if eventId provided
    let statistics = null;
    if (eventId) {
      const present = attendance.filter((a) => a.status === 'PRESENT').length;
      const absent = attendance.filter((a) => a.status === 'ABSENT').length;
      const total = present + absent;

      statistics = {
        eventId,
        total,
        present,
        absent,
        presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    }

    return NextResponse.json(
      {
        success: true,
        data: attendance,
        count: attendance.length,
        statistics,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/attendance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance records',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance
 * Anwesenheit erfassen oder aktualisieren (Upsert)
 * Body:
 *   - eventId: (required)
 *   - playerId: (required)
 *   - status: (required - PRESENT or ABSENT)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { eventId, playerId, status } = body;

    // Validation
    if (!eventId || !playerId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: eventId, playerId, status',
        },
        { status: 400 }
      );
    }

    if (!['PRESENT', 'ABSENT'].includes(status.toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Status must be PRESENT or ABSENT',
        },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        {
          success: false,
          error: `Event with ID ${eventId} not found`,
        },
        { status: 404 }
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

    // Check if attendance record exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        eventId_playerId: {
          eventId,
          playerId,
        },
      },
    });

    let attendance;

    if (existingAttendance) {
      // Update existing record
      attendance = await prisma.attendance.update({
        where: {
          eventId_playerId: {
            eventId,
            playerId,
          },
        },
        data: {
          status: status.toUpperCase(),
          updatedAt: new Date(),
        },
        include: {
          player: true,
          event: true,
        },
      });
    } else {
      // Create new record
      attendance = await prisma.attendance.create({
        data: {
          eventId,
          playerId,
          status: status.toUpperCase(),
        },
        include: {
          player: true,
          event: true,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: attendance,
        message: `Attendance for ${player.name} marked as ${status.toUpperCase()}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/attendance] Error:', error);

    // Handle Prisma validation errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Record not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record attendance',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attendance
 * Anwesenheitsrekord löschen
 * Query Parameters:
 *   - eventId: (required)
 *   - playerId: (required)
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const playerId = searchParams.get('playerId');

    // Validation
    if (!eventId || !playerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: eventId and playerId',
        },
        { status: 400 }
      );
    }

    // Delete attendance record
    await prisma.attendance.delete({
      where: {
        eventId_playerId: {
          eventId,
          playerId,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Attendance record deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/attendance] Error:', error);

    // Handle Prisma not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Attendance record not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete attendance record',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
