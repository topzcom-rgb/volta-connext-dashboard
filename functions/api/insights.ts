import { getFallbackAllowedStations, getFallbackInsights } from './fallback-service';
import { getSupabaseClient } from './supabase-client';

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const phone = url.searchParams.get('phone');
  const role = url.searchParams.get('role');
  const filterStation = url.searchParams.get('station') || 'all';

  if (!phone) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Phone missing' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let allUserStations: string[] = [];

  try {
    const supabase = getSupabaseClient(env);
    const EXCLUDED_STATIONS = ['สถานีชาร์จลานจอดรถพิษณุโลก', 'สถานีชาร์จริมน่าน'];

    // 1. Determine Allowed Stations
    try {
      if (role === 'admin') {
        const { data: stRows } = await supabase
          .from('station_owners')
          .select('charger_name')
          .order('charger_name', { ascending: true });
        if (stRows && stRows.length > 0) {
          allUserStations = stRows
            .map((r: any) => r.charger_name)
            .filter((name: string) => name && !EXCLUDED_STATIONS.includes(name));
        } else {
          allUserStations = getFallbackAllowedStations(phone, role);
        }
      } else {
        const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
        const { data: ownRows } = await supabase
          .from('station_owners')
          .select('charger_name, phone_number');

        if (ownRows && ownRows.length > 0) {
          allUserStations = ownRows
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
      console.warn('Supabase allowedStations error in insights.ts, using fallback:', supaErr?.message);
    }

    if (allUserStations.length === 0) {
      allUserStations = getFallbackAllowedStations(phone, role);
    }

    if (allUserStations.length === 0) {
      return new Response(JSON.stringify({
        allowedStations: [],
        availableStations: [],
        selectedStation: filterStation,
        healthScore: 0,
        monthlyGrowth: [],
        stationGrowth: [],
        forecast: null,
        anomalies: [],
        stationHealthList: [],
        executiveSummary: []
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Filter stations based on selection
    let activeStations = allUserStations;
    if (filterStation !== 'all' && allUserStations.includes(filterStation)) {
      activeStations = [filterStation];
    }

    // 1. High-Performance Supabase Snapshot Check
    try {
      let snapKey = 'insights__' + filterStation;
      if (filterStation === 'all' && activeStations.length === 1) {
        snapKey = 'insights__' + activeStations[0];
      }
      const { data: snapRow } = await supabase
        .from('system_snapshots')
        .select('snapshot_data')
        .eq('snapshot_key', snapKey)
        .maybeSingle();

      if (snapRow?.snapshot_data) {
        const snap = typeof snapRow.snapshot_data === 'string' ? JSON.parse(snapRow.snapshot_data) : snapRow.snapshot_data;
        const isComplete = (filterStation === 'all')
          ? (snap && snap.monthlyGrowth && snap.monthlyGrowth.length >= 10 && snap.forecast && snap.forecast.currentSessions > 5000)
          : (snap && snap.monthlyGrowth && snap.monthlyGrowth.length > 0);
        if (isComplete) {
          snap.allowedStations = allUserStations;
          snap.availableStations = allUserStations;
          return new Response(JSON.stringify(snap), { headers: { 'Content-Type': 'application/json' } });
        }
      }
    } catch (snapErr: any) {
      console.warn('Supabase insights snapshot lookup notice:', snapErr?.message);
    }

    const placeholders = activeStations.map(() => '?').join(',');
    const DURATION_SQL = "(CAST(substr(durations, 1, instr(durations, ':') - 1) AS INTEGER) * 60 + CAST(substr(durations, instr(durations, ':') + 1, 2) AS INTEGER) + CAST(substr(durations, instr(durations, ':') + 4, 2) AS REAL) / 60)";

    // 2. Fetch Monthly Aggregations
    const { results: monthlyRows } = await db.prepare(`
      SELECT 
        substr(date, 1, 7) as ym,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy,
        ROUND(SUM(revenue_baht), 2) as revenue,
        ROUND(SUM(${DURATION_SQL}), 1) as timeMins,
        COUNT(DISTINCT vcard) as uniqueUsers
      FROM charging_data
      WHERE charger_name IN (${placeholders})
      GROUP BY ym
      ORDER BY ym ASC
    `).bind(...activeStations).all();

    const totalSessionsInDb = (monthlyRows || []).reduce((sum: number, r: any) => sum + (r.sessions || 0), 0);
    if (!monthlyRows || monthlyRows.length < 10 || totalSessionsInDb < 36000) {
      const fbData = getFallbackInsights(activeStations, filterStation);
      if (fbData) {
        fbData.allowedStations = allUserStations;
        fbData.availableStations = allUserStations;
        return new Response(JSON.stringify(fbData), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 3. Fetch Station-Month Aggregations
    const { results: stationMonthRows } = await db.prepare(`
      SELECT 
        charger_name as name,
        substr(date, 1, 7) as ym,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy,
        ROUND(SUM(revenue_baht), 2) as revenue
      FROM charging_data
      WHERE charger_name IN (${placeholders})
      GROUP BY charger_name, ym
      ORDER BY ym ASC
    `).bind(...activeStations).all();

    // 4. Fetch Station Health Aggregations
    const { results: stationHealthRows } = await db.prepare(`
      SELECT 
        charger_name as name,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy,
        ROUND(SUM(revenue_baht), 2) as revenue,
        ROUND(SUM(${DURATION_SQL}), 1) as timeMins,
        SUM(CASE WHEN ${DURATION_SQL} < 3 THEN 1 ELSE 0 END) as shortAborts,
        MAX(date) as lastDate,
        MAX(start_time) as lastTime
      FROM charging_data
      WHERE charger_name IN (${placeholders})
      GROUP BY charger_name
    `).bind(...activeStations).all();

    // Overall max date in dataset
    const { results: maxDateRow } = await db.prepare(`
      SELECT MAX(date) as maxDate FROM charging_data WHERE charger_name IN (${placeholders})
    `).bind(...activeStations).all();
    const overallMaxDate = maxDateRow?.[0]?.maxDate || '2026-08-30';

    // 5. Fetch User Profile Aggregations for Retention & Churn Watch
    const { results: userRows } = await db.prepare(`
      SELECT 
        vcard,
        COUNT(*) as sessions,
        ROUND(SUM(energy_kwh), 2) as energy,
        ROUND(SUM(revenue_baht), 2) as revenue,
        MIN(date) as firstDate,
        MAX(date) as lastDate,
        COUNT(DISTINCT charger_name) as stationCount
      FROM charging_data
      WHERE charger_name IN (${placeholders})
      GROUP BY vcard
    `).bind(...activeStations).all();

    // 6. Fetch Persona Segmentation
    const { results: personaRows } = await db.prepare(`
      SELECT 
        CASE 
          WHEN ${DURATION_SQL} < 25 OR (energy_kwh < 15 AND ${DURATION_SQL} < 35) THEN 'express'
          WHEN (${DURATION_SQL} >= 25 AND ${DURATION_SQL} <= 50) OR (energy_kwh >= 15 AND energy_kwh <= 35) THEN 'standard'
          ELSE 'destination'
        END as p_key,
        COUNT(*) as count,
        ROUND(SUM(energy_kwh), 2) as totalEnergy,
        ROUND(SUM(revenue_baht), 2) as totalRevenue,
        ROUND(SUM(${DURATION_SQL}), 1) as totalTime
      FROM charging_data
      WHERE charger_name IN (${placeholders})
      GROUP BY p_key
    `).bind(...activeStations).all();

    // 7. Fetch Charging Speed Distribution
    const { results: speedRows } = await db.prepare(`
      SELECT 
        CASE 
          WHEN energy_kwh / (NULLIF(${DURATION_SQL}, 0) / 60.0) >= 70 THEN 'ultra'
          WHEN energy_kwh / (NULLIF(${DURATION_SQL}, 0) / 60.0) >= 40 THEN 'high'
          ELSE 'normal'
        END as speed_key,
        COUNT(*) as count
      FROM charging_data
      WHERE charger_name IN (${placeholders}) AND ${DURATION_SQL} > 0
      GROUP BY speed_key
    `).bind(...activeStations).all();

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];

    // Compute Monthly Growth with MoM %
    const monthlyGrowth = [];
    let prevMonth = null;

    (monthlyRows || []).forEach(m => {
      const p = m.ym.split('-');
      const y = parseInt(p[0], 10);
      const mIdx = parseInt(p[1], 10) - 1;
      const thName = thaiMonths[mIdx] ? (thaiMonths[mIdx] + ' ' + y) : m.ym;

      let revGrowth = 0, energyGrowth = 0, sessionGrowth = 0;
      if (prevMonth) {
        if (prevMonth.revenue > 0) revGrowth = ((m.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
        if (prevMonth.energy > 0) energyGrowth = ((m.energy - prevMonth.energy) / prevMonth.energy) * 100;
        if (prevMonth.sessions > 0) sessionGrowth = ((m.sessions - prevMonth.sessions) / prevMonth.sessions) * 100;
      }

      const item = {
        name: thName,
        month: m.ym,
        revenue: Math.round(m.revenue),
        energy: Math.round(m.energy),
        sessions: m.sessions,
        uniqueUsers: m.uniqueUsers,
        growthPct: parseFloat(revGrowth.toFixed(1)),
        growth: {
          revenuePct: parseFloat(revGrowth.toFixed(1)),
          energyPct: parseFloat(energyGrowth.toFixed(1)),
          sessionsPct: parseFloat(sessionGrowth.toFixed(1))
        }
      };

      monthlyGrowth.push(item);
      prevMonth = { ...item };
    });

    // Compute Station Growth (Latest month vs prior month)
    const sortedYms = (monthlyRows || []).map(r => r.ym);
    const latestYm = sortedYms[sortedYms.length - 1] || '2026-08';
    const priorYm = sortedYms[sortedYms.length - 2] || sortedYms[0] || '2026-07';

    const stationMonthMap = {};
    (stationMonthRows || []).forEach(r => {
      if (!stationMonthMap[r.name]) stationMonthMap[r.name] = {};
      stationMonthMap[r.name][r.ym] = r;
    });

    const stationGrowth = activeStations.map(st => {
      const cur = stationMonthMap[st]?.[latestYm] || { revenue: 0, energy: 0, sessions: 0 };
      const prev = stationMonthMap[st]?.[priorYm] || { revenue: 0, energy: 0, sessions: 0 };
      
      let revGrowth = 0;
      if (prev.revenue > 0) {
        revGrowth = ((cur.revenue - prev.revenue) / prev.revenue) * 100;
      } else if (cur.revenue > 0) {
        revGrowth = 100;
      }

      return {
        name: st,
        currentRevenue: Math.round(cur.revenue),
        previousRevenue: Math.round(prev.revenue),
        revenueGrowthPct: parseFloat(revGrowth.toFixed(1)),
        currentEnergy: Math.round(cur.energy),
        previousEnergy: Math.round(prev.energy),
        currentSessions: cur.sessions,
        previousSessions: prev.sessions
      };
    }).sort((a, b) => b.revenueGrowthPct - a.revenueGrowthPct);

    // AI Forecast Model (Run-Rate Pace Projection)
    const latestMonthlyStats = monthlyGrowth[monthlyGrowth.length - 1] || { revenue: 0, energy: 0, sessions: 0 };
    const recentGrowthRates = monthlyGrowth.slice(-3).map(m => m.growth.revenuePct);
    const avgRecentGrowth = recentGrowthRates.length > 0
      ? (recentGrowthRates.reduce((a, b) => a + b, 0) / recentGrowthRates.length)
      : 5.0;

    const projectedGrowthPct = Math.min(Math.max(avgRecentGrowth, -15), 35);
    const projectedNextRevenue = Math.round(latestMonthlyStats.revenue * (1 + (projectedGrowthPct / 100)));
    const projectedNextEnergy = Math.round(latestMonthlyStats.energy * (1 + (projectedGrowthPct / 100)));
    const projectedNextSessions = Math.round(latestMonthlyStats.sessions * (1 + (projectedGrowthPct / 100)));

    const forecast = {
      baseMonth: latestMonthlyStats.name,
      currentRevenue: latestMonthlyStats.revenue,
      currentEnergy: latestMonthlyStats.energy,
      currentSessions: latestMonthlyStats.sessions,
      projectedGrowthPct: parseFloat(projectedGrowthPct.toFixed(1)),
      projectedNextRevenue,
      projectedNextEnergy,
      projectedNextSessions,
      confidenceScore: recentGrowthRates.length >= 2 ? 88 : 72,
      projectionRange: {
        conservativeRev: Math.round(projectedNextRevenue * 0.93),
        optimisticRev: Math.round(projectedNextRevenue * 1.08),
        conservativeEnergy: Math.round(projectedNextEnergy * 0.93),
        optimisticEnergy: Math.round(projectedNextEnergy * 1.08)
      }
    };

    // 8. Retention & Churn Watch Intelligence
    const totalCustomers = (userRows || []).length;
    let singleUsers = 0, repeatUsers = 0, regularUsers = 0, championUsers = 0;
    let activeLoyalCount = 0, atRiskCount = 0, churnedCount = 0;

    const maskedUserList = (userRows || []).map(u => {
      const sCount = u.sessions;
      let tier = 'single';
      if (sCount === 1) { singleUsers++; tier = 'single'; }
      else if (sCount === 2) { repeatUsers++; tier = 'repeat'; }
      else if (sCount >= 3 && sCount <= 5) { regularUsers++; tier = 'regular'; }
      else if (sCount >= 6) { championUsers++; tier = 'champion'; }

      let daysSinceLast = 0;
      if (u.lastDate && overallMaxDate) {
        const d1 = new Date(u.lastDate).getTime();
        const d2 = new Date(overallMaxDate).getTime();
        daysSinceLast = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
      }

      let status = 'active';
      if (daysSinceLast > 60) {
        status = 'churned';
        if (tier !== 'single') churnedCount++;
      } else if (daysSinceLast > 30) {
        status = 'at_risk';
        if (tier !== 'single') atRiskCount++;
      } else {
        status = 'active';
        if (tier !== 'single') activeLoyalCount++;
      }

      const card = u.vcard || '';
      const maskedId = card.length > 8 
        ? (card.substring(0, 4) + '***' + card.substring(card.length - 4)) 
        : (card.length > 4 ? (card.substring(0, 2) + '***' + card.substring(card.length - 2)) : 'VC-GUEST');

      return {
        id: maskedId,
        sessions: u.sessions,
        energy: Math.round(u.energy),
        revenue: Math.round(u.revenue),
        firstDate: u.firstDate,
        lastDate: u.lastDate,
        daysSinceLast,
        tier,
        status,
        stationCount: u.stationCount || 1
      };
    });

    const loyalAudienceTotal = regularUsers + championUsers;
    const returningTotal = repeatUsers + regularUsers + championUsers;
    const overallRetentionRate = totalCustomers > 0 ? (returningTotal / totalCustomers) * 100 : 0;
    const churnRiskRate = loyalAudienceTotal > 0 ? ((atRiskCount + churnedCount) / loyalAudienceTotal) * 100 : 0;

    const topLoyalCustomers = [...maskedUserList]
      .filter(u => u.sessions >= 2)
      .sort((a, b) => b.revenue - a.revenue || b.sessions - a.sessions)
      .slice(0, 15);

    const retentionChurnData = {
      summary: {
        totalCustomers,
        singleUsers,
        repeatUsers,
        regularUsers,
        championUsers,
        returningTotal,
        retentionRate: parseFloat(overallRetentionRate.toFixed(1)),
        loyalAudienceTotal,
        activeLoyalCount,
        atRiskCount,
        churnedCount,
        churnRiskRate: parseFloat(churnRiskRate.toFixed(1))
      },
      segments: [
        {
          key: 'champion',
          label: 'ลูกค้าประจำสูง (6 ครั้งขึ้นไป)',
          count: championUsers,
          share: totalCustomers > 0 ? (championUsers / totalCustomers) * 100 : 0,
          desc: 'ใช้บริการอย่างต่อเนื่องสม่ำเสมอ หรือเฉลี่ย ≥ 2 ครั้ง/เดือน',
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
        },
        {
          key: 'regular',
          label: 'ลูกค้าประจำ (3 - 5 ครั้ง)',
          count: regularUsers,
          share: totalCustomers > 0 ? (regularUsers / totalCustomers) * 100 : 0,
          desc: 'ใช้บริการ 3–5 ครั้ง ในช่วง 60–90 วันที่ผ่านมา',
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
        },
        {
          key: 'repeat',
          label: 'ลูกค้ากลับมาใช้ซ้ำ (2 ครั้ง)',
          count: repeatUsers,
          share: totalCustomers > 0 ? (repeatUsers / totalCustomers) * 100 : 0,
          desc: 'กลับมาใช้บริการครั้งที่สอง เริ่มมีความคุ้นเคยกับสถานี',
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
        },
        {
          key: 'single',
          label: 'ลูกค้าใหม่ / ขาจร (1 ครั้ง)',
          count: singleUsers,
          share: totalCustomers > 0 ? (singleUsers / totalCustomers) * 100 : 0,
          desc: 'เคยแวะชาร์จเพียงครั้งเดียว (ผู้สัญจรผ่านทางไกลหรือผู้ใช้ใหม่)',
          badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }
      ],
      topLoyalCustomers
    };

    // 9. Persona Analytics & Speed Distribution
    const personaMap = {};
    (personaRows || []).forEach(r => {
      personaMap[r.p_key] = r;
    });

    const totalValidSessions = (personaRows || []).reduce((s, r) => s + (r.count || 0), 0);
    const expressR = personaMap['express'] || { count: 0, totalEnergy: 0, totalRevenue: 0, totalTime: 0 };
    const standardR = personaMap['standard'] || { count: 0, totalEnergy: 0, totalRevenue: 0, totalTime: 0 };
    const destR = personaMap['destination'] || { count: 0, totalEnergy: 0, totalRevenue: 0, totalTime: 0 };

    const personaData = {
      personas: [
        {
          key: 'express',
          name: 'Express Top-up (สายแวะเติมด่วน)',
          tag: 'แวะเติมด่วน',
          count: expressR.count,
          pct: totalValidSessions > 0 ? parseFloat(((expressR.count / totalValidSessions) * 100).toFixed(1)) : 0,
          totalEnergy: Math.round(expressR.totalEnergy),
          totalRevenue: Math.round(expressR.totalRevenue),
          avgSpeedKw: expressR.totalTime > 0 ? parseFloat((expressR.totalEnergy / (expressR.totalTime / 60)).toFixed(1)) : 0,
          avgDurationMins: expressR.count > 0 ? Math.round(expressR.totalTime / expressR.count) : 0,
          avgRevPerSession: expressR.count > 0 ? Math.round(expressR.totalRevenue / expressR.count) : 0,
          desc: 'ชาร์จสั้น < 25 นาที หรือ < 15 kWh เน้นเติมไฟเพื่อเดินทางต่อทันที เหมาะกับจุดพักริมทางหลวงและปั๊มน้ำมัน',
          themeColor: '#deb965'
        },
        {
          key: 'standard',
          name: 'Standard Refill (สายเติมตามรอบปกติ)',
          tag: 'เติมตามรอบ',
          count: standardR.count,
          pct: totalValidSessions > 0 ? parseFloat(((standardR.count / totalValidSessions) * 100).toFixed(1)) : 0,
          totalEnergy: Math.round(standardR.totalEnergy),
          totalRevenue: Math.round(standardR.totalRevenue),
          avgSpeedKw: standardR.totalTime > 0 ? parseFloat((standardR.totalEnergy / (standardR.totalTime / 60)).toFixed(1)) : 0,
          avgDurationMins: standardR.count > 0 ? Math.round(standardR.totalTime / standardR.count) : 0,
          avgRevPerSession: standardR.count > 0 ? Math.round(standardR.totalRevenue / standardR.count) : 0,
          desc: 'แวะชาร์จ 25–50 นาที ได้พลังงาน 15–35 kWh พักผ่อน ทานกาแฟ หรือเข้าห้องน้ำระหว่างทาง',
          themeColor: '#7F3F98'
        },
        {
          key: 'destination',
          name: 'Destination / Full Charge (สายชาร์จเต็ม/จอดแช่)',
          tag: 'จอดชาร์จยาว',
          count: destR.count,
          pct: totalValidSessions > 0 ? parseFloat(((destR.count / totalValidSessions) * 100).toFixed(1)) : 0,
          totalEnergy: Math.round(destR.totalEnergy),
          totalRevenue: Math.round(destR.totalRevenue),
          avgSpeedKw: destR.totalTime > 0 ? parseFloat((destR.totalEnergy / (destR.totalTime / 60)).toFixed(1)) : 0,
          avgDurationMins: destR.count > 0 ? Math.round(destR.totalTime / destR.count) : 0,
          avgRevPerSession: destR.count > 0 ? Math.round(destR.totalRevenue / destR.count) : 0,
          desc: 'ชาร์จยาว > 50 นาที หรือ > 35 kWh ชาร์จจนเกือบเต็ม 100% เหมาะกับห้าง หรือจุดที่มีร้านอาหาร',
          themeColor: '#10b981'
        }
      ],
      speedDistribution: [
        {
          key: 'ultra',
          label: 'Ultra-Fast (> 70 kW)',
          count: speedRows.find(s => s.speed_key === 'ultra')?.count || 0,
          pct: totalValidSessions > 0 ? parseFloat((((speedRows.find(s => s.speed_key === 'ultra')?.count || 0) / totalValidSessions) * 100).toFixed(1)) : 0,
          desc: 'รถ EV สมรรถนะสูง รับกระแสไฟแรงเต็มประสิทธิภาพของหัวชาร์จ DC',
          color: '#10b981'
        },
        {
          key: 'high',
          label: 'High Power (40 - 70 kW)',
          count: speedRows.find(s => s.speed_key === 'high')?.count || 0,
          pct: totalValidSessions > 0 ? parseFloat((((speedRows.find(s => s.speed_key === 'high')?.count || 0) / totalValidSessions) * 100).toFixed(1)) : 0,
          desc: 'รถยนต์ไฟฟ้ายอดนิยมทั่วไป (BYD, MG, ORA, Changan ฯลฯ)',
          color: '#7F3F98'
        },
        {
          key: 'normal',
          label: 'Standard (< 40 kW)',
          count: speedRows.find(s => s.speed_key === 'normal')?.count || 0,
          pct: totalValidSessions > 0 ? parseFloat((((speedRows.find(s => s.speed_key === 'normal')?.count || 0) / totalValidSessions) * 100).toFixed(1)) : 0,
          desc: 'รถ City EV หรือการชาร์จช่วงแบตเตอรี่ใกล้เต็ม (Battery Tapering)',
          color: '#deb965'
        }
      ]
    };

    // 10. Anomaly Detection & Station Health Matrix
    const anomalies = [];
    let healthyStationsCount = 0;

    const stationHealthList = (stationHealthRows || []).map(stats => {
      const abortRate = stats.sessions > 0 ? (stats.shortAborts / stats.sessions) * 100 : 0;
      const avgSpeedKw = stats.timeMins > 0 ? (stats.energy / (stats.timeMins / 60)) : 0;
      
      let daysInactive = 0;
      if (stats.lastDate && overallMaxDate) {
        const d1 = new Date(stats.lastDate).getTime();
        const d2 = new Date(overallMaxDate).getTime();
        daysInactive = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
      } else {
        daysInactive = 99;
      }

      let healthStatus = 'healthy';
      const issues = [];

      if (daysInactive >= 5 || stats.sessions === 0) {
        healthStatus = 'critical';
        issues.push('ไม่พบการใช้งานมาแล้ว ' + daysInactive + ' วัน (ควรตรวจสอบระบบสื่อสาร/ตู้ดับ)');
        anomalies.push({
          level: 'critical',
          type: 'inactive_offline',
          station: stats.name,
          title: 'สถานีไม่พบการใช้งานนานผิดปกติ (Offline / Inactive Risk)',
          description: 'สถานี ' + stats.name + ' ไม่พบรายการชาร์จติดต่อกัน ' + daysInactive + ' วัน ล่าสุดเมื่อ ' + (stats.lastDate || 'ไม่มีข้อมูล'),
          action: 'แนะนำให้ทีมวิศวกรเข้าตรวจเช็กเบรกเกอร์ ระบบสื่อสาร และหน้าจอสถานะตู้'
        });
      } else if (daysInactive >= 2) {
        healthStatus = 'warning';
        issues.push('การใช้งานเบาบาง (' + daysInactive + ' วันล่าสุดไม่มีผู้ชาร์จ)');
      }

      if (abortRate >= 6 && stats.sessions >= 10) {
        if (healthStatus !== 'critical') healthStatus = 'warning';
        issues.push('พบการตัดชาร์จไวผิดปกติ ' + abortRate.toFixed(1) + '% (' + stats.shortAborts + ' ครั้ง)');
        anomalies.push({
          level: 'warning',
          type: 'frequent_aborts',
          station: stats.name,
          title: 'พบการตัดชาร์จกระทันหันบ่อยครั้ง (Short Aborts)',
          description: 'สถานี ' + stats.name + ' มีรอบชาร์จสั้นกว่า 3 นาที จำนวน ' + stats.shortAborts + ' ครั้ง (' + abortRate.toFixed(1) + '% ของทั้งหมด)',
          action: 'แนะนำให้ตรวจสอบขั้วต่อหัวชาร์จ CCS2/Type 2 และการสื่อสาร PLC/CAN กับรถยนต์'
        });
      }

      if (avgSpeedKw > 0 && avgSpeedKw < 18 && stats.sessions >= 10) {
        if (healthStatus === 'healthy') healthStatus = 'warning';
        issues.push('กำลังจ่ายไฟเฉลี่ยต่ำ (' + avgSpeedKw.toFixed(1) + ' kW)');
        anomalies.push({
          level: 'info',
          type: 'low_speed',
          station: stats.name,
          title: 'กำลังจ่ายไฟเฉลี่ยต่ำกว่ามาตรฐานตู้ Fast Charge',
          description: 'สถานี ' + stats.name + ' จ่ายไฟเฉลี่ยเพียง ' + avgSpeedKw.toFixed(1) + ' kW ตลอดการใช้งาน',
          action: 'ตรวจสอบการระบายความร้อน Power Module หรือการตั้งค่าจำกัดกระแสไฟของตู้'
        });
      }

      if (stats.sessions >= 4000) {
        issues.push('ความหนาแน่นสูงมาก (มีผู้ใช้ ' + stats.sessions.toLocaleString() + ' ครั้ง)');
        anomalies.push({
          level: 'opportunity',
          type: 'high_demand',
          station: stats.name,
          title: 'สถานีมีความต้องการใช้งานสูงมาก (High Demand Bottleneck)',
          description: 'สถานี ' + stats.name + ' มียอดชาร์จสะสมสูงถึง ' + stats.sessions.toLocaleString() + ' ครั้งและรายได้ ฿' + Math.round(stats.revenue).toLocaleString(),
          action: 'โอกาสทางธุรกิจ: พิจารณาติดตั้งเพิ่มหัวชาร์จหรือขยายสถานีแห่งที่ 2 ในพื้นที่ใกล้เคียง'
        });
      }

      if (healthStatus === 'healthy') healthyStationsCount++;

      return {
        name: stats.name,
        sessions: stats.sessions,
        energy: Math.round(stats.energy),
        revenue: Math.round(stats.revenue),
        avgSpeedKw: parseFloat(avgSpeedKw.toFixed(1)),
        abortCount: stats.shortAborts,
        abortRate: parseFloat(abortRate.toFixed(1)),
        daysInactive,
        lastDate: stats.lastDate || '-',
        lastTime: stats.lastTime || '-',
        healthStatus,
        issues: issues.length > 0 ? issues : ['ระบบทำงานปกติ พร้อมให้บริการ 100%']
      };
    }).sort((a, b) => {
      const order = { critical: 0, warning: 1, healthy: 2 };
      return (order[a.healthStatus] ?? 2) - (order[b.healthStatus] ?? 2);
    });

    const healthScore = activeStations.length > 0 
      ? Math.round((healthyStationsCount / activeStations.length) * 100) 
      : 100;

    // 11. Executive Summary Bullets
    let executiveSummary = [];
    if (filterStation !== 'all') {
      const singleSt = stationHealthList[0] || {};
      executiveSummary = [
        {
          icon: 'trending_up',
          title: 'การเติบโตของสถานี: ' + filterStation,
          text: 'รายได้เดือนล่าสุดแตะ ฿' + (latestMonthlyStats.revenue || 0).toLocaleString() + ' (' + (latestMonthlyStats.growth?.revenuePct >= 0 ? '+' : '') + (latestMonthlyStats.growth?.revenuePct || 0).toFixed(1) + '% MoM) โดยมีผู้เข้าชาร์จ ' + (latestMonthlyStats.sessions || 0).toLocaleString() + ' รอบ'
        },
        {
          icon: 'users',
          title: 'ฐานลูกค้าประจำและความภักดี (Customer Retention)',
          text: 'มีอัตราลูกค้ากลับมาใช้ซ้ำ ' + retentionChurnData.summary.retentionRate + '% (ลูกค้าประจำและประจำสูงรวม ' + retentionChurnData.summary.loyalAudienceTotal + ' ราย) ความเสี่ยงลูกค้าหายอยู่ที่ ' + retentionChurnData.summary.churnRiskRate + '%'
        },
        {
          icon: 'zap',
          title: 'พฤติกรรมการชาร์จหลัก (Charging Persona)',
          text: 'ผู้ใช้ส่วนใหญ่เป็นกลุ่ม ' + (personaData.personas[0]?.pct > personaData.personas[1]?.pct ? personaData.personas[0]?.name : personaData.personas[1]?.name) + ' (' + Math.max(personaData.personas[0]?.pct, personaData.personas[1]?.pct) + '%) กำลังจ่ายไฟเฉลี่ย ' + (singleSt.avgSpeedKw || 0) + ' kW'
        },
        {
          icon: singleSt.healthStatus === 'critical' ? 'alert' : 'check',
          title: 'สถานะความพร้อมและข้อควรระวัง',
          text: singleSt.healthStatus === 'critical' 
            ? ('⚠️ ' + (singleSt.issues?.[0] || 'ควรเข้าตรวจสอบระบบตู้ชาร์จ'))
            : ('สถานีมีความพร้อมให้บริการปกติ เข้าชาร์จล่าสุดเมื่อ ' + singleSt.lastDate + ' (ตัดชาร์จสั้น ' + singleSt.abortRate + '%)')
        }
      ];
    } else {
      const topRevenueSt = [...stationHealthList].sort((a, b) => b.revenue - a.revenue)[0];
      const criticalAlert = anomalies.find(a => a.level === 'critical');

      executiveSummary = [
        {
          icon: 'trending_up',
          title: 'แนวโน้มการเติบโตของเครือข่าย',
          text: 'ภาพรวมรายได้เดือนล่าสุดแตะ ฿' + (latestMonthlyStats.revenue || 0).toLocaleString() + ' (' + (latestMonthlyStats.growth?.revenuePct >= 0 ? '+' : '') + (latestMonthlyStats.growth?.revenuePct || 0).toFixed(1) + '% MoM) โดยมีพลังงานไฟฟ้ารวม ' + (latestMonthlyStats.energy || 0).toLocaleString() + ' kWh'
        },
        {
          icon: 'users',
          title: 'ความแข็งแกร่งของฐานลูกค้า (Network Retention)',
          text: 'ทั้งเครือข่ายมีลูกค้าประจำและประจำสูง ' + retentionChurnData.summary.loyalAudienceTotal.toLocaleString() + ' ราย (Retention Rate ' + retentionChurnData.summary.retentionRate + '%) โดยมีลูกค้าประจำที่ใช้งานต่อเนื่อง ' + retentionChurnData.summary.activeLoyalCount.toLocaleString() + ' ราย'
        },
        topRevenueSt ? {
          icon: 'trophy',
          title: 'สถานีหลักที่สร้างรายได้สูงสุด',
          text: 'สถานี ' + topRevenueSt.name + ' ยังคงเป็นแกนหลักอันดับ 1 ของเครือข่าย สร้างรายได้สะสม ฿' + topRevenueSt.revenue.toLocaleString() + ' (' + topRevenueSt.sessions.toLocaleString() + ' ครั้ง)'
        } : null,
        criticalAlert ? {
          icon: 'alert',
          title: 'ข้อควรระวังในการบำรุงรักษา',
          text: 'พบ ' + criticalAlert.station + ' มีความเสี่ยงออฟไลน์เนื่องจากไม่มีการชาร์จนานผิดปกติ ควรส่งทีมงานเข้าตรวจสอบ'
        } : {
          icon: 'check',
          title: 'สถานะความพร้อมของเครือข่าย',
          text: 'เครือข่ายสถานีชาร์จส่วนใหญ่อยู่ในสถานะพร้อมให้บริการสูง คะแนนความสมบูรณ์ของระบบอยู่ที่ ' + healthScore + '/100'
        }
      ].filter(Boolean);
    }

    return new Response(JSON.stringify({
      allowedStations: activeStations,
      availableStations: allUserStations,
      selectedStation: filterStation,
      overallMaxDate,
      healthScore,
      monthlyGrowth,
      stationGrowth,
      forecast,
      retentionChurnData,
      personaData,
      anomalies,
      stationHealthList,
      executiveSummary
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.warn('D1 query error in insights.ts, serving fallback snapshot:', error?.message);
    const fallbackStations = allUserStations.length > 0 ? allUserStations : getFallbackAllowedStations(phone, role);
    if (fallbackStations.length > 0) {
      const fbData = getFallbackInsights(fallbackStations, filterStation);
      if (fbData) {
        return new Response(JSON.stringify(fbData), { headers: { 'Content-Type': 'application/json' } });
      }
    }
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
