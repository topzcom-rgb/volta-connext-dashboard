import { getSupabaseClient } from '../supabase-client';

export async function onRequestGet(context: any) {
  try {
    const supabase = getSupabaseClient(context.env);
    const { data, error } = await supabase
      .from('station_owners')
      .select('charger_name, phone_number')
      .order('charger_name', { ascending: true });

    if (!error && data && data.length > 0) {
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }

    // Fallback to D1
    const db = context.env.DB;
    if (db) {
      const { results } = await db.prepare("SELECT charger_name, phone_number FROM station_owners ORDER BY charger_name").all();
      return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPut(context: any) {
  try {
    const { request, env } = context;
    const { charger_name, phone_number } = await request.json();
    
    // Clean phone numbers: split by comma, trim, remove non-digits, join with comma
    let cleaned = '';
    if (phone_number) {
      cleaned = phone_number
        .split(',')
        .map((p: string) => p.trim().replace(/[^0-9]/g, ''))
        .filter((p: string) => p.length > 0)
        .join(', ');
    }

    // 1. Update Supabase
    const supabase = getSupabaseClient(env);
    await supabase
      .from('station_owners')
      .upsert({ charger_name, phone_number: cleaned }, { onConflict: 'charger_name' });

    // 2. Update D1 if available
    try {
      const db = env.DB;
      if (db) {
        await db.prepare("INSERT OR REPLACE INTO station_owners (charger_name, phone_number) VALUES (?, ?)").bind(charger_name, cleaned).run();
      }
    } catch (e) {}

    return new Response(JSON.stringify({ success: true, phone_number: cleaned }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}