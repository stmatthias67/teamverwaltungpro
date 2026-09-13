// app/api/players/[id]/route.js
/**
 * Players [id] API Route
 * Einzelne Spieler-Operationen: GET, PATCH, DELETE
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================================================
// GET /api/players/[id]
// Ruft einen einzelnen Spieler ab
// ============================================================================
export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Spieler-ID erforderlich' },
        { status: 400 }
      );
    }

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        attendances: true,
        nominations: true,
        laundryLog: true,
      },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, message: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: player,
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen des Spielers',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/players/[id]
// Aktualisiert einen Spieler
// ============================================================================
export async function PATCH(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Spieler-ID erforderlich' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, parentName, parentPhone, parentWhatsapp } = body;

    // Validierung - nur trimmen wenn vorhanden
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (parentName !== undefined) updateData.parentName = parentName?.trim();
    if (parentPhone !== undefined) updateData.parentPhone = parentPhone?.trim();
    if (parentWhatsapp !== undefined) updateData.parentWhatsapp = parentWhatsapp?.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Keine Änderungen vorhanden' },
        { status: 400 }
      );
    }

    const player = await prisma.player.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Spieler aktualisiert',
    });
  } catch (error) {
    console.error('Error updating player:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Aktualisieren des Spielers',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/players/[id]
// Löscht einen Spieler
// ============================================================================
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Spieler-ID erforderlich' },
        { status: 400 }
      );
    }

    // Prüfe ob Spieler existiert
    const player = await prisma.player.findUnique({
      where: { id },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, message: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    // Lösche den Spieler (Cascade löscht auch Attendances, Nominations, etc.)
    await prisma.player.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Spieler ${player.firstName} ${player.lastName} gelöscht`,
      data: { deletedId: id },
    });
  } catch (error) {
    console.error('Error deleting player:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Löschen des Spielers',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
