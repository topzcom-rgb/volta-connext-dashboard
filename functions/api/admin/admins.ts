import { getSupabaseClient } from '../supabase-client';

export async function onRequestGet(context: any) {
  try {
    const supabase = getSupabaseClient(context.env);
    const { data, error } = await supabase
      .from('admin_users')
      .select('phone_number')
      .order('phone_number', { ascending: true });

    if (!error && data && data.length > 0) {
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }

    const db = context.env.DB;
    if (db) {
      const { results } = await db.prepare("SELECT phone_number FROM admins ORDER BY phone_number ASC").all();
      return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify([{ phone_number: '0814032847' }, { phone_number: '0953198558' }]), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const { phone_number } = await request.json();
    const cleanPhone = phone_number?.trim().replace(/[^0-9]/g, '');
    
    if (!cleanPhone || cleanPhone.length !== 10) {
      return new Response(JSON.stringify({ error: 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = getSupabaseClient(env);
    const { data: existing } = await supabase
      .from('admin_users')
      .select('phone_number')
      .eq('phone_number', cleanPhone)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'เบอร์นี้เป็น Admin อยู่แล้ว' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await supabase.from('admin_users').insert({ phone_number: cleanPhone });

    try {
      const db = env.DB;
      if (db) {
        await db.prepare("INSERT OR IGNORE INTO admins (phone_number) VALUES (?)").bind(cleanPhone).run();
      }
    } catch (e) {}

    return new Response(JSON.stringify({ success: true, phone_number: cleanPhone }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestDelete(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone')?.trim();

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Missing phone' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = getSupabaseClient(env);
    const { count } = await supabase.from('admin_users').select('*', { count: 'exact', head: true });
    if (count !== null && count <= 1) {
      return new Response(JSON.stringify({ error: 'ไม่สามารถลบได้ เนื่องจากต้องมี Admin อย่างน้อย 1 เบอร์' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await supabase.from('admin_users').delete().eq('phone_number', phone);

    try {
      const db = env.DB;
      if (db) {
        await db.prepare("DELETE FROM admins WHERE phone_number = ?").bind(phone).run();
      }
    } catch (e) {}

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
