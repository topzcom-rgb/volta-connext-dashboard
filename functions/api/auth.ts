import { FALLBACK_ADMINS, FALLBACK_OWNERS } from './fallback-data';
import { getSupabaseClient } from './supabase-client';

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const { phone } = await request.json();
    const cleanPhone = phone?.trim().replace(/[^0-9]/g, '');

    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(JSON.stringify({ error: 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 1. Authenticate against Supabase
    try {
      const supabase = getSupabaseClient(env);

      // 1.1 Check Admin Users
      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('phone_number')
        .eq('phone_number', cleanPhone)
        .maybeSingle();

      if (!adminErr && adminUser) {
        return new Response(JSON.stringify({ role: 'admin', phone: cleanPhone }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 1.2 Check Station Owners (supports multiple comma-separated phone numbers per station)
      const { data: stationRows, error: ownerErr } = await supabase
        .from('station_owners')
        .select('charger_name, phone_number');

      if (!ownerErr && stationRows && stationRows.length > 0) {
        const matchedStations = stationRows.filter((r: any) => {
          if (!r.phone_number) return false;
          const phones = r.phone_number.split(',').map((p: string) => p.trim().replace(/[^0-9]/g, ''));
          return phones.includes(cleanPhone);
        });

        if (matchedStations.length > 0) {
          const stations = matchedStations.map((s: any) => ({
            charger_name: s.charger_name,
            phone_number: cleanPhone
          }));
          return new Response(JSON.stringify({ role: 'owner', phone: cleanPhone, stations }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    } catch (supaErr: any) {
      console.warn('Supabase auth query notice, checking fallback:', supaErr?.message);
    }

    // 2. Fallback to Known Admins & Owners (offline/redundant store)
    if (FALLBACK_ADMINS.includes(cleanPhone)) {
      return new Response(JSON.stringify({ role: 'admin', phone: cleanPhone }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (FALLBACK_OWNERS[cleanPhone]) {
      const stations = FALLBACK_OWNERS[cleanPhone].map(charger_name => ({ charger_name, phone_number: cleanPhone }));
      return new Response(JSON.stringify({ role: 'owner', phone: cleanPhone, stations }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ error: 'ไม่พบเบอร์โทรศัพท์นี้ในระบบ (กรุณาติดต่อผู้ดูแลระบบ)' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}