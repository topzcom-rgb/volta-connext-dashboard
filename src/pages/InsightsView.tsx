import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { 
  ArrowLeft, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Layers, 
  Sparkles, 
  HelpCircle,
  Lightbulb,
  Building2,
  ShieldCheck,
  UserCheck,
  Filter,
  RefreshCw,
  Users,
  UserX,
  UserMinus,
  HeartPulse,
  BatteryCharging,
  Trophy,
  Target,
  Car
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'

export default function InsightsView() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterStation, setFilterStation] = useState('all')
  const [metricTab, setMetricTab] = useState<'revenue' | 'energy' | 'sessions'>('revenue')
  const [retentionFilter, setRetentionFilter] = useState<'all' | 'active' | 'at_risk' | 'churned'>('all')

  const { isDark } = useTheme()
  const navigate = useNavigate()
  const phone = Cookies.get('auth_phone')
  const role = Cookies.get('auth_role') || 'owner'

  const fetchInsights = (station: string) => {
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
        const key = `insights__${station}`
        if (localMap[key]) {
          setData(localMap[key])
          setLoading(false)
        }
      }
    } catch (e) {}

    fetch(`/api/insights?phone=${phone}&role=${role}&station=${station}`)
      .then(res => res.json())
      .then(d => {
        if (!d.error) {
          setData(d);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchInsights(filterStation);
  }, [filterStation]);

  const THEME_PURPLE = '#7F3F98'
  const THEME_GOLD = '#B58E38'

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#3f1d4c] dark:bg-[#130d1b] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#B58E38] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-medium text-sm animate-pulse tracking-wide">
          กำลังประมวลผลข้อมูลการเติบโตและการตรวจจับความผิดปกติ...
        </p>
      </div>
    )
  }

  const healthBadge = () => {
    const score = data?.healthScore || 0;
    if (score >= 85) {
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        text: `ความสมบูรณ์ ${score}/100 (ระดับดีเยี่ยม)`
      };
    }
    if (score >= 65) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        text: `ความสมบูรณ์ ${score}/100 (ต้องเฝ้าระวัง)`
      };
    }
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
      text: `ความสมบูรณ์ ${score}/100 (ควรเข้าตรวจสอบ)`
    };
  };

  const currentBadge = healthBadge();
  const availableStations = data?.availableStations || [];
  const isSingleStation = filterStation !== 'all';

  const retentionSummary = data?.retentionChurnData?.summary || {};
  const retentionSegments = data?.retentionChurnData?.segments || [];
  const topLoyalCustomers = (data?.retentionChurnData?.topLoyalCustomers || []).filter((u: any) => {
    if (retentionFilter === 'all') return true;
    return u.status === retentionFilter;
  });

  const personaList = data?.personaData?.personas || [];
  const speedDist = data?.personaData?.speedDistribution || [];

  return (
    <div className="min-h-screen bg-[#faf8fc] dark:bg-[#0f0a14] text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-[#7F3F98] selection:text-white flex flex-col justify-between transition-colors duration-300">
      
      <div>
        {/* Top Header Glass Bar */}
        <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-[#130d1b]/90 border-b border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
            
            {/* Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#7F3F98] to-[#9d5ab8] flex items-center justify-center text-white shadow-sm shadow-[#7F3F98]/20 border border-[#B58E38]/50">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#7F3F98] dark:text-[#c084fc]">VOLTA</span>
                  <span className="text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#B58E38]/15 dark:bg-[#B58E38]/30 text-[#B58E38] dark:text-[#deb965] border border-[#B58E38]/30 dark:border-[#deb965]/40">
                    GROWTH & HEALTH
                  </span>
                </div>
                <p className="text-[9px] sm:text-[11px] text-slate-400 dark:text-slate-500 -mt-0.5 hidden xs:block">การวิเคราะห์การเติบโต พยากรณ์ และตรวจสอบความผิดปกติ</p>
              </div>
            </div>

            {/* Actions: User Status, Theme Toggle & Back Button */}
            <div className="flex items-center space-x-2">
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
              <ThemeToggle />
              <button
                onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard')}
                className="inline-flex items-center space-x-1 sm:space-x-2 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#7F3F98]/10 dark:bg-[#7F3F98]/25 text-[#7F3F98] dark:text-[#c084fc] hover:bg-[#7F3F98]/20 dark:hover:bg-[#7F3F98]/35 transition border border-[#7F3F98]/25 cursor-pointer shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">กลับหน้า</span>
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content Workspace */}
        <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Station Selector Bar (Admin & Station Owners) */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#f6edfa] dark:bg-[#251a33] flex items-center justify-center text-[#7F3F98] dark:text-[#c084fc] shadow-2xs shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">ขอบเขตการวิเคราะห์ (Analysis Scope)</h2>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">
                  {isSingleStation 
                    ? `เจาะจงสถานี: ${filterStation}`
                    : `ภาพรวมทั้งเครือข่าย (${availableStations.length} สถานี)`}
                </p>
              </div>
            </div>

            {/* Station Dropdown Filter */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7F3F98] dark:text-[#c084fc] shrink-0" />
              <select
                value={filterStation}
                onChange={e => setFilterStation(e.target.value)}
                className="text-xs bg-[#faf8fc] dark:bg-[#251a33] border border-[#7F3F98]/25 dark:border-[#7F3F98]/40 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#7F3F98]/30 cursor-pointer w-full sm:w-auto shadow-2xs transition-colors"
              >
                {(role === 'admin' || availableStations.length > 1) && (
                  <option value="all">
                    {role === 'admin' 
                      ? `🏢 ทุกสถานีในเครือข่าย (${availableStations.length} สถานี)`
                      : `🏢 ภาพรวมสถานีของคุณ (${availableStations.length} สถานี)`}
                  </option>
                )}
                {availableStations.map((st: string) => (
                  <option key={st} value={st}>⚡ {st}</option>
                ))}
              </select>
              {loading && <RefreshCw className="w-3.5 h-3.5 text-[#7F3F98] dark:text-[#c084fc] animate-spin shrink-0" />}
            </div>
          </section>

          {/* Executive Overview Banner & Health Scorecard */}
          <section className="bg-gradient-to-r from-[#3f1d4c] via-[#5c2771] to-[#3f1d4c] dark:from-[#240c2d] dark:via-[#3d164d] dark:to-[#240c2d] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-md border border-[#B58E38]/30 space-y-3.5 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3 sm:pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#deb965]" />
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#deb965] uppercase">
                    SYSTEM HEALTH & EXECUTIVE INSIGHTS
                  </span>
                </div>
                <h1 className="text-lg sm:text-2xl font-extrabold text-white">
                  {isSingleStation 
                    ? `ผลการวิเคราะห์เชิงลึก: ${filterStation}`
                    : `สรุปผลการวิเคราะห์เชิงลึกและสถานะความพร้อมเครือข่าย`}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-300">
                  {isSingleStation 
                    ? `การวิเคราะห์เฉพาะสถานีในสังกัด การไฟฟ้าส่วนภูมิภาค เขต 2 (ภาคเหนือ)`
                    : `ครอบคลุม ${data.allowedStations?.length || 13} สถานีหลักในพื้นที่ การไฟฟ้าส่วนภูมิภาค เขต 2 (ภาคเหนือ)`}
                </p>
              </div>

              {/* Health Score Pill */}
              <div className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border ${currentBadge.bg} shadow-sm text-xs`}>
                <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${currentBadge.dot} animate-pulse`}></span>
                <span className="font-bold text-[11px] sm:text-xs">{currentBadge.text}</span>
              </div>
            </div>

            {/* 4 Dynamic Takeaway Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
              {(data?.executiveSummary || []).map((item: any, idx: number) => (
                <div key={idx} className="bg-white/10 dark:bg-black/30 backdrop-blur-md p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/15 dark:border-white/10 shadow-2xs space-y-1.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 text-[#deb965] text-[11px] sm:text-xs font-bold mb-1">
                      {idx === 0 && <TrendingUp className="w-3.5 h-3.5 shrink-0" />}
                      {idx === 1 && <Users className="w-3.5 h-3.5 shrink-0" />}
                      {idx === 2 && <Zap className="w-3.5 h-3.5 shrink-0" />}
                      {idx === 3 && (item.icon === 'alert' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 shrink-0" />)}
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed font-normal">
                      {item.text || item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 1: มิติที่ 1 - การวิเคราะห์การเติบโต (Growth Analytics & MoM %) */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 shadow-xs space-y-4 sm:space-y-6 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#f6edfa] dark:bg-[#251a33] text-[#7F3F98] dark:text-[#c084fc] flex items-center justify-center shadow-xs shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                      มิติที่ 1: การวิเคราะห์อัตราการเติบโต (Growth Analytics & MoM)
                    </h2>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-[#7F3F98]/10 dark:bg-[#7F3F98]/30 text-[#7F3F98] dark:text-[#c084fc] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#7F3F98]/20 dark:border-[#7F3F98]/40">
                      MoM
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {isSingleStation
                      ? `เปรียบเทียบการเติบโตของสถานี ${filterStation} ในแต่ละเดือน`
                      : `เปรียบเทียบการเติบโตของรายได้ พลังงาน และจำนวนครั้งที่เข้าชาร์จ`}
                  </p>
                </div>
              </div>

              {/* Metric Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-[#251a33] p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-[#7F3F98]/30">
                <button
                  onClick={() => setMetricTab('revenue')}
                  className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
                    metricTab === 'revenue' 
                      ? 'bg-[#B58E38] text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  รายได้ (บาท)
                </button>
                <button
                  onClick={() => setMetricTab('energy')}
                  className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
                    metricTab === 'energy' 
                      ? 'bg-[#7F3F98] text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  พลังงาน (kWh)
                </button>
                <button
                  onClick={() => setMetricTab('sessions')}
                  className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition cursor-pointer ${
                    metricTab === 'sessions' 
                      ? 'bg-[#7F3F98] text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  จำนวนครั้ง
                </button>
              </div>
            </div>

            {/* Monthly Growth Chart & Summary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6">
              
              {/* Composed Chart */}
              <div className={`${isSingleStation ? 'lg:col-span-12' : 'lg:col-span-8'} bg-[#faf8fc] dark:bg-[#130d1b] p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-[#7F3F98]/10 dark:border-[#7F3F98]/20 space-y-2 sm:space-y-3 transition-colors`}>
                <div className="flex justify-between items-center text-[10px] sm:text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    กราฟแนวโน้มรายเดือนและอัตราการเติบโต (%) {isSingleStation && `- ${filterStation}`}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    แท่ง = ปริมาณ | เส้น = MoM %
                  </span>
                </div>
                <div className="h-60 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.monthlyGrowth} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2d1b3b' : '#f1e5f5'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#c084fc' : THEME_PURPLE }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#deb965' : THEME_GOLD }} unit="%" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? 'rgba(26, 15, 36, 0.95)' : 'rgba(63, 29, 76, 0.95)', 
                          border: '1px solid rgba(181, 142, 56, 0.4)', 
                          borderRadius: '16px', 
                          color: '#ffffff',
                          fontSize: '12px'
                        }}
                        formatter={(val: any, name: any) => {
                          if (name === 'revenue') return [`฿${Number(val).toLocaleString()}`, 'รายได้'];
                          if (name === 'energy') return [`${Number(val).toLocaleString()} kWh`, 'พลังงาน'];
                          if (name === 'sessions') return [`${Number(val).toLocaleString()} ครั้ง`, 'จำนวนครั้ง'];
                          if (name === 'revGrowth' || name === 'growthPct') return [`${Number(val).toFixed(1)}%`, 'เติบโต (MoM)'];
                          return [val, name];
                        }} 
                      />
                      <Bar 
                        yAxisId="left" 
                        dataKey={metricTab === 'revenue' ? 'revenue' : metricTab === 'energy' ? 'energy' : 'sessions'} 
                        fill={metricTab === 'revenue' ? (isDark ? '#deb965' : THEME_GOLD) : (isDark ? '#a855f7' : THEME_PURPLE)} 
                        radius={[6, 6, 0, 0]} 
                        maxBarSize={45} 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey={metricTab === 'revenue' ? 'growth.revenuePct' : metricTab === 'energy' ? 'growth.energyPct' : 'growth.sessionsPct'} 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ r: 3.5, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Station Growth Ranking (Only displayed in network view) */}
              {!isSingleStation && (
                <div className="lg:col-span-4 bg-[#faf8fc] dark:bg-[#130d1b] p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-[#7F3F98]/10 dark:border-[#7F3F98]/20 flex flex-col justify-between space-y-2.5 sm:space-y-3 transition-colors">
                  <div>
                    <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                      การเติบโตรายสถานี (เดือนล่าสุด vs ก่อนหน้า)
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400">
                      เรียงตามอัตราเติบโตของรายได้ (%)
                    </p>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 max-h-64 overflow-y-auto pr-1">
                    {(data?.stationGrowth || []).map((st: any) => {
                      const isPositive = st.revenueGrowthPct >= 0;
                      return (
                        <div 
                          key={st.name} 
                          onClick={() => setFilterStation(st.name)}
                          className="flex items-center justify-between p-2 sm:p-2.5 bg-white dark:bg-[#1a1224] hover:bg-[#f6edfa] dark:hover:bg-[#251a33] transition cursor-pointer rounded-xl border border-slate-100 dark:border-slate-800 text-xs shadow-2xs"
                          title="คลิกเพื่อวิเคราะห์เฉพาะสถานีนี้"
                        >
                          <div className="truncate max-w-[140px] sm:max-w-[170px]">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate text-[11px] sm:text-xs">{st.name}</span>
                            <span className="text-[9.5px] sm:text-[10px] text-slate-400">฿{st.currentRevenue?.toLocaleString()}</span>
                          </div>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-lg font-bold text-[10px] sm:text-[11px] ${
                            isPositive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            {isPositive ? '+' : ''}{st.revenueGrowthPct?.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </section>

          {/* Section 2: มิติที่ 2 - การพยากรณ์ยอดสิ้นเดือน (Run-Rate & Pace Projection) */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#B58E38]/25 dark:border-[#B58E38]/30 shadow-xs space-y-4 sm:space-y-6 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                      มิติที่ 2: การพยากรณ์ยอดและแนวโน้ม (Run-Rate & Pace Projection)
                    </h2>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-[#B58E38]/15 dark:bg-[#B58E38]/30 text-[#8f6d22] dark:text-[#deb965] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#B58E38]/30 dark:border-[#deb965]/40">
                      AI Forecasting
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {isSingleStation
                      ? `ประเมินเป้าหมายและยอดการใช้งานในรอบเดือนถัดไปของสถานี ${filterStation}`
                      : `ประเมินเป้าหมายและแนวโน้มปริมาณการใช้งานในรอบเดือนถัดไป`}
                  </p>
                </div>
              </div>
            </div>

            {/* Projection Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
              
              {/* Projected Revenue */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#faf4e8] to-white dark:from-[#2e2213] dark:to-[#1a1224] border border-[#B58E38]/30 dark:border-[#B58E38]/40 shadow-2xs space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center space-x-1 sm:space-x-1.5 text-[#B58E38] dark:text-[#deb965]">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>คาดการณ์รายได้เดือนถัดไป</span>
                  </span>
                  <span className="bg-[#B58E38]/10 dark:bg-[#B58E38]/20 text-[#B58E38] dark:text-[#deb965] px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold">
                    {data.forecast?.projectedGrowthPct >= 0 ? '+' : ''}{data.forecast?.projectedGrowthPct?.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ฿{data.forecast?.projectedNextRevenue?.toLocaleString()}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 sm:pt-2 border-t border-[#B58E38]/15 dark:border-[#B58E38]/30 flex justify-between">
                  <span>ช่วงคาดการณ์ (Min - Max):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ฿{data.forecast?.projectionRange?.conservativeRev?.toLocaleString()} – ฿{data.forecast?.projectionRange?.optimisticRev?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Projected Energy */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#f6edfa] to-white dark:from-[#2e1d38] dark:to-[#1a1224] border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 shadow-2xs space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center space-x-1 sm:space-x-1.5 text-[#7F3F98] dark:text-[#c084fc]">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>คาดการณ์พลังงานรวม</span>
                  </span>
                  <span className="bg-[#7F3F98]/10 dark:bg-[#7F3F98]/25 text-[#7F3F98] dark:text-[#c084fc] px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold">
                    {data.forecast?.projectedGrowthPct >= 0 ? '+' : ''}{data.forecast?.projectedGrowthPct?.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-[#7F3F98] dark:text-[#c084fc]">
                  {data.forecast?.projectedNextEnergy?.toLocaleString()} <span className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300">kWh</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 sm:pt-2 border-t border-[#7F3F98]/15 dark:border-[#7F3F98]/30 flex justify-between">
                  <span>ช่วงคาดการณ์:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {data.forecast?.projectionRange?.conservativeEnergy?.toLocaleString()} – {data.forecast?.projectionRange?.optimisticEnergy?.toLocaleString()} kWh
                  </span>
                </div>
              </div>

              {/* Projected Sessions */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-50 to-white dark:from-[#251a33] dark:to-[#1a1224] border border-slate-200 dark:border-[#7F3F98]/30 shadow-2xs space-y-2 sm:space-y-3 sm:col-span-2 md:col-span-1">
                <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center space-x-1 sm:space-x-1.5 text-slate-700 dark:text-slate-300">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>คาดการณ์รอบการชาร์จ</span>
                  </span>
                  <span className="bg-slate-100 dark:bg-[#1f152b] text-slate-700 dark:text-slate-300 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                    เชื่อมั่น {data.forecast?.confidenceScore}%
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {data.forecast?.projectedNextSessions?.toLocaleString()} <span className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300">รอบ</span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 sm:pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between">
                  <span>เทียบเดือนฐาน:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{data.forecast?.currentSessions?.toLocaleString()} รอบ</span>
                </div>
              </div>

            </div>
          </section>

          {/* Section 3: มิติที่ 3 - การรักษาฐานลูกค้าและการป้องกันลูกค้าหาย (Customer Retention & Churn Watch) */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 shadow-xs space-y-4 sm:space-y-6 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#f6edfa] dark:bg-[#251a33] text-[#7F3F98] dark:text-[#c084fc] flex items-center justify-center shadow-xs shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                      มิติที่ 3: ระบบรักษาฐานลูกค้าและการป้องกันลูกค้าหาย (Customer Retention & Churn Watch)
                    </h2>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Retention {retentionSummary.retentionRate || 0}%
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {isSingleStation
                      ? `วิเคราะห์พฤติกรรมลูกค้าประจำและความเสี่ยงลูกค้าหายของสถานี ${filterStation}`
                      : `วิเคราะห์พฤติกรรมลูกค้าประจำ การกลับมาใช้ซ้ำ และตรวจจับความเสี่ยงลูกค้าที่เริ่มไม่กลับมาใช้บริการ`}
                  </p>
                </div>
              </div>
            </div>

            {/* Retention & Churn Scorecards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              
              {/* Retention Rate */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#faf8fc] dark:bg-[#130d1b] border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">
                  <span className="flex items-center space-x-1">
                    <HeartPulse className="w-3.5 h-3.5 text-emerald-500" />
                    <span>อัตรากลับมาใช้ซ้ำ</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{retentionSummary.retentionRate}%</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
                  {retentionSummary.returningTotal?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {retentionSummary.totalCustomers?.toLocaleString()} ราย</span>
                </div>
                <p className="text-[9.5px] sm:text-[10px] text-slate-400 dark:text-slate-500">ลูกค้าที่ใช้บริการตั้งแต่ 2 ครั้งขึ้นไป</p>
              </div>

              {/* Loyal Audience */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#faf8fc] dark:bg-[#130d1b] border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 space-y-1">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">
                  <span className="flex items-center space-x-1">
                    <Trophy className="w-3.5 h-3.5 text-[#B58E38]" />
                    <span>ฐานลูกค้าประจำ</span>
                  </span>
                  <span className="font-bold text-[#7F3F98] dark:text-[#c084fc]">Core Base</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-[#7F3F98] dark:text-[#c084fc]">
                  {retentionSummary.loyalAudienceTotal?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-400">ราย</span>
                </div>
                <p className="text-[9.5px] sm:text-[10px] text-slate-400 dark:text-slate-500">ลูกค้าประจำ (3-5 ครั้ง) + ประจำสูง (≥6 ครั้ง)</p>
              </div>

              {/* At-Risk Churn */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-1">
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-[10px] sm:text-xs">
                  <span className="flex items-center space-x-1">
                    <UserMinus className="w-3.5 h-3.5 text-amber-600" />
                    <span>เฝ้าระวังเริ่มหาย</span>
                  </span>
                  <span className="font-bold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded text-[9px]">31–60 วัน</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-amber-700 dark:text-amber-300">
                  {retentionSummary.atRiskCount?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-amber-600/80">ราย</span>
                </div>
                <p className="text-[9.5px] sm:text-[10px] text-amber-700/70 dark:text-amber-400/70">ลูกค้าประจำที่ไม่มีการชาร์จเกิน 1 เดือน</p>
              </div>

              {/* Churned Risk */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/40 space-y-1">
                <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-[10px] sm:text-xs">
                  <span className="flex items-center space-x-1">
                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                    <span>ลูกค้าที่หลุดหาย</span>
                  </span>
                  <span className="font-bold bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.2 rounded text-[9px]">&gt; 60 วัน</span>
                </div>
                <div className="text-lg sm:text-2xl font-black text-rose-700 dark:text-rose-300">
                  {retentionSummary.churnedCount?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-rose-600/80">ราย</span>
                </div>
                <p className="text-[9.5px] sm:text-[10px] text-rose-700/70 dark:text-rose-400/70">อัตราหลุดหายรวม {retentionSummary.churnRiskRate}%</p>
              </div>

            </div>

            {/* Customer Segment Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {retentionSegments.map((seg: any) => (
                <div key={seg.key} className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#130d1b] border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] sm:text-xs text-slate-800 dark:text-slate-200">{seg.label}</span>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md ${seg.badgeColor}`}>
                      {seg.share.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {seg.count?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-400">ราย</span>
                  </div>
                  <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">{seg.desc}</p>
                </div>
              ))}
            </div>

            {/* Top Loyal Customers Table & Churn Watch Matrix */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-[#B58E38]" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    รายชื่อกลุ่มลูกค้าประจำและสถานะการใช้งาน (Loyalty & Churn Watch)
                  </h3>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-[#251a33] p-0.5 rounded-xl border border-slate-200 dark:border-[#7F3F98]/30 text-[10px] sm:text-[11px]">
                  <button
                    onClick={() => setRetentionFilter('all')}
                    className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${retentionFilter === 'all' ? 'bg-[#7F3F98] text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    ทั้งหมด ({data?.retentionChurnData?.topLoyalCustomers?.length || 0})
                  </button>
                  <button
                    onClick={() => setRetentionFilter('active')}
                    className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${retentionFilter === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    🟢 ใช้งานต่อเนื่อง
                  </button>
                  <button
                    onClick={() => setRetentionFilter('at_risk')}
                    className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${retentionFilter === 'at_risk' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    🟡 เฝ้าระวัง (&gt;30 วัน)
                  </button>
                  <button
                    onClick={() => setRetentionFilter('churned')}
                    className={`px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${retentionFilter === 'churned' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    🔴 หลุดหาย (&gt;60 วัน)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-[11px] sm:text-xs whitespace-nowrap">
                  <thead className="bg-[#f6edfa] dark:bg-[#2d1b3b] text-[#7F3F98] dark:text-[#deb965] border-b border-[#eddcf5] dark:border-[#482860]">
                    <tr>
                      <th className="px-3 sm:px-4 py-2 sm:py-2.5 font-bold">รหัสบัตร / ผู้ใช้งาน</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold">ระดับลูกค้า (Tier)</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold text-right">จำนวนครั้ง</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold text-right">พลังงานรวม</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold text-right">ยอดใช้จ่ายสะสม</th>
                      <th className="px-2.5 sm:px-3 py-2 sm:py-2.5 font-bold">ใช้งานล่าสุด</th>
                      <th className="px-2.5 sm:px-4 py-2 sm:py-2.5 font-bold text-center">สถานะความเสี่ยง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                    {topLoyalCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400">
                          ไม่พบข้อมูลในตัวกรองนี้
                        </td>
                      </tr>
                    ) : (
                      topLoyalCustomers.map((user: any, uIdx: number) => {
                        let tierBadge = <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[9.5px]">ลูกค้าใหม่</span>;
                        if (user.tier === 'champion') {
                          tierBadge = <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">👑 ประจำสูง (Champion)</span>;
                        } else if (user.tier === 'regular') {
                          tierBadge = <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">💜 ลูกค้าประจำ</span>;
                        } else if (user.tier === 'repeat') {
                          tierBadge = <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">💛 กลับมาซ้ำ</span>;
                        }

                        let statusPill = (
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>ใช้งานต่อเนื่อง ({user.daysSinceLast} วันก่อน)</span>
                          </span>
                        );

                        if (user.status === 'at_risk') {
                          statusPill = (
                            <span className="inline-flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>เฝ้าระวัง ({user.daysSinceLast} วันไม่มา)</span>
                            </span>
                          );
                        } else if (user.status === 'churned') {
                          statusPill = (
                            <span className="inline-flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>ลูกค้าหลุดหาย ({user.daysSinceLast} วัน)</span>
                            </span>
                          );
                        }

                        return (
                          <tr key={uIdx} className="hover:bg-[#fcfaff] dark:hover:bg-[#261738] transition">
                            <td className="px-3 sm:px-4 py-2 sm:py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                              {user.id}
                            </td>
                            <td className="px-2.5 sm:px-3 py-2 sm:py-2.5">
                              {tierBadge}
                            </td>
                            <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                              {user.sessions} รอบ
                            </td>
                            <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right text-[#7F3F98] dark:text-[#c084fc] font-semibold">
                              {user.energy?.toLocaleString()} kWh
                            </td>
                            <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-right font-extrabold text-[#B58E38] dark:text-[#deb965]">
                              ฿{user.revenue?.toLocaleString()}
                            </td>
                            <td className="px-2.5 sm:px-3 py-2 sm:py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              {user.lastDate}
                            </td>
                            <td className="px-2.5 sm:px-4 py-2 sm:py-2.5 text-center">
                              {statusPill}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Actionable Churn Strategy Alert Box */}
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#f6edfa] to-[#faf4e8] dark:from-[#251a33] dark:to-[#2e2316] border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 text-xs text-slate-800 dark:text-slate-200 flex items-start space-x-2.5 sm:space-x-3">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-[#B58E38] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-[11px] sm:text-xs text-[#7F3F98] dark:text-[#deb965]">กลยุทธ์รักษาฐานลูกค้าและกระตุ้นการใช้งาน (Customer Retention Strategy):</span>
                  <p className="text-[10.5px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    สำหรับกลุ่มลูกค้า <strong className="text-amber-600 dark:text-amber-400">เฝ้าระวัง ({retentionSummary.atRiskCount} ราย)</strong> แนะนำให้พิจารณาส่งข้อความแจ้งเตือนสิทธิประโยชน์ หรือมอบคูปองส่วนลดช่วง Off-Peak ผ่านแอปพลิเคชัน เพื่อดึงดูดให้กลับมาใช้งานก่อนหลุดเป็นกลุ่ม Churned
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* Section 4: มิติที่ 4 - การวิเคราะห์พฤติกรรมการชาร์จและกลุ่มผู้ใช้ (EV Charging Persona Analytics) */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#B58E38]/25 dark:border-[#B58E38]/30 shadow-xs space-y-4 sm:space-y-6 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center shadow-xs shrink-0">
                  <BatteryCharging className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                      มิติที่ 4: การวิเคราะห์กลุ่มพฤติกรรมการชาร์จ (EV Charging Persona Analytics)
                    </h2>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-[#B58E38]/15 dark:bg-[#B58E38]/30 text-[#8f6d22] dark:text-[#deb965] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#B58E38]/30 dark:border-[#deb965]/40">
                      Behavioral Segmentation
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {isSingleStation
                      ? `วิเคราะห์พฤติกรรมการแวะชาร์จ ระยะเวลา และกำลังจ่ายไฟของสถานี ${filterStation}`
                      : `จำแนกพฤติกรรมการแวะชาร์จ ระยะเวลา และกำลังจ่ายไฟ เพื่อวางแผนการตลาดและการติดตั้งหัวชาร์จ`}
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Main Persona Deep-Dive Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
              {personaList.map((p: any) => (
                <div 
                  key={p.key}
                  className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#faf8fc] dark:bg-[#130d1b] border border-[#7F3F98]/15 dark:border-[#7F3F98]/25 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#251a33] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {p.tag}
                      </span>
                      <span className="text-sm sm:text-base font-black" style={{ color: p.themeColor }}>
                        {p.pct}%
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </h4>

                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      {p.desc}
                    </p>
                  </div>

                  {/* Persona Stat Grid */}
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
                    <div className="bg-white dark:bg-[#1a1224] p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">จำนวนรอบชาร์จ</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{p.count?.toLocaleString()} รอบ</span>
                    </div>
                    <div className="bg-white dark:bg-[#1a1224] p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">รายได้เฉลี่ย/รอบ</span>
                      <span className="font-extrabold text-[#B58E38] dark:text-[#deb965]">฿{p.avgRevPerSession?.toLocaleString()}</span>
                    </div>
                    <div className="bg-white dark:bg-[#1a1224] p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">กำลังไฟเฉลี่ย</span>
                      <span className="font-extrabold text-[#7F3F98] dark:text-[#c084fc]">{p.avgSpeedKw} kW</span>
                    </div>
                    <div className="bg-white dark:bg-[#1a1224] p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[9.5px]">เวลาเฉลี่ย/รอบ</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">{p.avgDurationMins} นาที</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charging Power Distribution Profile */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf8fc] dark:bg-[#130d1b] border border-[#B58E38]/20 dark:border-[#B58E38]/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-[#7F3F98] dark:text-[#c084fc]" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    การกระจายตัวของกำลังจ่ายไฟของรถยนต์ (Charging Speed Profile)
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400">
                  สะท้อนสมรรถนะการรับไฟของรถยนต์ที่เข้ามาใช้บริการ
                </span>
              </div>

              {/* Progress Bar Distribution */}
              <div className="w-full h-4 sm:h-5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex shadow-inner">
                {speedDist.map((s: any) => (
                  <div 
                    key={s.key} 
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    className="h-full transition-all duration-500 relative group cursor-pointer"
                    title={`${s.label}: ${s.pct}% (${s.count.toLocaleString()} ครั้ง)`}
                  />
                ))}
              </div>

              {/* Speed Distribution Legend */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 pt-1">
                {speedDist.map((s: any) => (
                  <div key={s.key} className="flex items-start space-x-2 text-[10.5px] sm:text-xs">
                    <span className="w-3 h-3 rounded-md shrink-0 mt-0.5" style={{ backgroundColor: s.color }}></span>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {s.label} ({s.pct}%)
                      </div>
                      <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>

          {/* Section 5: มิติที่ 5 - การตรวจจับความผิดปกติ (Anomaly Detection & Equipment Health) */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 shadow-xs space-y-4 sm:space-y-6 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs shrink-0">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
                      มิติที่ 5: ระบบตรวจจับความผิดปกติ (Anomaly & Inactive Detection)
                    </h2>
                    <span className="text-[9px] sm:text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-1.5 sm:px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      พบ {(data?.anomalies || []).length} ประเด็น
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {isSingleStation
                      ? `ตรวจจับความผิดปกติเฉพาะสถานี ${filterStation}`
                      : `ตรวจจับสถานีที่ไม่มีผู้ใช้งานนานผิดปกติ การตัดชาร์จกระทันหัน และความหนาแน่นสูง`}
                  </p>
                </div>
              </div>
            </div>

            {/* Anomaly Alerts List */}
            <div className="space-y-2.5 sm:space-y-3">
              {(data?.anomalies || []).length === 0 ? (
                <div className="p-6 sm:p-8 text-center bg-emerald-50 dark:bg-emerald-950/20 rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 space-y-1">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 mx-auto" />
                  <p className="font-bold text-xs sm:text-sm">ไม่พบความผิดปกติในสถานีที่เลือก</p>
                  <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">สถานีเปิดให้บริการตามปกติและมีพฤติกรรมการชาร์จในเกณฑ์มาตรฐาน</p>
                </div>
              ) : (
                (data?.anomalies || []).map((anom: any, aIdx: number) => {
                  let badgeBg = 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200';
                  let icon = <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />;

                  if (anom.level === 'warning') {
                    badgeBg = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200';
                    icon = <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />;
                  } else if (anom.level === 'opportunity') {
                    badgeBg = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200';
                    icon = <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />;
                  } else if (anom.level === 'info') {
                    badgeBg = 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200';
                    icon = <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0 mt-0.5" />;
                  }

                  return (
                    <div key={aIdx} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${badgeBg} flex items-start space-x-2.5 sm:space-x-3.5 shadow-2xs`}>
                      {icon}
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-bold text-[11px] sm:text-xs">{anom.title}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 bg-white/70 dark:bg-black/40 rounded-md border border-current">
                            {anom.station}
                          </span>
                        </div>
                        <p className="text-[10.5px] sm:text-xs text-slate-700 dark:text-slate-300">{anom.description}</p>
                        <div className="pt-1 flex items-center space-x-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                          <span className="text-[#7F3F98] dark:text-[#deb965]">💡 คำแนะนำ:</span>
                          <span>{anom.action}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Section 4: ตารางตรวจสอบสุขภาพรายสถานี (Station Health Audit Matrix) */}
          <section className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 shadow-xs space-y-3.5 sm:space-y-4 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
              <div className="flex items-center space-x-2.5 sm:space-x-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {isSingleStation
                      ? `ตารางตรวจสอบสถานะความพร้อม: ${filterStation}`
                      : `ตารางตรวจสอบสถานะการทำงานรายสถานี (Station Health Matrix)`}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">
                    สรุปสถานะความพร้อม อัตราการตัดชาร์จ และกำลังจ่ายไฟเฉลี่ย
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-[11px] sm:text-xs whitespace-nowrap">
                <thead className="bg-[#f6edfa] dark:bg-[#2d1b3b] text-[#7F3F98] dark:text-[#deb965] border-b border-[#eddcf5] dark:border-[#482860]">
                  <tr>
                    <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold">ชื่อสถานีชาร์จ</th>
                    <th className="px-2 sm:px-3 py-2.5 sm:py-3 font-bold text-center">สถานะความพร้อม</th>
                    <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 font-bold text-right">จำนวนครั้ง</th>
                    <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 font-bold text-right">พลังงานรวม</th>
                    <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 font-bold text-right">รายได้สะสม</th>
                    <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 font-bold text-right">กำลังไฟเฉลี่ย</th>
                    <th className="px-2.5 sm:px-3 py-2.5 sm:py-3 font-bold text-right">ตัดชาร์จสั้น (&lt;3 นาที)</th>
                    <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold">ใช้งานล่าสุด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  {(data?.stationHealthList || []).map((st: any) => {
                    let statusPill = (
                      <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                        <span>ปกติ (พร้อมใช้)</span>
                      </span>
                    );

                    if (st.healthStatus === 'critical') {
                      statusPill = (
                        <span className="inline-flex items-center space-x-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold animate-pulse">
                          <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-600" />
                          <span>ควรเข้าตรวจเช็ก</span>
                        </span>
                      );
                    } else if (st.healthStatus === 'warning') {
                      statusPill = (
                        <span className="inline-flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold">
                          <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" />
                          <span>เฝ้าระวัง</span>
                        </span>
                      );
                    }

                    return (
                      <tr key={st.name} className="hover:bg-[#fcfaff] dark:hover:bg-[#261738] transition">
                        <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold text-slate-900 dark:text-white">
                          {st.name}
                        </td>
                        <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-center">
                          {statusPill}
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                          {st.sessions?.toLocaleString()} รอบ
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right text-[#7F3F98] dark:text-[#c084fc] font-semibold">
                          {st.energy?.toLocaleString()} kWh
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right font-bold text-[#B58E38] dark:text-[#deb965]">
                          ฿{st.revenue?.toLocaleString()}
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right text-slate-600 dark:text-slate-400 font-medium">
                          {st.avgSpeedKw > 0 ? `${st.avgSpeedKw} kW` : '-'}
                        </td>
                        <td className="px-2.5 sm:px-3 py-2.5 sm:py-3 text-right text-slate-600 dark:text-slate-400">
                          {st.abortCount > 0 ? (
                            <span className={st.abortRate >= 6 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                              {st.abortCount} ({st.abortRate}%)
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">0%</span>
                          )}
                        </td>
                        <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-slate-500 dark:text-slate-400 font-mono text-[10px] sm:text-[11px]">
                          {st.lastDate} {st.daysInactive > 0 && <span className="text-slate-400">({st.daysInactive} วันก่อน)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
