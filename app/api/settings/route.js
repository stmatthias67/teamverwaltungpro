// app/api/settings/route.js
/**
 * Settings API Route
 * Speichert und lädt Benutzer-Einstellungen (Theme, Colors, Layout)
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Standardwerte
const DEFAULT_SETTINGS = {
  colorMode: 'DARK',
  layoutStyle: 'STANDARD',
  primaryColor: '#2ea043',
  secondaryColor: '#1f6feb',
  bgMain: '#0d1117',
  bgCard: '#161b22',
  accentColor: '#58a6ff',
  compactMode: false,
};

// ============================================================================
// GET /api/settings
// Gibt die Einstellungen zurück (oder Default falls nicht vorhanden)
// ============================================================================
export async function GET(request) {
  try {
    let settings = await prisma.userSettings.findFirst();

    // Falls keine Settings exist, erstelle mit Default
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Abrufen der Einstellungen',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/settings
// Aktualisiert die Einstellungen
// ============================================================================
export async function PATCH(request) {
  try {
    const body = await request.json();

    // Validiere Farben (müssen HEX sein)
    const colorFields = ['primaryColor', 'secondaryColor', 'bgMain', 'bgCard', 'accentColor'];
    for (const field of colorFields) {
      if (body[field] && !isValidHex(body[field])) {
        return NextResponse.json(
          {
            success: false,
            message: `${field} muss eine gültige HEX-Farbe sein`,
          },
          { status: 400 }
        );
      }
    }

    // Validiere ColorMode
    if (body.colorMode && !['LIGHT', 'DARK', 'SYSTEM'].includes(body.colorMode)) {
      return NextResponse.json(
        {
          success: false,
          message: 'colorMode muss LIGHT, DARK oder SYSTEM sein',
        },
        { status: 400 }
      );
    }

    // Validiere LayoutStyle
    if (body.layoutStyle && !['STANDARD', 'MODERN'].includes(body.layoutStyle)) {
      return NextResponse.json(
        {
          success: false,
          message: 'layoutStyle muss STANDARD oder MODERN sein',
        },
        { status: 400 }
      );
    }

    // Hole oder erstelle Settings
    let settings = await prisma.userSettings.findFirst();
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    // Aktualisiere nur die Felder die gesendet wurden
    const updateData = {};
    const allowedFields = [
      'colorMode',
      'layoutStyle',
      'primaryColor',
      'secondaryColor',
      'bgMain',
      'bgCard',
      'accentColor',
      'compactMode',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    settings = await prisma.userSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Einstellungen aktualisiert',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Aktualisieren der Einstellungen',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT /api/settings (Reset zu Defaults)
// Setzt alle Einstellungen auf Standard zurück
// ============================================================================
export async function PUT(request) {
  try {
    const body = await request.json();
    const { reset } = body;

    if (reset !== true) {
      return NextResponse.json(
        { success: false, message: 'reset flag erforderlich' },
        { status: 400 }
      );
    }

    let settings = await prisma.userSettings.findFirst();

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: DEFAULT_SETTINGS,
      });
    } else {
      settings = await prisma.userSettings.update({
        where: { id: settings.id },
        data: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Einstellungen auf Standard zurückgesetzt',
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Fehler beim Zurücksetzen der Einstellungen',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Hilfsfunktionen
// ============================================================================

/**
 * Prüft ob eine Farbe ein gültiges HEX-Format ist
 */
function isValidHex(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}
