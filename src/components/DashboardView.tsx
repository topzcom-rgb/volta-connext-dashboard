import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  Zap,
  Clock,
  BatteryCharging,
  Timer,
  Filter,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
  Calendar,
  Building2,
  ShieldCheck,
  UserCheck,
  Activity,
  Layers,
  Coins,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Users,
  Repeat,
  SunMedium,
  Moon,
  Trophy,
  Gauge,
  Hourglass,
  Percent,
  UploadCloud
} from 'lucide-react'
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from './ThemeToggle'

// Hoisted static constants (rendering-hoist-jsx)
const THEME_PURPLE = '#6D288A'
const THEME_GOLD = '#B58A28'
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

const THAI_DAY_COLORS: Record<string | number, string> = {
  0: '#EF4444',
  1: '#EAB308',
  2: '#EC4899',
  3: '#10B981',
  4: '#F97316',
  5: '#0EA5E9',
  6: '#6D288A',
  'อาทิตย์': '#EF4444',
  'จันทร์': '#EAB308',
  'อังคาร': '#EC4899',
  'พุธ': '#10B981',
  'พฤหัสบดี': '#F97316',
  'ศุกร์': '#0EA5E9',
  'เสาร์': '#6D288A',
  'วันอาทิตย์': '#EF4444',
  'วันจันทร์': '#EAB308',
  'วันอังคาร': '#EC4899',
  'วันพุธ': '#10B981',
  'วันพฤหัสบดี': '#F97316',
  'วันศุกร์': '#0EA5E9',
  'วันเสาร์': '#6D288A',
  'อา.': '#EF4444',
  'จ.': '#EAB308',
  'อ.': '#EC4899',
  'พ.': '#10B981',
  'พฤ.': '#F97316',
  'ศ.': '#0EA5E9',
  'ส.': '#6D288A'
}

const THAI_HOLIDAYS: Record<string, string> = {
  '2026-01-01': 'วันขึ้นปีใหม่',
  '2026-01-02': 'วันหยุดชดเชยวันขึ้นปีใหม่',
  '2026-03-03': 'วันมาฆบูชา',
  '2026-04-06': 'วันจักรี',
  '2026-04-13': 'วันสงกรานต์',
  '2026-04-14': 'วันสงกรานต์',
  '2026-04-15': 'วันสงกรานต์',
  '2026-05-01': 'วันแรงงานแห่งชาติ',
  '2026-05-04': 'วันฉัตรมงคล',
  '2026-05-31': 'วันวิสาขบูชา',
  '2026-06-01': 'วันหยุดชดเชยวันวิสาขบูชา',
  '2026-06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
  '2026-07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
  '2026-07-29': 'วันอาสาฬหบูชา',
  '2026-07-30': 'วันเข้าพรรษา',
  '2026-08-12': 'วันแม่แห่งชาติ',
  '2026-10-13': 'วันนวมินทรมหาราช',
  '2026-10-23': 'วันปิยมหาราช',
  '2026-12-05': 'วันพ่อแห่งชาติ / วันชาติ',
  '2026-12-07': 'วันหยุดชดเชยวันพ่อแห่งชาติ',
  '2026-12-10': 'วันรัฐธรรมนูญ',
  '2026-12-31': 'วันสิ้นปี',
  '2025-01-01': 'วันขึ้นปีใหม่',
  '2025-02-12': 'วันมาฆบูชา',
  '2025-04-06': 'วันจักรี',
  '2025-04-07': 'วันหยุดชดเชยวันจักรี',
  '2025-04-13': 'วันสงกรานต์',
  '2025-04-14': 'วันสงกรานต์',
  '2025-04-15': 'วันสงกรานต์',
  '2025-04-16': 'วันหยุดชดเชยวันสงกรานต์',
  '2025-05-01': 'วันแรงงานแห่งชาติ',
  '2025-05-05': 'วันหยุดชดเชยวันฉัตรมงคล',
  '2025-05-11': 'วันวิสาขบูชา',
  '2025-05-12': 'วันหยุดชดเชยวันวิสาขบูชา',
  '2025-06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
  '2025-07-10': 'วันอาสาฬหบูชา',
  '2025-07-11': 'วันเข้าพรรษา',
  '2025-07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
  '2025-08-12': 'วันแม่แห่งชาติ',
  '2025-10-13': 'วันนวมินทรมหาราช',
  '2025-10-23': 'วันปิยมหาราช',
  '2025-12-05': 'วันพ่อแห่งชาติ',
  '2025-12-10': 'วันรัฐธรรมนูญ',
  '2025-12-31': 'วันสิ้นปี'
}

const formatHrs = (mins: number) => `${Math.floor(mins / 60)} ชม. ${Math.floor(mins % 60)} น.`

const getDayColor = (entry: any): string => {
  if (entry === null || entry === undefined) return THEME_PURPLE
  if (typeof entry === 'string' || typeof entry === 'number') {
    if (THAI_DAY_COLORS[entry]) return THAI_DAY_COLORS[entry]
  }
  if (entry.dayIndex !== undefined && THAI_DAY_COLORS[entry.dayIndex]) {
    return THAI_DAY_COLORS[entry.dayIndex]
  }
  if (entry.name && THAI_DAY_COLORS[entry.name]) {
    return THAI_DAY_COLORS[entry.name]
  }
  if (entry.day && THAI_DAY_COLORS[entry.day]) {
    return THAI_DAY_COLORS[entry.day]
  }
  return THEME_PURPLE
}

// Memoized Pivot Heatmap Section (rerender-memo)
const PivotHeatmapSection = memo(function PivotHeatmapSection({
  pivot,
  isDark,
  showHeatmap,
  onToggleHeatmap,
  hourSort,
  onToggleHourSort
}: {
  pivot: any
  isDark: boolean
  showHeatmap: boolean
  onToggleHeatmap: () => void
  hourSort: 'normal' | 'peak'
  onToggleHourSort: () => void
}) {
  const displayedHours = useMemo(() => {
    if (hourSort !== 'peak') return ALL_HOURS
    return [...ALL_HOURS].sort((a, b) => (pivot?.hourTotals?.[b] || 0) - (pivot?.hourTotals?.[a] || 0))
  }, [hourSort, pivot?.hourTotals])

  const maxVal = pivot?.maxCellVal || 1

  const getHeatmapStyle = useCallback(
    (val: number) => {
      if (!val || val === 0) {
        return {
          bg: isDark ? 'bg-[#15101C]' : 'bg-white',
          text: isDark ? 'text-slate-600 font-normal' : 'text-slate-300 font-normal',
          display: '-'
        }
      }
      const ratio = Math.min(Math.max(val / maxVal, 0.05), 1)
      const display = Math.round(val).toString()

      if (ratio >= 0.75) return { bg: isDark ? 'bg-[#9333EA]' : 'bg-[#6D288A]', text: 'text-white font-bold', display }
      if (ratio >= 0.5) return { bg: isDark ? 'bg-[#7E22CE]' : 'bg-[#9353B2]', text: 'text-white font-medium', display }
      if (ratio >= 0.3) return { bg: isDark ? 'bg-[#581C87]' : 'bg-[#CE9FE6]', text: isDark ? 'text-slate-100 font-medium' : 'text-slate-900 font-medium', display }
      if (ratio >= 0.15) return { bg: isDark ? 'bg-[#3B0764]/90' : 'bg-[#EDDDF5]', text: isDark ? 'text-slate-200 font-normal' : 'text-slate-800 font-normal', display }
      return { bg: isDark ? 'bg-[#25053E]/90' : 'bg-[#F7F1FA]', text: isDark ? 'text-slate-300 font-normal' : 'text-slate-700 font-normal', display }
    },
    [isDark, maxVal]
  )

  return (
    <section className="bg-white dark:bg-[#15101C] rounded-xl border border-slate-200/80 dark:border-[#B975DB]/20 overflow-hidden">
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#16111D] dark:bg-[#1D1528] text-white flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E2B95B]/15 border border-[#E2B95B]/30 flex items-center justify-center text-[#E2B95B] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold tracking-tight">ตารางความหนาแน่นรายชั่วโมง (kWh)</h3>
              {!showHeatmap ? (
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-slate-300 font-medium">
                  พับเก็บอยู่
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-400">เมทริกซ์ปริมาณไฟฟ้าตลอด 24 ชั่วโมงแยกตามวัน</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showHeatmap ? (
            <button
              type="button"
              onClick={onToggleHourSort}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/15 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#E2B95B]" />
              <span>{hourSort === 'normal' ? 'เวลา: 00-23 น.' : 'เรียงตาม Peak'}</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onToggleHeatmap}
            className={`flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              showHeatmap
                ? 'bg-[#B58A28] hover:bg-[#9D7721] text-white'
                : 'bg-white text-[#16111D] hover:bg-slate-100'
            }`}
          >
            {showHeatmap ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>ซ่อนตาราง</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#6D288A]" />
                <span>แสดงตาราง Heatmap</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {showHeatmap ? (
        <div className="overflow-auto max-h-[520px] cv-auto">
          <div className="px-4 sm:px-6 py-2 bg-[#F7F6F9] dark:bg-[#110C17] border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">สัญลักษณ์:</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>วันหยุดนักขัตฤกษ์</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono-num">
              <span>0 kWh</span>
              <span className="w-3 h-3 rounded-xs bg-white dark:bg-[#15101C] border border-slate-200 dark:border-slate-700" />
              <span className="w-3 h-3 rounded-xs bg-[#F7F1FA] dark:bg-[#25053E]" />
              <span className="w-3 h-3 rounded-xs bg-[#EDDDF5] dark:bg-[#3B0764]" />
              <span className="w-3 h-3 rounded-xs bg-[#CE9FE6] dark:bg-[#581C87]" />
              <span className="w-3 h-3 rounded-xs bg-[#6D288A] dark:bg-[#9333EA]" />
              <span className="text-[#6D288A] dark:text-[#B975DB] font-bold">Peak</span>
            </div>
          </div>

          <table className="w-full text-left text-[11px] sm:text-xs whitespace-nowrap border-collapse font-mono-num">
            <thead className="bg-[#F3EEF7] dark:bg-[#1D1528] text-[#6D288A] dark:text-[#E2B95B] sticky top-0 z-20 border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-3 sm:px-4 py-2.5 font-bold bg-[#F3EEF7] dark:bg-[#1D1528] sticky left-0 z-20 border-r border-slate-200 dark:border-white/10 min-w-[100px] font-sans">
                  วันที่
                </th>
                <th className="px-2 sm:px-3 py-2.5 font-bold bg-[#F3EEF7] dark:bg-[#1D1528] sticky left-[100px] z-20 border-r border-slate-200 dark:border-white/10 min-w-[65px] font-sans">
                  วัน
                </th>
                {displayedHours.map((h: string) => (
                  <th key={h} className="px-1.5 py-2.5 font-bold text-center border-r border-slate-200/70 dark:border-white/5 min-w-[42px]">
                    {h}
                  </th>
                ))}
                <th className="px-3 sm:px-4 py-2.5 font-bold text-right bg-[#FAF5E9] dark:bg-[#261E12] text-[#B58A28] dark:text-[#E2B95B] sticky right-0 z-20 border-l border-[#E2B95B]/30 min-w-[85px] font-sans">
                  รวม (kWh)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {pivot?.rows?.map((row: any) => {
                const holidayName = THAI_HOLIDAYS[row.date]
                const isHoliday = Boolean(holidayName)

                return (
                  <tr key={row.date} className="hover:opacity-95">
                    <td
                      className={`px-3 sm:px-4 py-2 font-semibold font-sans sticky left-0 z-10 border-r ${
                        isHoliday
                          ? 'bg-rose-50/95 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                          : 'bg-white dark:bg-[#15101C] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10'
                      }`}
                      title={holidayName ? `${row.formattedDate} (${holidayName})` : row.formattedDate}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{row.formattedDate}</span>
                        {isHoliday ? (
                          <span className="text-[9px] px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 rounded font-bold shrink-0">
                            หยุด
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-2 bg-white dark:bg-[#15101C] font-sans sticky left-[100px] z-10 border-r border-slate-200 dark:border-white/10 text-center">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: getDayColor(row.dow) }}
                      >
                        {row.dow}
                      </span>
                    </td>
                    {displayedHours.map((h: string) => {
                      const val = row[h] || 0
                      const style = getHeatmapStyle(val)
                      return (
                        <td
                          key={h}
                          className={`px-1 py-2 text-center border-r border-slate-100 dark:border-white/5 ${style.bg} ${style.text}`}
                        >
                          {style.display}
                        </td>
                      )
                    })}
                    <td className="px-3 sm:px-4 py-2 text-right bg-[#FAF5E9]/80 dark:bg-[#221A0E]/90 font-bold text-[#B58A28] dark:text-[#E2B95B] sticky right-0 z-10 border-l border-slate-200 dark:border-white/10">
                      {row.total ? Math.round(row.total).toLocaleString() : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {pivot?.hourTotals ? (
              <tfoot className="bg-[#16111D] dark:bg-[#1D1528] text-white font-bold sticky bottom-0 z-20 border-t border-white/15">
                <tr>
                  <td className="px-3 sm:px-4 py-2.5 bg-[#16111D] dark:bg-[#1D1528] sticky left-0 z-20 border-r border-white/10 text-slate-200 font-sans">
                    รวมทั้งหมด
                  </td>
                  <td className="px-2 sm:px-3 py-2.5 bg-[#16111D] dark:bg-[#1D1528] sticky left-[100px] z-20 border-r border-white/10 text-slate-400">
                    -
                  </td>
                  {displayedHours.map((h: string) => (
                    <td key={h} className="px-1.5 py-2.5 text-center border-r border-white/10 text-[#E2B95B]">
                      {pivot.hourTotals[h] ? Math.round(pivot.hourTotals[h]).toLocaleString() : '-'}
                    </td>
                  ))}
                  <td className="px-3 sm:px-4 py-2.5 text-right bg-[#B58A28] text-white sticky right-0 z-20 border-l border-[#E2B95B] font-extrabold">
                    {Math.round(pivot.grandTotal).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      ) : null}
    </section>
  )
})

export default function DashboardView({ role }: { role: 'admin' | 'owner' }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterStation, setFilterStation] = useState('all')
  const [hourSort, setHourSort] = useState<'normal' | 'peak'>('normal')

  const [energyMode, setEnergyMode] = useState<'energy' | 'revenue'>('energy')
  const [avgMode, setAvgMode] = useState<'energy' | 'revenue'>('energy')
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false)
  const [leaderboardSort, setLeaderboardSort] = useState<'revenue' | 'energy' | 'sessions'>('revenue')
  const [dowMetric, setDowMetric] = useState<'sessions' | 'energy' | 'revenue'>('sessions')

  const { isDark } = useTheme()
  const navigate = useNavigate()
  const phone = Cookies.get('auth_phone')

  useEffect(() => {
    if (!phone) {
      navigate('/')
      return
    }

    const controller = new AbortController()
    setLoading(true)

    try {
      const localBundleStr = localStorage.getItem('local_snapshots_bundle')
      if (localBundleStr) {
        const localMap = JSON.parse(localBundleStr)
        const key = `dashboard__${filterStation}__${filterMonth}`
        if (localMap[key]) {
          setData(localMap[key])
          setLoading(false)
        }
      }
    } catch {
      // Ignore invalid local cache
    }

    fetch(`/api/dashboard?phone=${phone}&role=${role}&month=${filterMonth}&station=${filterStation}`, {
      signal: controller.signal
    })
      .then(res => res.json())
      .then(d => {
        if (!d.error) {
          setData(d)
        }
        setLoading(false)
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          console.error(e)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [phone, role, navigate, filterMonth, filterStation])

  const handleLogout = useCallback(() => {
    Cookies.remove('auth_phone')
    Cookies.remove('auth_role')
    navigate('/')
  }, [navigate])

  const handleToggleHeatmap = useCallback(() => setShowHeatmap(prev => !prev), [])
  const handleToggleHourSort = useCallback(() => setHourSort(prev => (prev === 'normal' ? 'peak' : 'normal')), [])

  const sortedLeaderboard = useMemo(() => {
    const list = data?.stationLeaderboard || []
    return [...list].sort((a: any, b: any) => {
      if (leaderboardSort === 'revenue') return (b.revenue || 0) - (a.revenue || 0)
      if (leaderboardSort === 'energy') return (b.energy || 0) - (a.energy || 0)
      return (b.sessions || 0) - (a.sessions || 0)
    })
  }, [data?.stationLeaderboard, leaderboardSort])

  const hourlyChartData = useMemo(
    () => (data?.hourlyChart || []).map((h: any) => ({ ...h, name: h.name || h.hour })),
    [data?.hourlyChart]
  )

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: isDark ? '#1D1528' : '#16111D',
      border: '1px solid rgba(226, 185, 91, 0.35)',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '12px'
    }),
    [isDark]
  )

  if (!data && loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F9] dark:bg-[#0C0910] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-[#6D288A] dark:border-[#E2B95B] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm">กำลังเตรียมข้อมูล Dashboard...</p>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-[#F7F6F9] dark:bg-[#0C0910] flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-[#15101C] p-8 rounded-xl border border-slate-200 dark:border-[#B975DB]/25 max-w-md w-full text-center space-y-4">
          <div className="w-11 h-11 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#16111D] dark:text-white">ไม่สามารถโหลดข้อมูลสถานีได้</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{data?.error || 'ไม่พบข้อมูลสถานีที่เชื่อมโยงกับบัญชีนี้'}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-4 bg-[#6D288A] text-white rounded-lg text-sm font-semibold hover:bg-[#581E70] transition-colors cursor-pointer"
          >
            กลับสู่หน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F6F9] dark:bg-[#0C0910] text-[#16111D] dark:text-[#F3F0F7] antialiased selection:bg-[#6D288A] selection:text-white flex flex-col justify-between">
      <div>
        {/* Top Command Navigation */}
        <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-[#15101C]/95 border-b border-slate-200/80 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-[#6D288A] flex items-center justify-center text-white border border-[#E2B95B]/40">
                <Zap className="w-4.5 h-4.5 fill-[#E2B95B] text-[#E2B95B]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#16111D] dark:text-white">VOLTA</span>
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#FAF5E9] dark:bg-[#261E12] text-[#B58A28] dark:text-[#E2B95B] border border-[#B58A28]/25">
                    CONNEXT
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">ระบบวิเคราะห์สถานีอัดประจุไฟฟ้า</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden md:flex items-center gap-1.5 bg-[#F7F6F9] dark:bg-[#1D1528] py-1.5 px-3 rounded-lg border border-slate-200 dark:border-white/10">
                {role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6D288A] dark:text-[#B975DB]" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-[#B58A28] dark:text-[#E2B95B]" />
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'เจ้าของสถานี'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/insights')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#FAF5E9] dark:bg-[#261E12] text-[#8E6919] dark:text-[#E2B95B] hover:bg-[#F3E9D1] dark:hover:bg-[#332818] transition-colors border border-[#B58A28]/30 cursor-pointer shrink-0"
                title="การวิเคราะห์การเติบโต พยากรณ์ และสถานะระบบ"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">วิเคราะห์เติบโต & พยากรณ์</span>
                <span className="sm:hidden">พยากรณ์</span>
              </button>

              {role === 'admin' ? (
                <button
                  type="button"
                  onClick={() => navigate('/admin/stations')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#6D288A] hover:bg-[#581E70] text-white transition-colors cursor-pointer shrink-0"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">จัดการสิทธิ์ & CSV</span>
                  <span className="sm:hidden">จัดการ</span>
                </button>
              ) : null}

              <ThemeToggle />

              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 shrink-0 cursor-pointer"
                title="ออกจากระบบ"
                aria-label="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Workspace */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* Filter Toolbar */}
          <section className="bg-white dark:bg-[#15101C] rounded-xl p-4 border border-slate-200/80 dark:border-[#B975DB]/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F3EEF7] dark:bg-[#1D1528] flex items-center justify-center text-[#6D288A] dark:text-[#B975DB] shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xs sm:text-sm font-bold text-[#16111D] dark:text-white">ขอบเขตข้อมูลสถานี</h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {filterStation === 'all' ? `ภาพรวมทั้งหมด ${(data.allowedStations || []).length} สถานี` : filterStation}
                  {filterMonth !== 'all' ? ` • เดือน ${filterMonth}` : ' • ทุกช่วงเวลา'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial min-w-[170px]">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  aria-label="เลือกสถานีชาร์จ"
                  value={filterStation}
                  onChange={e => setFilterStation(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-7 py-2 bg-[#F7F6F9] dark:bg-[#0C0910] border border-slate-200 dark:border-[#B975DB]/25 text-xs font-semibold text-[#16111D] dark:text-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-[#6D288A] cursor-pointer"
                >
                  <option value="all">ทุกสถานี ({(data.allowedStations || []).length} สถานี)</option>
                  {(data.allowedStations || []).map((s: string) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="relative flex-1 sm:flex-initial min-w-[140px]">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  aria-label="เลือกเดือน"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="w-full sm:w-44 pl-9 pr-7 py-2 bg-[#F7F6F9] dark:bg-[#0C0910] border border-slate-200 dark:border-[#B975DB]/25 text-xs font-semibold text-[#16111D] dark:text-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-[#6D288A] cursor-pointer"
                >
                  <option value="all">ทุกช่วงเวลา</option>
                  {(data.availableMonths || []).map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {loading ? (
                <span className="text-[11px] font-semibold text-[#6D288A] dark:text-[#B975DB] bg-[#F3EEF7] dark:bg-[#1D1528] px-2.5 py-1.5 rounded-lg">
                  กำลังอัปเดต...
                </span>
              ) : null}
            </div>
          </section>

          {/* Row 1: Primary Telemetry KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Total Energy / Revenue */}
            <div className="bg-white dark:bg-[#15101C] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#B975DB]/20 border-t-2 border-t-[#6D288A] dark:border-t-[#B975DB]">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex bg-[#F7F6F9] dark:bg-[#0C0910] p-0.5 rounded-lg border border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEnergyMode('energy')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      energyMode === 'energy'
                        ? 'bg-[#6D288A] text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    พลังงานรวม
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnergyMode('revenue')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      energyMode === 'revenue'
                        ? 'bg-[#B58A28] text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    รายได้รวม
                  </button>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#F3EEF7] dark:bg-[#1D1528] text-[#6D288A] dark:text-[#B975DB] flex items-center justify-center">
                  {energyMode === 'energy' ? <Zap className="w-4 h-4" /> : <Coins className="w-4 h-4 text-[#B58A28] dark:text-[#E2B95B]" />}
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 tabular-nums">
                {energyMode === 'energy' ? (
                  <>
                    <span className="text-2xl font-extrabold tracking-tight text-[#16111D] dark:text-white">
                      {data.stats.totalEnergy.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-xs font-bold text-[#6D288A] dark:text-[#B975DB]">kWh</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold tracking-tight text-[#B58A28] dark:text-[#E2B95B]">
                      ฿{(data.stats.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">บาท</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 tabular-nums">
                {data.stats.sessionsCount?.toLocaleString()} รอบการชาร์จสะสม
              </p>
            </div>

            {/* Card 2: Total Duration */}
            <div className="bg-white dark:bg-[#15101C] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#B975DB]/20 border-t-2 border-t-[#B58A28] dark:border-t-[#E2B95B]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">เวลาชาร์จสะสมรวม</span>
                <div className="w-8 h-8 rounded-lg bg-[#FAF5E9] dark:bg-[#261E12] text-[#B58A28] dark:text-[#E2B95B] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-[#16111D] dark:text-white tabular-nums">
                {formatHrs(data.stats.totalTimeMins)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">ระยะเวลาจ่ายไฟรวมทั้งหมด</p>
            </div>

            {/* Card 3: Avg Energy / Avg Revenue */}
            <div className="bg-white dark:bg-[#15101C] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#B975DB]/20">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex bg-[#F7F6F9] dark:bg-[#0C0910] p-0.5 rounded-lg border border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setAvgMode('energy')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      avgMode === 'energy'
                        ? 'bg-[#6D288A] text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    พลังงานเฉลี่ย
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvgMode('revenue')}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      avgMode === 'revenue'
                        ? 'bg-[#B58A28] text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    รายได้เฉลี่ย
                  </button>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#F3EEF7] dark:bg-[#1D1528] text-[#6D288A] dark:text-[#B975DB] flex items-center justify-center">
                  {avgMode === 'energy' ? <BatteryCharging className="w-4 h-4" /> : <Coins className="w-4 h-4 text-[#B58A28] dark:text-[#E2B95B]" />}
                </div>
              </div>

              <div className="flex items-baseline gap-1.5 tabular-nums">
                {avgMode === 'energy' ? (
                  <>
                    <span className="text-2xl font-extrabold tracking-tight text-[#16111D] dark:text-white">
                      {data.stats.avgEnergy.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-[#6D288A] dark:text-[#B975DB]">kWh/ครั้ง</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold tracking-tight text-[#B58A28] dark:text-[#E2B95B]">
                      ฿{(data.stats.avgRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ครั้ง</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">ค่าเฉลี่ยต่อการชาร์จ 1 รอบ</p>
            </div>

            {/* Card 4: Avg Duration */}
            <div className="bg-white dark:bg-[#15101C] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-[#B975DB]/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">ระยะเวลาชาร์จเฉลี่ย</span>
                <div className="w-8 h-8 rounded-lg bg-[#FAF5E9] dark:bg-[#261E12] text-[#B58A28] dark:text-[#E2B95B] flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-2xl font-extrabold tracking-tight text-[#16111D] dark:text-white">
                  {formatHrs(data.stats.avgTimeMins)}
                </span>
                <span className="text-xs font-semibold text-[#B58A28] dark:text-[#E2B95B]">/ครั้ง</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">เวลาเฉลี่ยต่อรอบการใช้งาน</p>
            </div>
          </section>

          {/* Row 2: Operational Telemetry */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white dark:bg-[#15101C] rounded-xl p-4 border border-slate-200/80 dark:border-[#B975DB]/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-[#6D288A] dark:text-[#B975DB]" />
                  <span>กำลังไฟเฉลี่ยขณะชาร์จ</span>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-xl font-extrabold text-[#6D288A] dark:text-[#B975DB]">
                    {data.stats?.avgChargingSpeedKw?.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">kW</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">อัตราจ่ายไฟเฉลี่ย (kWh/ชม.)</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#15101C] rounded-xl p-4 border border-slate-200/80 dark:border-[#B975DB]/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Percent className="w-3.5 h-3.5 text-[#B58A28] dark:text-[#E2B95B]" />
                  <span>อัตราการใช้งานตู้ (Utilization)</span>
                </div>
                <div className="text-xl font-extrabold text-[#B58A28] dark:text-[#E2B95B] tabular-nums">
                  {data.stats?.utilizationRate?.toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  เฉลี่ย {data.stats?.avgHoursPerDay?.toFixed(1)} ชม. / 24 ชม.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#15101C] rounded-xl p-4 border border-slate-200/80 dark:border-[#B975DB]/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#6D288A] dark:text-[#B975DB]" />
                  <span>ผู้ใช้บริการไม่ซ้ำ (Unique)</span>
                </div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-xl font-extrabold text-[#16111D] dark:text-white">
                    {data.customerStats?.uniqueUsers?.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">คน</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  ความถี่ {data.customerStats?.avgFrequency?.toFixed(1)} ครั้ง/คน
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#15101C] rounded-xl p-4 border border-slate-200/80 dark:border-[#B975DB]/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <Repeat className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>อัตราการกลับมาใช้ซ้ำ</span>
                </div>
                <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 tabular-nums">
                  {data.customerStats?.retentionRate?.toFixed(1)}%
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  ใช้ซ้ำ {data.customerStats?.totalReturning?.toLocaleString()} คน (≥2 ครั้ง)
                </p>
              </div>
            </div>
          </section>

          {/* Row 3: Retention, Duration Bins & TOU */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Customer Retention */}
            <div className="bg-white dark:bg-[#15101C] rounded-xl p-5 border border-slate-200/80 dark:border-[#B975DB]/20 flex flex-col justify-between">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#F3EEF7] dark:bg-[#1D1528] text-[#6D288A] dark:text-[#B975DB] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#16111D] dark:text-white">กลุ่มลูกค้าและการใช้ซ้ำ</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">จำแนกตามความถี่ในการเข้ามาชาร์จ</p>
                </div>
              </div>

              <div className="space-y-3">
                {data.customerStats?.customerSegments?.map((seg: any) => {
                  let barColor = 'bg-[#6D288A] dark:bg-[#B975DB]'
                  let textColor = 'text-[#6D288A] dark:text-[#B975DB]'
                  if (seg.key === 'repeat') {
                    barColor = 'bg-[#9353B2] dark:bg-[#C084FC]'
                    textColor = 'text-[#9353B2] dark:text-[#C084FC]'
                  } else if (seg.key === 'champion') {
                    barColor = 'bg-[#B58A28] dark:bg-[#E2B95B]'
                    textColor = 'text-[#B58A28] dark:text-[#E2B95B]'
                  } else if (seg.key === 'single') {
                    barColor = 'bg-slate-300 dark:bg-slate-700'
                    textColor = 'text-slate-600 dark:text-slate-400'
                  }

                  return (
                    <div key={seg.key} className="space-y-1">
                      <div className="flex justify-between text-xs tabular-nums">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{seg.label}</span>
                        <span className={`font-bold ${textColor}`}>
                          {seg.count?.toLocaleString()} คน ({seg.share?.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${seg.share || 0}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Duration Bins */}
            <div className="bg-white dark:bg-[#15101C] rounded-xl p-5 border border-slate-200/80 dark:border-[#B975DB]/20 flex flex-col justify-between">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#FAF5E9] dark:bg-[#261E12] text-[#B58A28] dark:text-[#E2B95B] flex items-center justify-center shrink-0">
                  <Hourglass className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#16111D] dark:text-white">ช่วงระยะเวลาการชาร์จ</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">สัดส่วนเวลาต่อรอบการชาร์จ</p>
                </div>
              </div>

              <div className="space-y-3">
                {data.durationList?.map((bin: any) => (
                  <div key={bin.key || bin.bin} className="space-y-1">
                    <div className="flex justify-between text-xs tabular-nums">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{bin.label}</span>
                      <span className="font-bold text-[#6D288A] dark:text-[#B975DB]">
                        {bin.count?.toLocaleString()} ครั้ง ({bin.share?.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6D288A] dark:bg-[#B975DB] rounded-full"
                        style={{ width: `${bin.share || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOU Analytics */}
            <div className="bg-white dark:bg-[#15101C] rounded-xl p-5 border border-slate-200/80 dark:border-[#B975DB]/20 flex flex-col justify-between">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <SunMedium className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#16111D] dark:text-white">ช่วงเวลาไฟฟ้า TOU</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">จ.-ศ. 09:00-22:00 น. เทียบช่วงนอกเวลา</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300 mb-2">
                    <span className="flex items-center gap-1"><SunMedium className="w-3.5 h-3.5 text-amber-600" /> On-Peak</span>
                    <span className="tabular-nums">{data.touStats?.onPeakEnergyPct?.toFixed(0)}%</span>
                  </div>
                  <div className="text-base font-extrabold text-amber-950 dark:text-amber-100 tabular-nums">
                    {data.touStats?.onPeak?.energy?.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">kWh</span>
                  </div>
                  <div className="text-[11px] text-amber-800 dark:text-amber-400 mt-1 tabular-nums">
                    {data.touStats?.onPeak?.sessions?.toLocaleString()} ครั้ง • ฿{(data.touStats?.onPeak?.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-300 mb-2">
                    <span className="flex items-center gap-1"><Moon className="w-3.5 h-3.5 text-indigo-500" /> Off-Peak</span>
                    <span className="tabular-nums">{data.touStats?.offPeakEnergyPct?.toFixed(0)}%</span>
                  </div>
                  <div className="text-base font-extrabold text-indigo-950 dark:text-indigo-100 tabular-nums">
                    {data.touStats?.offPeak?.energy?.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">kWh</span>
                  </div>
                  <div className="text-[11px] text-indigo-800 dark:text-indigo-400 mt-1 tabular-nums">
                    {data.touStats?.offPeak?.sessions?.toLocaleString()} ครั้ง • ฿{(data.touStats?.offPeak?.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Admin Exclusive: Station Leaderboard */}
          {role === 'admin' ? (
            <section className="bg-white dark:bg-[#15101C] rounded-xl p-5 border border-slate-200/80 dark:border-[#B975DB]/20 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FAF5E9] dark:bg-[#261E12] text-[#B58A28] dark:text-[#E2B95B] flex items-center justify-center shrink-0">
                    <Trophy className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#16111D] dark:text-white">
                      จัดอันดับสถานีในเครือข่าย ({data.stationLeaderboard?.length || 14} สถานี)
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">เปรียบเทียบรายได้ พลังงาน และความถี่การใช้งาน</p>
                  </div>
                </div>

                <div className="inline-flex bg-[#F7F6F9] dark:bg-[#0C0910] p-1 rounded-lg border border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setLeaderboardSort('revenue')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                      leaderboardSort === 'revenue'
                        ? 'bg-[#B58A28] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    รายได้
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardSort('energy')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                      leaderboardSort === 'energy'
                        ? 'bg-[#6D288A] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    พลังงาน
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardSort('sessions')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                      leaderboardSort === 'sessions'
                        ? 'bg-[#16111D] dark:bg-slate-700 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    จำนวนครั้ง
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-80 rounded-lg border border-slate-200/80 dark:border-white/10 cv-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#F7F6F9] dark:bg-[#1D1528] text-slate-600 dark:text-[#E2B95B] sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-3.5 py-2.5 font-bold w-14 text-center">อันดับ</th>
                      <th className="px-3.5 py-2.5 font-bold">ชื่อสถานี</th>
                      <th className="px-3.5 py-2.5 font-bold text-right">รายได้รวม (บาท)</th>
                      <th className="px-3.5 py-2.5 font-bold text-right">พลังงานรวม (kWh)</th>
                      <th className="px-3.5 py-2.5 font-bold text-right">จำนวนครั้ง</th>
                      <th className="px-3.5 py-2.5 font-bold text-right">กำลังไฟเฉลี่ย</th>
                      <th className="px-3.5 py-2.5 font-bold text-right">เวลาเฉลี่ย/ครั้ง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 tabular-nums">
                    {sortedLeaderboard.map((st: any, idx: number) => {
                      const rank = idx + 1
                      return (
                        <tr key={st.name} className="hover:bg-[#F7F6F9] dark:hover:bg-[#1D1528] transition-colors">
                          <td className="px-3.5 py-2.5 text-center">
                            {rank <= 3 ? (
                              <span
                                className={`w-6 h-6 rounded-md font-bold inline-flex items-center justify-center text-xs text-white ${
                                  rank === 1 ? 'bg-[#B58A28]' : rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
                                }`}
                              >
                                {rank}
                              </span>
                            ) : (
                              <span className="font-semibold text-slate-400">{rank}</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 font-semibold text-[#16111D] dark:text-slate-200">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-[#6D288A] dark:text-[#B975DB] shrink-0" />
                              <span className="truncate max-w-[180px] sm:max-w-none">{st.name}</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-[#B58A28] dark:text-[#E2B95B]">
                            ฿{st.revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-semibold text-[#6D288A] dark:text-[#B975DB]">
                            {st.energy?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                            {st.sessions?.toLocaleString()} ครั้ง
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-slate-600 dark:text-slate-400">
                            {st.avgSpeedKw?.toFixed(1)} kW
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-slate-500 dark:text-slate-400">
                            {formatHrs(st.avgDurationMins)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* Row 4: Monthly Trend & Day of Week */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            <div className="lg:col-span-8 bg-white dark:bg-[#15101C] rounded-xl p-5 border border-slate-200/80 dark:border-[#B975DB]/20 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#6D288A] dark:text-[#B975DB]" />
                    <h2 className="text-sm font-bold text-[#16111D] dark:text-white">แนวโน้มการใช้พลังงานรายเดือน</h2>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ปริมาณไฟฟ้า (kWh) เทียบกับเวลาชาร์จรวม (ชม.)</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#6D288A] dark:bg-[#B975DB]" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">พลังงาน (kWh)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#B58A28] dark:bg-[#E2B95B]" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">เวลาชาร์จ (ชม.)</span>
                  </div>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.monthlyChart} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#281D38' : '#ECE8F1'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#B975DB' : THEME_PURPLE }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#E2B95B' : THEME_GOLD }} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: any, name: any) => {
                        if (name === 'energy') return [`${Number(val).toFixed(1)} kWh`, 'ปริมาณไฟฟ้า']
                        return [`${Number(val).toFixed(1)} ชม.`, 'เวลาชาร์จ']
                      }}
                    />
                    <Bar yAxisId="left" dataKey="energy" name="energy" fill={isDark ? '#B975DB' : THEME_PURPLE} radius={[4, 4, 0, 0]} maxBarSize={42} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="timeHrs"
                      name="timeHrs"
                      stroke={isDark ? '#E2B95B' : THEME_GOLD}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: isDark ? '#E2B95B' : THEME_GOLD, strokeWidth: 1.5, stroke: '#ffffff' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white dark:bg-[#15101C] rounded-xl p-5 border border-slate-200/80 dark:border-[#B975DB]/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#B58A28] dark:text-[#E2B95B]" />
                    <h2 className="text-sm font-bold text-[#16111D] dark:text-white">สัดส่วนตามวัน</h2>
                  </div>

                  <div className="inline-flex bg-[#F7F6F9] dark:bg-[#0C0910] p-0.5 rounded-lg border border-slate-200/80 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setDowMetric('sessions')}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        dowMetric === 'sessions' ? 'bg-[#6D288A] text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      ครั้ง
                    </button>
                    <button
                      type="button"
                      onClick={() => setDowMetric('energy')}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        dowMetric === 'energy' ? 'bg-[#6D288A] text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      kWh
                    </button>
                    <button
                      type="button"
                      onClick={() => setDowMetric('revenue')}
                      className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ${
                        dowMetric === 'revenue' ? 'bg-[#B58A28] text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      บาท
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {dowMetric === 'sessions' ? 'จำนวนครั้งการชาร์จ (จ.-อา.)' : null}
                  {dowMetric === 'energy' ? 'ปริมาณไฟฟ้า kWh (จ.-อา.)' : null}
                  {dowMetric === 'revenue' ? 'รายได้ค่าบริการ บาท (จ.-อา.)' : null}
                </p>
              </div>

              <div className="h-48 sm:h-52 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.dowChart || []} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={3} dataKey={dowMetric}>
                      {(data.dowChart || []).map((entry: any, index: number) => (
                        <Cell key={entry.name || entry.day || index} fill={getDayColor(entry)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: any) => {
                        if (dowMetric === 'energy') return [`${Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`, 'พลังงานรวม']
                        if (dowMetric === 'revenue') return [`฿${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'รายได้รวม']
                        return [`${Number(val).toLocaleString()} ครั้ง`, 'จำนวนครั้ง']
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-7 gap-1 pt-3 border-t border-slate-100 dark:border-white/10 text-center tabular-nums">
                {(data.dowChart || []).map((d: any, index: number) => {
                  let displayVal = `${d.sessions || 0}`
                  if (dowMetric === 'energy') displayVal = `${d.energy ? Math.round(d.energy).toLocaleString() : 0}`
                  if (dowMetric === 'revenue') {
                    displayVal = `${d.revenue ? (d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : Math.round(d.revenue)) : 0}`
                  }
                  return (
                    <div key={d.name || index} className="flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: getDayColor(d) }} />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{d.name}</span>
                      <span className="text-[10.5px] font-bold text-[#16111D] dark:text-slate-100">{displayVal}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Row 5: Hourly Peak & Daily Log */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            <div className="lg:col-span-6 bg-white dark:bg-[#15101C] rounded-xl p-5 border border-slate-200/80 dark:border-[#B975DB]/20 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#6D288A] dark:text-[#B975DB]" />
                    <h2 className="text-sm font-bold text-[#16111D] dark:text-white">โหลดการใช้งานตลอด 24 ชั่วโมง</h2>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">พฤติกรรมการชาร์จตั้งแต่ 00:00 - 23:00 น.</p>
                </div>
                <span className="text-[11px] font-semibold bg-[#FAF5E9] dark:bg-[#261E12] text-[#B58A28] dark:text-[#E2B95B] px-2.5 py-1 rounded-md border border-[#B58A28]/25 font-mono-num">
                  24h
                </span>
              </div>

              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyChartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#281D38' : '#ECE8F1'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} interval={3} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#B975DB' : THEME_PURPLE }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#E2B95B' : THEME_GOLD }} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: any, name: any) => {
                        if (name === 'energy') return [`${Number(val).toFixed(1)} kWh`, 'พลังงาน']
                        return [`${val} ครั้ง`, 'จำนวนครั้ง']
                      }}
                    />
                    <Line yAxisId="left" type="monotone" dataKey="energy" name="energy" stroke={isDark ? '#B975DB' : THEME_PURPLE} strokeWidth={2.5} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="sessions" name="sessions" stroke={isDark ? '#E2B95B' : THEME_GOLD} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs pt-3 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6D288A] dark:bg-[#B975DB]" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">พลังงาน (kWh)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B58A28] dark:bg-[#E2B95B]" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">จำนวนครั้ง</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white dark:bg-[#15101C] rounded-xl p-5 border border-slate-200/80 dark:border-[#B975DB]/20 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#6D288A] dark:text-[#B975DB]" />
                    <h2 className="text-sm font-bold text-[#16111D] dark:text-white">ประวัติการใช้งานรายวัน</h2>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">สรุปยอดพลังงานและรายได้ประจำแต่ละวัน</p>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
                  {(data.dailyTable || []).length} วัน
                </span>
              </div>

              <div className="overflow-auto max-h-64 rounded-lg border border-slate-200/80 dark:border-white/10 cv-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#F7F6F9] dark:bg-[#1D1528] text-slate-600 dark:text-[#E2B95B] sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">วันที่</th>
                      <th className="px-3 py-2.5 font-bold text-right">ครั้ง</th>
                      <th className="px-3 py-2.5 font-bold text-right">รายได้</th>
                      <th className="px-3 py-2.5 font-bold text-right">พลังงาน</th>
                      <th className="px-3 py-2.5 font-bold text-right">เวลาชาร์จ</th>
                      <th className="px-3 py-2.5 font-bold text-right">เฉลี่ย/ครั้ง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300 tabular-nums">
                    {(data.dailyTable || []).map((d: any) => {
                      const energyVal = typeof d.energy === 'number' ? d.energy : parseFloat(d.energy) || 0
                      const avgEnergyVal =
                        typeof d.avgEnergy === 'number'
                          ? d.avgEnergy
                          : d.sessions > 0
                            ? energyVal / d.sessions
                            : parseFloat(d.avgEnergy) || 0
                      const timeVal = d.timeHrs ? d.timeHrs * 60 : d.time || d.timeMins || 0
                      return (
                        <tr key={d.date} className="hover:bg-[#F7F6F9] dark:hover:bg-[#1D1528] transition-colors">
                          <td className="px-3 py-2 font-medium text-[#16111D] dark:text-slate-200">{d.formattedDate || d.date}</td>
                          <td className="px-3 py-2 text-right font-semibold text-[#16111D] dark:text-white">{d.sessions}</td>
                          <td className="px-3 py-2 text-right font-bold text-[#B58A28] dark:text-[#E2B95B]">
                            ฿{d.revenue ? Math.round(d.revenue).toLocaleString() : '0'}
                          </td>
                          <td className="px-3 py-2 text-right text-[#6D288A] dark:text-[#B975DB] font-semibold">
                            {energyVal.toFixed(1)} kWh
                          </td>
                          <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-400">{formatHrs(timeVal)}</td>
                          <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">{avgEnergyVal.toFixed(1)} kWh</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Row 6: Memoized Pivot Heatmap */}
          <PivotHeatmapSection
            pivot={data.pivot}
            isDark={isDark}
            showHeatmap={showHeatmap}
            onToggleHeatmap={handleToggleHeatmap}
            hourSort={hourSort}
            onToggleHourSort={handleToggleHourSort}
          />
        </main>
      </div>

      <footer className="mt-10 py-6 bg-white dark:bg-[#15101C] border-t border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 px-4">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Copyright © 2026 แผนกบริการงานวิศวกรรม กองบริการลูกค้า
        </p>
        <p>ฝ่ายวิศวกรรมและบริการ การไฟฟ้าส่วนภูมิภาค เขต 2 (ภาคเหนือ)</p>
      </footer>
    </div>
  )
}
