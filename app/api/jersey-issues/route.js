// app/api/jersey-issues/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const STATUS = ['PLANNED', 'TAKEN_HOME', 'RETURNED'];

// GET /api/jersey-issues  (optional ?playerId=...)
export async function GET(request) {
  try {
    const playerId = new URL(request.url).searchParams.get('playerId');
    const issues = await prisma.jerseyIssue.findMany({
      where: playerId ? { playerId } : undefined,
      orderBy: { issuedAt: 'desc' },
      include: { player: { select: { id: true, firstName: true, lastName: true, performanceGroup: true } } },
    });
    return NextResponse.json({ success: true, data: issues, count: issues.length });
  } catch (error) {
    console.error('Error fetching jersey issues:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Abrufen', error: error.message }, { status: 500 });
  }
}

// POST /api/jersey-issues  Body: { playerId, jerseySet, returnDue?, status?, notes? }
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.playerId || !body.jerseySet?.trim()) {
      return NextResponse.json({ success: false, message: 'Spieler und Trikotsatz sind erforderlich' }, { status: 400 });
    }
    const status = body.status ?? 'PLANNED';
    if (!STATUS.includes(status)) {
      return NextResponse.json({ success: false, message: 'Ungültiger Status' }, { status: 400 });
    }

    const issue = await prisma.jerseyIssue.create({
      data: {
        playerId: body.playerId,
        jerseySet: body.jerseySet.trim(),
        returnDue: body.returnDue ? new Date(body.returnDue) : null,
        status,
        notes: body.notes?.trim() || null,
      },
    });
    return NextResponse.json({ success: true, data: issue, message: 'Trikotsatz eingetragen' }, { status: 201 });
  } catch (error) {
    console.error('Error creating jersey issue:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Erstellen', error: error.message }, { status: 500 });
  }
}

// PATCH /api/jersey-issues  Body: { id, status?, cleanCheck?, returnDue?, notes? }
export async function PATCH(request) {
  try {
    const { id, ...rest } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: 'ID erforderlich' }, { status: 400 });

    const data = {};
    if ('status' in rest) {
      if (!STATUS.includes(rest.status)) return NextResponse.json({ success: false, message: 'Ungültiger Status' }, { status: 400 });
      data.status = rest.status;
    }
    if ('cleanCheck' in rest) data.cleanCheck = Boolean(rest.cleanCheck);
    if ('returnDue' in rest) data.returnDue = rest.returnDue ? new Date(rest.returnDue) : null;
    if ('notes' in rest) data.notes = rest.notes?.trim() || null;

    const issue = await prisma.jerseyIssue.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: issue, message: 'Aktualisiert' });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Eintrag nicht gefunden' }, { status: 404 });
    }
    console.error('Error updating jersey issue:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Aktualisieren', error: error.message }, { status: 500 });
  }
}

// DELETE /api/jersey-issues?id=...
export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID erforderlich' }, { status: 400 });

    await prisma.jerseyIssue.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Eintrag gelöscht' });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Eintrag nicht gefunden' }, { status: 404 });
    }
    console.error('Error deleting jersey issue:', error);
    return NextResponse.json({ success: false, message: 'Fehler beim Löschen', error: error.message }, { status: 500 });
  }
  }
