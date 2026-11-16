import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { Zap, ShieldCheck, Activity, BarChart3, Clock } from 'lucide-react'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))
  }, [])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (phone.length !== 10) {
      setError('กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ครบถ้วน')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ไม่พบเบอร์โทรศัพท์นี้ในระบบ')
      } else {
        Cookies.set('auth_phone', data.phone, { expires: 7 })
        Cookies.set('auth_role', data.role, { expires: 7 })

        if (data.role === 'admin') navigate('/admin')
        else navigate('/dashboard')
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }, [phone, navigate])

  return (
    <div className="min-h-screen bg-[#F7F6F9] dark:bg-[#0C0910] text-[#16111D] dark:text-[#F3F0F7] volta-grid-bg flex flex-col justify-between relative">
      {/* Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-5 sm:px-8 pt-5 sm:pt-7 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#6D288A] dark:bg-[#B975DB]/20 border border-[#6D288A]/20 dark:border-[#B975DB]/40 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-[#E2B95B] fill-[#E2B95B]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-[#16111D] dark:text-white">VOLTA</span>
            <span className="text-xs font-bold text-[#6D288A] dark:text-[#E2B95B]">CONNEXT</span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Split Architectural Layout */}
      <main className="w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Editorial / Telemetry Column */}
        <section className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-[#15101C] border border-[#6D288A]/15 dark:border-[#B975DB]/25 text-xs font-semibold text-[#6D288A] dark:text-[#E2B95B]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>เครือข่ายสถานีชาร์จ EV 14 แห่ง</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-[1.2] text-[#16111D] dark:text-white max-w-xl">
            ระบบวิเคราะห์ข้อมูลและติดตามรายได้สถานีอัดประจุไฟฟ้า
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
            ตรวจสอบปริมาณพลังงานไฟฟ้า รายได้แยกตามช่วงเวลา TOU พฤติกรรมผู้ใช้บริการ และสถานะความสมบูรณ์ของสถานีแบบเรียลไทม์สำหรับผู้ดูแลและเจ้าของสถานี
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
            <div className="bg-white/90 dark:bg-[#15101C]/90 border border-slate-200/80 dark:border-[#B975DB]/20 rounded-xl p-3.5">
              <BarChart3 className="w-4 h-4 text-[#6D288A] dark:text-[#B975DB] mb-2" />
              <div className="text-xs font-bold text-[#16111D] dark:text-white">สรุปรายได้ & kWh</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">แยกตามสถานีและรายเดือน</div>
            </div>
            <div className="bg-white/90 dark:bg-[#15101C]/90 border border-slate-200/80 dark:border-[#B975DB]/20 rounded-xl p-3.5">
              <Clock className="w-4 h-4 text-[#B58A28] dark:text-[#E2B95B] mb-2" />
              <div className="text-xs font-bold text-[#16111D] dark:text-white">โหลดรายชั่วโมง & TOU</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">วิเคราะห์ช่วง On-Peak / Off-Peak</div>
            </div>
            <div className="bg-white/90 dark:bg-[#15101C]/90 border border-slate-200/80 dark:border-[#B975DB]/20 rounded-xl p-3.5">
              <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400 mb-2" />
              <div className="text-xs font-bold text-[#16111D] dark:text-white">พยากรณ์ & สุขภาพระบบ</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ประเมินแนวโน้มและลูกค้าประจำ</div>
            </div>
          </div>
        </section>

        {/* Right Sign-In Panel */}
        <section className="lg:col-span-5">
          <div className="bg-white dark:bg-[#15101C] rounded-2xl border border-[#6D288A]/18 dark:border-[#B975DB]/25 shadow-sm p-6 sm:p-8">
            <div className="border-b border-slate-100 dark:border-white/10 pb-5 mb-6">
              <h2 className="text-lg font-bold text-[#16111D] dark:text-white">เข้าสู่ระบบแดชบอร์ด</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ใช้เบอร์โทรศัพท์ 10 หลักที่ลงทะเบียนไว้กับเครือข่าย
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="phone-input"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  เบอร์โทรศัพท์ประจำสถานีหรือผู้ดูแลระบบ
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="08XXXXXXXX"
                  className="w-full px-4 py-3.5 bg-[#F7F6F9] dark:bg-[#0C0910] border border-slate-200 dark:border-[#B975DB]/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D288A] dark:focus:ring-[#B975DB] focus:border-transparent text-[#16111D] dark:text-white font-mono-num font-semibold tracking-widest text-center text-lg placeholder:text-slate-300 dark:placeholder:text-slate-700 transition-colors"
                />
              </div>

              {error ? (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-medium"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-xl font-bold text-sm text-white bg-[#6D288A] hover:bg-[#581E70] dark:bg-[#7F3F98] dark:hover:bg-[#934CB0] active:scale-[0.99] transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6D288A]"
              >
                {loading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบวิเคราะห์ข้อมูล'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-[#B58A28] dark:text-[#E2B95B] shrink-0" />
              <span>สิทธิ์การเข้าถึงแยกตามสถานีที่ผูกกับเบอร์โทรศัพท์</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-5 sm:px-8 pb-6 text-xs text-slate-400 dark:text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>VOLTA CONNEXT Analytics</span>
        <span>Data synced with Supabase</span>
      </footer>
    </div>
  )
}
