import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { Zap, ShieldCheck, ArrowRight } from 'lucide-react'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (phone.length !== 10) {
      setError('กรุณากรอกเบอร์โทรศัพท์ 10 หลัก')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ไม่พบเบอร์โทรศัพท์ในระบบ')
      } else {
        Cookies.set('auth_phone', data.phone, { expires: 7 })
        Cookies.set('auth_role', data.role, { expires: 7 })
        
        if (data.role === 'admin') navigate('/admin')
        else navigate('/dashboard')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#faf8fc] dark:bg-[#0f0a14] flex items-center justify-center p-4 selection:bg-[#7F3F98] selection:text-white relative transition-colors duration-300">
      {/* Top Floating Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#7F3F98]/10 dark:bg-[#7F3F98]/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#B58E38]/10 dark:bg-[#B58E38]/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full bg-white dark:bg-[#1a1224] rounded-3xl shadow-xl shadow-[#7F3F98]/5 dark:shadow-black/40 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 p-8 sm:p-10 transition-colors duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7F3F98] to-[#9d5ab8] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7F3F98]/25 border-2 border-[#B58E38]/40">
            <Zap className="w-7 h-7 fill-[#B58E38] text-white" />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">VOLTA</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#7F3F98]/10 dark:bg-[#7F3F98]/30 text-[#7F3F98] dark:text-[#deb965] border border-[#7F3F98]/20 dark:border-[#deb965]/40">
              CONNEXT
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">EV Charging Station Analytics Dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              เบอร์โทรศัพท์ประจำสถานี (10 หลัก)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="08XXXXXXXX"
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#251a33] border border-slate-200 dark:border-[#7F3F98]/30 rounded-2xl focus:ring-2 focus:ring-[#7F3F98]/30 focus:border-[#7F3F98] focus:bg-white dark:focus:bg-[#2c1e3d] outline-none text-slate-900 dark:text-white font-medium tracking-wider transition text-center text-lg placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-rose-950/40 border border-red-100 dark:border-rose-800/50 text-red-600 dark:text-rose-300 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#7F3F98] to-[#6a2d81] hover:from-[#6f3387] hover:to-[#5c2771] active:scale-[0.99] shadow-md shadow-[#7F3F98]/25 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
            {!loading && <ArrowRight className="w-4 h-4 text-[#B58E38]" />}
          </button>
        </form>

        {/* Footer Admin Note */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center space-x-2 text-[11px] text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B58E38]" />
          <span>เข้าสู่ระบบด้วยเบอร์โทรศัพท์ที่ลงทะเบียนไว้</span>
        </div>

      </div>
    </div>
  )
}