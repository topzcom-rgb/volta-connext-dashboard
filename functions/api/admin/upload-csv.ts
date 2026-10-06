import { getSupabaseClient } from '../supabase-client';

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const { mode, batchIndex, totalBatches, rows } = body;
    const supabase = getSupabaseClient(env);
    const EXCLUDED_STATIONS = ['สถานีชาร์จลานจอดรถพิษณุโลก', 'สถานีชาร์จริมน่าน'];

    // 1. If replace mode and first batch, clear previous data in Supabase
    if (mode === 'replace' && batchIndex === 0) {
      try {
        await supabase.from('charging_data').delete().neq('id', 0);
      } catch (e) {
        console.warn('Supabase clear notice:', e);
      }

      // Also clean D1 if available
      try {
        const db = env.DB;
        if (db) await db.prepare("DELETE FROM charging_data;").run();
      } catch (e) {}
    }

    // 2. Normalize and filter valid rows
    const validRows = (rows || []).map((r: any) => {
      const charger_name = (r.charger_name || r.station || r.station_name || '').trim();
      const date = (r.date || r.start_time?.slice(0, 10) || '').trim();
      const start_time = (r.start_time || '').trim();
      const stop_time = (r.stop_time || '').trim();
      const charger_head = (r.charger_head || r.connector_id || r.connector || '').trim();
      const vcard = (r.vcard || r.user_id || r.rfid || '').trim();
      const durations = (r.durations || r.total_time || r.duration || '').trim();
      const energy_kwh = parseFloat(r.energy_kwh ?? r.total_energy ?? r.energy) || 0;
      const revenue_baht = parseFloat(r.revenue_baht ?? r.total_amount ?? r.revenue ?? r.total_fee) || 0;

      return {
        date,
        charger_name,
        charger_head: charger_head || null,
        vcard: vcard || null,
        start_time: start_time || null,
        stop_time: stop_time || null,
        durations,
        energy_kwh,
        revenue_baht
      };
    }).filter((r: any) => r.charger_name && !EXCLUDED_STATIONS.includes(r.charger_name) && r.date);

    // 3. Batch insert into Supabase charging_data
    if (validRows.length > 0) {
      const { error: supaErr } = await supabase.from('charging_data').insert(validRows);
      if (supaErr) {
        console.warn('Supabase raw insert warning:', supaErr);
      }
    }

    // 4. If this is the last batch, sync station_owners table
    let stats = null;
    if (batchIndex === totalBatches - 1) {
      const { data: distinctStations } = await supabase
        .from('charging_data')
        .select('charger_name');

      const stSet = new Set((distinctStations || []).map((s: any) => s.charger_name).filter(Boolean));
      const stRows = Array.from(stSet).map((st: string) => ({ charger_name: st }));

      if (stRows.length > 0) {
        await supabase.from('station_owners').upsert(stRows, { onConflict: 'charger_name', ignoreDuplicates: true });
      }

      const { count } = await supabase.from('charging_data').select('*', { count: 'exact', head: true });
      stats = {
        totalRows: count || 0,
        stationsCount: stSet.size
      };
    }

    return new Response(JSON.stringify({
      success: true,
      batchIndex,
      insertedCount: validRows.length,
      stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Upload CSV Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
