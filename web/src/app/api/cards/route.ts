import { NextRequest, NextResponse } from 'next/server';
import { getAllCards, addCard, deleteCard } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const source = searchParams.get('source') || undefined;

  if (type && type !== 'prompt' && type !== 'response') {
    return NextResponse.json({ error: 'type must be prompt or response' }, { status: 400 });
  }
  if (source && source !== 'original' && source !== 'custom') {
    return NextResponse.json({ error: 'source must be original or custom' }, { status: 400 });
  }

  const cards = getAllCards(type, source);
  return NextResponse.json(cards);
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, text } = body;

  if (!type || !text) {
    return NextResponse.json({ error: 'type and text required' }, { status: 400 });
  }

  if (type !== 'prompt' && type !== 'response') {
    return NextResponse.json({ error: 'type must be prompt or response' }, { status: 400 });
  }

  const trimmed = String(text).trim();
  if (trimmed.length === 0) {
    return NextResponse.json({ error: 'text cannot be empty' }, { status: 400 });
  }
  if (trimmed.length > 500) {
    return NextResponse.json({ error: 'text too long (max 500 characters)' }, { status: 400 });
  }

  const card = addCard(type, trimmed);
  return NextResponse.json(card, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) {
    return NextResponse.json({ error: 'id must be a number' }, { status: 400 });
  }

  const success = deleteCard(parsed);
  if (!success) {
    return NextResponse.json(
      { error: 'Card not found or is an original card' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
