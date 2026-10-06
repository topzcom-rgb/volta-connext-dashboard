import { FALLBACK_ADMINS, FALLBACK_OWNERS, FALLBACK_STATIONS, FALLBACK_MONTHS, DASHBOARD_SNAPSHOTS, INSIGHTS_SNAPSHOTS } from './fallback-data';

export function getFallbackAllowedStations(phone: string | null, role: string | null): string[] {
  if (role === 'admin') {
    return FALLBACK_STATIONS;
  }
  if (phone) {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (FALLBACK_OWNERS[cleanPhone]) {
      return FALLBACK_OWNERS[cleanPhone];
    }
  }
  return [];
}

export function getFallbackDashboard(allowedStations: string[], filterStation: string, filterMonth: string) {
  let targetStations = [...allowedStations];
  if (filterStation !== 'all' && allowedStations.includes(filterStation)) {
    targetStations = [filterStation];
  }

  if (targetStations.length === 1) {
    const single = DASHBOARD_SNAPSHOTS[targetStations[0] + '__' + filterMonth];
    if (single) {
      return { ...single, allowedStations, availableMonths: FALLBACK_MONTHS };
    }
  }

  if (targetStations.length === FALLBACK_STATIONS.length) {
    const allSnap = DASHBOARD_SNAPSHOTS['all__' + filterMonth];
    if (allSnap) {
      return { ...allSnap, allowedStations: targetStations, availableMonths: FALLBACK_MONTHS };
    }
  }

  // Combine multiple stations (e.g. 0800000002 has 3 stations)
  let totalEnergy = 0;
  let totalRevenue = 0;
  let totalTimeMins = 0;
  let sessionsCount = 0;
  let stationLeaderboard: any[] = [];
  const monthlyAgg: Record<string, any> = {};
  const hourlyAgg: Record<string, any> = {};
  const dowAgg: Record<number, any> = {};
  for (let i = 0; i < 7; i++) dowAgg[i] = { sessions: 0, energy: 0, revenue: 0, name: '', day: '', dayIndex: i };
  for (let i = 0; i < 24; i++) hourlyAgg[i.toString().padStart(2, '0')] = { hour: i.toString().padStart(2, '0') + ':00', sessions: 0, energy: 0, revenue: 0 };
  const touStats = { onPeak: { sessions: 0, energy: 0, revenue: 0 }, offPeak: { sessions: 0, energy: 0, revenue: 0 } };
  const durationList = [
    { bin: 'quick', label: 'ชาร์จด่วน (< 15 นาที)', count: 0, share: 0 },
    { bin: 'normal', label: 'ชาร์จปกติ (15 - 45 นาที)', count: 0, share: 0 },
    { bin: 'extended', label: 'ชาร์จต่อเนื่อง (45 - 90 นาที)', count: 0, share: 0 },
    { bin: 'long', label: 'จอดชาร์จยาว (> 90 นาที)', count: 0, share: 0 }
  ];
  const dailyMap: Record<string, any> = {};
  const pivotRowMap: Record<string, any> = {};
  const pivotHourTotals: Record<string, number> = {};
  for (let i = 0; i < 24; i++) pivotHourTotals[i.toString().padStart(2, '0')] = 0;

  for (const st of targetStations) {
    const snap = DASHBOARD_SNAPSHOTS[st + '__' + filterMonth];
    if (!snap) continue;

    totalEnergy += snap.stats.totalEnergy;
    totalRevenue += snap.stats.totalRevenue;
    totalTimeMins += snap.stats.totalTimeMins;
    sessionsCount += snap.stats.sessionsCount;

    if (snap.stationLeaderboard) {
      stationLeaderboard.push(...snap.stationLeaderboard);
    }

    for (const m of (snap.monthlyChart || [])) {
      if (!monthlyAgg[m.month]) {
        monthlyAgg[m.month] = { month: m.month, name: m.name, energy: 0, revenue: 0, timeHrs: 0, sessions: 0 };
      }
      monthlyAgg[m.month].energy += m.energy;
      monthlyAgg[m.month].revenue += m.revenue;
      monthlyAgg[m.month].timeHrs += m.timeHrs;
      monthlyAgg[m.month].sessions += m.sessions;
    }

    for (const h of (snap.hourlyChart || [])) {
      const hKey = h.hour.slice(0, 2);
      if (hourlyAgg[hKey]) {
        hourlyAgg[hKey].sessions += h.sessions;
        hourlyAgg[hKey].energy += h.energy;
        hourlyAgg[hKey].revenue += h.revenue;
      }
    }

    for (const d of (snap.dowChart || [])) {
      if (dowAgg[d.dayIndex]) {
        dowAgg[d.dayIndex].name = d.name;
        dowAgg[d.dayIndex].day = d.day;
        dowAgg[d.dayIndex].sessions += d.sessions;
        dowAgg[d.dayIndex].energy += d.energy;
        dowAgg[d.dayIndex].revenue += d.revenue;
      }
    }

    touStats.onPeak.sessions += snap.touStats.onPeak.sessions;
    touStats.onPeak.energy += snap.touStats.onPeak.energy;
    touStats.onPeak.revenue += snap.touStats.onPeak.revenue;
    touStats.offPeak.sessions += snap.touStats.offPeak.sessions;
    touStats.offPeak.energy += snap.touStats.offPeak.energy;
    touStats.offPeak.revenue += snap.touStats.offPeak.revenue;

    for (let i = 0; i < 4; i++) {
      durationList[i].count += snap.durationList[i]?.count || 0;
    }

    for (const row of (snap.dailyTable || [])) {
      if (!dailyMap[row.date]) {
        dailyMap[row.date] = { date: row.date, formattedDate: row.formattedDate, dayOfWeek: row.dayOfWeek, sessions: 0, energy: 0, revenue: 0, timeHrs: 0 };
      }
      dailyMap[row.date].sessions += row.sessions;
      dailyMap[row.date].energy += row.energy;
      dailyMap[row.date].revenue += row.revenue;
      dailyMap[row.date].timeHrs += row.timeHrs;
    }

    for (const pRow of (snap.pivot?.rows || [])) {
      if (!pivotRowMap[pRow.date]) {
        pivotRowMap[pRow.date] = { date: pRow.date, formattedDate: pRow.formattedDate, dow: pRow.dow, total: 0 };
        for (let i = 0; i < 24; i++) pivotRowMap[pRow.date][i.toString().padStart(2, '0')] = 0;
      }
      pivotRowMap[pRow.date].total += pRow.total;
      for (let i = 0; i < 24; i++) {
        const hKey = i.toString().padStart(2, '0');
        pivotRowMap[pRow.date][hKey] += pRow[hKey] || 0;
        pivotHourTotals[hKey] += pRow[hKey] || 0;
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    durationList[i].share = sessionsCount > 0 ? parseFloat(((durationList[i].count / sessionsCount) * 100).toFixed(1)) : 0;
  }

  const distinctDays = Object.keys(dailyMap).length || 1;
  const avgHoursPerDay = parseFloat((totalTimeMins / 60 / distinctDays).toFixed(1));
  const chargingStationsCount = targetStations.length || 1;
  const totalPotentialHours = distinctDays * 24 * chargingStationsCount;
  const utilizationRate = totalPotentialHours > 0 ? Math.min(100, parseFloat(((totalTimeMins / 60 / totalPotentialHours) * 100).toFixed(1))) : 0;

  const avgEnergy = sessionsCount > 0 ? parseFloat((totalEnergy / sessionsCount).toFixed(2)) : 0;
  const avgRevenue = sessionsCount > 0 ? parseFloat((totalRevenue / sessionsCount).toFixed(2)) : 0;
  const avgTimeMins = sessionsCount > 0 ? parseFloat((totalTimeMins / sessionsCount).toFixed(1)) : 0;
  const avgChargingSpeedKw = totalTimeMins > 0 ? parseFloat((totalEnergy / (totalTimeMins / 60)).toFixed(1)) : 0;

  stationLeaderboard.sort((a, b) => b.revenue - a.revenue);

  const monthlyChart = Object.values(monthlyAgg).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({
    ...m,
    energy: Math.round(m.energy * 10) / 10,
    timeHrs: Math.round(m.timeHrs * 10) / 10
  }));

  const hourlyChart = Object.values(hourlyAgg).sort((a, b) => a.hour.localeCompare(b.hour)).map(h => ({
    ...h,
    energy: Math.round(h.energy * 10) / 10
  }));

  const dowChart = [1, 2, 3, 4, 5, 6, 0].map(d => ({
    ...dowAgg[d],
    energy: Math.round(dowAgg[d].energy),
    revenue: Math.round(dowAgg[d].revenue)
  }));

  const dailyTable = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date)).map(d => ({
    ...d,
    energy: Math.round(d.energy * 10) / 10,
    timeHrs: Math.round(d.timeHrs * 10) / 10,
    avgSpeedKw: d.timeHrs > 0 ? parseFloat((d.energy / d.timeHrs).toFixed(1)) : 0
  }));

  let maxCellVal = 1;
  let pivotGrandTotal = 0;
  const pivotRows = Object.values(pivotRowMap).sort((a, b) => a.date.localeCompare(b.date)).map(row => {
    row.total = Math.round(row.total * 100) / 100;
    pivotGrandTotal += row.total;
    for (let i = 0; i < 24; i++) {
      const hKey = i.toString().padStart(2, '0');
      row[hKey] = Math.round(row[hKey] * 100) / 100;
      if (row[hKey] > maxCellVal) maxCellVal = row[hKey];
    }
    return row;
  });

  for (const h in pivotHourTotals) {
    pivotHourTotals[h] = Math.round(pivotHourTotals[h] * 100) / 100;
  }

  const totalTouEnergy = touStats.onPeak.energy + touStats.offPeak.energy;
  const totalTouSessions = touStats.onPeak.sessions + touStats.offPeak.sessions;

  return {
    allowedStations,
    availableMonths: FALLBACK_MONTHS,
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
      uniqueUsers: targetStations.length === 1 ? (DASHBOARD_SNAPSHOTS[targetStations[0] + '__all']?.customerStats?.uniqueUsers || 0) : 7706,
      totalReturning: 0,
      returningUsers: 0,
      singleUsers: 0,
      repeatUsers: 0,
      regularUsers: 0,
      championUsers: 0,
      retentionRate: 35.8,
      avgFrequency: 3.8,
      customerSegments: []
    },
    touStats: {
      onPeak: touStats.onPeak,
      offPeak: touStats.offPeak,
      onPeakEnergyPct: totalTouEnergy > 0 ? parseFloat(((touStats.onPeak.energy / totalTouEnergy) * 100).toFixed(1)) : 0,
      offPeakEnergyPct: totalTouEnergy > 0 ? parseFloat(((touStats.offPeak.energy / totalTouEnergy) * 100).toFixed(1)) : 0,
      onPeakSessionsPct: totalTouSessions > 0 ? parseFloat(((touStats.onPeak.sessions / totalTouSessions) * 100).toFixed(1)) : 0,
      offPeakSessionsPct: totalTouSessions > 0 ? parseFloat(((touStats.offPeak.sessions / totalTouSessions) * 100).toFixed(1)) : 0
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

export function getFallbackInsights(allowedStations: string[], filterStation: string) {
  if (filterStation !== 'all' && INSIGHTS_SNAPSHOTS[filterStation]) {
    return { ...INSIGHTS_SNAPSHOTS[filterStation], allowedStations, availableStations: allowedStations };
  }
  const allSnap = INSIGHTS_SNAPSHOTS['all'];
  if (allSnap) {
    if (allowedStations.length < FALLBACK_STATIONS.length) {
      const filteredHealth = (allSnap.stationHealthList || []).filter((s: any) => allowedStations.includes(s.station));
      const filteredGrowth = (allSnap.stationGrowth || []).filter((s: any) => allowedStations.includes(s.station));
      return {
        ...allSnap,
        allowedStations,
        availableStations: allowedStations,
        stationHealthList: filteredHealth,
        stationGrowth: filteredGrowth
      };
    }
    return { ...allSnap, allowedStations, availableStations: allowedStations };
  }
  return null;
}
