// app/api/material-borrow/route.js
/**
 * Material Borrow API Route
 * Speichert Übergabe, Rückgabe und Status von Material
 * Status: BORROWED, RETURNED, LOST, DAMAGED
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================================================
// GET /api/material-borrow
// Ruft Material-Borrow-Einträge ab
// Query: ?playerId=X (optional), ?status=BORROWED (optional)
// ============================================================================
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const status = searchParams.get('status');
    const itemId = searchParams.get('itemId');

    const where = {};
    if (playerId) where.playerId = playerId;
    if (status) where.status = status;
    if (itemId) where.itemId = itemId;

    const borrows = await prisma.materialBorrow.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { borrowedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: borrows,
      count: borrows.length,
    });
  } catch (error) {
    console.error('Error fetching borrows:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen der Material-Einträge',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/material-borrow
// Erstellt einen neuen Material-Borrow-Eintrag
// Body: { playerId, itemId, notes? }
// ============================================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const { playerId, itemId, notes } = body;

    // Validierung
    if (!playerId) {
      return NextResponse.json(
        { success: false, message: 'playerId erforderlich' },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { success: false, message: 'itemId erforderlich' },
        { status: 400 }
      );
    }

    // Prüfe Spieler
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, message: 'Spieler nicht gefunden' },
        { status: 404 }
      );
    }

    // Prüfe Material-Item
    const item = await prisma.materialInventory.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Material-Item nicht gefunden' },
        { status: 404 }
      );
    }

    // Erstelle Borrow-Eintrag
    const borrow = await prisma.materialBorrow.create({
      data: {
        playerId,
        itemId,
        status: 'BORROWED',
        notes: notes?.trim(),
      },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        item: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: borrow,
        message: `${item.name} an ${player.firstName} ${player.lastName} übergeben`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating borrow:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Erstellen des Eintrags',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/material-borrow
// Aktualisiert einen Borrow-Eintrag (z.B. Material zurückgegeben)
// Body: { borrowId, status, notes?, returnedAt? }
// ============================================================================
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { borrowId, status, notes, returnedAt } = body;

    if (!borrowId) {
      return NextResponse.json(
        { success: false, message: 'borrowId erforderlich' },
        { status: 400 }
      );
    }

    if (!['BORROWED', 'RETURNED', 'LOST', 'DAMAGED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Ungültiger Status' },
        { status: 400 }
      );
    }

    // Aktualisiere Eintrag
    const borrow = await prisma.materialBorrow.update({
      where: { id: borrowId },
      data: {
        status,
        notes: notes?.trim(),
        returnedAt: status !== 'BORROWED' && returnedAt ? new Date(returnedAt) : null,
      },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        item: {
          select: {
            name: true,
          },
        },
      },
    });

    const statusText = {
      BORROWED: 'übergeben',
      RETURNED: 'zurückgegeben',
      LOST: 'verloren',
      DAMAGED: 'beschädigt',
    }[status];

    return NextResponse.json({
      success: true,
      data: borrow,
      message: `${borrow.item.name} als ${statusText} markiert`,
    });
  } catch (error) {
    console.error('Error updating borrow:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Eintrag nicht gefunden' },
        { status: 404 }
      );
    }

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
// DELETE /api/material-borrow
// Löscht einen Borrow-Eintrag
// Query: ?borrowId=X
// ============================================================================
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const borrowId = searchParams.get('borrowId');

    if (!borrowId) {
      return NextResponse.json(
        { success: false, message: 'borrowId erforderlich' },
        { status: 400 }
      );
    }

    const borrow = await prisma.materialBorrow.delete({
      where: { id: borrowId },
      include: {
        item: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Material-Eintrag für ${borrow.item.name} gelöscht`,
    });
  } catch (error) {
    console.error('Error deleting borrow:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Eintrag nicht gefunden' },
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
