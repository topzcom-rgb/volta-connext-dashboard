import { getSupabaseClient } from '../supabase-client';

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { snapshotEntries, stats, stations } = body;

    const supabase = getSupabaseClient(env);

    // 1. Sync station_owners table in Supabase
    if (stations && stations.length > 0) {
      const EXCLUDED_STATIONS = ['สถานีชาร์จลานจอดรถพิษณุโลก', 'สถานีชาร์จริมน่าน'];
      const stRows = stations
        .filter((st: string) => st && !EXCLUDED_STATIONS.includes(st))
        .map((st: string) => ({ charger_name: st }));

      try {
        await supabase
          .from('station_owners')
          .upsert(stRows, { onConflict: 'charger_name', ignoreDuplicates: true });
      } catch (e) {
        console.warn('Supabase station_owners sync notice:', e);
      }
    }

    // 2. Batch insert snapshots safely to Supabase
    if (snapshotEntries && snapshotEntries.length > 0) {
      const nowStr = new Date().toISOString();
      const rows = snapshotEntries.map((item: any) => ({
        snapshot_key: item.key,
        snapshot_data: item.data,
        updated_at: nowStr
      }));

      const CHUNK_SIZE = 50;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
          .from('system_snapshots')
          .upsert(chunk, { onConflict: 'snapshot_key' });
        if (error) {
          console.warn('Supabase snapshot save error:', error);
        }
      }
    }

    // 3. Dual-sync to D1 if available
    try {
      const db = env.DB;
      if (db) {
        const nowStr = new Date().toISOString();
        const insertSnapStmt = db.prepare('INSERT OR REPLACE INTO system_snapshots (snapshot_key, snapshot_data, updated_at) VALUES (?, ?, ?)');
        const CHUNK_SIZE = 25;
        for (let i = 0; i < snapshotEntries.length; i += CHUNK_SIZE) {
          const chunk = snapshotEntries.slice(i, i + CHUNK_SIZE);
          const stmts = chunk.map((item: any) => insertSnapStmt.bind(item.key, JSON.stringify(item.data), nowStr));
          await db.batch(stmts);
        }
      }
    } catch (d1Err) {
      console.warn('D1 sync notice:', d1Err);
    }

    return new Response(JSON.stringify({
      success: true,
      savedSnapshots: snapshotEntries?.length || 0,
      stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Save Snapshots Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal Server Error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
