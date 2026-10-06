// Auto-Precomputed Dynamic Snapshot Engine
// Computes and persists high-performance, 1-read snapshots upon CSV upload

import { getFallbackAllowedStations, getFallbackDashboard, getFallbackInsights } from './fallback-service';
import { FALLBACK_STATIONS, FALLBACK_MONTHS } from './fallback-data';

export const EXCLUDED_STATIONS = ['สถานีชาร์จลานจอดรถพิษณุโลก', 'สถานีชาร์จริมน่าน'];

const thaiMonths = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];
const shortDayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const fullDayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

export async function ensureSnapshotTable(db: any) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS system_snapshots (
        snapshot_key TEXT PRIMARY KEY,
        snapshot_data TEXT,
        updated_at TEXT
      );
    `).run();
  } catch (err: any) {
    console.warn('ensureSnapshotTable warning:', err?.message);
  }
}

export function parseDurationToMins(dur: string): number {
  if (!dur) return 0;
  const parts = dur.split(':');
  if (parts.length < 2) return parseFloat(dur) || 0;
  const hrs = parseInt(parts[0], 10) || 0;
  const mins = parseInt(parts[1], 10) || 0;
  const secs = parseFloat(parts[2] || '0') || 0;
  return hrs * 60 + mins + (secs / 60);
}

export function computeDashboardSnapshot(rows: any[], filterMonth: string, filterStation: string, allowedStations: string[], availableMonths: string[]) {
  let totalEnergy = 0;
  let totalRevenue = 0;
  let totalTimeMins = 0;
  const sessionsCount = rows.length;

  const stationMap: Record<string, any> = {};
  const monthlyMap: Record<string, any> = {};
  const hourlyMap: Record<string, any> = {};
  const dowMap: Record<number, any> = {};
  const dailyMap: Record<string, any> = {};
  const vcardCounts: Record<string, number> = {};

  for (let i = 0; i < 24; i++) {
    const hStr = i.toString().padStart(2, '0');
    hourlyMap[hStr] = { hour: hStr + ':00', sessions: 0, energy: 0, revenue: 0 };
  }
  for (let i = 0; i < 7; i++) {
    dowMap[i] = { dayIndex: i, name: shortDayNames[i], day: fullDayNames[i], sessions: 0, energy: 0, revenue: 0 };
  }

  const durationBins = { quick: 0, normal: 0, extended: 0, long: 0 };
  const touStats = { onPeak: { sessions: 0, energy: 0, revenue: 0 }, offPeak: { sessions: 0, energy: 0, revenue: 0 } };

  const pivotRowsMap: Record<string, any> = {};
  const pivotHourTotals: Record<string, number> = {};
  for (let i = 0; i < 24; i++) pivotHourTotals[i.toString().padStart(2, '0')] = 0;

  for (const r of rows) {
    totalEnergy += r.energy_kwh;
    totalRevenue += r.revenue_baht;
    totalTimeMins += r.timeMins;

    if (!stationMap[r.charger_name]) {
      stationMap[r.charger_name] = { name: r.charger_name, sessions: 0, energy: 0, revenue: 0, timeMins: 0 };
    }
    stationMap[r.charger_name].sessions++;
    stationMap[r.charger_name].energy += r.energy_kwh;
    stationMap[r.charger_name].revenue += r.revenue_baht;
    stationMap[r.charger_name].timeMins += r.timeMins;

    if (!monthlyMap[r.month]) {
      monthlyMap[r.month] = { ym: r.month, sessions: 0, energy: 0, revenue: 0, timeMins: 0 };
    }
    monthlyMap[r.month].sessions++;
    monthlyMap[r.month].energy += r.energy_kwh;
    monthlyMap[r.month].revenue += r.revenue_baht;
    monthlyMap[r.month].timeMins += r.timeMins;

    if (hourlyMap[r.hr]) {
      hourlyMap[r.hr].sessions++;
      hourlyMap[r.hr].energy += r.energy_kwh;
      hourlyMap[r.hr].revenue += r.revenue_baht;
    }

    if (dowMap[r.dow]) {
      dowMap[r.dow].sessions++;
      dowMap[r.dow].energy += r.energy_kwh;
      dowMap[r.dow].revenue += r.revenue_baht;
    }

    if (r.vcard) {
      vcardCounts[r.vcard] = (vcardCounts[r.vcard] || 0) + 1;
    }

    if (r.timeMins < 15) durationBins.quick++;
    else if (r.timeMins <= 45) durationBins.normal++;
    else if (r.timeMins <= 90) durationBins.extended++;
    else durationBins.long++;

    if (r.isOnPeak) {
      touStats.onPeak.sessions++;
      touStats.onPeak.energy += r.energy_kwh;
      touStats.onPeak.revenue += r.revenue_baht;
    } else {
      touStats.offPeak.sessions++;
      touStats.offPeak.energy += r.energy_kwh;
      touStats.offPeak.revenue += r.revenue_baht;
    }

    if (!dailyMap[r.date]) {
      dailyMap[r.date] = { date: r.date, sessions: 0, energy: 0, revenue: 0, timeMins: 0 };
    }
    dailyMap[r.date].sessions++;
    dailyMap[r.date].energy += r.energy_kwh;
    dailyMap[r.date].revenue += r.revenue_baht;
    dailyMap[r.date].timeMins += r.timeMins;

    if (!pivotRowsMap[r.date]) {
      const parts = r.date.split('-');
      const formattedDate = parseInt(parts[2], 10) + ' ' + (thaiMonths[parseInt(parts[1], 10) - 1] || '') + ' ' + parts[0];
      pivotRowsMap[r.date] = {
        date: r.date,
        formattedDate,
        dow: shortDayNames[r.dow],
        total: 0
      };
      for (let i = 0; i < 24; i++) pivotRowsMap[r.date][i.toString().padStart(2, '0')] = 0;
    }
    pivotRowsMap[r.date][r.hr] = Math.round((pivotRowsMap[r.date][r.hr] + r.energy_kwh) * 100) / 100;
    pivotRowsMap[r.date].total += r.energy_kwh;
    pivotHourTotals[r.hr] = (pivotHourTotals[r.hr] || 0) + r.energy_kwh;
  }

  const uniqueUsers = Object.keys(vcardCounts).length;
  let singleUsers = 0, repeatUsers = 0, regularUsers = 0, championUsers = 0;

  for (const v of Object.values(vcardCounts)) {
    if (v === 1) singleUsers++;
    else if (v === 2) repeatUsers++;
    else if (v <= 5) regularUsers++;
    else championUsers++;
  }
  const returningUsers = repeatUsers + regularUsers + championUsers;
  const retentionRate = uniqueUsers > 0 ? parseFloat(((returningUsers / uniqueUsers) * 100).toFixed(1)) : 0;
  const avgFrequency = uniqueUsers > 0 ? parseFloat((sessionsCount / uniqueUsers).toFixed(1)) : 0;

  const distinctDays = Object.keys(dailyMap).length || 1;
  const avgHoursPerDay = parseFloat((totalTimeMins / 60 / distinctDays).toFixed(1));
  const chargingStationsCount = (filterStation !== 'all' ? 1 : allowedStations.length) || 1;
  const totalPotentialHours = distinctDays * 24 * chargingStationsCount;
  const utilizationRate = totalPotentialHours > 0 ? Math.min(100, parseFloat(((totalTimeMins / 60 / totalPotentialHours) * 100).toFixed(1))) : 0;

  const avgEnergy = sessionsCount > 0 ? parseFloat((totalEnergy / sessionsCount).toFixed(2)) : 0;
  const avgRevenue = sessionsCount > 0 ? parseFloat((totalRevenue / sessionsCount).toFixed(2)) : 0;
  const avgTimeMins = sessionsCount > 0 ? parseFloat((totalTimeMins / sessionsCount).toFixed(1)) : 0;
  const avgChargingSpeedKw = totalTimeMins > 0 ? parseFloat((totalEnergy / (totalTimeMins / 60)).toFixed(1)) : 0;

  const stationLeaderboard = Object.values(stationMap).map(st => ({
    name: st.name,
    sessions: st.sessions,
    energy: Math.round(st.energy * 10) / 10,
    revenue: Math.round(st.revenue),
    avgSpeedKw: st.timeMins > 0 ? parseFloat((st.energy / (st.timeMins / 60)).toFixed(1)) : 0,
    avgDurationMins: st.sessions > 0 ? Math.round(st.timeMins / st.sessions) : 0
  })).sort((a, b) => b.revenue - a.revenue);

  const monthlyChart = Object.keys(monthlyMap).sort().map(mStr => {
    const parts = mStr.split('-');
    const mIdx = parseInt(parts[1], 10) - 1;
    const thName = (thaiMonths[mIdx] || '') + ' ' + parts[0];
    const mData = monthlyMap[mStr];
    return {
      month: mStr,
      name: thName,
      energy: Math.round(mData.energy * 10) / 10,
      revenue: Math.round(mData.revenue),
      timeHrs: Math.round((mData.timeMins / 60) * 10) / 10,
      sessions: mData.sessions
    };
  });

  const hourlyChart = Object.keys(hourlyMap).sort().map(h => ({
    hour: h + ':00',
    name: h + ':00',
    sessions: hourlyMap[h].sessions,
    energy: Math.round(hourlyMap[h].energy * 10) / 10,
    revenue: Math.round(hourlyMap[h].revenue)
  }));

  const dowChart = [1, 2, 3, 4, 5, 6, 0].map(d => ({
    name: shortDayNames[d],
    day: fullDayNames[d],
    dayIndex: d,
    sessions: dowMap[d].sessions,
    energy: Math.round(dowMap[d].energy),
    revenue: Math.round(dowMap[d].revenue)
  }));

  const durationList = [
    {
      bin: 'quick',
      key: 'quick',
      label: 'ชาร์จด่วน (< 15 นาที)',
      count: durationBins.quick,
      share: sessionsCount > 0 ? parseFloat(((durationBins.quick / sessionsCount) * 100).toFixed(1)) : 0
    },
    {
      bin: 'normal',
      key: 'normal',
      label: 'ชาร์จปกติ (15 - 45 นาที)',
      count: durationBins.normal,
      share: sessionsCount > 0 ? parseFloat(((durationBins.normal / sessionsCount) * 100).toFixed(1)) : 0
    },
    {
      bin: 'extended',
      key: 'extended',
      label: 'ชาร์จต่อเนื่อง (45 - 90 นาที)',
      count: durationBins.extended,
      share: sessionsCount > 0 ? parseFloat(((durationBins.extended / sessionsCount) * 100).toFixed(1)) : 0
    },
    {
      bin: 'long',
      key: 'long',
      label: 'จอดชาร์จยาว (> 90 นาที)',
      count: durationBins.long,
      share: sessionsCount > 0 ? parseFloat(((durationBins.long / sessionsCount) * 100).toFixed(1)) : 0
    }
  ];

  const customerSegments = [
    {
      key: 'repeat',
      label: 'ลูกค้าใช้ซ้ำ (2 ครั้ง)',
      desc: 'ใช้บริการ 2 ครั้ง',
      count: repeatUsers,
      share: uniqueUsers > 0 ? parseFloat(((repeatUsers / uniqueUsers) * 100).toFixed(1)) : 0
    },
    {
      key: 'regular',
      label: 'ลูกค้าประจำ (3-5 ครั้ง)',
      desc: 'ใช้บริการ 3-5 ครั้ง ในช่วง 60-90 วัน',
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

  const dailyTable = Object.keys(dailyMap).sort().reverse().map(dStr => {
    const parts = dStr.split('-');
    const dObj = new Date(dStr + 'T00:00:00Z');
    const formattedDate = (parseInt(parts[2], 10)) + ' ' + (thaiMonths[parseInt(parts[1], 10) - 1] || '') + ' ' + parts[0];
    const dData = dailyMap[dStr];
    return {
      date: dStr,
      formattedDate,
      dayOfWeek: fullDayNames[dObj.getUTCDay()],
      sessions: dData.sessions,
      energy: Math.round(dData.energy * 10) / 10,
      avgEnergy: dData.sessions > 0 ? parseFloat((dData.energy / dData.sessions).toFixed(1)) : 0,
      revenue: Math.round(dData.revenue),
      timeHrs: Math.round((dData.timeMins / 60) * 10) / 10,
      time: dData.timeMins,
      avgSpeedKw: dData.timeMins > 0 ? parseFloat((dData.energy / (dData.timeMins / 60)).toFixed(1)) : 0
    };
  });

  let maxCellVal = 1;
  let pivotGrandTotal = 0;
  const pivotRows = Object.keys(pivotRowsMap).sort().map(dStr => {
    const row = pivotRowsMap[dStr];
    row.total = Math.round(row.total * 10) / 10;
    pivotGrandTotal += row.total;
    for (let i = 0; i < 24; i++) {
      const hStr = i.toString().padStart(2, '0');
      if (row[hStr] > maxCellVal) maxCellVal = row[hStr];
    }
    return row;
  });

  for (let i = 0; i < 24; i++) {
    const hStr = i.toString().padStart(2, '0');
    pivotHourTotals[hStr] = Math.round((pivotHourTotals[hStr] || 0) * 10) / 10;
  }

  const onPeakEnergyPct = totalEnergy > 0 ? parseFloat(((touStats.onPeak.energy / totalEnergy) * 100).toFixed(1)) : 0;
  const offPeakEnergyPct = totalEnergy > 0 ? parseFloat(((touStats.offPeak.energy / totalEnergy) * 100).toFixed(1)) : 0;
  const onPeakSessionsPct = sessionsCount > 0 ? parseFloat(((touStats.onPeak.sessions / sessionsCount) * 100).toFixed(1)) : 0;
  const offPeakSessionsPct = sessionsCount > 0 ? parseFloat(((touStats.offPeak.sessions / sessionsCount) * 100).toFixed(1)) : 0;

  return {
    allowedStations,
    availableMonths,
    selectedStation: filterStation,
    selectedMonth: filterMonth,
    stats: {
      totalEnergy: Math.round(totalEnergy * 100) / 100,
      totalRevenue: Math.round(totalRevenue),
      totalTimeMins: Math.round(totalTimeMins * 10) / 10,
      sessionsCount,
      avgEnergy,
      avgRevenue,
      avgTimeMins,
      avgChargingSpeedKw,
      utilizationRate,
      avgHoursPerDay
    },
    customerStats: {
      uniqueUsers,
      totalReturning: returningUsers,
      returningUsers,
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
        sessions: touStats.onPeak.sessions,
        energy: touStats.onPeak.energy,
        revenue: touStats.onPeak.revenue
      },
      offPeak: {
        sessions: touStats.offPeak.sessions,
        energy: touStats.offPeak.energy,
        revenue: touStats.offPeak.revenue
      },
      onPeakEnergyPct,
      offPeakEnergyPct,
      onPeakSessionsPct,
      offPeakSessionsPct
    },
    durationList,
    stationLeaderboard,
    monthlyChart,
    hourlyChart,
    dowChart,
    dailyTable,
    pivot: {
      rows: pivotRows,
      hourTotals: pivotHourTotals,
      grandTotal: Math.round(pivotGrandTotal * 100) / 100,
      maxCellVal
    }
  };
}

export function computeInsightsSnapshot(subRows: any[], filterStation: string, allowedStations: string[]) {
  const monthlyMap: Record<string, any> = {};
  const stationMonthMap: Record<string, any> = {};
  const stationHealthMap: Record<string, any> = {};
  const userMap: Record<string, any> = {};
  const personaMap = { express: { count: 0, energy: 0, revenue: 0, time: 0 }, standard: { count: 0, energy: 0, revenue: 0, time: 0 }, destination: { count: 0, energy: 0, revenue: 0, time: 0 } };
  const speedMap = { ultra: 0, high: 0, standard: 0 };
  let overallMaxDate = '2026-08-30';

  for (const r of subRows) {
    if (r.date > overallMaxDate) overallMaxDate = r.date;

    if (!monthlyMap[r.month]) {
      monthlyMap[r.month] = { ym: r.month, sessions: 0, energy: 0, revenue: 0, timeMins: 0, vcards: new Set() };
    }
    monthlyMap[r.month].sessions++;
    monthlyMap[r.month].energy += r.energy_kwh;
    monthlyMap[r.month].revenue += r.revenue_baht;
    monthlyMap[r.month].timeMins += r.timeMins;
    if (r.vcard) monthlyMap[r.month].vcards.add(r.vcard);

    const smKey = r.charger_name + '__' + r.month;
    if (!stationMonthMap[smKey]) {
      stationMonthMap[smKey] = { name: r.charger_name, ym: r.month, sessions: 0, energy: 0, revenue: 0 };
    }
    stationMonthMap[smKey].sessions++;
    stationMonthMap[smKey].energy += r.energy_kwh;
    stationMonthMap[smKey].revenue += r.revenue_baht;

    if (!stationHealthMap[r.charger_name]) {
      stationHealthMap[r.charger_name] = { name: r.charger_name, sessions: 0, energy: 0, revenue: 0, timeMins: 0, shortAborts: 0, lastDate: r.date, lastTime: r.start_time };
    }
    stationHealthMap[r.charger_name].sessions++;
    stationHealthMap[r.charger_name].energy += r.energy_kwh;
    stationHealthMap[r.charger_name].revenue += r.revenue_baht;
    stationHealthMap[r.charger_name].timeMins += r.timeMins;
    if (r.timeMins < 3) stationHealthMap[r.charger_name].shortAborts++;
    if (r.date > stationHealthMap[r.charger_name].lastDate) {
      stationHealthMap[r.charger_name].lastDate = r.date;
      stationHealthMap[r.charger_name].lastTime = r.start_time;
    }

    if (r.vcard) {
      if (!userMap[r.vcard]) {
        userMap[r.vcard] = { vcard: r.vcard, sessions: 0, energy: 0, revenue: 0, firstDate: r.date, lastDate: r.date, stations: new Set() };
      }
      userMap[r.vcard].sessions++;
      userMap[r.vcard].energy += r.energy_kwh;
      userMap[r.vcard].revenue += r.revenue_baht;
      userMap[r.vcard].stations.add(r.charger_name);
      if (r.date < userMap[r.vcard].firstDate) userMap[r.vcard].firstDate = r.date;
      if (r.date > userMap[r.vcard].lastDate) userMap[r.vcard].lastDate = r.date;
    }

    if (r.timeMins < 25 || (r.energy_kwh < 15 && r.timeMins < 35)) {
      personaMap.express.count++;
      personaMap.express.energy += r.energy_kwh;
      personaMap.express.revenue += r.revenue_baht;
      personaMap.express.time += r.timeMins;
    } else if ((r.timeMins >= 25 && r.timeMins <= 50) || (r.energy_kwh >= 15 && r.energy_kwh <= 35)) {
      personaMap.standard.count++;
      personaMap.standard.energy += r.energy_kwh;
      personaMap.standard.revenue += r.revenue_baht;
      personaMap.standard.time += r.timeMins;
    } else {
      personaMap.destination.count++;
      personaMap.destination.energy += r.energy_kwh;
      personaMap.destination.revenue += r.revenue_baht;
      personaMap.destination.time += r.timeMins;
    }

    if (r.timeMins > 0) {
      const spd = r.energy_kwh / (r.timeMins / 60);
      if (spd > 70) speedMap.ultra++;
      else if (spd >= 40) speedMap.high++;
      else speedMap.standard++;
    }
  }

  const sortedYM = Object.keys(monthlyMap).sort();
  const monthlyGrowth: any[] = [];
  let prevMonth: any = null;

  sortedYM.forEach(ym => {
    const cur = monthlyMap[ym];
    const p = ym.split('-');
    const y = parseInt(p[0], 10);
    const mIdx = parseInt(p[1], 10) - 1;
    const thName = thaiMonths[mIdx] ? (thaiMonths[mIdx] + ' ' + y) : ym;

    let revGrowth = 0, energyGrowth = 0, sessionGrowth = 0;
    if (prevMonth) {
      if (prevMonth.revenue > 0) revGrowth = ((cur.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
      if (prevMonth.energy > 0) energyGrowth = ((cur.energy - prevMonth.energy) / prevMonth.energy) * 100;
      if (prevMonth.sessions > 0) sessionGrowth = ((cur.sessions - prevMonth.sessions) / prevMonth.sessions) * 100;
    }

    const item = {
      name: thName,
      month: ym,
      revenue: Math.round(cur.revenue),
      energy: Math.round(cur.energy),
      sessions: cur.sessions,
      uniqueUsers: cur.vcards.size,
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

  const latestYm = sortedYM[sortedYM.length - 1] || '2026-08';
  const priorYm = sortedYM[sortedYM.length - 2] || sortedYM[0] || '2026-07';

  const stationGrowth = allowedStations.map(st => {
    const cur = stationMonthMap[st + '__' + latestYm] || { revenue: 0, energy: 0, sessions: 0 };
    const prev = stationMonthMap[st + '__' + priorYm] || { revenue: 0, energy: 0, sessions: 0 };
    
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

  const totalCustomers = Object.keys(userMap).length;
  let singleUsers = 0, repeatUsers = 0, regularUsers = 0, championUsers = 0;
  let activeLoyalCount = 0, atRiskCount = 0, churnedCount = 0;

  const maskedUserList = Object.values(userMap).map(u => {
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
      stationCount: u.stations ? u.stations.size : 1
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

  const totalValidSessions = subRows.length;
  const expressR = personaMap.express;
  const standardR = personaMap.standard;
  const destR = personaMap.destination;

  const personaData = {
    personas: [
      {
        key: 'express',
        name: 'Express Top-up (สายแวะเติมด่วน)',
        tag: 'แวะเติมด่วน',
        count: expressR.count,
        pct: totalValidSessions > 0 ? parseFloat(((expressR.count / totalValidSessions) * 100).toFixed(1)) : 0,
        totalEnergy: Math.round(expressR.energy),
        totalRevenue: Math.round(expressR.revenue),
        avgSpeedKw: expressR.time > 0 ? parseFloat((expressR.energy / (expressR.time / 60)).toFixed(1)) : 0,
        avgDurationMins: expressR.count > 0 ? Math.round(expressR.time / expressR.count) : 0,
        avgRevPerSession: expressR.count > 0 ? Math.round(expressR.revenue / expressR.count) : 0,
        desc: 'ชาร์จสั้น < 25 นาที หรือ < 15 kWh เน้นเติมไฟเพื่อเดินทางต่อทันที เหมาะกับจุดพักริมทางหลวงและปั๊มน้ำมัน',
        themeColor: '#deb965'
      },
      {
        key: 'standard',
        name: 'Standard Refill (สายเติมตามรอบปกติ)',
        tag: 'เติมตามรอบ',
        count: standardR.count,
        pct: totalValidSessions > 0 ? parseFloat(((standardR.count / totalValidSessions) * 100).toFixed(1)) : 0,
        totalEnergy: Math.round(standardR.energy),
        totalRevenue: Math.round(standardR.revenue),
        avgSpeedKw: standardR.time > 0 ? parseFloat((standardR.energy / (standardR.time / 60)).toFixed(1)) : 0,
        avgDurationMins: standardR.count > 0 ? Math.round(standardR.time / standardR.count) : 0,
        avgRevPerSession: standardR.count > 0 ? Math.round(standardR.revenue / standardR.count) : 0,
        desc: 'แวะชาร์จ 25–50 นาที ได้พลังงาน 15–35 kWh พักผ่อน ทานกาแฟ หรือเข้าห้องน้ำระหว่างทาง',
        themeColor: '#7F3F98'
      },
      {
        key: 'destination',
        name: 'Destination / Full Charge (สายชาร์จเต็ม/จอดแช่)',
        tag: 'จอดชาร์จยาว',
        count: destR.count,
        pct: totalValidSessions > 0 ? parseFloat(((destR.count / totalValidSessions) * 100).toFixed(1)) : 0,
        totalEnergy: Math.round(destR.energy),
        totalRevenue: Math.round(destR.revenue),
        avgSpeedKw: destR.time > 0 ? parseFloat((destR.energy / (destR.time / 60)).toFixed(1)) : 0,
        avgDurationMins: destR.count > 0 ? Math.round(destR.time / destR.count) : 0,
        avgRevPerSession: destR.count > 0 ? Math.round(destR.revenue / destR.count) : 0,
        desc: 'ชาร์จยาว > 50 นาที หรือ > 35 kWh ชาร์จจนเกือบเต็ม 100% เหมาะกับห้าง หรือจุดที่มีร้านอาหาร',
        themeColor: '#10b981'
      }
    ],
    speedDistribution: [
      {
        key: 'ultra',
        label: 'Ultra-Fast (> 70 kW)',
        count: speedMap.ultra,
        pct: totalValidSessions > 0 ? parseFloat(((speedMap.ultra / totalValidSessions) * 100).toFixed(1)) : 0,
        desc: 'รถ EV สมรรถนะสูง รับกระแสไฟแรงเต็มประสิทธิภาพของหัวชาร์จ DC',
        color: '#10b981'
      },
      {
        key: 'high',
        label: 'High Power (40 - 70 kW)',
        count: speedMap.high,
        pct: totalValidSessions > 0 ? parseFloat(((speedMap.high / totalValidSessions) * 100).toFixed(1)) : 0,
        desc: 'รถยนต์ไฟฟ้ายอดนิยมทั่วไป (BYD, MG, ORA, Changan ฯลฯ)',
        color: '#7F3F98'
      },
      {
        key: 'normal',
        label: 'Standard (< 40 kW)',
        count: speedMap.standard,
        pct: totalValidSessions > 0 ? parseFloat(((speedMap.standard / totalValidSessions) * 100).toFixed(1)) : 0,
        desc: 'รถ City EV หรือการชาร์จช่วงแบตเตอรี่ใกล้เต็ม (Battery Tapering)',
        color: '#deb965'
      }
    ]
  };

  const anomalies: any[] = [];
  let healthyStationsCount = 0;

  const stationHealthList = Object.values(stationHealthMap).map(stats => {
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
    const issues: string[] = [];

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
    const order: Record<string, number> = { critical: 0, warning: 1, healthy: 2 };
    return (order[a.healthStatus] ?? 2) - (order[b.healthStatus] ?? 2);
  });

  const healthScore = allowedStations.length > 0 
    ? Math.round((healthyStationsCount / allowedStations.length) * 100) 
    : 100;

  let executiveSummary: any[] = [];
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

  return {
    allowedStations,
    availableStations: allowedStations,
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
  };
}

export async function generateAndSaveAllSnapshots(db: any) {
  await ensureSnapshotTable(db);

  // 1. Fetch raw rows once
  const { results: rawRows } = await db.prepare(
    "SELECT date, charger_name, vcard, start_time, stop_time, durations, energy_kwh, revenue_baht FROM charging_data WHERE charger_name NOT IN (?, ?) ORDER BY date ASC, start_time ASC"
  ).bind(...EXCLUDED_STATIONS).all();

  if (!rawRows || rawRows.length === 0) {
    return { success: false, message: 'No rows found in charging_data' };
  }

  // Normalize rows
  const rows = rawRows.map((r: any) => {
    const date = (r.date || '').trim();
    const timeMins = parseDurationToMins(r.durations || '');
    const hr = (r.start_time || '00:00').slice(0, 2);
    const month = date.slice(0, 7);
    const dObj = new Date(date + 'T00:00:00Z');
    const dow = isNaN(dObj.getUTCDay()) ? 0 : dObj.getUTCDay();

    // TOU: Mon-Fri (1-5) and hour 09..21
    const hrNum = parseInt(hr, 10) || 0;
    const isWeekday = dow >= 1 && dow <= 5;
    const isOnPeak = isWeekday && (hrNum >= 9 && hrNum < 22);

    return {
      date,
      month,
      hr,
      dow,
      isOnPeak,
      charger_name: r.charger_name,
      vcard: r.vcard,
      start_time: r.start_time,
      energy_kwh: parseFloat(r.energy_kwh) || 0,
      revenue_baht: parseFloat(r.revenue_baht) || 0,
      timeMins
    };
  });

  const distinctStations = Array.from(new Set(rows.map((r: any) => r.charger_name))).filter(Boolean) as string[];
  const distinctMonths = Array.from(new Set(rows.map((r: any) => r.month))).filter(Boolean).sort().reverse() as string[];

  const allStations = ['all', ...distinctStations];
  const allMonths = ['all', ...distinctMonths];
  const nowStr = new Date().toISOString();

  const snapshotEntries = [];

  // Metadata Overview Snapshot
  snapshotEntries.push({
    key: 'meta__overview',
    data: {
      distinctStations,
      distinctMonths,
      totalRows: rows.length,
      updatedAt: nowStr
    }
  });

  // Precompute Dashboard snapshots
  for (const st of allStations) {
    for (const mo of allMonths) {
      const filtered = rows.filter((r: any) => {
        if (st !== 'all' && r.charger_name !== st) return false;
        if (mo !== 'all' && r.month !== mo) return false;
        return true;
      });
      const allowed = st === 'all' ? distinctStations : [st];
      const dashData = computeDashboardSnapshot(filtered, mo, st, allowed, distinctMonths);
      snapshotEntries.push({
        key: 'dashboard__' + st + '__' + mo,
        data: dashData
      });
    }
  }

  // Precompute Insights snapshots
  for (const st of allStations) {
    const filtered = rows.filter((r: any) => {
      if (st !== 'all' && r.charger_name !== st) return false;
      return true;
    });
    const allowed = st === 'all' ? distinctStations : [st];
    const insData = computeInsightsSnapshot(filtered, st, allowed);
    snapshotEntries.push({
      key: 'insights__' + st,
      data: insData
    });
  }

  // Batch insert into system_snapshots safely with db.batch
  const insertSnapStmt = db.prepare('INSERT OR REPLACE INTO system_snapshots (snapshot_key, snapshot_data, updated_at) VALUES (?, ?, ?)');
  const CHUNK_SIZE = 50;
  for (let i = 0; i < snapshotEntries.length; i += CHUNK_SIZE) {
    const chunk = snapshotEntries.slice(i, i + CHUNK_SIZE);
    const stmts = chunk.map((item: any) => insertSnapStmt.bind(item.key, JSON.stringify(item.data), nowStr));
    await db.batch(stmts);
  }

  return {
    success: true,
    totalSnapshots: snapshotEntries.length,
    stationsCount: distinctStations.length,
    monthsCount: distinctMonths.length,
    rowsCount: rows.length
  };
}
