import { getFallbackAllowedStations, getFallbackDashboard } from './fallback-service';
import { getSupabaseClient } from './supabase-client';

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const phone = url.searchParams.get('phone');
  const role = url.searchParams.get('role');
  const filterMonth = url.searchParams.get('month') || 'all';
  const filterStation = url.searchParams.get('station') || 'all';

  let allowedStations: string[] = [];

  try {
    const db = env.DB;
    const EXCLUDED_STATIONS = ['สถานีชาร์จลานจอดรถพิษณุโลก', 'สถานีชาร์จริมน่าน'];

    const supabase = getSupabaseClient(env);

    try {
      if (role === 'admin') {
        const { data: stRows } = await supabase
          .from('station_owners')
          .select('charger_name')
          .order('charger_name', { ascending: true });
        if (stRows && stRows.length > 0) {
          allowedStations = stRows
            .map((r: any) => r.charger_name)
            .filter((name: string) => name && !EXCLUDED_STATIONS.includes(name));
        } else {
          allowedStations = getFallbackAllowedStations(phone, role);
        }
      } else if (role === 'owner' && phone) {
        const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
        const { data: ownRows } = await supabase
          .from('station_owners')
          .select('charger_name, phone_number');

        if (ownRows && ownRows.length > 0) {
          allowedStations = ownRows
            .filter((r: any) => {
              if (!r.phone_number) return false;
              const phones = r.phone_number.split(',').map((p: string) => p.trim().replace(/[^0-9]/g, ''));
              return phones.includes(cleanPhone);
            })
            .map((r: any) => r.charger_name)
            .filter((name: string) => name && !EXCLUDED_STATIONS.includes(name));
        }
      }
    } catch (supaErr: any) {
      console.warn('Supabase allowedStations notice:', supaErr?.message);
    }

    if (allowedStations.length === 0) {
      allowedStations = getFallbackAllowedStations(phone, role);
    }

    if (allowedStations.length === 0) {
      return new Response(JSON.stringify({ error: 'ไม่พบข้อมูลสถานีที่เชื่อมโยงกับบัญชีนี้' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Determine target stations based on filterStation
    let targetStations = [...allowedStations];
    if (filterStation !== 'all' && allowedStations.includes(filterStation)) {
      targetStations = [filterStation];
    }

    // 1. High-Performance Supabase Snapshot Check
    try {
      if (filterStation !== 'all' || role === 'admin') {
        const snapKey = `dashboard__${filterStation}__${filterMonth}`;
        const { data: snapRow } = await supabase
          .from('system_snapshots')
          .select('snapshot_data')
          .eq('snapshot_key', snapKey)
          .maybeSingle();

        if (snapRow?.snapshot_data) {
          const snap = typeof snapRow.snapshot_data === 'string' ? JSON.parse(snapRow.snapshot_data) : snapRow.snapshot_data;
          const isComplete = (filterStation === 'all' && filterMonth === 'all')
            ? (snap?.stats?.sessionsCount >= 36000)
            : (snap?.stats?.sessionsCount > 0);
          if (isComplete) {
            snap.allowedStations = allowedStations;
            return new Response(JSON.stringify(snap), { headers: { 'Content-Type': 'application/json' } });
          }
        }
      }
    } catch (snapErr: any) {
      console.warn('Supabase snapshot lookup notice:', snapErr?.message);
    }

    const inClause = targetStations.map(() => '?').join(',');
    const baseWhere = "charger_name IN (" + inClause + ")" + (filterMonth !== 'all' ? " AND date LIKE ?" : "");
    const baseParams = [...targetStations];
    if (filterMonth !== 'all') {
      baseParams.push(filterMonth + '-%');
    }

    const DURATION_SQL = "(CAST(substr(durations, 1, instr(durations, ':') - 1) AS INTEGER) * 60 + CAST(substr(durations, instr(durations, ':') + 1, 2) AS INTEGER) + CAST(substr(durations, instr(durations, ':') + 4, 2) AS REAL) / 60)";

    // 1. Available Months (from all allowed stations)
    const { results: allDates } = await db.prepare(
      "SELECT DISTINCT substr(date, 1, 7) as ym FROM charging_data WHERE charger_name IN (" + allowedStations.map(() => '?').join(',') + ") ORDER BY ym DESC"
    ).bind(...allowedStations).all();
    const availableMonths = (allDates || []).map(r => r.ym);

    // 2. Station Leaderboard & Summary
    const { results: stationRows } = await db.prepare(`
      SELECT 
        charger_name as name,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy,
        ROUND(SUM(revenue_baht), 2) as revenue,
        ROUND(SUM(${DURATION_SQL}), 1) as timeMins
      FROM charging_data 
      WHERE ${baseWhere}
      GROUP BY charger_name
    `).bind(...baseParams).all();

    let totalEnergy = 0;
    let totalRevenue = 0;
    let totalTimeMins = 0;
    let sessionsCount = 0;

    (stationRows || []).forEach(r => {
      totalEnergy += r.energy || 0;
      totalRevenue += r.revenue || 0;
      totalTimeMins += r.timeMins || 0;
      sessionsCount += r.sessions || 0;
    });

    if (!stationRows || stationRows.length === 0 || (filterStation === 'all' && filterMonth === 'all' && sessionsCount < 36000)) {
      const fbData = getFallbackDashboard(allowedStations, filterStation, filterMonth);
      if (fbData) {
        return new Response(JSON.stringify(fbData), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    const stationLeaderboard = (stationRows || []).map(st => ({
      name: st.name,
      sessions: st.sessions,
      energy: Math.round(st.energy),
      revenue: Math.round(st.revenue),
      timeMins: Math.round(st.timeMins),
      sharePct: totalEnergy > 0 ? parseFloat(((st.energy / totalEnergy) * 100).toFixed(1)) : 0,
      avgSpeedKw: st.timeMins > 0 ? parseFloat((st.energy / (st.timeMins / 60)).toFixed(1)) : 0,
      avgDurationMins: st.sessions > 0 ? Math.round(st.timeMins / st.sessions) : 0
    })).sort((a, b) => b.revenue - a.revenue);

    // 3. Monthly Chart
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const { results: monthlyRows } = await db.prepare(`
      SELECT 
        substr(date, 1, 7) as ym,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy,
        ROUND(SUM(revenue_baht), 2) as revenue,
        ROUND(SUM(${DURATION_SQL}) / 60, 1) as timeHours
      FROM charging_data
      WHERE ${baseWhere}
      GROUP BY ym
      ORDER BY ym ASC
    `).bind(...baseParams).all();

    const monthlyChart = (monthlyRows || []).map(r => {
      const p = r.ym.split('-');
      const y = parseInt(p[0], 10);
      const m = parseInt(p[1], 10) - 1;
      const thName = thaiMonths[m] ? (thaiMonths[m] + ' ' + y) : r.ym;
      return {
        name: thName,
        month: r.ym,
        sessions: r.sessions,
        energy: Math.round(r.energy),
        revenue: Math.round(r.revenue),
        time: Math.round(r.timeHours),
        timeHrs: Math.round(r.timeHours)
      };
    });

    // 4. Hourly Chart (00 - 23)
    const { results: hourlyRows } = await db.prepare(`
      SELECT 
        substr(start_time, 12, 2) as hr,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy
      FROM charging_data
      WHERE ${baseWhere}
      GROUP BY hr
      ORDER BY hr ASC
    `).bind(...baseParams).all();

    const hourlyMap = {};
    for (let i = 0; i < 24; i++) {
      const hStr = i.toString().padStart(2, '0');
      hourlyMap[hStr] = { name: hStr + ':00', hour: hStr + ':00', sessions: 0, energy: 0 };
    }
    (hourlyRows || []).forEach(r => {
      const hStr = (r.hr || '00').padStart(2, '0');
      if (hourlyMap[hStr]) {
        hourlyMap[hStr].sessions = r.sessions;
        hourlyMap[hStr].energy = Math.round(r.energy);
      }
    });
    const hourlyChart = Object.values(hourlyMap);

    // 5. Day of Week & TOU
    const dowNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const { results: dowTouRows } = await db.prepare(`
      SELECT 
        strftime('%w', date) as dow,
        CASE 
          WHEN strftime('%w', date) IN ('1','2','3','4','5') AND substr(start_time, 12, 2) >= '09' AND substr(start_time, 12, 2) < '22' THEN 'onPeak'
          ELSE 'offPeak'
        END as tou_type,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy,
        ROUND(SUM(revenue_baht), 2) as revenue
      FROM charging_data
      WHERE ${baseWhere}
      GROUP BY dow, tou_type
    `).bind(...baseParams).all();

    const dowMap = {};
    for (let i = 0; i < 7; i++) {
      dowMap[i] = { day: dowNames[i], sessions: 0, energy: 0, revenue: 0 };
    }

    const touData = {
      onPeak: { sessions: 0, energy: 0, revenue: 0 },
      offPeak: { sessions: 0, energy: 0, revenue: 0 }
    };

    (dowTouRows || []).forEach(r => {
      const d = parseInt(r.dow, 10);
      if (dowMap[d]) {
        dowMap[d].sessions += r.sessions || 0;
        dowMap[d].energy += r.energy || 0;
        dowMap[d].revenue += r.revenue || 0;
      }
      if (r.tou_type === 'onPeak') {
        touData.onPeak.sessions += r.sessions || 0;
        touData.onPeak.energy += r.energy || 0;
        touData.onPeak.revenue += r.revenue || 0;
      } else {
        touData.offPeak.sessions += r.sessions || 0;
        touData.offPeak.energy += r.energy || 0;
        touData.offPeak.revenue += r.revenue || 0;
      }
    });

    const shortDayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const fullDayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

    const dowChart = [1, 2, 3, 4, 5, 6, 0].map(d => ({
      name: shortDayNames[d],
      day: fullDayNames[d],
      dayIndex: d,
      sessions: dowMap[d].sessions,
      energy: Math.round(dowMap[d].energy),
      revenue: Math.round(dowMap[d].revenue)
    }));

    // 6. Duration Bins
    const { results: durationBinRows } = await db.prepare(`
      SELECT 
        CASE 
          WHEN ${DURATION_SQL} < 15 THEN 'quick'
          WHEN ${DURATION_SQL} < 45 THEN 'normal'
          WHEN ${DURATION_SQL} <= 90 THEN 'extended'
          ELSE 'long'
        END as bin,
        COUNT(*) as count,
        ROUND(SUM(energy_kwh), 2) as energy
      FROM charging_data
      WHERE ${baseWhere}
      GROUP BY bin
    `).bind(...baseParams).all();

    const durationBins = {
      quick: { key: 'quick', label: 'ชาร์จด่วน (< 15 นาที)', count: 0, energy: 0 },
      normal: { key: 'normal', label: 'ปกติ (15 - 45 นาที)', count: 0, energy: 0 },
      extended: { key: 'extended', label: 'ต่อเนื่อง (45 - 90 นาที)', count: 0, energy: 0 },
      long: { key: 'long', label: 'ชาร์จนาน (> 90 นาที)', count: 0, energy: 0 }
    };

    (durationBinRows || []).forEach(r => {
      if (durationBins[r.bin]) {
        durationBins[r.bin].count = r.count;
        durationBins[r.bin].energy = Math.round(r.energy);
      }
    });

    const durationList = Object.values(durationBins).map(d => ({
      ...d,
      share: sessionsCount > 0 ? parseFloat(((d.count / sessionsCount) * 100).toFixed(1)) : 0,
      countPct: sessionsCount > 0 ? parseFloat(((d.count / sessionsCount) * 100).toFixed(1)) : 0,
      energyPct: totalEnergy > 0 ? parseFloat(((d.energy / totalEnergy) * 100).toFixed(1)) : 0
    }));

    // 7. Customer Loyalty & Retention Segmentation
    const { results: userRows } = await db.prepare(`
      SELECT 
        vcard,
        COUNT(*) as cnt
      FROM charging_data
      WHERE ${baseWhere}
      GROUP BY vcard
    `).bind(...baseParams).all();

    const uniqueUsers = (userRows || []).length;
    let singleUsers = 0;
    let repeatUsers = 0;
    let regularUsers = 0;
    let championUsers = 0;

    (userRows || []).forEach(r => {
      const c = r.cnt;
      if (c === 1) singleUsers++;
      else if (c === 2) repeatUsers++;
      else if (c >= 3 && c <= 5) regularUsers++;
      else if (c >= 6) championUsers++;
    });

    const totalReturning = repeatUsers + regularUsers + championUsers;
    const retentionRate = uniqueUsers > 0 ? parseFloat(((totalReturning / uniqueUsers) * 100).toFixed(1)) : 0;
    const avgFrequency = uniqueUsers > 0 ? parseFloat((sessionsCount / uniqueUsers).toFixed(1)) : 0;

    const customerSegments = [
      {
        key: 'repeat',
        label: 'ลูกค้ากลับมาใช้ซ้ำ (2 ครั้ง)',
        desc: 'ใช้บริการ 2 ครั้ง',
        count: repeatUsers,
        share: uniqueUsers > 0 ? parseFloat(((repeatUsers / uniqueUsers) * 100).toFixed(1)) : 0
      },
      {
        key: 'regular',
        label: 'ลูกค้าประจำ (3-5 ครั้ง)',
        desc: 'ใช้บริการ 3 - 5 ครั้ง (ใน 60–90 วัน)',
        count: regularUsers,
        share: uniqueUsers > 0 ? parseFloat(((regularUsers / uniqueUsers) * 100).toFixed(1)) : 0
      },
      {
        key: 'champion',
        label: 'ลูกค้าประจำสูง (6 ครั้งขึ้นไป)',
        desc: 'ใช้บริการ 6 ครั้งขึ้นไป (หรือเฉลี่ย ≥ 2 ครั้ง/เดือน)',
        count: championUsers,
        share: uniqueUsers > 0 ? parseFloat(((championUsers / uniqueUsers) * 100).toFixed(1)) : 0
      },
      {
        key: 'single',
        label: 'ลูกค้าใหม่ / ครั้งเดียว (1 ครั้ง)',
        desc: 'ใช้บริการ 1 ครั้ง',
        count: singleUsers,
        share: uniqueUsers > 0 ? parseFloat(((singleUsers / uniqueUsers) * 100).toFixed(1)) : 0
      }
    ];

    // 8. Daily Summary & Hourly Heatmap Pivot
    const { results: dailyHourlyRows } = await db.prepare(`
      SELECT 
        date,
        substr(start_time, 12, 2) as hr,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy,
        ROUND(SUM(revenue_baht), 2) as revenue,
        ROUND(SUM(${DURATION_SQL}), 1) as timeMins
      FROM charging_data
      WHERE ${baseWhere}
      GROUP BY date, hr
      ORDER BY date ASC, hr ASC
    `).bind(...baseParams).all();

    const formatThaiDate = (dateStr) => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[0], 10);
        return d + ' ' + (thaiMonths[m] || '') + ' ' + y;
      }
      return dateStr;
    };

    const getDOW = (dateStr) => {
      const d = new Date(dateStr + 'T00:00:00Z');
      return shortDayNames[d.getUTCDay()];
    };

    const dailyData = {};
    const pivotData = {};
    const hourTotals = {};
    for (let i = 0; i < 24; i++) {
      hourTotals[i.toString().padStart(2, '0')] = 0;
    }

    (dailyHourlyRows || []).forEach(r => {
      const dKey = r.date;
      const hStr = (r.hr || '00').padStart(2, '0');
      const e = r.energy || 0;
      const rev = r.revenue || 0;
      const s = r.sessions || 0;
      const t = r.timeMins || 0;

      // Daily table map
      if (!dailyData[dKey]) {
        dailyData[dKey] = {
          date: dKey,
          formattedDate: formatThaiDate(dKey),
          energy: 0,
          revenue: 0,
          sessions: 0,
          time: 0
        };
      }
      dailyData[dKey].energy += e;
      dailyData[dKey].revenue += rev;
      dailyData[dKey].sessions += s;
      dailyData[dKey].time += t;

      // Pivot heatmap map
      if (!pivotData[dKey]) {
        pivotData[dKey] = {
          date: dKey,
          formattedDate: formatThaiDate(dKey),
          dow: getDOW(dKey),
          total: 0
        };
      }
      pivotData[dKey][hStr] = (pivotData[dKey][hStr] || 0) + e;
      pivotData[dKey].total += e;
      hourTotals[hStr] = (hourTotals[hStr] || 0) + e;
    });

    const dailyTable = Object.values(dailyData).sort((a, b) => b.date.localeCompare(a.date)).map(d => ({
      ...d,
      avgEnergy: d.sessions > 0 ? (d.energy / d.sessions) : 0,
      avgTime: d.sessions > 0 ? (d.time / d.sessions) : 0,
      avgRevenue: d.sessions > 0 ? (d.revenue / d.sessions) : 0
    }));

    // Populate missing calendar days if a specific month is selected
    if (filterMonth && filterMonth !== 'all') {
      const parts = filterMonth.split('-');
      if (parts.length === 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m)) {
          const daysInMonth = new Date(y, m, 0).getDate();
          for (let day = 1; day <= daysInMonth; day++) {
            const dayStr = day.toString().padStart(2, '0');
            const dKey = parts[0] + '-' + parts[1].padStart(2, '0') + '-' + dayStr;
            if (!pivotData[dKey]) {
              pivotData[dKey] = {
                date: dKey,
                formattedDate: formatThaiDate(dKey),
                dow: getDOW(dKey),
                total: 0
              };
            }
          }
        }
      }
    }

    const pivotRows = Object.values(pivotData).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate max cell value for heatmap
    let maxCellVal = 0;
    pivotRows.forEach(row => {
      for (let i = 0; i < 24; i++) {
        const h = i.toString().padStart(2, '0');
        if (row[h] && row[h] > maxCellVal) {
          maxCellVal = row[h];
        }
      }
    });

    // Operational Stats
    const totalChargingHours = totalTimeMins / 60;
    const avgChargingSpeedKw = totalChargingHours > 0 ? (totalEnergy / totalChargingHours) : 0;
    const uniqueDaysCount = Object.keys(dailyData).length || 1;
    const activeStationsCount = filterStation === 'all' ? allowedStations.length : 1;
    const totalAvailableHours = uniqueDaysCount * 24 * activeStationsCount;
    const utilizationRate = totalAvailableHours > 0 ? (totalChargingHours / totalAvailableHours) * 100 : 0;
    const avgHoursPerDay = uniqueDaysCount > 0 ? (totalChargingHours / uniqueDaysCount / activeStationsCount) : 0;

    return new Response(JSON.stringify({
      allowedStations,
      availableMonths,
      stats: { 
        totalEnergy: Math.round(totalEnergy * 100) / 100, 
        totalRevenue: Math.round(totalRevenue),
        totalTimeMins: Math.round(totalTimeMins), 
        sessionsCount,
        avgEnergy: sessionsCount > 0 ? totalEnergy / sessionsCount : 0,
        avgRevenue: sessionsCount > 0 ? totalRevenue / sessionsCount : 0,
        avgTimeMins: sessionsCount > 0 ? totalTimeMins / sessionsCount : 0,
        avgChargingSpeedKw: parseFloat(avgChargingSpeedKw.toFixed(1)),
        utilizationRate: parseFloat(utilizationRate.toFixed(1)),
        avgHoursPerDay: parseFloat(avgHoursPerDay.toFixed(1))
      },
      customerStats: {
        uniqueUsers,
        totalReturning,
        returningUsers: totalReturning,
        singleUsers,
        repeatUsers,
        regularUsers,
        championUsers,
        retentionRate,
        avgFrequency,
        customerSegments
      },
      touStats: {
        onPeak: {
          sessions: touData.onPeak.sessions,
          energy: Math.round(touData.onPeak.energy),
          revenue: Math.round(touData.onPeak.revenue)
        },
        offPeak: {
          sessions: touData.offPeak.sessions,
          energy: Math.round(touData.offPeak.energy),
          revenue: Math.round(touData.offPeak.revenue)
        },
        onPeakEnergyPct: totalEnergy > 0 ? parseFloat(((touData.onPeak.energy / totalEnergy) * 100).toFixed(1)) : 0,
        offPeakEnergyPct: totalEnergy > 0 ? parseFloat(((touData.offPeak.energy / totalEnergy) * 100).toFixed(1)) : 0,
        onPeakSessionsPct: sessionsCount > 0 ? parseFloat(((touData.onPeak.sessions / sessionsCount) * 100).toFixed(1)) : 0,
        offPeakSessionsPct: sessionsCount > 0 ? parseFloat(((touData.offPeak.sessions / sessionsCount) * 100).toFixed(1)) : 0
      },
      durationList,
      stationLeaderboard,
      monthlyChart,
      hourlyChart,
      dowChart,
      dailyTable,
      pivot: {
        rows: pivotRows,
        hourTotals,
        grandTotal: Math.round(totalEnergy),
        maxCellVal: maxCellVal || 1
      }
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.warn('D1 query error in dashboard.ts, serving fallback snapshot:', error?.message);
    const fallbackStations = allowedStations.length > 0 ? allowedStations : getFallbackAllowedStations(phone, role);
    if (fallbackStations.length > 0) {
      const fbData = getFallbackDashboard(fallbackStations, filterStation, filterMonth);
      if (fbData) {
        return new Response(JSON.stringify(fbData), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
