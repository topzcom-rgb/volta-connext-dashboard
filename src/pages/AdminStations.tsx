import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  AlertCircle,
  Search,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  Database,
  Calendar,
  Zap,
  DollarSign,
  Layers,
  Sparkles,
  FileText
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'
import { generateAllSnapshotsFromRows } from '../utils/snapshotGenerator'

export default function AdminStations() {
  const [stations, setStations] = useState<any[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [newAdminPhone, setNewAdminPhone] = useState('')
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [savedStation, setSavedStation] = useState<string | null>(null)
  
  // CSV Uploader States
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [parseSummary, setParseSummary] = useState<any | null>(null)
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadStatusText, setUploadStatusText] = useState<string>('')
  const [uploadResult, setUploadResult] = useState<any | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const fetchAll = async () => {
    try {
      const [stRes, adRes] = await Promise.all([
        fetch('/api/admin/stations'),
        fetch('/api/admin/admins')
      ]);
      const stData = await stRes.json();
      const adData = await adRes.json();

      setStations(Array.isArray(stData) ? stData : []);
      setAdmins(Array.isArray(adData) ? adData : []);
    } catch (e) {
      console.error(e);
      setStations([]);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Cookies.get('auth_role') !== 'admin') { 
      navigate('/'); 
      return; 
    }
    fetchAll();
  }, [navigate])

  const handleUpdateStation = async (charger_name: string, phone_number: string) => {
    try {
      await fetch('/api/admin/stations', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ charger_name, phone_number }) 
      });
      setSavedStation(charger_name);
      setTimeout(() => setSavedStation(null), 2500);
    } catch (err) {
      console.error(err);
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);
    const clean = newAdminPhone.trim().replace(/[^0-9]/g, '');
    if (clean.length !== 10) {
      setAdminError('กรุณากรอกเบอร์โทรศัพท์ 10 หลัก (เช่น 08XXXXXXXX)');
      return;
    }

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: clean })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminError(data.error || 'เกิดข้อผิดพลาดในการเพิ่ม Admin');
      } else {
        setAdminSuccess(`เพิ่มเบอร์ Admin ${clean} เรียบร้อยแล้ว`);
        setNewAdminPhone('');
        fetchAll();
        setTimeout(() => setAdminSuccess(null), 3000);
      }
    } catch (err: any) {
      setAdminError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  const handleDeleteAdmin = async (phone: string) => {
    if (admins.length <= 1) {
      alert('ไม่สามารถลบได้ เนื่องจากต้องมี Admin อย่างน้อย 1 เบอร์ในระบบ');
      return;
    }
    if (!confirm(`คุณต้องการลบสิทธิ์ Admin ของเบอร์ ${phone} ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/admin/admins?phone=${phone}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'เกิดข้อผิดพลาดในการลบ Admin');
      } else {
        fetchAll();
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  // CSV Parsing logic
  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('กรุณาเลือกไฟล์นามสกุล .csv เท่านั้น');
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    setUploadError(null);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        alert('ไฟล์ CSV ไม่มีข้อมูลรายการ');
        setSelectedFile(null);
        return;
      }

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let insideQuote = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            result.push(cur.trim().replace(/^["']|["']$/g, ''));
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const header = parseCSVLine(lines[0]);
      const colMap: { [key: string]: number } = {};
      const cleanLower = (str: string) => (str || '').toLowerCase().replace(/[\s_()\-]/g, '');

      header.forEach((h, idx) => {
        const norm = cleanLower(h);
        if (norm === 'date' || norm === 'วันที่') colMap['date'] = idx;
        if (norm.includes('chargername') || norm.includes('เครื่องชาร์จ') || norm.includes('สถานี') || norm === 'station' || norm === 'stationname') colMap['charger_name'] = idx;
        if (norm.includes('connectorid') || norm.includes('หัวชาร์จ') || norm.includes('หัวจ่าย') || norm.includes('chargerhead') || norm === 'connector') colMap['charger_head'] = idx;
        if (norm === 'vcard' || norm.includes('userid') || norm.includes('vcardid') || norm.includes('rfid') || norm.includes('บัตร') || norm === 'card') colMap['vcard'] = idx;
        if (norm.includes('starttime') || norm.includes('เวลาเริ่ม') || norm === 'start') colMap['start_time'] = idx;
        if (norm.includes('stoptime') || norm.includes('เวลาสิ้นสุด') || norm === 'stop' || norm.includes('endtime')) colMap['stop_time'] = idx;
        if (norm.includes('duration') || norm.includes('totaltime') || norm.includes('ระยะเวลา') || norm === 'time') colMap['durations'] = idx;
        if (norm.includes('energy') || norm.includes('kwh') || norm.includes('พลังงาน')) colMap['energy_kwh'] = idx;
        if (norm.includes('revenue') || norm.includes('amount') || norm.includes('fee') || norm.includes('ยอดเงิน') || norm.includes('รายได้') || norm.includes('บาท')) colMap['revenue_baht'] = idx;
      });

      const EXCLUDED_STATIONS = ['สถานีชาร์จลานจอดรถพิษณุโลก', 'สถานีชาร์จริมน่าน'];
      const parsed: any[] = [];
      let totalEnergy = 0;
      let totalRevenue = 0;
      let minDate = '9999-99-99';
      let maxDate = '0000-00-00';
      const stationSet = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length < 3) continue;

        const charger_name = (cols[colMap['charger_name'] ?? 1] || '').trim();
        if (!charger_name || EXCLUDED_STATIONS.includes(charger_name)) {
          continue;
        }

        const start_time = (cols[colMap['start_time'] ?? 5] || '').trim();
        const stop_time = (cols[colMap['stop_time'] ?? 6] || '').trim();
        const rawDate = (cols[colMap['date'] ?? 0] || '').trim();
        
        let date = '';
        if (start_time.length >= 10 && start_time.includes('-')) {
          date = start_time.slice(0, 10);
        } else if (rawDate.length >= 10) {
          const dParts = rawDate.split('-');
          if (dParts.length === 3) {
            date = `${dParts[0]}-${dParts[2]}-${dParts[1]}`;
          } else {
            date = rawDate;
          }
        }

        const charger_head = (cols[colMap['charger_head'] ?? 2] || '').trim();
        const vcard = (cols[colMap['vcard'] ?? 4] || '').trim();
        const durations = (cols[colMap['durations'] ?? 7] || '00:00:00').trim();
        const energy_kwh = parseFloat(cols[colMap['energy_kwh'] ?? 8] || '0') || 0;
        const revenue_baht = parseFloat(cols[colMap['revenue_baht'] ?? 9] || '0') || 0;

        if (!date) continue;

        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;

        totalEnergy += energy_kwh;
        totalRevenue += revenue_baht;
        stationSet.add(charger_name);

        parsed.push({
          date,
          charger_name,
          charger_head,
          vcard,
          start_time,
          stop_time,
          durations,
          energy_kwh,
          revenue_baht
        });
      }

      setParsedRows(parsed);
      setParseSummary({
        totalRows: parsed.length,
        totalEnergy: Math.round(totalEnergy * 10) / 10,
        totalRevenue: Math.round(totalRevenue),
        minDate: minDate === '9999-99-99' ? '-' : minDate,
        maxDate: maxDate === '0000-00-00' ? '-' : maxDate,
        stationCount: stationSet.size
      });
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Start Batch Uploading to Cloudflare D1
  const handleStartUpload = async () => {
    if (parsedRows.length === 0) return;

    if (uploadMode === 'replace') {
      const confirmed = confirm(
        `⚠️ คุณกำลังจะอัปเดตข้อมูลแบบ "แทนที่ทั้งหมด (Replace All)"\n\nระบบจะล้างข้อมูลเก่า และลงข้อมูลชุดใหม่ ${parsedRows.length.toLocaleString()} รายการ\n(ช่วงวันที่ ${parseSummary?.minDate} ถึง ${parseSummary?.maxDate})\n\nต้องการดำเนินการต่อหรือไม่?`
      );
      if (!confirmed) return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      setUploadStatusText('กำลังประมวลผล Auto-Precomputed Snapshots (คำนวณกราฟและสถิติล่วงหน้า)...');
      setUploadProgress(20);

      // 1. Generate full snapshot bundle in memory
      const bundle = generateAllSnapshotsFromRows(parsedRows);
      
      // Save local backup immediately
      try {
        const localMap: Record<string, any> = {};
        for (const entry of bundle.snapshotEntries) {
          localMap[entry.key] = entry.data;
        }
        localStorage.setItem('local_snapshots_bundle', JSON.stringify(localMap));
        localStorage.setItem('local_snapshots_stats', JSON.stringify(bundle.stats));
      } catch (lsErr) {
        console.warn('LocalStorage save notice:', lsErr);
      }

      setUploadProgress(20);
      setUploadStatusText(`ประมวลผลสำเร็จ ${bundle.snapshotEntries.length} Snapshots กำลังบันทึก Snapshot เข้า Supabase...`);

      // 2. Send snapshots to Supabase (~210 entries)
      const SNAPSHOT_CHUNK = 30;
      const totalSnapBatches = Math.ceil(bundle.snapshotEntries.length / SNAPSHOT_CHUNK);

      for (let b = 0; b < totalSnapBatches; b++) {
        const chunk = bundle.snapshotEntries.slice(b * SNAPSHOT_CHUNK, (b + 1) * SNAPSHOT_CHUNK);
        setUploadStatusText(`กำลังบันทึก Snapshot ชุดที่ ${b + 1}/${totalSnapBatches} เข้า Supabase...`);

        try {
          await fetch('/api/admin/save-snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              snapshotEntries: chunk,
              stats: bundle.stats,
              stations: bundle.distinctStations
            })
          });
        } catch (fetchErr) {
          console.warn('Snapshot sync notice:', fetchErr);
        }

        const pct = Math.round(20 + (((b + 1) / totalSnapBatches) * 30));
        setUploadProgress(pct);
      }

      // 3. Batch upload raw rows into Supabase charging_data table
      const RAW_BATCH_SIZE = 2000;
      const totalRawBatches = Math.ceil(parsedRows.length / RAW_BATCH_SIZE);

      for (let b = 0; b < totalRawBatches; b++) {
        const rawChunk = parsedRows.slice(b * RAW_BATCH_SIZE, (b + 1) * RAW_BATCH_SIZE);
        setUploadStatusText(`กำลังบันทึกข้อมูลดิบชุดที่ ${b + 1}/${totalRawBatches} (${((b + 1) * RAW_BATCH_SIZE > parsedRows.length ? parsedRows.length : (b + 1) * RAW_BATCH_SIZE).toLocaleString()} / ${parsedRows.length.toLocaleString()} แถว) เข้า Supabase...`);

        try {
          await fetch('/api/admin/upload-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: uploadMode,
              batchIndex: b,
              totalBatches: totalRawBatches,
              rows: rawChunk
            })
          });
        } catch (rawErr) {
          console.warn('Raw batch upload notice:', rawErr);
        }

        const pct = Math.round(50 + (((b + 1) / totalRawBatches) * 50));
        setUploadProgress(pct);
      }

      setUploadResult(bundle.stats);
      setUploadStatusText('🎉 อัปเดตข้อมูลและสร้าง Snapshot เข้า Supabase สำเร็จสมบูรณ์ 100%');
      fetchAll();

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'เกิดข้อผิดพลาดในการประมวลผลข้อมูล');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetUpload = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParseSummary(null);
    setUploadProgress(0);
    setUploadResult(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8fc] dark:bg-[#0f0a14] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#7F3F98] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[#7F3F98] dark:text-[#c084fc]">กำลังโหลดข้อมูลการจัดการ...</p>
      </div>
    )
  }

  const safeStations = Array.isArray(stations) ? stations : [];
  const safeAdmins = Array.isArray(admins) ? admins : [];

  const filteredStations = safeStations.filter(s => 
    s?.charger_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s?.phone_number && s.phone_number.includes(searchFilter))
  );

  return (
    <div className="min-h-screen bg-[#faf8fc] dark:bg-[#0f0a14] p-3 sm:p-6 text-slate-800 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Header Card */}
        <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-[#1a1224] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs transition-colors">
          <div>
            <div className="flex items-center space-x-1.5 text-[10px] sm:text-xs font-bold text-[#7F3F98] dark:text-[#c084fc] mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B58E38] dark:text-[#deb965]" />
              <span>ADMINISTRATION & DATA PORTAL</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white">จัดการข้อมูลและสิทธิ์ระบบ</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              อัปเดตข้อมูล CSV เข้า Cloudflare D1, จัดการเบอร์ Admin และเบอร์ประจำสถานี
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button 
              onClick={() => navigate('/admin')} 
              className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#7F3F98]/10 dark:bg-[#7F3F98]/25 text-[#7F3F98] dark:text-[#c084fc] hover:bg-[#7F3F98]/20 dark:hover:bg-[#7F3F98]/35 transition border border-[#7F3F98]/25 cursor-pointer shadow-2xs shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>กลับหน้า Dashboard</span>
            </button>
          </div>
        </div>

        {/* Section 1: CSV Uploader Card (Drag & Drop to Cloudflare D1) */}
        <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 shadow-xs space-y-4 sm:space-y-5 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7F3F98] to-[#5c2771] text-white flex items-center justify-center shadow-xs shrink-0">
                <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">อัปเดตฐานข้อมูลด้วยไฟล์ CSV (Admin CSV Uploader)</h2>
                  <span className="text-[9px] sm:text-[10px] font-bold bg-[#B58E38]/15 dark:bg-[#B58E38]/30 text-[#8f6d22] dark:text-[#deb965] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#B58E38]/30 dark:border-[#deb965]/40">
                    D1 Direct Sync
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                  ลากวางไฟล์ CSV รายวันชุดใหม่เพื่ออัปเดตข้อมูลทั้งหมดเข้าสู่ฐานข้อมูลระบบทันที
                </p>
              </div>
            </div>
            {selectedFile && !isUploading && (
              <button
                onClick={handleResetUpload}
                className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center space-x-1 cursor-pointer bg-slate-100 dark:bg-[#251a33] hover:bg-slate-200 dark:hover:bg-[#342447] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>เลือกไฟล์ใหม่</span>
              </button>
            )}
          </div>

          {/* Drag & Drop Upload Zone */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center transition-all cursor-pointer ${
                dragActive 
                  ? 'border-[#7F3F98] bg-[#f6edfa]/60 dark:bg-[#251a33]/60 scale-[0.99]' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-[#7F3F98] dark:hover:border-[#deb965] hover:bg-[#fcfaff] dark:hover:bg-[#251a33]'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl bg-[#f6edfa] dark:bg-[#251a33] text-[#7F3F98] dark:text-[#c084fc] flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                ลากและวางไฟล์ CSV ที่นี่ หรือ <span className="text-[#7F3F98] dark:text-[#deb965] underline underline-offset-2">คลิกเพื่อเลือกไฟล์</span>
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400 mt-1">
                รองรับไฟล์ CSV ข้อมูลชาร์จรายวัน/รายเดือน (เช่น <code className="text-[#7F3F98] dark:text-[#deb965] bg-slate-100 dark:bg-black/40 px-1 py-0.5 rounded">N02 - CONNEXT DASHBOARD...csv</code>)
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {/* File Info & Pre-Upload Preview Card */}
              <div className="bg-[#faf8fc] dark:bg-[#130d1b] rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-[#7F3F98]/15 dark:border-[#7F3F98]/25 space-y-3.5 sm:space-y-4 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#7F3F98] dark:text-[#c084fc] shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">{selectedFile.name}</span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-800">
                    ✓ ตรวจสอบแล้ว
                  </span>
                </div>

                {/* Data Metric Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-white dark:bg-[#1a1224] p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                      <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#7F3F98] dark:text-[#c084fc]" />
                      <span>จำนวนรายการ</span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {parseSummary?.totalRows?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-500">แถว</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1224] p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>ช่วงวันที่</span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1 truncate">
                      {parseSummary?.minDate} - {parseSummary?.maxDate}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1224] p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#7F3F98] dark:text-[#c084fc]" />
                      <span>พลังงานรวม</span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-[#7F3F98] dark:text-[#c084fc] mt-0.5">
                      {parseSummary?.totalEnergy?.toLocaleString()} <span className="text-[10px] sm:text-xs font-normal text-slate-500">kWh</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1224] p-2.5 sm:p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#B58E38] dark:text-[#deb965]" />
                      <span>รายได้รวม</span>
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-[#B58E38] dark:text-[#deb965] mt-0.5">
                      ฿{parseSummary?.totalRevenue?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Upload Mode Selector */}
                <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">รูปแบบการนำเข้า:</span>
                  <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer bg-white dark:bg-[#1a1224] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-[11px] sm:text-xs">
                    <input 
                      type="radio" 
                      name="uploadMode" 
                      value="replace" 
                      checked={uploadMode === 'replace'} 
                      onChange={() => setUploadMode('replace')}
                      disabled={isUploading}
                      className="accent-[#7F3F98]"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      แทนที่ข้อมูลเดิมทั้งหมด (Replace All) <span className="text-[10px] sm:text-[11px] text-[#7F3F98] dark:text-[#deb965] font-medium">(แนะนำ)</span>
                    </span>
                  </label>
                  <label className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer bg-white dark:bg-[#1a1224] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-[11px] sm:text-xs">
                    <input 
                      type="radio" 
                      name="uploadMode" 
                      value="append" 
                      checked={uploadMode === 'append'} 
                      onChange={() => setUploadMode('append')}
                      disabled={isUploading}
                      className="accent-[#7F3F98]"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      เพิ่มต่อท้ายข้อมูลเดิม (Append Only)
                    </span>
                  </label>
                </div>
              </div>

              {/* Progress & Upload Action */}
              {isUploading && (
                <div className="space-y-2 p-4 sm:p-5 bg-[#f6edfa]/60 dark:bg-[#251a33]/60 rounded-xl sm:rounded-2xl border border-[#7F3F98]/20 dark:border-[#7F3F98]/30 animate-pulse">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#7F3F98] dark:text-[#deb965] flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadStatusText}</span>
                    </span>
                    <span className="text-slate-800 dark:text-white">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 sm:h-3 bg-white dark:bg-[#1a1224] rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-[#7F3F98] to-[#B58E38] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/60 text-xs text-red-700 dark:text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Success Result Card */}
              {uploadResult && (
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                    <span>อัปเดตฐานข้อมูลและสร้าง Auto-Precomputed Snapshot เรียบร้อยแล้ว!</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] sm:text-xs pt-1">
                    <div>ยอดรายการรวม: <strong>{uploadResult.totalRows?.toLocaleString()} รายการ</strong></div>
                    <div>พลังงานรวม: <strong>{uploadResult.totalEnergy?.toLocaleString()} kWh</strong></div>
                    <div>รายได้รวม: <strong>฿{uploadResult.totalRevenue?.toLocaleString()}</strong></div>
                    <div>ข้อมูลล่าสุด: <strong>{uploadResult.maxDate}</strong></div>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    ⚡ ประมวลผลล่วงหน้า (Precomputed 1-Read Snapshot) สำเร็จ — เปิดดูได้ทันที โหลดไว และไม่จำกัดโควตา
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => navigate('/admin')}
                      className="inline-flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>เปิดดู Dashboard ข้อมูลใหม่</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!isUploading && !uploadResult && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                  <button
                    onClick={handleStartUpload}
                    className="inline-flex items-center space-x-2 bg-[#7F3F98] hover:bg-[#6a2d81] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-[#B58E38]" />
                    <span>เริ่มบันทึกเข้าสู่ Cloudflare D1 ({parseSummary?.totalRows?.toLocaleString()} รายการ)</span>
                  </button>
                  <button
                    onClick={handleResetUpload}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-slate-100 dark:hover:bg-[#251a33] transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Admin Management Card */}
        <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs space-y-3.5 sm:space-y-4 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#f6edfa] dark:bg-[#251a33] text-[#7F3F98] dark:text-[#c084fc] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">เบอร์โทรศัพท์ผู้ดูแลระบบ (Admin Phone Numbers)</h2>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">เบอร์ที่มีสิทธิ์ดูทุกสถานี จัดการเบอร์ อัปโหลด CSV และดู Leaderboard</p>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-bold bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#B58E38]/30">
              ทั้งหมด {safeAdmins.length} เบอร์
            </span>
          </div>

          {/* Add Admin Form */}
          <form onSubmit={handleAddAdmin} className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
              <input 
                type="text" 
                value={newAdminPhone}
                onChange={e => setNewAdminPhone(e.target.value)}
                placeholder="กรอกเบอร์โทรศัพท์ Admin ใหม่ (เช่น 0812345678)"
                maxLength={10}
                className="w-full text-xs bg-slate-50 dark:bg-[#251a33] border border-slate-200 dark:border-[#7F3F98]/30 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#7F3F98]/30 focus:border-[#7F3F98]"
              />
            </div>
            <button 
              type="submit"
              className="inline-flex items-center space-x-1.5 bg-[#7F3F98] hover:bg-[#6a2d81] text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-semibold shadow-xs transition cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เพิ่ม Admin</span>
            </button>

            {adminError && (
              <span className="w-full text-xs text-red-600 dark:text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{adminError}</span>
              </span>
            )}
            {adminSuccess && (
              <span className="w-full text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{adminSuccess}</span>
              </span>
            )}
          </form>

          {/* Admin Badges List */}
          <div className="flex flex-wrap gap-2 pt-1">
            {safeAdmins.map(ad => (
              <div 
                key={ad.phone_number} 
                className="flex items-center space-x-1.5 sm:space-x-2 bg-[#f6edfa] dark:bg-[#251a33] border border-[#eddcf5] dark:border-[#7F3F98]/30 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#7F3F98] dark:text-[#c084fc]" />
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{ad.phone_number}</span>
                {safeAdmins.length > 1 && (
                  <button 
                    onClick={() => handleDeleteAdmin(ad.phone_number)}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-rose-400 transition p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    title="ลบสิทธิ์ Admin"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Station Phone Management Card (Multi-phone supported) */}
        <div className="bg-white dark:bg-[#1a1224] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#7F3F98]/15 dark:border-[#7F3F98]/30 shadow-xs space-y-3.5 sm:space-y-4 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3 sm:pb-4">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-[#faf4e8] dark:bg-[#2e2316] text-[#B58E38] dark:text-[#deb965] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">จัดการเบอร์โทรศัพท์ประจำสถานี (Station Owners)</h2>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-400">
                  สามารถใส่ได้ <span className="font-semibold text-[#7F3F98] dark:text-[#c084fc]">มากกว่า 1 เบอร์</span> ต่อสถานี คั่นด้วยเครื่องหมาย <code className="bg-slate-100 dark:bg-black/40 px-1 py-0.5 rounded-md text-[#7F3F98] dark:text-[#deb965]">,</code>
                </p>
              </div>
            </div>
            
            {/* Search filter input */}
            <div className="relative w-full sm:w-auto sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="ค้นหาชื่อสถานี หรือเบอร์..." 
                className="w-full text-xs bg-slate-50 dark:bg-[#251a33] border border-slate-200 dark:border-[#7F3F98]/30 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl pl-8 pr-3 py-1.5 sm:py-2 focus:outline-hidden focus:ring-2 focus:ring-[#7F3F98]/30 focus:border-[#7F3F98]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-[11px] sm:text-xs whitespace-nowrap">
              <thead className="bg-[#f6edfa] dark:bg-[#2d1b3b] text-[#7F3F98] dark:text-[#deb965] border-b border-[#eddcf5] dark:border-[#482860]">
                <tr>
                  <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold">ชื่อสถานีชาร์จ</th>
                  <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold">เบอร์โทรศัพท์ที่ได้รับสิทธิ์</th>
                  <th className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold text-center w-24 sm:w-28">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredStations.map((st: any) => {
                  const phoneList = st.phone_number 
                    ? st.phone_number.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
                    : [];

                  return (
                    <tr key={st.charger_name} className="hover:bg-[#fcfaff] dark:hover:bg-[#261738] transition">
                      <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 font-bold text-slate-900 dark:text-white">
                        {st.charger_name}
                      </td>
                      <td className="px-2.5 sm:px-4 py-2.5 sm:py-3">
                        <div className="space-y-1.5">
                          <input 
                            type="text" 
                            defaultValue={st.phone_number || ''}
                            placeholder="เช่น 0812345678, 0898765432"
                            onBlur={(e) => {
                              const val = e.target.value;
                              const updated = [...stations];
                              const targetIdx = updated.findIndex(item => item.charger_name === st.charger_name);
                              if (targetIdx !== -1) {
                                updated[targetIdx].phone_number = val;
                                setStations(updated);
                              }
                            }}
                            className="w-full max-w-md text-xs bg-white dark:bg-[#251a33] border border-slate-200 dark:border-[#7F3F98]/30 text-slate-900 dark:text-white rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-[#7F3F98]/30 focus:border-[#7F3F98]"
                          />
                          {phoneList.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {phoneList.map((p: string, pIdx: number) => (
                                <span key={pIdx} className="text-[9.5px] sm:text-[10px] bg-[#f6edfa] dark:bg-[#1f152b] text-[#7F3F98] dark:text-[#deb965] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border border-[#eddcf5] dark:border-[#7F3F98]/30">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2.5 sm:px-4 py-2.5 sm:py-3 text-center">
                        {savedStation === st.charger_name ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[11px] sm:text-xs animate-pulse">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>บันทึกแล้ว</span>
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleUpdateStation(st.charger_name, st.phone_number)} 
                            className="inline-flex items-center space-x-1.5 bg-[#7F3F98] hover:bg-[#6a2d81] text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#B58E38]" />
                            <span>บันทึก</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

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