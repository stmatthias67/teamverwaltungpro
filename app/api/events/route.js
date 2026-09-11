// app/api/events/route.js
/**
 * API Route für Event-Management
 * GET  - Alle Events laden (mit Filter)
 * POST - Neues Event erstellen
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/events
 * Events laden mit optional Filtering
 * Query Parameters:
 *   - type: Filter nach Typ (MATCH, TRAINING, TOURNAMENT)
 *   - upcoming: true = nur kommende Events
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const upcoming = searchParams.get('upcoming') === 'true';

    let where = {};

    if (type) {
      where.type = type.toUpperCase();
    }

    if (upcoming) {
      where.date = {
        gte: new Date(),
      };
    }

    const events = await prisma.event.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        attendances: {
          include: {
            player: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(
      {
        success: true,
        data: events,
        count: events.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/events] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Neues Event erstellen
 * Body:
 *   - title: (required)
 *   - type: (required - MATCH, TRAINING, TOURNAMENT)
 *   - date: (required - ISO Date String)
 *   - location: (required)
 *   - meetTime: (optional - ISO Date String)
 *   - distanceInfo: (optional)
 *   - isAway: (optional, default: false)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, type, date, meetTime, location, distanceInfo, isAway } = body;

    // Validation
    if (!title || !type || !date || !location) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: title, type, date, location',
        },
        { status: 400 }
      );
    }

    if (!['MATCH', 'TRAINING', 'TOURNAMENT'].includes(type.toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Type must be MATCH, TRAINING, or TOURNAMENT',
        },
        { status: 400 }
      );
    }

    // Parse dates
    let eventDate, eventMeetTime;
    try {
      eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        throw new Error('Invalid date format');
      }
      if (meetTime) {
        eventMeetTime = new Date(meetTime);
        if (isNaN(eventMeetTime.getTime())) {
          throw new Error('Invalid meetTime format');
        }
      }
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
        },
        { status: 400 }
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        type: type.toUpperCase(),
        date: eventDate,
        meetTime: eventMeetTime || null,
        location: location.trim(),
        distanceInfo: distanceInfo?.trim() || null,
        isAway: isAway || false,
      },
      include: {
        attendances: {
          include: {
            player: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: event,
        message: `Event "${event.title}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/events] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create event',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
