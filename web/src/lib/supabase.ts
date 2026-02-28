import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Card } from './types';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  supabase = createClient(url, key);
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;
}

export async function supabaseGetAllCards(type?: string, source?: string): Promise<Card[]> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');

  let query = client.from('cards').select('id, type, text, source, is_top_scored');

  if (type) query = query.eq('type', type);
  if (source) query = query.eq('source', source);

  const { data, error } = await query.order('id');
  if (error) throw error;
  return data as Card[];
}

export async function supabaseGetCardsByType(): Promise<{ prompts: Card[]; responses: Card[] }> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');

  const { data: prompts, error: e1 } = await client
    .from('cards')
    .select('id, type, text, source, is_top_scored')
    .eq('type', 'prompt');
  if (e1) throw e1;

  const { data: responses, error: e2 } = await client
    .from('cards')
    .select('id, type, text, source, is_top_scored')
    .eq('type', 'response');
  if (e2) throw e2;

  return { prompts: prompts as Card[], responses: responses as Card[] };
}

export async function supabaseAddCard(type: 'prompt' | 'response', text: string): Promise<Card> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('cards')
    .insert({ type, text, source: 'custom', is_top_scored: false })
    .select('id, type, text, source, is_top_scored')
    .single();
  if (error) throw error;
  return data as Card;
}

export async function supabaseDeleteCard(id: number): Promise<boolean> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');

  const { error, count } = await client
    .from('cards')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('source', 'custom');
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function supabaseRateCards(
  playerName: string,
  ratings: { cardId: number; rating: number }[],
  roundNumber: number
): Promise<void> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');

  const rows = ratings.map((r) => ({
    card_id: r.cardId,
    player_name: playerName,
    rating: r.rating,
    round_number: roundNumber,
  }));

  const { error } = await client.from('card_ratings').insert(rows);
  if (error) throw error;
}

export async function supabaseGetCardRatings(cardId: number): Promise<{ avg: number; count: number }> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase not configured');

  const { data, error } = await client
    .from('card_ratings')
    .select('rating')
    .eq('card_id', cardId);
  if (error) throw error;

  if (!data || data.length === 0) return { avg: 0, count: 0 };
  const sum = data.reduce((a: number, b: { rating: number }) => a + b.rating, 0);
  return { avg: sum / data.length, count: data.length };
}
