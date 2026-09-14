// app/api/attendance/route.js

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const playerId = searchParams.get('playerId');

    const where = {};
    if (eventId) where.eventId = eventId;
    if (playerId) where.playerId = playerId;

    const attendance = await prisma.attendance.findMany({
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: attendance,
      count: attendance.length,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen der Anwesenheit',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { eventId, playerId, status } = body;

    if (!eventId || !playerId || !status) {
      return NextResponse.json(
        { success: false, message: 'eventId, playerId und status erforderlich' },
        { status: 400 }
      );
    }

    if (!['PRESENT', 'ABSENT'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status muss PRESENT oder ABSENT sein' },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_playerId: { eventId, playerId },
      },
      update: {
        status,
        checkedInAt: new Date(),
      },
      create: {
        eventId,
        playerId,
        status,
        checkedInAt: new Date(),
      },
      include: {
        player: true,
        event: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: attendance,
        message: `Anwesenheit aktualisiert: ${status}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating attendance:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Aktualisieren der Anwesenheit',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

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

    const attendance = await prisma.attendance.delete({
      where: {
        eventId_playerId: { eventId, playerId },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Anwesenheitseintrag gelöscht',
    });
  } catch (error) {
    console.error('Error deleting attendance:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Anwesenheitseintrag nicht gefunden' },
        { status: 404 }
      );
    }

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
