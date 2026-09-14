// app/api/material-inventory/route.js

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const materials = await prisma.materialInventory.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: materials,
      count: materials.length,
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen des Materials',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, category, quantity = 1, complete = true, missingItems } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, message: 'Name und Kategorie erforderlich' },
        { status: 400 }
      );
    }

    const material = await prisma.materialInventory.create({
      data: {
        name: name.trim(),
        category,
        quantity,
        complete,
        missingItems: missingItems?.trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: material,
        message: `Material "${name}" hinzugefügt`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating material:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Erstellen des Materials',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Material-ID erforderlich' },
        { status: 400 }
      );
    }

    const material = await prisma.materialInventory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: material,
      message: 'Material aktualisiert',
    });
  } catch (error) {
    console.error('Error updating material:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Material nicht gefunden' },
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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Material-ID erforderlich' },
        { status: 400 }
      );
    }

    const material = await prisma.materialInventory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Material "${material.name}" gelöscht`,
    });
  } catch (error) {
    console.error('Error deleting material:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: 'Material nicht gefunden' },
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
