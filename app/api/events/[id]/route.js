// app/api/events/[id]/route.js

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Event-ID erforderlich' },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: 'Event nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen des Events',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Event-ID erforderlich' },
        { status: 400 }
      );
    }

    const event = await prisma.event.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Event aktualisiert',
    });
  } catch (error) {
    console.error('Error updating event:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Event nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Aktualisieren des Events',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Event-ID erforderlich' },
        { status: 400 }
      );
    }

    const event = await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Event ${event.title} gelöscht`,
    });
  } catch (error) {
    console.error('Error deleting event:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Event nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Löschen des Events',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
