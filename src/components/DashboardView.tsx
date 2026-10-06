import { useEffect, useState } from 'react'
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

export default function DashboardView({ role }: { role: 'admin' | 'owner' }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterStation, setFilterStation] = useState('all')
  const [hourSort, setHourSort] = useState<'normal' | 'peak'>('normal')
  
  // Interactive Toggles
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
    setLoading(true)

    // Check local snapshot bundle first for instant display
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
    } catch (e) {}

    fetch(`/api/dashboard?phone=${phone}&role=${role}&month=${filterMonth}&station=${filterStation}`)
      .then(res => res.json())
      .then(d => { 
        if (!d.error) {
          setData(d);
        }
        setLoading(false); 
      })
      .catch(e => { console.error(e); setLoading(false); })
  }, [phone, role, navigate, filterMonth, filterStation])

  if (!data && loading) {
    return (
      <div className="min-h-screen bg-[#3f1d4c] dark:bg-[#130d1b] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#B58E38] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-medium text-sm animate-pulse tracking-wide">กำลังเตรียมข้อมูล Dashboard...</p>
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-[#faf8fc] dark:bg-[#0f0a14] flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-[#1a1224] p-8 rounded-3xl shadow-sm border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 dark:bg-rose-950/50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{data?.error || 'ไม่พบข้อมูลสถานีที่เชื่อมโยงกับบัญชีนี้'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full py-2.5 px-4 bg-[#7F3F98] text-white rounded-xl text-sm font-medium hover:bg-[#6a2d81] transition cursor-pointer"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
      </div>
    )
  }

  const handleLogout = () => { 
    Cookies.remove('auth_phone'); 
    Cookies.remove('auth_role'); 
    navigate('/'); 
  }

  const formatHrs = (mins: number) => `${Math.floor(mins / 60)} ชม. ${Math.floor(mins % 60)} น.`
  
  // Corporate Theme
  const THEME_PURPLE = '#7F3F98';
  const THEME_GOLD = '#B58E38';

  // Traditional Thai Daily Colors (สีประจำวันตามวัฒนธรรมไทย)
  const THAI_DAY_COLORS: { [key: string | number]: string } = {
    0: '#EF4444', // อาทิตย์ - แดง
    1: '#EAB308', // จันทร์ - เหลือง
    2: '#EC4899', // อังคาร - ชมพู
    3: '#10B981', // พุธ - เขียว
    4: '#F97316', // พฤหัสฯ - ส้ม
    5: '#0EA5E9', // ศุกร์ - ฟ้า
    6: '#7F3F98', // เสาร์ - ม่วง
    'อาทิตย์': '#EF4444',
    'จันทร์': '#EAB308',
    'อังคาร': '#EC4899',
    'พุธ': '#10B981',
    'พฤหัสบดี': '#F97316',
    'ศุกร์': '#0EA5E9',
    'เสาร์': '#7F3F98',
    'วันอาทิตย์': '#EF4444',
    'วันจันทร์': '#EAB308',
    'วันอังคาร': '#EC4899',
    'วันพุธ': '#10B981',
    'วันพฤหัสบดี': '#F97316',
    'วันศุกร์': '#0EA5E9',
    'วันเสาร์': '#7F3F98',
    'อา.': '#EF4444',
    'จ.': '#EAB308',
    'อ.': '#EC4899',
    'พ.': '#10B981',
    'พฤ.': '#F97316',
    'ศ.': '#0EA5E9',
    'ส.': '#7F3F98',
  };

  const getDayColor = (entry: any) => {
    if (entry === null || entry === undefined) return '#7F3F98';
    if (typeof entry === 'string' || typeof entry === 'number') {
      if (THAI_DAY_COLORS[entry]) return THAI_DAY_COLORS[entry];
    }
    if (entry.dayIndex !== undefined && THAI_DAY_COLORS[entry.dayIndex]) {
      return THAI_DAY_COLORS[entry.dayIndex];
    }
    if (entry.name && THAI_DAY_COLORS[entry.name]) {
      return THAI_DAY_COLORS[entry.name];
    }
    if (entry.day && THAI_DAY_COLORS[entry.day]) {
      return THAI_DAY_COLORS[entry.day];
    }
    return '#7F3F98';
  };

  // Thai Public Holidays (วันหยุดนักขัตฤกษ์ของไทย)
  const THAI_HOLIDAYS: { [dateStr: string]: string } = {
    // 2026
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
    // 2025
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
    '2025-06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชินี',
    '2025-07-10': 'วันอาสาฬหบูชา',
    '2025-07-11': 'วันเข้าพรรษา',
    '2025-07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
    '2025-08-12': 'วันแม่แห่งชาติ',
    '2025-10-13': 'วันนวมินทรมหาราช',
    '2025-10-23': 'วันปิยมหาราช',
    '2025-12-05': 'วันพ่อแห่งชาติ',
    '2025-12-10': 'วันรัฐธรรมนูญ',
    '2025-12-31': 'วันสิ้นปี'
  };

  const allHours = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
  const displayedHours = hourSort === 'peak'
    ? [...allHours].sort((a, b) => (data.pivot?.hourTotals?.[b] || 0) - (data.pivot?.hourTotals?.[a] || 0))
    : allHours;

  const maxVal = data.pivot?.maxCellVal || 1;

  const getHeatmapStyle = (val: number) => {
    if (!val || val === 0) {
      return { 
        bg: isDark ? 'bg-[#181120]' : 'bg-white', 
        text: isDark ? 'text-slate-600 font-normal' : 'text-slate-300 font-normal', 
        display: '-' 
      };
    }
    const ratio = Math.min(Math.max(val / maxVal, 0.05), 1);
    const display = Math.round(val).toString();
    
    if (ratio >= 0.75) return { bg: isDark ? 'bg-[#9d4edd]' : 'bg-[#7F3F98]', text: 'text-white font-bold shadow-xs', display };
    if (ratio >= 0.50) return { bg: isDark ? 'bg-[#7b2cbf]' : 'bg-[#9f5fc0]', text: 'text-white font-medium', display };
    if (ratio >= 0.30) return { bg: isDark ? 'bg-[#5a189a]' : 'bg-[#cf9fe6]', text: isDark ? 'text-slate-100 font-medium' : 'text-slate-900 font-medium', display };
    if (ratio >= 0.15) return { bg: isDark ? 'bg-[#3c096c]/80' : 'bg-[#eddcf5]', text: isDark ? 'text-slate-200 font-normal' : 'text-slate-800 font-normal', display };
    return { bg: isDark ? 'bg-[#240046]/80' : 'bg-[#f6edfa]', text: isDark ? 'text-slate-300 font-normal' : 'text-slate-700 font-normal', display };
  };

  // Sort Leaderboard
  const sortedLeaderboard = [...(data.stationLeaderboard || [])].sort((a, b) => {
    if (leaderboardSort === 'revenue') return (b.revenue || 0) - (a.revenue || 0);
    if (leaderboardSort === 'energy') return (b.energy || 0) - (a.energy || 0);
    return (b.sessions || 0) - (a.sessions || 0);
  });

  return (
    <div className="min-h-screen bg-[#faf8fc] dark:bg-[#0f0a14] text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-[#7F3F98] selection:text-white flex flex-col justify-between transition-colors duration-300">
      
      <div>
        {/* Top Glass Navigation */}
        <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-[#130d1b]/90 border-b border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-2xs transition-colors">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
            
            {/* Logo & Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#7F3F98] to-[#9d5ab8] flex items-center justify-center text-white shadow-sm shadow-[#7F3F98]/20 border border-[#B58E38]/50">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-[#B58E38] text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1 sm:space-x-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#7F3F98] dark:text-[#c084fc]">VOLTA</span>
                  <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#B58E38]/15 dark:bg-[#B58E38]/30 text-[#B58E38] dark:text-[#deb965] border border-[#B58E38]/30 dark:border-[#deb965]/40">
                    CONNEXT
                  </span>
                </div>
                <p className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 -mt-0.5 hidden xs:block">EV Charging Intelligence Platform</p>
              </div>
            </div>

            {/* User Status & Actions */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5">
              <div className="hidden md:flex items-center space-x-2 bg-[#f6edfa] dark:bg-[#251a33] py-1 px-3 rounded-full border border-[#eddcf5] dark:border-[#7F3F98]/30">
                {role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7F3F98] dark:text-[#c084fc]" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-[#B58E38] dark:text-[#deb965]" />
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'Owner'}
                </span>
              </div>

              {/* Growth & Insights Page Button */}
              <button 
                onClick={() => navigate('/insights')} 
                className="inline-flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#B58E38]/15 dark:bg-[#B58E38]/25 text-[#7c5b13] dark:text-[#deb965] hover:bg-[#B58E38]/25 dark:hover:bg-[#B58E38]/35 transition border border-[#B58E38]/35 cursor-pointer shadow-2xs shrink-0"
                title="การวิเคราะห์การเติบโต พยากรณ์ และสถานะระบบ"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#B58E38] dark:text-[#deb965]" />
                <span className="hidden sm:inline">การวิเคราะห์เติบโต & </span>
                <span>พยากรณ์</span>
              </button>

              {role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin/stations')} 
                  className="inline-flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#7F3F98]/10 dark:bg-[#7F3F98]/25 text-[#7F3F98] dark:text-[#c084fc] hover:bg-[#7F3F98]/20 dark:hover:bg-[#7F3F98]/35 transition border border-[#7F3F98]/25 cursor-pointer shadow-2xs shrink-0"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#7F3F98] dark:text-[#c084fc]" />
                  <span className="hidden sm:inline">จัดการข้อมูล & </span>
                  <span>CSV</span>
                </button>
              )}

              {/* Small Dark Mode Toggle Button */}
              <ThemeToggle />

              <button 
                onClick={handleLogout} 
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-rose-950/40 transition border border-transparent hover:border-red-100 dark:hover:border-rose-900/40 shrink-0 cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Bento Grid Workspace */}
        <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Bento Control & Filter Bar */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#f6edfa] dark:bg-[#251a33] flex items-center justify-center text-[#7F3F98] dark:text-[#c084fc] shrink-0">
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">ตัวกรองข้อมูลสถานี</h2>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">เลือกดูภาพรวมทั้งหมดหรือเจาะจงเฉพาะสถานี</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {/* Station Dropdown */}
              <div className="relative flex-1 sm:flex-initial min-w-[150px]">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <select 
                  value={filterStation} 
                  onChange={e => setFilterStation(e.target.value)} 
                  className="w-full sm:w-64 pl-8 sm:pl-9 pr-7 py-2 bg-slate-50 dark:bg-[#251a33] border border-slate-200 dark:border-[#7F3F98]/30 text-xs font-medium text-slate-800 dark:text-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-[#7F3F98]/20 focus:border-[#7F3F98] transition appearance-none cursor-pointer"
                >
                  <option value="all">ทุกสถานี ({(data.allowedStations || []).length} สถานี)</option>
                  {(data.allowedStations || []).map((s: any) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Month Dropdown */}
              <div className="relative flex-1 sm:flex-initial min-w-[130px]">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <select 
                  value={filterMonth} 
                  onChange={e => setFilterMonth(e.target.value)} 
                  className="w-full sm:w-44 pl-8 sm:pl-9 pr-7 py-2 bg-slate-50 dark:bg-[#251a33] border border-slate-200 dark:border-[#7F3F98]/30 text-xs font-medium text-slate-800 dark:text-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-2 focus:ring-[#7F3F98]/20 focus:border-[#7F3F98] transition appearance-none cursor-pointer"
                >
                  <option value="all">ทุกช่วงเวลา (All)</option>
                  {(data.availableMonths || []).map((m: any) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {loading && (
                <span className="text-[11px] font-medium text-[#7F3F98] dark:text-[#c084fc] bg-[#f6edfa] dark:bg-[#251a33] px-2 py-1 rounded-lg animate-pulse">
                  กำลังอัปเดต...
                </span>
              )}
            </div>
          </section>

          {/* Bento Grid: Row 1 - 4 Key Metrics with Dynamic Switchers */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Card 1: Total Energy / Total Revenue Toggle */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#7F3F98]/10 dark:from-[#7F3F98]/20 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
              
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center bg-slate-100 dark:bg-[#251a33] p-0.5 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-[#7F3F98]/30">
                  <button
                    onClick={() => setEnergyMode('energy')}
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md sm:rounded-lg transition cursor-pointer ${
                      energyMode === 'energy' 
                        ? 'bg-[#7F3F98] text-white shadow-xs' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    พลังงานรวม
                  </button>
                  <button
                    onClick={() => setEnergyMode('revenue')}
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md sm:rounded-lg transition cursor-pointer ${
                      energyMode === 'revenue' 
                        ? 'bg-[#B58E38] text-white shadow-xs' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    รายได้รวม
                  </button>
                </div>

                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                  energyMode === 'energy' 
                    ? 'bg-[#f6edfa] dark:bg-[#2e1d3d] text-[#7F3F98] dark:text-[#c084fc]' 
                    : 'bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965]'
                }`}>
                  {energyMode === 'energy' ? <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#7F3F98] dark:fill-[#c084fc]" /> : <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>
              </div>

              <div className="flex items-baseline space-x-1.5 mt-1">
                {energyMode === 'energy' ? (
                  <>
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {data.stats.totalEnergy.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </span>
                    <span className="text-xs font-bold text-[#7F3F98] dark:text-[#c084fc]">kWh</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#B58E38] dark:text-[#deb965]">
                      ฿{(data.stats.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">บาท</span>
                  </>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                {energyMode === 'energy' ? 'ปริมาณไฟฟ้าสะสมทั้งหมด (กดสลับดูรายได้)' : 'รายได้ค่าบริการชาร์จรวม (กดสลับดูพลังงาน)'}
              </p>
            </div>

            {/* Card 2: Total Duration */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#B58E38]/20 dark:border-[#B58E38]/30 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#B58E38]/15 dark:from-[#B58E38]/20 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">Total Duration</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {formatHrs(data.stats.totalTimeMins)}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-1">เวลาชาร์จสะสมทั้งหมด</p>
            </div>

            {/* Card 3: Avg Energy / Session vs Avg Revenue / Session */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#7F3F98]/10 dark:from-[#7F3F98]/20 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
              
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="flex items-center bg-slate-100 dark:bg-[#251a33] p-0.5 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-[#7F3F98]/30">
                  <button
                    onClick={() => setAvgMode('energy')}
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md sm:rounded-lg transition cursor-pointer ${
                      avgMode === 'energy' 
                        ? 'bg-[#7F3F98] text-white shadow-xs' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    เฉลี่ยพลังงาน
                  </button>
                  <button
                    onClick={() => setAvgMode('revenue')}
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md sm:rounded-lg transition cursor-pointer ${
                      avgMode === 'revenue' 
                        ? 'bg-[#B58E38] text-white shadow-xs' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    รายได้เฉลี่ย
                  </button>
                </div>

                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                  avgMode === 'energy' 
                    ? 'bg-[#f6edfa] dark:bg-[#2e1d3d] text-[#7F3F98] dark:text-[#c084fc]' 
                    : 'bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965]'
                }`}>
                  {avgMode === 'energy' ? <BatteryCharging className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>
              </div>

              <div className="flex items-baseline space-x-1.5 mt-1">
                {avgMode === 'energy' ? (
                  <>
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {data.stats.avgEnergy.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-[#7F3F98] dark:text-[#c084fc]">kWh/ครั้ง</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#B58E38] dark:text-[#deb965]">
                      ฿{(data.stats.avgRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">/ครั้ง</span>
                  </>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                {avgMode === 'energy' ? 'เฉลี่ยต่อการชาร์จ 1 ครั้ง' : 'รายได้เฉลี่ยต่อการชาร์จ 1 ครั้ง'}
              </p>
            </div>

            {/* Card 4: Avg Time / Session */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#B58E38]/20 dark:border-[#B58E38]/30 shadow-xs hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#B58E38]/15 dark:from-[#B58E38]/20 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">Avg Duration</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center">
                  <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {formatHrs(data.stats.avgTimeMins)}
                </span>
                <span className="text-xs font-bold text-[#B58E38] dark:text-[#deb965]">/ครั้ง</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-1">เฉลี่ยเวลาต่อรอบการชาร์จ</p>
            </div>

          </section>

          {/* Bento Grid: Row 2 - Operational Performance (Charging Speed & Utilization Rate) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Bento Card: Average Charging Speed (kW) */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-[#7F3F98] dark:text-[#c084fc]" />
                  <span>Avg Charging Speed</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#7F3F98] dark:text-[#c084fc]">
                    {data.stats?.avgChargingSpeedKw?.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">kW</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">กำลังไฟเฉลี่ยขณะชาร์จ (kWh/ชม.)</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f6edfa] dark:bg-[#251a33] text-[#7F3F98] dark:text-[#c084fc] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-[#7F3F98] dark:fill-[#c084fc]" />
              </div>
            </div>

            {/* Bento Card: Utilization Rate (%) */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#B58E38]/20 dark:border-[#B58E38]/30 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  <Percent className="w-3.5 h-3.5 text-[#B58E38] dark:text-[#deb965]" />
                  <span>Utilization Rate</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#B58E38] dark:text-[#deb965]">
                    {data.stats?.utilizationRate?.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                  เฉลี่ย {data.stats?.avgHoursPerDay?.toFixed(1)} ชม. / 24 ชม.
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Bento Card: Unique Customers */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  <Users className="w-3.5 h-3.5 text-[#7F3F98] dark:text-[#c084fc]" />
                  <span>Unique Customers</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {data.customerStats?.uniqueUsers?.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[#7F3F98] dark:text-[#c084fc]">คน</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                  ความถี่ {data.customerStats?.avgFrequency?.toFixed(1)} ครั้ง/คน
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#f6edfa] dark:bg-[#251a33] text-[#7F3F98] dark:text-[#c084fc] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            {/* Bento Card: Retention Rate */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#B58E38]/20 dark:border-[#B58E38]/30 shadow-xs flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  <Repeat className="w-3.5 h-3.5 text-[#B58E38] dark:text-[#deb965]" />
                  <span>Retention Rate</span>
                </div>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {data.customerStats?.retentionRate?.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                  ใช้ซ้ำ {data.customerStats?.totalReturning?.toLocaleString()} คน (≥2 ครั้ง)
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

          </section>

          {/* Bento Grid: Row 3 - Customer Retention, Duration Bins & TOU Analytics (4 Col + 4 Col + 4 Col) */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
            
            {/* Customer Retention Segments Bento Card */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#f6edfa] dark:bg-[#251a33] text-[#7F3F98] dark:text-[#c084fc] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">กลุ่มลูกค้าและการใช้ซ้ำ (Retention)</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400">จำแนกตามความถี่และพฤติกรรมการใช้งาน</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {data.customerStats?.customerSegments?.map((seg: any) => {
                  let barColor = 'bg-[#7F3F98] dark:bg-[#a855f7]';
                  let textColor = 'text-[#7F3F98] dark:text-[#c084fc]';
                  if (seg.key === 'repeat') { barColor = 'bg-[#9f5fc0] dark:bg-[#c084fc]'; textColor = 'text-[#9f5fc0] dark:text-[#c084fc]'; }
                  if (seg.key === 'regular') { barColor = 'bg-[#7F3F98] dark:bg-[#a855f7]'; textColor = 'text-[#7F3F98] dark:text-[#c084fc]'; }
                  if (seg.key === 'champion') { barColor = 'bg-[#B58E38] dark:bg-[#deb965]'; textColor = 'text-[#B58E38] dark:text-[#deb965]'; }
                  if (seg.key === 'single') { barColor = 'bg-slate-300 dark:bg-slate-700'; textColor = 'text-slate-500 dark:text-slate-400'; }

                  return (
                    <div key={seg.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">{seg.label}</span>
                        <span className={`font-bold ${textColor} text-[11px] sm:text-xs`}>
                          {seg.count?.toLocaleString()} คน ({seg.share?.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${seg.share || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duration Bins Bento Card */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center shrink-0">
                    <Hourglass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">ระยะเวลาการชาร์จ (Duration Bins)</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400">การกระจายตัวของรอบการชาร์จ</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {data.durationList?.map((bin: any) => (
                  <div key={bin.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">{bin.label}</span>
                      <span className="font-bold text-[#7F3F98] dark:text-[#c084fc] text-[11px] sm:text-xs">
                        {bin.count?.toLocaleString()} ครั้ง ({bin.share?.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#7F3F98] to-[#B58E38] rounded-full transition-all duration-500"
                        style={{ width: `${bin.share || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOU Analytics Bento Card */}
            <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <SunMedium className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">On-Peak vs Off-Peak (TOU)</h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400">จ.-ศ. 09:00-22:00 น. vs ช่วงเวลาอื่น</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-orange-800 dark:text-orange-300 mb-1">
                    <span className="flex items-center"><SunMedium className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-orange-500" /> On-Peak</span>
                    <span className="text-xs sm:text-sm">{data.touStats?.onPeakEnergyPct?.toFixed(0)}%</span>
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-orange-950 dark:text-orange-200">
                    {data.touStats?.onPeak?.energy?.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-orange-700 dark:text-orange-400 mt-1">
                    {data.touStats?.onPeak?.sessions?.toLocaleString()} ครั้ง • ฿{(data.touStats?.onPeak?.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">
                    <span className="flex items-center"><Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-indigo-500" /> Off-Peak</span>
                    <span className="text-xs sm:text-sm">{data.touStats?.offPeakEnergyPct?.toFixed(0)}%</span>
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-indigo-950 dark:text-indigo-200">
                    {data.touStats?.offPeak?.energy?.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400">kWh</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-indigo-700 dark:text-indigo-400 mt-1">
                    {data.touStats?.offPeak?.sessions?.toLocaleString()} ครั้ง • ฿{(data.touStats?.offPeak?.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* Admin Exclusive: Station Ranking Leaderboard (13 Stations) */}
          {role === 'admin' && (
            <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 shadow-xs space-y-3.5 sm:space-y-4 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
                <div className="flex items-center space-x-2.5 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center shadow-xs shrink-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Leaderboard จัดอันดับ {data.stationLeaderboard?.length || 13} สถานี</h3>
                      <span className="text-[9px] sm:text-[10px] font-bold bg-[#7F3F98]/10 dark:bg-[#7F3F98]/30 text-[#7F3F98] dark:text-[#c084fc] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#7F3F98]/20 dark:border-[#7F3F98]/40">
                        Admin Exclusive
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">จัดอันดับประสิทธิภาพและรายได้ของแต่ละสถานีในเครือข่าย</p>
                  </div>
                </div>

                {/* Leaderboard Sorting Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-[#251a33] p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-[#7F3F98]/30">
                  <button
                    onClick={() => setLeaderboardSort('revenue')}
                    className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
                      leaderboardSort === 'revenue' 
                        ? 'bg-[#B58E38] text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    รายได้
                  </button>
                  <button
                    onClick={() => setLeaderboardSort('energy')}
                    className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
                      leaderboardSort === 'energy' 
                        ? 'bg-[#7F3F98] text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    พลังงาน
                  </button>
                  <button
                    onClick={() => setLeaderboardSort('sessions')}
                    className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
                      leaderboardSort === 'sessions' 
                        ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    จำนวนครั้ง
                  </button>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="overflow-auto max-h-80 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-[11px] sm:text-xs whitespace-nowrap">
                  <thead className="bg-[#f6edfa] dark:bg-[#2d1b3b] text-[#7F3F98] dark:text-[#deb965] sticky top-0 z-10 border-b border-[#eddcf5] dark:border-[#482860]">
                    <tr>
                      <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold w-10 sm:w-14 text-center">อันดับ</th>
                      <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold">ชื่อสถานี</th>
                      <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold text-right">รายได้รวม (บาท)</th>
                      <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold text-right">พลังงานรวม (kWh)</th>
                      <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold text-right">จำนวนครั้ง</th>
                      <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold text-right">กำลังไฟเฉลี่ย</th>
                      <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold text-right">เวลาเฉลี่ย/ครั้ง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {sortedLeaderboard.map((st: any, idx: number) => {
                      const rank = idx + 1;
                      const isTop1 = rank === 1;
                      const isTop2 = rank === 2;
                      const isTop3 = rank === 3;
                      return (
                        <tr key={st.name} className="hover:bg-[#fcfaff] dark:hover:bg-[#261738] transition">
                          <td className="px-2.5 sm:px-4 py-2.5 text-center">
                            {isTop1 ? (
                              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#B58E38] text-white font-extrabold flex items-center justify-center mx-auto text-[10px] sm:text-xs shadow-xs">1</span>
                            ) : isTop2 ? (
                              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-400 text-white font-extrabold flex items-center justify-center mx-auto text-[10px] sm:text-xs">2</span>
                            ) : isTop3 ? (
                              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-700 text-white font-extrabold flex items-center justify-center mx-auto text-[10px] sm:text-xs">3</span>
                            ) : (
                              <span className="font-semibold text-slate-400 text-[11px]">{rank}</span>
                            )}
                          </td>
                          <td className="px-2.5 sm:px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 sm:space-x-2">
                            <Building2 className="w-3.5 h-3.5 text-[#7F3F98] dark:text-[#c084fc] shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-none">{st.name}</span>
                          </td>
                          <td className="px-2.5 sm:px-4 py-2.5 text-right font-bold text-[#B58E38] dark:text-[#deb965]">
                            ฿{st.revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-2.5 sm:px-4 py-2.5 text-right font-semibold text-[#7F3F98] dark:text-[#c084fc]">
                            {st.energy?.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </td>
                          <td className="px-2.5 sm:px-4 py-2.5 text-right font-medium text-slate-700 dark:text-slate-300">
                            {st.sessions?.toLocaleString()} ครั้ง
                          </td>
                          <td className="px-2.5 sm:px-4 py-2.5 text-right font-medium text-slate-600 dark:text-slate-400">
                            {st.avgSpeedKw?.toFixed(1)} kW
                          </td>
                          <td className="px-2.5 sm:px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                            {formatHrs(st.avgDurationMins)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Bento Grid: Row 4 - Monthly Trend & Day of Week (8 Col + 4 Col) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6">
            
            {/* Bento Card: Monthly Trend (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-[#7F3F98] dark:text-[#c084fc]" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">แนวโน้มการใช้พลังงานรายเดือน (Monthly Trend)</h3>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">ปริมาณไฟฟ้า (kWh) และเวลาชาร์จรวม (ชม.)</p>
                </div>
                <div className="flex items-center space-x-3 sm:space-x-4 text-[10px] sm:text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs sm:rounded-md bg-[#7F3F98] dark:bg-[#a855f7]"></span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">พลังงาน (kWh)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-1 sm:w-3 sm:h-1 bg-[#B58E38] dark:bg-[#deb965] rounded-full"></span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">เวลาชาร์จ (ชม.)</span>
                  </div>
                </div>
              </div>

              <div className="h-60 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data.monthlyChart} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2d1b3b' : '#f6edfa'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#c084fc' : '#7F3F98' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#deb965' : '#B58E38' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(26, 15, 36, 0.95)' : 'rgba(63, 29, 76, 0.95)', 
                        border: '1px solid rgba(181, 142, 56, 0.4)', 
                        borderRadius: '16px', 
                        boxShadow: '0 10px 25px -5px rgba(127, 63, 152, 0.3)',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                      formatter={(val: any, name: any) => {
                        if (name === 'energy') return [`${Number(val).toFixed(1)} kWh`, 'ปริมาณไฟฟ้า'];
                        return [`${Number(val).toFixed(1)} ชม.`, 'เวลาชาร์จ'];
                      }} 
                    />
                    <Bar yAxisId="left" dataKey="energy" name="energy" fill={isDark ? '#a855f7' : THEME_PURPLE} radius={[6, 6, 0, 0]} maxBarSize={45} />
                    <Line yAxisId="right" type="monotone" dataKey="timeHrs" name="timeHrs" stroke={isDark ? '#deb965' : THEME_GOLD} strokeWidth={3} dot={{ r: 3.5, fill: isDark ? '#deb965' : THEME_GOLD, strokeWidth: 2, stroke: '#ffffff' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bento Card: Day of Week (4 cols) with Traditional Thai Day Colors */}
            <div className="lg:col-span-4 bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#B58E38] dark:text-[#deb965]" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">สัดส่วนตามวัน</h3>
                  </div>

                  {/* DOW Metric Switcher */}
                  <div className="flex items-center bg-slate-100 dark:bg-[#251a33] p-0.5 rounded-lg sm:rounded-xl border border-slate-200/60 dark:border-[#7F3F98]/30">
                    <button
                      onClick={() => setDowMetric('sessions')}
                      className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md sm:rounded-lg transition cursor-pointer ${
                        dowMetric === 'sessions'
                          ? 'bg-[#7F3F98] text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                      title="จำนวนครั้ง (Sessions)"
                    >
                      ครั้ง
                    </button>
                    <button
                      onClick={() => setDowMetric('energy')}
                      className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md sm:rounded-lg transition cursor-pointer ${
                        dowMetric === 'energy'
                          ? 'bg-[#7F3F98] text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                      title="พลังงาน (kWh)"
                    >
                      kWh
                    </button>
                    <button
                      onClick={() => setDowMetric('revenue')}
                      className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md sm:rounded-lg transition cursor-pointer ${
                        dowMetric === 'revenue'
                          ? 'bg-[#B58E38] text-white shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                      title="รายได้ (บาท)"
                    >
                      บาท
                    </button>
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400">
                  {dowMetric === 'sessions' && 'สัดส่วนจำนวนครั้งการชาร์จตามวัน (จ.-อา.)'}
                  {dowMetric === 'energy' && 'สัดส่วนปริมาณไฟฟ้า (kWh) ตามวัน (จ.-อา.)'}
                  {dowMetric === 'revenue' && 'สัดส่วนรายได้ค่าบริการ (บาท) ตามวัน (จ.-อา.)'}
                </p>
              </div>

              <div className="h-48 sm:h-52 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={data.dowChart || []} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={48} 
                      outerRadius={68} 
                      paddingAngle={4} 
                      dataKey={dowMetric}
                    >
                      {(data.dowChart || []).map((entry: any, index: number) => (
                        <Cell 
                          key={entry.name || entry.day || index} 
                          fill={getDayColor(entry)} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(26, 15, 36, 0.95)' : 'rgba(63, 29, 76, 0.95)', 
                        border: '1px solid rgba(181, 142, 56, 0.4)', 
                        borderRadius: '12px', 
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                      formatter={(val: any) => {
                        if (dowMetric === 'energy') return [`${Number(val).toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`, 'พลังงานรวม'];
                        if (dowMetric === 'revenue') return [`฿${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'รายได้รวม'];
                        return [`${Number(val).toLocaleString()} ครั้ง`, 'จำนวนครั้ง'];
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Daily Legend with Thai Colors */}
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                {(data.dowChart || []).map((d: any, index: number) => {
                  let displayVal = `${d.sessions || 0}`;
                  if (dowMetric === 'energy') displayVal = `${d.energy ? Math.round(d.energy).toLocaleString() : 0}`;
                  if (dowMetric === 'revenue') displayVal = `${d.revenue ? (d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : Math.round(d.revenue)) : 0}`;
                  return (
                    <div key={d.name || index} className="flex flex-col items-center">
                      <span 
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mb-0.5 sm:mb-1 shadow-2xs ring-1 ring-black/10 dark:ring-white/20" 
                        style={{ backgroundColor: getDayColor(d) }}
                      ></span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium">{d.name}</span>
                      <span className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-800 dark:text-slate-100 tracking-tight">{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>

          {/* Bento Grid: Row 5 - Hourly Peak & Daily Log (6 Col + 6 Col) */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6">
            
            {/* Bento Card: Hourly Peak (6 cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-[#7F3F98] dark:text-[#c084fc]" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">สถิติการชาร์จตามช่วงเวลา (Hourly Peak)</h3>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">พฤติกรรมการชาร์จตลอด 24 ชั่วโมง (00:00 - 23:00 น.)</p>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-[#B58E38]/30">
                  24h Peak
                </span>
              </div>

              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(data.hourlyChart || []).map((h: any) => ({ ...h, name: h.name || h.hour }))} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2d1b3b' : '#f6edfa'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: isDark ? '#94a3b8' : '#64748b' }} interval={3} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: isDark ? '#c084fc' : '#7F3F98' }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: isDark ? '#deb965' : '#B58E38' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(26, 15, 36, 0.95)' : 'rgba(63, 29, 76, 0.95)', 
                        border: '1px solid rgba(181, 142, 56, 0.4)', 
                        borderRadius: '14px', 
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                      formatter={(val: any, name: any) => {
                        if (name === 'energy') return [`${Number(val).toFixed(1)} kWh`, 'พลังงาน'];
                        return [`${val} ครั้ง`, 'จำนวนครั้ง (Sessions)'];
                      }} 
                    />
                    <Line yAxisId="left" type="monotone" dataKey="energy" name="energy" stroke={isDark ? '#c084fc' : THEME_PURPLE} strokeWidth={2.5} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="sessions" name="sessions" stroke={isDark ? '#deb965' : THEME_GOLD} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-[10px] sm:text-xs pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#7F3F98] dark:bg-[#c084fc]"></span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">พลังงาน (kWh)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#B58E38] dark:bg-[#deb965]"></span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">จำนวนครั้ง</span>
                </div>
              </div>
            </div>

            {/* Bento Card: Daily History (6 cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#7F3F98] dark:text-[#c084fc]" />
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">ตารางบันทึกประวัติรายวัน (Daily History)</h3>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">สรุปผลการใช้งานประจำแต่ละวัน</p>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 font-medium">
                  {(data.dailyTable || []).length} วัน
                </span>
              </div>

              <div className="overflow-auto max-h-64 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-[11px] sm:text-xs whitespace-nowrap">
                  <thead className="bg-[#f6edfa] dark:bg-[#2d1b3b] text-[#7F3F98] dark:text-[#deb965] sticky top-0 z-10 border-b border-[#eddcf5] dark:border-[#482860]">
                    <tr>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold">วันที่</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold text-right">จำนวนครั้ง</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold text-right">รายได้ประจำวัน</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold text-right">พลังงานรวม</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold text-right">เวลาชาร์จรวม</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold text-right">เฉลี่ย/ครั้ง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {(data.dailyTable || []).map((d: any) => {
                      const energyVal = typeof d.energy === 'number' ? d.energy : (parseFloat(d.energy) || 0);
                      const avgEnergyVal = typeof d.avgEnergy === 'number' ? d.avgEnergy : (d.sessions > 0 ? energyVal / d.sessions : (parseFloat(d.avgEnergy) || 0));
                      const timeVal = d.timeHrs ? d.timeHrs * 60 : (d.time || d.timeMins || 0);
                      return (
                        <tr key={d.date} className="hover:bg-[#fcfaff] dark:hover:bg-[#261738] transition">
                          <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-medium text-slate-800 dark:text-slate-200">{d.formattedDate || d.date}</td>
                          <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-semibold text-slate-900 dark:text-white">{d.sessions}</td>
                          <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-bold text-[#B58E38] dark:text-[#deb965]">฿{d.revenue ? Math.round(d.revenue).toLocaleString() : '0'}</td>
                          <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right text-[#7F3F98] dark:text-[#c084fc] font-semibold">{energyVal.toFixed(1)} kWh</td>
                          <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right text-slate-600 dark:text-slate-400">{formatHrs(timeVal)}</td>
                          <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right text-slate-500 dark:text-slate-400">{avgEnergyVal.toFixed(1)} kWh</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </section>

          {/* Bento Grid: Row 6 - Pivot Heatmap Matrix (Hidden by default) */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 shadow-xs overflow-hidden transition-all duration-300">
            
            {/* Header Action Bar */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-[#3f1d4c] via-[#5c2771] to-[#3f1d4c] dark:from-[#240c2d] dark:via-[#3d164d] dark:to-[#240c2d] text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#B58E38]/20">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#B58E38]/20 border border-[#B58E38]/40 flex items-center justify-center text-[#B58E38] dark:text-[#deb965] shrink-0">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight">Hour / Electricity Quantity (kWh)</h3>
                    {!showHeatmap && (
                      <span className="text-[9px] sm:text-[10px] bg-white/15 px-2 py-0.5 rounded-full text-slate-200 font-medium">
                        ซ่อนอยู่
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-300">การวิเคราะห์เมทริกซ์ความหนาแน่นของการใช้ไฟฟ้า 24 ชั่วโมง</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {showHeatmap && (
                  <button 
                    onClick={() => setHourSort(hourSort === 'normal' ? 'peak' : 'normal')} 
                    className="flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/20 transition backdrop-blur-sm cursor-pointer"
                  >
                    <ArrowUpDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#deb965]" />
                    <span>{hourSort === 'normal' ? 'เวลา: 00-23 น.' : 'เรียงตาม Peak'}</span>
                  </button>
                )}

                {/* Show / Hide Toggle Button */}
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`flex items-center space-x-1 sm:space-x-1.5 text-[11px] sm:text-xs px-3 sm:px-3.5 py-1.5 rounded-xl font-bold transition shadow-sm cursor-pointer ${
                    showHeatmap 
                      ? 'bg-[#B58E38] hover:bg-[#9e792e] text-white' 
                      : 'bg-white dark:bg-[#251a33] text-[#7F3F98] dark:text-[#c084fc] hover:bg-slate-100 dark:hover:bg-[#342447]'
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
                      <Eye className="w-3.5 h-3.5 text-[#7F3F98] dark:text-[#c084fc]" />
                      <span>แสดงตาราง Heatmap</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Matrix Heatmap Table (Rendered only when expanded) */}
            {showHeatmap && (
              <div className="overflow-auto max-h-[520px] transition-all">
                <div className="px-4 sm:px-6 py-2 bg-[#fdfbf6] dark:bg-[#1b1224] border-b border-[#eddcf5] dark:border-[#482860] flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-700 dark:text-slate-200">ระดับความหนาแน่นพลังงาน:</span>
                    <span className="inline-flex items-center space-x-1 text-[10px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md border border-red-200/80 dark:border-red-900/50 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      <span>ช่องสีแดงอ่อน = วันหยุดนักขัตฤกษ์</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-1.5 text-[9px] sm:text-[10px] text-slate-600 dark:text-slate-300">
                    <span>0 kWh</span>
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-white dark:bg-[#181120] border border-slate-200 dark:border-slate-700 text-center">-</span>
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-[#f6edfa] dark:bg-[#240046]"></span>
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-[#eddcf5] dark:bg-[#3c096c]"></span>
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-[#cf9fe6] dark:bg-[#5a189a]"></span>
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-xs bg-[#7F3F98] dark:bg-[#9d4edd]"></span>
                    <span className="text-[#7F3F98] dark:text-[#c084fc] font-bold">Peak</span>
                  </div>
                </div>

                <table className="w-full text-left text-[11px] sm:text-xs whitespace-nowrap border-collapse">
                  <thead className="bg-[#f6edfa] dark:bg-[#2d1b3b] text-[#7F3F98] dark:text-[#deb965] sticky top-0 z-20 border-b border-[#eddcf5] dark:border-[#482860]">
                    <tr>
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold bg-[#f6edfa] dark:bg-[#2d1b3b] sticky left-0 z-20 border-r border-[#eddcf5] dark:border-[#482860] min-w-[95px] sm:min-w-[110px]">
                        วันที่
                      </th>
                      <th className="px-2 sm:px-3 py-2.5 sm:py-3 font-bold bg-[#f6edfa] dark:bg-[#2d1b3b] sticky left-[95px] sm:left-[110px] z-20 border-r border-[#eddcf5] dark:border-[#482860] min-w-[65px] sm:min-w-[75px]">
                        DOW
                      </th>
                      {displayedHours.map((h: string) => (
                        <th key={h} className="px-1.5 py-2.5 sm:py-3 font-bold text-center border-r border-[#eddcf5]/80 dark:border-[#482860]/80 min-w-[40px] sm:min-w-[44px]">
                          {h}
                        </th>
                      ))}
                      <th className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-right bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] sticky right-0 z-20 border-l border-[#ead297] dark:border-[#523d24] min-w-[80px] sm:min-w-[90px]">
                        รวม (kWh)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {data.pivot?.rows?.map((row: any) => {
                      const holidayName = THAI_HOLIDAYS[row.date];
                      const isHoliday = !!holidayName;

                      return (
                        <tr key={row.date} className="hover:opacity-95 transition-opacity">
                          <td 
                            className={`px-3 sm:px-4 py-2 font-semibold sticky left-0 z-10 border-r transition-colors ${
                              isHoliday 
                                ? 'bg-red-50/90 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60' 
                                : 'bg-white dark:bg-[#1a1224] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800'
                            }`}
                            title={holidayName ? `${row.formattedDate} (${holidayName})` : row.formattedDate}
                          >
                            <div className="flex items-center space-x-1.5">
                              <span>{row.formattedDate}</span>
                              {isHoliday && (
                                <span 
                                  className="text-[9px] px-1.5 py-0.2 bg-red-100/90 dark:bg-red-900/60 text-red-700 dark:text-red-200 rounded-md font-bold border border-red-200/80 dark:border-red-800/80 shrink-0 shadow-2xs"
                                  title={holidayName}
                                >
                                  วันหยุด
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 bg-white dark:bg-[#1a1224] font-medium sticky left-[95px] sm:left-[110px] z-10 border-r border-slate-300 dark:border-slate-800 text-center">
                            <span 
                              className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs"
                              style={{ backgroundColor: getDayColor(row.dow) }}
                            >
                              {row.dow}
                            </span>
                          </td>
                        {displayedHours.map((h: string) => {
                          const val = row[h] || 0;
                          const style = getHeatmapStyle(val);
                          return (
                            <td 
                              key={h} 
                              className={`px-1 py-2 text-center border-r border-slate-100 dark:border-slate-800/60 ${style.bg} ${style.text} transition-colors`}
                            >
                              {style.display}
                            </td>
                          );
                        })}
                        <td className="px-3 sm:px-4 py-2 text-right bg-[#faf4e8]/70 dark:bg-[#2a1e12]/70 font-bold text-[#B58E38] dark:text-[#deb965] sticky right-0 z-10 border-l border-slate-200 dark:border-slate-800">
                          {row.total ? Math.round(row.total).toLocaleString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                  {data.pivot?.hourTotals && (
                    <tfoot className="bg-[#3f1d4c] dark:bg-[#1e0a26] text-white font-bold sticky bottom-0 z-20 border-t border-[#5c2771] dark:border-[#4b1c5e]">
                      <tr>
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#3f1d4c] dark:bg-[#1e0a26] sticky left-0 z-20 border-r border-[#5c2771] dark:border-[#4b1c5e] text-slate-200">
                          รวมทั้งหมด
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 sm:py-3 bg-[#3f1d4c] dark:bg-[#1e0a26] sticky left-[95px] sm:left-[110px] z-20 border-r border-[#5c2771] dark:border-[#4b1c5e] text-slate-400">
                          -
                        </td>
                        {displayedHours.map((h: string) => (
                          <td key={h} className="px-1.5 py-2.5 sm:py-3 text-center border-r border-[#5c2771] dark:border-[#4b1c5e] text-[#deb965]">
                            {data.pivot.hourTotals[h] ? Math.round(data.pivot.hourTotals[h]).toLocaleString() : '-'}
                          </td>
                        ))}
                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right bg-[#B58E38] dark:bg-[#a67c29] text-white sticky right-0 z-20 border-l border-[#deb965] dark:border-[#a67c29] font-extrabold shadow-sm">
                          {Math.round(data.pivot.grandTotal).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </section>

        </main>
      </div>

      {/* Official Corporate Footer */}
      <footer className="mt-8 sm:mt-12 py-6 sm:py-8 bg-white dark:bg-[#130d1b] border-t border-[#7F3F98]/15 dark:border-[#7F3F98]/30 text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 space-y-1 px-4 transition-colors">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Copyright © 2026 แผนกบริการงานวิศวกรรม กองบริการลูกค้า
        </p>
        <p className="text-slate-500 dark:text-slate-400">
          ฝ่ายวิศวกรรมและบริการ การไฟฟ้าส่วนภูมิภาค เขต 2 (ภาคเหนือ)
        </p>
      </footer>

    </div>
  )
}