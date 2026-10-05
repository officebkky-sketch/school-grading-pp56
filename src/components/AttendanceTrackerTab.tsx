import React, { useState, useEffect } from 'react';
import { StudentProfile, AttendanceDetail } from '../types/pp5Types';
import { INITIAL_ATTENDANCE } from '../data/initialAttendanceData';
import { 
  CalendarCheck, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Check, 
  CalendarDays,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  Trash2,
  Plus,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  X,
  RefreshCw
} from 'lucide-react';

export interface HolidayItem {
  id: string;
  term: 1 | 2;
  date: string;
  rawDate?: string;
  name: string;
  type: string;
  isDefault?: boolean;
}

const DEFAULT_HOLIDAYS: HolidayItem[] = [
  { id: 'h1', term: 1, date: '3 มิ.ย. 2569', rawDate: '2026-06-03', name: 'วันเฉลิมฯ พระราชินี', type: 'วันหยุดราชการ', isDefault: true },
  { id: 'h2', term: 1, date: '28 ก.ค. 2569', rawDate: '2026-07-28', name: 'วันเฉลิมฯ รัชกาลที่ 10', type: 'วันหยุดราชการ', isDefault: true },
  { id: 'h3', term: 1, date: '12 ส.ค. 2569', rawDate: '2026-08-12', name: 'วันแม่แห่งชาติ', type: 'วันหยุดราชการ', isDefault: true },
  { id: 'h4', term: 2, date: '5 ธ.ค. 2569', rawDate: '2026-12-05', name: 'วันพ่อแห่งชาติ', type: 'วันหยุดราชการ', isDefault: true },
  { id: 'h5', term: 2, date: '10 ธ.ค. 2569', rawDate: '2026-12-10', name: 'วันรัฐธรรมนูญ', type: 'วันหยุดราชการ', isDefault: true },
  { id: 'h6', term: 2, date: '1 ม.ค. 2570', rawDate: '2027-01-01', name: 'วันขึ้นปีใหม่', type: 'วันหยุดราชการ', isDefault: true },
  { id: 'h7', term: 2, date: '16 ม.ค. 2570', rawDate: '2027-01-16', name: 'วันครูแห่งชาติ', type: 'วันหยุดสถานศึกษา', isDefault: true },
];

const MONTH_DEFINITIONS = [
  { key: '2026-05', name: 'พฤษภาคม 2569', shortName: 'พ.ค.', term: 1, note: 'เปิด 16 พ.ค.' },
  { key: '2026-06', name: 'มิถุนายน 2569', shortName: 'มิ.ย.', term: 1 },
  { key: '2026-07', name: 'กรกฎาคม 2569', shortName: 'ก.ค.', term: 1 },
  { key: '2026-08', name: 'สิงหาคม 2569', shortName: 'ส.ค.', term: 1 },
  { key: '2026-09', name: 'กันยายน 2569', shortName: 'ก.ย.', term: 1 },
  { key: '2026-10', name: 'ตุลาคม 2569', shortName: 'ต.ค.', term: 1, note: 'ปิด 10 ต.ค.' },
  { key: '2026-11', name: 'พฤศจิกายน 2569', shortName: 'พ.ย.', term: 2 },
  { key: '2026-12', name: 'ธันวาคม 2569', shortName: 'ธ.ค.', term: 2 },
  { key: '2027-01', name: 'มกราคม 2570', shortName: 'ม.ค.', term: 2 },
  { key: '2027-02', name: 'กุมภาพันธ์ 2570', shortName: 'ก.พ.', term: 2 },
  { key: '2027-03', name: 'มีนาคม 2570', shortName: 'มี.ค.', term: 2 },
];

const THAI_MONTH_NAMES: Record<string, string> = {
  '2026-05': 'พฤษภาคม 2569',
  '2026-06': 'มิถุนายน 2569',
  '2026-07': 'กรกฎาคม 2569',
  '2026-08': 'สิงหาคม 2569',
  '2026-09': 'กันยายน 2569',
  '2026-10': 'ตุลาคม 2569',
  '2026-11': 'พฤศจิกายน 2569',
  '2026-12': 'ธันวาคม 2569',
  '2027-01': 'มกราคม 2570',
  '2027-02': 'กุมภาพันธ์ 2570',
  '2027-03': 'มีนาคม 2570'
};

const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export interface CalendarScheduleConfig {
  term1StartDate: string;
  term1EndDate: string;
  term1Midterm: string;
  term1Final: string;
  term1MonthlyDays: {
    may: number;
    jun: number;
    jul: number;
    aug: number;
    sep: number;
    oct: number;
  };
  term2StartDate: string;
  term2EndDate: string;
  term2Midterm: string;
  term2Final: string;
  term2MonthlyDays: {
    nov: number;
    dec: number;
    jan: number;
    feb: number;
    mar: number;
  };
}

const DEFAULT_CALENDAR_SCHEDULE: CalendarScheduleConfig = {
  term1StartDate: '2026-05-16',
  term1EndDate: '2026-10-10',
  term1Midterm: '25 – 29 กรกฎาคม 2569',
  term1Final: '3 – 7 ตุลาคม 2569',
  term1MonthlyDays: {
    may: 11,
    jun: 21,
    jul: 21,
    aug: 21,
    sep: 22,
    oct: 8
  },
  term2StartDate: '2026-11-01',
  term2EndDate: '2027-03-31',
  term2Midterm: '11 – 15 มกราคม 2570',
  term2Final: '22 – 26 มีนาคม 2570',
  term2MonthlyDays: {
    nov: 21,
    dec: 21,
    jan: 20,
    feb: 20,
    mar: 22
  }
};

interface Props {
  students: StudentProfile[];
  classLevel: string;
  semester: 1 | 2;
  totalDays: number;
  attendanceData?: Record<string, AttendanceDetail>;
  onUpdateAttendance?: (studentId: string, data: AttendanceDetail) => void;
  onBulkUpdateAttendance?: (records: Record<string, AttendanceDetail>) => void;
  onUpdateTotalDays?: (semester: 1 | 2, days: number) => void;
  canConfigureCalendar?: boolean;
  schoolName?: string;
  homeroomTeacher?: string;
  academicHeadName?: string;
  directorName?: string;
  onManualSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export const AttendanceTrackerTab: React.FC<Props> = ({
  students,
  classLevel,
  semester,
  totalDays,
  attendanceData = {},
  onUpdateAttendance,
  onBulkUpdateAttendance,
  onUpdateTotalDays,
  canConfigureCalendar = true,
  schoolName = 'บ้านควนโคกยา',
  homeroomTeacher = '',
  academicHeadName = 'นางสาววัชรี พรหมช่วย',
  directorName = 'นายเอกคณิต สิทธิศักดิ์',
  onManualSync,
  isSyncing = false
}) => {
  // Main Sub-Tab: 'monthly_matrix' (โหมดลงเวลารายเดือน) | 'summary' (ตารางสรุปสะสม & สิทธิ์สอบ) | 'calendar' (ปฏิทินการศึกษา)
  const [subTab, setSubTab] = useState<'monthly_matrix' | 'summary' | 'calendar'>('monthly_matrix');

  // เดือนที่เลือกสำหรับโหมดตาราง Matrix (เริ่มต้นที่ มิถุนายน 2569 หรือ พฤษภาคม 2569 ตาม mockup)
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06');

  // โหมดเครื่องมือจิ้มติ๊ก (Stamp Tool)
  const [stampTool, setStampTool] = useState<'present' | 'leave' | 'late' | 'absent'>('present');

  // กำหนดการเปิด-ปิดภาคเรียน และวันทำการรายเดือน
  const [scheduleConfig, setScheduleConfig] = useState<CalendarScheduleConfig>(() => {
    const saved = localStorage.getItem('pp5_calendar_schedule');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.term1MonthlyDays?.sep || parsed.term1MonthlyDays?.sep === 21) {
          return {
            ...DEFAULT_CALENDAR_SCHEDULE,
            ...parsed,
            term1MonthlyDays: DEFAULT_CALENDAR_SCHEDULE.term1MonthlyDays,
            term2MonthlyDays: DEFAULT_CALENDAR_SCHEDULE.term2MonthlyDays,
          };
        }
        return parsed;
      } catch {}
    }
    return DEFAULT_CALENDAR_SCHEDULE;
  });

  const handleScheduleChange = (field: keyof CalendarScheduleConfig, val: any) => {
    setScheduleConfig(prev => {
      const updated = { ...prev, [field]: val };
      localStorage.setItem('pp5_calendar_schedule', JSON.stringify(updated));
      return updated;
    });
  };

  const handleMonthlyDaysChange = (term: 'term1' | 'term2', monthKey: string, days: number) => {
    setScheduleConfig(prev => {
      const currentDaysMap = term === 'term1' ? { ...prev.term1MonthlyDays } : { ...prev.term2MonthlyDays };
      (currentDaysMap as any)[monthKey] = days;

      const updated = {
        ...prev,
        [term === 'term1' ? 'term1MonthlyDays' : 'term2MonthlyDays']: currentDaysMap
      };
      localStorage.setItem('pp5_calendar_schedule', JSON.stringify(updated));

      // คำนวณวันทำการรวมของเทอมนั้น แล้วซิงค์ไปยัง App.tsx
      if (term === 'term1') {
        const totalTerm1 = Object.values(updated.term1MonthlyDays).reduce((a, b) => a + b, 0);
        if (onUpdateTotalDays) onUpdateTotalDays(1, totalTerm1);
      } else {
        const totalTerm2 = Object.values(updated.term2MonthlyDays).reduce((a, b) => a + b, 0);
        if (onUpdateTotalDays) onUpdateTotalDays(2, totalTerm2);
      }

      return updated;
    });
  };

  // ปฏิทินและวันหยุด
  const [holidays, setHolidays] = useState<HolidayItem[]>(() => {
    const saved = localStorage.getItem('pp5_calendar_holidays');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_HOLIDAYS;
  });

  const [showAddHolidayForm, setShowAddHolidayForm] = useState(false);
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolName, setNewHolName] = useState('');
  const [newHolTerm, setNewHolTerm] = useState<1 | 2>(1);
  const [newHolType, setNewHolType] = useState('วันหยุดสถานศึกษา');

  // Print Modals
  const [isGridPrintModalOpen, setIsGridPrintModalOpen] = useState(false);
  const [isCalendarPrintModalOpen, setIsCalendarPrintModalOpen] = useState(false);
  const [isSummaryPrintModalOpen, setIsSummaryPrintModalOpen] = useState(false);

  // ตรวจสอบว่าเป็นวันทำการเรียนการสอนหรือไม่
  const isSchoolDay = (y: number, m: number, d: number): boolean => {
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = dt.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; // เสาร์-อาทิตย์

    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // เช็คช่วงวันเปิด - ปิดเทอม 1 และ เทอม 2 แบบไดนามิกตามที่ฝ่ายวิชาการตั้งค่า
    const inTerm1 = dateStr >= scheduleConfig.term1StartDate && dateStr <= scheduleConfig.term1EndDate;
    const inTerm2 = dateStr >= scheduleConfig.term2StartDate && dateStr <= scheduleConfig.term2EndDate;
    if (!inTerm1 && !inTerm2) return false;

    // เช็ควันหยุดราชการและวันหยุดพิเศษ
    const isHoliday = holidays.some(h => h.rawDate === dateStr);
    return !isHoliday;
  };

  // ตรวจสอบจากสตริงวันที่ YYYY-MM-DD โดยตรง
  const checkIsSchoolDateStr = (dateStr: string): boolean => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    return isSchoolDay(y, m, d);
  };

  // คำนวณวันทำการจริงในแต่ละเดือนแบบไดนามิกตามปฏิทินและวันหยุดจริง
  const getMonthSchoolDaysCount = (monthKey: string): number => {
    const [yStr, mStr] = monthKey.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const daysInMonth = new Date(y, m, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (isSchoolDay(y, m, d)) count++;
    }
    return count;
  };

  // ดึงรายการวันทั้งหมดในเดือนที่เลือก (1 ถึงสิ้นเดือน)
  const getDaysInSelectedMonth = () => {
    const [yStr, mStr] = selectedMonth.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const daysInMonth = new Date(y, m, 0).getDate();
    const days: { day: number; dateStr: string; dayOfWeek: number; dayLabel: string; isSchool: boolean; isWeekend: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(y, m - 1, d);
      const dayOfWeek = dt.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isSchool = isSchoolDay(y, m, d);
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        dayOfWeek,
        dayLabel: THAI_DAYS_SHORT[dayOfWeek],
        isSchool,
        isWeekend
      });
    }
    return days;
  };

  const monthDays = getDaysInSelectedMonth();
  const activeDays = monthDays.filter(d => d.isSchool).map(d => d.day);

  // ข้อมูลเวลาเรียนของนักเรียน
  const [records, setRecords] = useState<Record<string, AttendanceDetail>>(() => {
    if (attendanceData && Object.keys(attendanceData).length > 0) {
      return attendanceData;
    }
    if (classLevel === 'ป.1' && INITIAL_ATTENDANCE['ป.1']) {
      return INITIAL_ATTENDANCE['ป.1'];
    }
    const init: Record<string, AttendanceDetail> = {};
    students.forEach(s => {
      init[s.studentId] = {
        present: Math.max(0, totalDays - 2),
        leave: 1,
        sick: 1,
        absent: 0,
        late: 0,
        dailyRecords: {},
        dailyNotes: {}
      };
    });
    return init;
  });

  useEffect(() => {
    if (attendanceData && Object.keys(attendanceData).length > 0) {
      setRecords(attendanceData);
    } else if (classLevel === 'ป.1' && INITIAL_ATTENDANCE['ป.1']) {
      setRecords(INITIAL_ATTENDANCE['ป.1']);
    }
  }, [attendanceData, classLevel]);

  // เปลี่ยนสถานะการมาเรียนใน Matrix รายวัน
  const handleMatrixCellClick = (studentId: string, day: number) => {
    const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    const studentRecord = records[studentId] || { present: 0, leave: 0, sick: 0, absent: 0, late: 0, dailyRecords: {} };
    const currentDaily = { ...(studentRecord.dailyRecords || {}) };
    const currentStatus = currentDaily[dateStr];

    let nextStatus: 'present' | 'leave' | 'sick' | 'absent' | 'late' | undefined = stampTool;
    // ถ้าคลิกครั้งแรกในช่องว่าง ให้เริ่มด้วย stampTool (เช่น 'present')
    if (!currentStatus) {
      nextStatus = stampTool;
    } else if (stampTool !== 'present' && currentStatus !== stampTool) {
      nextStatus = stampTool;
    } else {
      // ถ้าคลิกซ้ำที่สถานะเดิม ให้หมุนเวียน (Cycle): present -> leave -> late -> absent -> ล้างกลับเป็นว่าง (เว้นว่าง)
      const cycle: Record<string, 'present' | 'leave' | 'late' | 'absent' | undefined> = {
        'present': 'leave',
        'leave': 'late',
        'late': 'absent',
        'absent': undefined,
        'sick': 'present'
      };
      nextStatus = cycle[currentStatus];
    }

    if (nextStatus === undefined) {
      delete currentDaily[dateStr];
    } else {
      currentDaily[dateStr] = nextStatus;
    }

    // คำนวณสรุปยอดสะสมของภาคเรียนที่กำลังเลือกอยู่แบบสัมพันธ์จริง (นับเฉพาะวันเปิดเรียน)
    const currentTermStart = semester === 1 ? scheduleConfig.term1StartDate : scheduleConfig.term2StartDate;
    const currentTermEnd = semester === 1 ? scheduleConfig.term1EndDate : scheduleConfig.term2EndDate;

    let presentCount = 0, leaveCount = 0, sickCount = 0, absentCount = 0, lateCount = 0;
    Object.entries(currentDaily).forEach(([dStr, st]) => {
      if (dStr >= currentTermStart && dStr <= currentTermEnd) {
        if (checkIsSchoolDateStr(dStr)) {
          if (st === 'present') presentCount++;
          else if (st === 'leave') leaveCount++;
          else if (st === 'sick') sickCount++;
          else if (st === 'absent') absentCount++;
          else if (st === 'late') lateCount++;
        }
      }
    });

    const updated = {
      ...studentRecord,
      present: presentCount,
      leave: leaveCount,
      sick: sickCount,
      absent: absentCount,
      late: lateCount,
      dailyRecords: currentDaily
    };

    const newRecords = { ...records, [studentId]: updated };
    setRecords(newRecords);

    if (onUpdateAttendance) {
      onUpdateAttendance(studentId, updated);
    }
  };

  // มาเรียนทั้งหมดในเดือนนี้สำหรับทั้งห้อง (นับเฉพาะวันเปิดเรียนจริง)
  const handleMarkAllPresentInMonth = () => {
    const newRecords = { ...records };
    const currentTermStart = semester === 1 ? scheduleConfig.term1StartDate : scheduleConfig.term2StartDate;
    const currentTermEnd = semester === 1 ? scheduleConfig.term1EndDate : scheduleConfig.term2EndDate;

    // กรองเฉพาะวันเปิดเรียนในเดือนนี้
    const schoolDaysInThisMonth = monthDays.filter(d => d.isSchool);

    students.forEach(stu => {
      const studentRecord = newRecords[stu.studentId] || { present: 0, leave: 0, sick: 0, absent: 0, late: 0, dailyRecords: {} };
      const currentDaily = { ...(studentRecord.dailyRecords || {}) };

      // เซ็ตมาเรียนเฉพาะวันเปิดเรียนจริง
      schoolDaysInThisMonth.forEach(d => {
        const dateStr = `${selectedMonth}-${String(d.day).padStart(2, '0')}`;
        currentDaily[dateStr] = 'present';
      });

      // ลบวันที่ไม่ใช่วันเปิดเรียนในเดือนนี้ออกจาก dailyRecords หากเคยมีบันทึกตกค้าง
      monthDays.filter(d => !d.isSchool).forEach(d => {
        const dateStr = `${selectedMonth}-${String(d.day).padStart(2, '0')}`;
        delete currentDaily[dateStr];
      });

      // คำนวณสรุปยอดสะสมของภาคเรียนที่เลือก โดยนับเฉพาะวันที่เป็นวันเปิดเรียนจริง (isSchoolDay) เท่านั้น
      let presentCount = 0, leaveCount = 0, sickCount = 0, absentCount = 0, lateCount = 0;
      Object.entries(currentDaily).forEach(([dStr, st]) => {
        if (dStr >= currentTermStart && dStr <= currentTermEnd) {
          if (checkIsSchoolDateStr(dStr)) {
            if (st === 'present') presentCount++;
            else if (st === 'leave') leaveCount++;
            else if (st === 'sick') sickCount++;
            else if (st === 'absent') absentCount++;
            else if (st === 'late') lateCount++;
          }
        }
      });

      newRecords[stu.studentId] = {
        ...studentRecord,
        present: presentCount,
        leave: leaveCount,
        sick: sickCount,
        absent: absentCount,
        late: lateCount,
        dailyRecords: currentDaily
      };
    });

    setRecords(newRecords);
    if (onBulkUpdateAttendance) {
      onBulkUpdateAttendance(newRecords);
    }
  };

  // การจัดการวันหยุด
  const handleSaveHoliday = () => {
    if (!newHolName.trim()) {
      alert('กรุณาระบุชื่อวันหยุดหรือกิจกรรม');
      return;
    }

    let displayDate = newHolDate;
    if (newHolDate) {
      const parts = newHolDate.split('-');
      if (parts.length === 3) {
        const monthsThai = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        const mIdx = parseInt(parts[1], 10) - 1;
        const yThai = parseInt(parts[0], 10) + 543;
        displayDate = `${parseInt(parts[2], 10)} ${monthsThai[mIdx]} ${yThai}`;
      }
    } else {
      displayDate = 'ตามประกาศ ร.ร.';
    }

    const newItem: HolidayItem = {
      id: 'hol_' + Date.now(),
      term: newHolTerm,
      date: displayDate,
      rawDate: newHolDate,
      name: newHolName.trim(),
      type: newHolType,
      isDefault: false
    };

    const updated = [...holidays, newItem];
    setHolidays(updated);
    localStorage.setItem('pp5_calendar_holidays', JSON.stringify(updated));
    setNewHolName('');
    setShowAddHolidayForm(false);
  };

  const handleDeleteHoliday = (id: string) => {
    if (confirm('ต้องการลบวันหยุดรายการนี้ใช่หรือไม่?')) {
      const updated = holidays.filter(h => h.id !== id);
      setHolidays(updated);
      localStorage.setItem('pp5_calendar_holidays', JSON.stringify(updated));
    }
  };

  // ตัวเลือกขอบเขตสรุป: 'current_term' (ตามเทอมปัจจุบัน) | 'term1' (เทอม 1) | 'term2' (เทอม 2) | 'year' (ตลอดทั้งปี 208 วัน)
  const [summaryScope, setSummaryScope] = useState<'current_term' | 'term1' | 'term2' | 'year'>('current_term');

  const term1Days = Object.values(scheduleConfig.term1MonthlyDays).reduce((a, b) => a + b, 0);
  const term2Days = Object.values(scheduleConfig.term2MonthlyDays).reduce((a, b) => a + b, 0);
  const fullYearDays = term1Days + term2Days;

  const effectiveScope = summaryScope === 'current_term' 
    ? (semester === 1 ? 'term1' : 'term2') 
    : summaryScope;

  const targetDays = effectiveScope === 'term1' 
    ? (totalDays && semester === 1 ? totalDays : term1Days)
    : effectiveScope === 'term2' 
      ? (totalDays && semester === 2 ? totalDays : term2Days)
      : (fullYearDays || 208);

  const scopeLabel = effectiveScope === 'term1'
    ? `ภาคเรียนที่ 1 (${targetDays} วันทำการ)`
    : effectiveScope === 'term2'
      ? `ภาคเรียนที่ 2 (${targetDays} วันทำการ)`
      : `ตลอดทั้งปีการศึกษา (${targetDays} วันทำการ)`;

  // คำนวณสถิติภาพรวมและการแปรผลสิทธิ์สอบ (Dynamically linked to monthly records 100%)
  const evaluations = students.map(s => {
    const r = records[s.studentId] || { present: targetDays, leave: 0, sick: 0, absent: 0, late: 0 };

    let present = r.present ?? 0;
    let leave = r.leave ?? 0;
    let sick = r.sick ?? 0;
    let absent = r.absent ?? 0;
    let late = r.late ?? 0;
    let hasScopeRecords = false;

    // หากมี dailyRecords ให้คำนวณจากบันทึกรายวันตามขอบเขต (Scope) ที่เลือกแบบเรียลไทม์
    if (r.dailyRecords && Object.keys(r.dailyRecords).length > 0) {
      let p = 0, l = 0, sk = 0, ab = 0, lt = 0;

      Object.entries(r.dailyRecords).forEach(([dStr, st]) => {
        let inScope = false;
        if (effectiveScope === 'term1') {
          inScope = dStr >= scheduleConfig.term1StartDate && dStr <= scheduleConfig.term1EndDate;
        } else if (effectiveScope === 'term2') {
          inScope = dStr >= scheduleConfig.term2StartDate && dStr <= scheduleConfig.term2EndDate;
        } else {
          // 'year'
          inScope = (dStr >= scheduleConfig.term1StartDate && dStr <= scheduleConfig.term1EndDate) ||
                    (dStr >= scheduleConfig.term2StartDate && dStr <= scheduleConfig.term2EndDate);
        }

        if (inScope && checkIsSchoolDateStr(dStr)) {
          hasScopeRecords = true;
          if (st === 'present') p++;
          else if (st === 'leave') l++;
          else if (st === 'sick') sk++;
          else if (st === 'absent') ab++;
          else if (st === 'late') lt++;
        }
      });

      if (hasScopeRecords) {
        present = p;
        leave = l;
        sick = sk;
        absent = ab;
        late = lt;
      }
    }

    const totalRecordedDays = present + leave + sick + absent + late;
    // หากอยู่ในช่วงระหว่างภาคเรียน (ยังลงเวลาไม่ครบ targetDays) ให้คิดเปอร์เซ็นต์เทียบกับวันที่ลงบันทึกจริง
    const effectiveDenominator = (totalRecordedDays > 0 && totalRecordedDays < targetDays)
      ? totalRecordedDays
      : (targetDays > 0 ? targetDays : 100);

    // ระเบียบ สพฐ.: คิดร้อยละจากวันมาเรียนจริง (present) เท่านั้น วันลา/ป่วย ไม่นับเป็นวันมาเรียน
    const percent = effectiveDenominator > 0
      ? Math.min(100, Math.round(((present / effectiveDenominator) * 100) * 10) / 10)
      : 100.0;
    const isEligible = percent >= 80;

    return {
      student: s,
      record: { ...r, present, leave, sick, absent, late },
      percent,
      isEligible
    };
  });

  const eligibleCount = evaluations.filter(e => e.isEligible).length;
  const inEligibleCount = evaluations.filter(e => !e.isEligible).length;
  const avgPercent = evaluations.length > 0 
    ? (evaluations.reduce((sum, e) => sum + e.percent, 0) / evaluations.length).toFixed(1)
    : '0.0';

  return (
    <>
      <div className={`space-y-6 ${(isGridPrintModalOpen || isCalendarPrintModalOpen || isSummaryPrintModalOpen) ? 'print:hidden' : ''}`}>
        {/* Top Banner with Sub-Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                ชั้น {classLevel} (ภาคเรียนที่ {semester})
              </span>
              <span className="text-xs text-slate-500 font-mono">
                วันเปิดเรียนตลอดปี 208 วันทำการ (เทอม 1: 102 วัน, เทอม 2: 106 วัน)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-1">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              ระบบบันทึกเวลาเรียนและปฏิทินการศึกษา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              โหมดลงเวลาเรียนรายเดือนเชื่อมโยงปฏิทินสถานศึกษาและเกณฑ์สิทธิ์สอบ สพฐ. 80% อัตโนมัติ
            </p>
          </div>

          {/* Sub-Tabs Switches (3 โหมด: ตารางรายเดือน, สรุปสะสม, ปฏิทิน) */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 flex-wrap">
            <button
              onClick={() => setSubTab('monthly_matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                subTab === 'monthly_matrix'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. ลงเวลารายเดือน (Matrix)</span>
            </button>

            <button
              onClick={() => setSubTab('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                subTab === 'summary'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>2. สรุปสะสม & สิทธิ์สอบ</span>
            </button>

            <button
              onClick={() => setSubTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                subTab === 'calendar'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-purple-600" />
              <span>3. ปฏิทินการศึกษา & วันหยุด</span>
            </button>
          </div>
        </div>

        {/* Global Attendance Stats Overview */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-emerald-700 font-medium">มีสิทธิ์เข้าสอบ (&ge; 80%)</div>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">{eligibleCount} คน</div>
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="bg-rose-50 rounded-xl p-3 border border-rose-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-rose-700 font-medium">หมดสิทธิ์สอบ (มส.)</div>
              <div className="text-xl font-bold text-rose-900 mt-0.5">{inEligibleCount} คน</div>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>

          <div className="bg-blue-50 rounded-xl p-3 border border-blue-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-blue-700 font-medium">ร้อยละการมาเรียนเฉลี่ย</div>
              <div className="text-xl font-bold text-blue-900 mt-0.5">{avgPercent}%</div>
            </div>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">วันทำการในเดือนนี้</div>
              <div className="text-xl font-bold text-slate-800 mt-0.5">{activeDays.length} วัน</div>
            </div>
            <CalendarDays className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: MONTHLY ATTENDANCE MATRIX (ลงเวลาเรียนรายเดือน ปพ.5) */}
      {/* ======================================================== */}
      {subTab === 'monthly_matrix' && (
        <div className="space-y-4">
          {/* Controls Bar: Month Selector & Quick Tool Stamp */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="font-bold text-xs sm:text-sm text-slate-700 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <span>เลือกเดือนที่ต้องการลงเวลา:</span>
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="font-bold text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 shadow-2xs focus:outline-hidden focus:border-emerald-500"
                >
                  <optgroup label="ภาคเรียนที่ 1 / 2569">
                    {MONTH_DEFINITIONS.filter(m => m.term === 1).map(m => {
                      const daysCount = getMonthSchoolDaysCount(m.key);
                      const noteText = m.note ? `${m.note} • ` : '';
                      return (
                        <option key={m.key} value={m.key}>
                          {m.name} ({noteText}{daysCount} วันทำการ)
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="ภาคเรียนที่ 2 / 2569">
                    {MONTH_DEFINITIONS.filter(m => m.term === 2).map(m => {
                      const daysCount = getMonthSchoolDaysCount(m.key);
                      const noteText = m.note ? `${m.note} • ` : '';
                      return (
                        <option key={m.key} value={m.key}>
                          {m.name} ({noteText}{daysCount} วันทำการ)
                        </option>
                      );
                    })}
                  </optgroup>
                </select>
              </div>

              {/* Quick Tool Stamp Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <span className="text-[11px] font-bold text-slate-500 px-1.5">โหมดจิ้มติ๊ก:</span>
                <button
                  type="button"
                  onClick={() => setStampTool('present')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    stampTool === 'present'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>✓ มา</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStampTool('leave')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    stampTool === 'leave'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>ล ลา</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStampTool('late')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    stampTool === 'late'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>ส สาย</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStampTool('absent')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    stampTool === 'absent'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>ข ขาด</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleMarkAllPresentInMonth}
                title={`บันทึกสถานะมาเรียนให้ทุกคนเฉพาะวันเปิดเรียนในเดือนนี้ (${activeDays.length} วันทำการ)`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-300 transition shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>✓ ติ๊กมาทั้งเดือน (เฉพาะวันเปิดเรียน {activeDays.length} วัน)</span>
              </button>
              {onManualSync && (
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={onManualSync}
                  title="ซิงค์ข้อมูลเวลาเรียนขึ้นระบบคลาวด์โรงเรียนทันที"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'กำลังซิงค์...' : '☁️ ซิงค์เวลาเรียน'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsGridPrintModalOpen(true)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>พิมพ์ ปพ.5 เดือนนี้ (A4 แนวนอน)</span>
              </button>
            </div>
          </div>

          {/* Legend / หมายเหตุสัญลักษณ์ตรงตาม Mockup */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-4 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="font-bold text-slate-700">สัญลักษณ์ ปพ.5:</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✓</span> มาเรียน
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-blue-100 text-blue-800 border border-blue-300">ล</span> ลากิจ/ป่วย
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-amber-100 text-amber-800 border border-amber-300">ส</span> มาสาย
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold bg-rose-100 text-rose-800 border border-rose-300">ข</span> ขาดเรียน
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-7 h-5 rounded flex items-center justify-center font-bold bg-slate-200 text-slate-500 text-[10px]">หยุด</span> วันหยุด
              </span>
            </div>
            <span className="text-slate-400 italic">* คลิกที่ช่องวันเพื่อจิ้มติ๊กตามโหมดที่เลือกด้านบน หรือคลิกซ้ำเพื่อหมุนเวียนสถานะ</span>
          </div>

          {/* Matrix Grid Table with 2-Tier Header & Sticky Columns */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 z-20 shadow-2xs border-b border-slate-200">
                  {/* Row 1: Day of Month (1..31) */}
                  <tr>
                    <th rowSpan={2} className="p-2 border-r border-slate-200 sticky left-0 bg-slate-100 z-30 w-12 min-w-12 max-w-12 text-center">ที่</th>
                    <th rowSpan={2} className="p-2 border-r border-slate-200 sticky left-12 bg-slate-100 z-30 w-16 min-w-16 max-w-16 text-center font-mono">รหัส</th>
                    <th rowSpan={2} className="p-2 text-left border-r-2 border-slate-300 sticky left-28 bg-slate-100 z-30 w-52 min-w-52 max-w-52 shadow-xs">ชื่อ - นามสกุล</th>
                    {monthDays.map(d => (
                      <th
                        key={d.day}
                        className={`p-1 border-r border-slate-200 min-w-[28px] w-7 font-mono font-bold ${
                          !d.isSchool
                            ? d.isWeekend ? 'bg-slate-200/80 text-slate-500' : 'bg-amber-100/70 text-amber-900'
                            : 'bg-white text-slate-800'
                        }`}
                        title={d.dateStr}
                      >
                        {d.day}
                      </th>
                    ))}
                    <th rowSpan={2} className="p-2 border-r border-slate-200 w-14 bg-emerald-50 text-emerald-900 font-bold">มา</th>
                    <th rowSpan={2} className="p-2 border-r border-slate-200 w-12 bg-blue-50 text-blue-900">ล</th>
                    <th rowSpan={2} className="p-2 border-r border-slate-200 w-12 bg-amber-50 text-amber-900">ส</th>
                    <th rowSpan={2} className="p-2 border-r border-slate-200 w-12 bg-rose-50 text-rose-900 font-bold">ข</th>
                  </tr>
                  {/* Row 2: Day of Week (จ, อ, พ, พฤ, ศ, ส, อา) */}
                  <tr className="text-[10px] bg-slate-100 border-b border-slate-300">
                    {monthDays.map(d => (
                      <th
                        key={'lbl-' + d.day}
                        className={`p-0.5 border-r border-slate-200 font-normal ${
                          !d.isSchool ? 'bg-slate-200/60 text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {d.dayLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => {
                    const studentRecord = records[s.studentId] || { present: 0, leave: 0, sick: 0, absent: 0, late: 0, dailyRecords: {} };
                    const daily = studentRecord.dailyRecords || {};

                    // คำนวณสรุปเฉพาะของเดือนที่เลือก (selectedMonth) เฉพาะวันเปิดเรียนจริงเท่านั้น
                    const schoolDaysInMonth = monthDays.filter(d => d.isSchool);
                    let monthPresent = 0;
                    let monthLeave = 0;
                    let monthLate = 0;
                    let monthAbsent = 0;

                    schoolDaysInMonth.forEach(d => {
                      const dateKey = `${selectedMonth}-${String(d.day).padStart(2, '0')}`;
                      const curStatus = daily[dateKey];
                      if (curStatus === 'present') monthPresent++;
                      else if (curStatus === 'leave' || curStatus === 'sick') monthLeave++;
                      else if (curStatus === 'late') monthLate++;
                      else if (curStatus === 'absent') monthAbsent++;
                    });

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-500 sticky left-0 bg-white z-10 w-12 min-w-12 max-w-12 text-center">{s.seq}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-400 sticky left-12 bg-white z-10 w-16 min-w-16 max-w-16 text-center">{s.studentId}</td>
                        <td className="p-2 text-left border-r-2 border-slate-300 font-bold text-slate-800 sticky left-28 bg-white z-10 shadow-xs whitespace-nowrap w-52 min-w-52 max-w-52 truncate">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>
                        {monthDays.map(d => {
                          if (!d.isSchool) {
                            return (
                              <td
                                key={d.day}
                                className={`p-1 border-r border-slate-100 text-[10px] font-medium select-none ${
                                  d.isWeekend ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600'
                                }`}
                              >
                                {d.isWeekend ? 'หยุด' : 'พิเศษ'}
                              </td>
                            );
                          }

                          const dateKey = `${selectedMonth}-${String(d.day).padStart(2, '0')}`;
                          const curStatus = daily[dateKey];

                          return (
                            <td key={d.day} className="p-0.5 border-r border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleMatrixCellClick(s.studentId, d.day)}
                                title={curStatus ? `คลิกเพื่อเปลี่ยนสถานะ (ปัจจุบัน: ${curStatus})` : 'ยังไม่ได้บันทึก (คลิกเพื่อลงเวลา)'}
                                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] mx-auto transition-transform active:scale-90 border shadow-2xs ${
                                  curStatus === 'present'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                    : curStatus === 'leave'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                                    : curStatus === 'sick'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                    : curStatus === 'late'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                                    : curStatus === 'absent'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                    : 'bg-white text-transparent border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                                }`}
                              >
                                {curStatus === 'present' ? '✓' : curStatus === 'leave' ? 'ล' : curStatus === 'sick' ? 'ป' : curStatus === 'late' ? 'ส' : curStatus === 'absent' ? 'ข' : ''}
                              </button>
                            </td>
                          );
                        })}
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-emerald-800 bg-emerald-50/40" title={`มาเรียน ${monthPresent} วัน (เฉพาะวันเปิดเรียน)`}>{monthPresent}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-blue-800">{monthLeave}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-amber-800">{monthLate}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-bold text-rose-700 bg-rose-50/30">{monthAbsent}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Summary Row at the Bottom */}
                <tfoot className="bg-slate-100 text-[11px] font-bold text-slate-700 border-t-2 border-slate-300 sticky bottom-0">
                  <tr>
                    <td colSpan={3} className="p-2 text-right border-r-2 border-slate-300 sticky left-0 bg-slate-100 z-10 w-[320px] min-w-[320px]">
                      รวมมาเรียน (คน/วัน):
                    </td>
                    {monthDays.map(d => {
                      if (!d.isSchool) {
                        return <td key={'foot-' + d.day} className="p-1 border-r border-slate-200 bg-slate-200/50 text-slate-400">-</td>;
                      }
                      const dateKey = `${selectedMonth}-${String(d.day).padStart(2, '0')}`;
                      let presentTotal = 0;
                      let hasAnyRecord = false;
                      students.forEach(s => {
                        const st = (records[s.studentId]?.dailyRecords || {})[dateKey];
                        if (st) hasAnyRecord = true;
                        if (st === 'present') presentTotal++;
                      });
                      return (
                        <td key={'foot-' + d.day} className="p-1 border-r border-slate-200 font-mono text-emerald-800 bg-emerald-50/50">
                          {hasAnyRecord ? presentTotal : '-'}
                        </td>
                      );
                    })}
                    {(() => {
                      const schoolDaysInMonth = monthDays.filter(d => d.isSchool);
                      let totalClassMonthPresent = 0;
                      let totalClassMonthLeave = 0;
                      let totalClassMonthLate = 0;
                      let totalClassMonthAbsent = 0;

                      students.forEach(s => {
                        const daily = records[s.studentId]?.dailyRecords || {};
                        schoolDaysInMonth.forEach(d => {
                          const dateKey = `${selectedMonth}-${String(d.day).padStart(2, '0')}`;
                          const curStatus = daily[dateKey];
                          if (curStatus === 'present') totalClassMonthPresent++;
                          else if (curStatus === 'leave' || curStatus === 'sick') totalClassMonthLeave++;
                          else if (curStatus === 'late') totalClassMonthLate++;
                          else if (curStatus === 'absent') totalClassMonthAbsent++;
                        });
                      });

                      return (
                        <>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-emerald-800 bg-emerald-100/60 text-center" title="ยอดรวมมาเรียนทั้งห้องในเดือนนี้">{totalClassMonthPresent}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-blue-800 bg-blue-100/60 text-center" title="ยอดรวมลาทั้งห้องในเดือนนี้">{totalClassMonthLeave}</td>
                          <td className="p-2 border-r border-slate-200 font-mono text-amber-800 bg-amber-100/60 text-center" title="ยอดรวมสายทั้งห้องในเดือนนี้">{totalClassMonthLate}</td>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-rose-800 bg-rose-100/60 text-center" title="ยอดรวมขาดทั้งห้องในเดือนนี้">{totalClassMonthAbsent}</td>
                        </>
                      );
                    })()}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: CUMULATIVE SUMMARY & EXAM ELIGIBILITY */}
      {/* ======================================================== */}
      {subTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>ตารางสรุปเวลาเรียนสะสมและสิทธิ์เข้าสอบ (สพฐ. 80%)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ประมวลผลแปรผันสัมพันธ์ตามการลงเวลารายวันรายเดือน และเกณฑ์วันเปิดเรียนจริง 100%
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-mono bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                เกณฑ์ขั้นต่ำ 80%: อย่างน้อย <strong>{Math.ceil(targetDays * 0.8)}</strong> จาก {targetDays} วันทำการ
              </span>
            </div>
          </div>

          {/* Scope Selector Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600 mr-1">ขอบเขตสรุป:</span>
              <button
                type="button"
                onClick={() => setSummaryScope('current_term')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  summaryScope === 'current_term'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⚡ ภาคเรียนปัจจุบัน (เทอม {semester})
              </button>
              <button
                type="button"
                onClick={() => setSummaryScope('term1')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  summaryScope === 'term1'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ภาคเรียนที่ 1 ({term1Days} วัน)
              </button>
              <button
                type="button"
                onClick={() => setSummaryScope('term2')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  summaryScope === 'term2'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ภาคเรียนที่ 2 ({term2Days} วัน)
              </button>
              <button
                type="button"
                onClick={() => setSummaryScope('year')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  summaryScope === 'year'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ตลอดทั้งปีการศึกษา ({fullYearDays} วัน)
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shrink-0">
                กำลังแสดง: {scopeLabel}
              </div>
              <button
                type="button"
                onClick={() => setIsSummaryPrintModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์รายงานสรุปสิทธิ์สอบ (A4)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 border-r border-slate-200 w-12">ที่</th>
                  <th className="p-2.5 border-r border-slate-200 w-20">รหัสนักเรียน</th>
                  <th className="p-2.5 text-left border-r border-slate-200">ชื่อ - สกุล</th>
                  <th className="p-2.5 border-r border-slate-200 w-20 bg-emerald-50 text-emerald-900 font-bold">มา (วัน)</th>
                  <th className="p-2.5 border-r border-slate-200 w-16 bg-blue-50 text-blue-900">ลา (วัน)</th>
                  <th className="p-2.5 border-r border-slate-200 w-16 bg-amber-50 text-amber-900">ป่วย (วัน)</th>
                  <th className="p-2.5 border-r border-slate-200 w-16 bg-rose-50 text-rose-900">ขาด (วัน)</th>
                  <th className="p-2.5 border-r border-slate-200 w-16 bg-purple-50 text-purple-900">สาย (ครั้ง)</th>
                  <th className="p-2.5 border-r border-slate-200 w-28 font-bold">ร้อยละการมา</th>
                  <th className="p-2.5 w-32 font-bold">ผลสิทธิ์เข้าสอบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evaluations.map((e) => (
                  <tr key={e.student.id} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-slate-500">{e.student.seq}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-slate-400">{e.student.studentId}</td>
                    <td className="p-2.5 text-left border-r border-slate-200 font-bold text-slate-800">
                      {e.student.prefix}{e.student.firstName} {e.student.lastName}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-emerald-800 bg-emerald-50/40">{e.record.present}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-blue-800">{e.record.leave}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-amber-800">{e.record.sick}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-rose-700 font-bold">{e.record.absent}</td>
                    <td className="p-2.5 border-r border-slate-200 font-mono text-purple-700">{e.record.late || 0}</td>
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50">
                      <div className="flex items-center justify-center gap-1.5 font-mono font-bold text-slate-700">
                        <span>{e.percent}%</span>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full ${e.isEligible ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${Math.min(100, e.percent)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5">
                      {e.isEligible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          มีสิทธิ์สอบ (ปพ.5)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          หมดสิทธิ์สอบ (มส.)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="p-2.5 text-center border-r border-slate-200">
                    รวม / เฉลี่ยทั้งห้อง ({evaluations.length} คน)
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-mono text-emerald-900 bg-emerald-100/50">
                    {evaluations.length > 0 ? (evaluations.reduce((sum, e) => sum + e.record.present, 0) / evaluations.length).toFixed(1) : 0}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-mono text-blue-900">
                    {evaluations.reduce((sum, e) => sum + e.record.leave, 0)}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-mono text-amber-900">
                    {evaluations.reduce((sum, e) => sum + e.record.sick, 0)}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-mono text-rose-900">
                    {evaluations.reduce((sum, e) => sum + e.record.absent, 0)}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-mono text-purple-900">
                    {evaluations.reduce((sum, e) => sum + (e.record.late || 0), 0)}
                  </td>
                  <td className="p-2.5 border-r border-slate-200 font-mono text-slate-900">
                    เฉลี่ย {avgPercent}%
                  </td>
                  <td className="p-2.5">
                    <span className="text-[11px] text-emerald-700">ผ่าน {eligibleCount}</span>
                    {inEligibleCount > 0 && <span className="text-[11px] text-rose-600 ml-1">| มส. {inEligibleCount}</span>}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: CALENDAR & HOLIDAYS MANAGEMENT */}
      {/* ======================================================== */}
      {subTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-600" />
                  <span>กำหนดการเปิด - ปิดภาคเรียน และปฏิทินการศึกษา ประจำปีการศึกษา 2569</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  โรงเรียนบ้านควนโคกยา • รวมวันทำการตลอดปีการศึกษา: <strong>208 วัน</strong> (ไม่น้อยกว่า 200 วันตามระเบียบ สพฐ.)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canConfigureCalendar ? (
                  <button
                    onClick={() => setShowAddHolidayForm(!showAddHolidayForm)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มวันหยุดพิเศษ</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>เฉพาะฝ่ายวิชาการที่ตั้งค่าได้</span>
                  </span>
                )}
                <button
                  onClick={() => setIsCalendarPrintModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>พิมพ์ปฏิทิน A4 (ตราครุฑ)</span>
                </button>
              </div>
            </div>

            {/* Academic Role Lock Notice if teacher is not academic/admin */}
            {!canConfigureCalendar && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>โหมดอ่านอย่างเดียว (Read-only):</strong> กำหนดวันเปิด-ปิดภาคเรียนและปฏิทินการศึกษา สามารถแก้ไขได้เฉพาะ <strong>ครูฝ่ายวิชาการ / นายทะเบียน (นางสาววัชรี พรหมช่วย)</strong> หรือผู้ดูแลระบบเท่านั้น
                </span>
              </div>
            )}

            {/* Interactive Term 1 and Term 2 Configuration Cards (เหมือน Mockup เป๊ะๆ) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* ภาคเรียนที่ 1 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-emerald-200" />
                    <h3 className="font-bold text-base">ภาคเรียนที่ 1 / 2569</h3>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                    {scheduleConfig.term1MonthlyDays.may + scheduleConfig.term1MonthlyDays.jun + scheduleConfig.term1MonthlyDays.jul + scheduleConfig.term1MonthlyDays.aug + scheduleConfig.term1MonthlyDays.sep + scheduleConfig.term1MonthlyDays.oct} วันทำการ
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* วันเปิด - ปิดภาคเรียนที่ 1 */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-medium">วันเปิดภาคเรียนที่ 1:</span>
                      <input
                        type="date"
                        value={scheduleConfig.term1StartDate}
                        disabled={!canConfigureCalendar}
                        onChange={(e) => handleScheduleChange('term1StartDate', e.target.value)}
                        className={`font-bold text-slate-800 bg-transparent w-full mt-1 border-b border-slate-300 focus:outline-none ${!canConfigureCalendar ? 'cursor-not-allowed opacity-80' : 'focus:border-emerald-500'}`}
                      />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-medium">วันปิดภาคเรียนที่ 1:</span>
                      <input
                        type="date"
                        value={scheduleConfig.term1EndDate}
                        disabled={!canConfigureCalendar}
                        onChange={(e) => handleScheduleChange('term1EndDate', e.target.value)}
                        className={`font-bold text-slate-800 bg-transparent w-full mt-1 border-b border-slate-300 focus:outline-none ${!canConfigureCalendar ? 'cursor-not-allowed opacity-80' : 'focus:border-emerald-500'}`}
                      />
                    </div>
                  </div>

                  {/* สัปดาห์สอบกลางภาค - ปลายภาค */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                      <span className="text-amber-700 font-semibold block">สัปดาห์สอบกลางภาค:</span>
                      <input
                        type="text"
                        value={scheduleConfig.term1Midterm}
                        disabled={!canConfigureCalendar}
                        onChange={(e) => handleScheduleChange('term1Midterm', e.target.value)}
                        className={`font-bold text-slate-800 bg-transparent w-full mt-0.5 border-b border-amber-300 focus:outline-none ${!canConfigureCalendar ? 'cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200 text-rose-900">
                      <span className="text-rose-700 font-semibold block">สัปดาห์สอบปลายภาค:</span>
                      <input
                        type="text"
                        value={scheduleConfig.term1Final}
                        disabled={!canConfigureCalendar}
                        onChange={(e) => handleScheduleChange('term1Final', e.target.value)}
                        className={`font-bold text-slate-800 bg-transparent w-full mt-0.5 border-b border-rose-300 focus:outline-none ${!canConfigureCalendar ? 'cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  {/* แจกแจงจำนวนวันทำการรายเดือน เทอม 1 */}
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>จำนวนวันทำการเรียนการสอนจริงรายเดือน</span>
                      <span className="text-[11px] text-slate-400 font-normal">แก้ไขตัวเลขได้อิสระ</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                      {[
                        { key: 'may', label: 'พ.ค.' },
                        { key: 'jun', label: 'มิ.ย.' },
                        { key: 'jul', label: 'ก.ค.' },
                        { key: 'aug', label: 'ส.ค.' },
                        { key: 'sep', label: 'ก.ย.' },
                        { key: 'oct', label: 'ต.ค.' }
                      ].map(m => (
                        <div key={m.key} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-slate-500 text-[11px]">{m.label}</div>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={(scheduleConfig.term1MonthlyDays as any)[m.key]}
                            disabled={!canConfigureCalendar}
                            onChange={(e) => handleMonthlyDaysChange('term1', m.key, Number(e.target.value))}
                            className="w-full text-center font-bold text-emerald-800 bg-white border border-slate-200 rounded mt-1 py-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ภาคเรียนที่ 2 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-blue-200" />
                    <h3 className="font-bold text-base">ภาคเรียนที่ 2 / 2569</h3>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                    {scheduleConfig.term2MonthlyDays.nov + scheduleConfig.term2MonthlyDays.dec + scheduleConfig.term2MonthlyDays.jan + scheduleConfig.term2MonthlyDays.feb + scheduleConfig.term2MonthlyDays.mar} วันทำการ
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* วันเปิด - ปิดภาคเรียนที่ 2 */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-medium">วันเปิดภาคเรียนที่ 2:</span>
                      <input
                        type="date"
                        value={scheduleConfig.term2StartDate}
                        disabled={!canConfigureCalendar}
                        onChange={(e) => handleScheduleChange('term2StartDate', e.target.value)}
                        className={`font-bold text-slate-800 bg-transparent w-full mt-1 border-b border-slate-300 focus:outline-none ${!canConfigureCalendar ? 'cursor-not-allowed opacity-80' : 'focus:border-blue-500'}`}
                      />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block font-medium">วันปิดภาคเรียนที่ 2:</span>
                      <input
                        type="date"
                        value={scheduleConfig.term2EndDate}
                        disabled={!canConfigureCalendar}
                        onChange={(e) => handleScheduleChange('term2EndDate', e.target.value)}
                        className={`font-bold text-slate-800 bg-transparent w-full mt-1 border-b border-slate-300 focus:outline-none ${!canConfigureCalendar ? 'cursor-not-allowed opacity-80' : 'focus:border-blue-500'}`}
                      />
                    </div>
                  </div>

                  {/* สัปดาห์สอบกลางภาค - ปลายภาค */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 text-amber-900">
                      <span className="text-amber-700 font-semibold block">สัปดาห์สอบกลางภาค:</span>
                      <input
                        type="text"
                        value={scheduleConfig.term2Midterm}
                        disabled={!canConfigureCalendar}
                        onChange={(e) => handleScheduleChange('term2Midterm', e.target.value)}
                        className={`font-bold text-slate-800 bg-transparent w-full mt-0.5 border-b border-amber-300 focus:outline-none ${!canConfigureCalendar ? 'cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200 text-rose-900">
                      <span className="text-rose-700 font-semibold block">สัปดาห์สอบปลายภาค:</span>
                      <input
                        type="text"
                        value={scheduleConfig.term2Final}
                        disabled={!canConfigureCalendar}
                        onChange={(e) => handleScheduleChange('term2Final', e.target.value)}
                        className={`font-bold text-slate-800 bg-transparent w-full mt-0.5 border-b border-rose-300 focus:outline-none ${!canConfigureCalendar ? 'cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>

                  {/* แจกแจงจำนวนวันทำการรายเดือน เทอม 2 */}
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>จำนวนวันทำการเรียนการสอนจริงรายเดือน</span>
                      <span className="text-[11px] text-slate-400 font-normal">แก้ไขตัวเลขได้อิสระ</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
                      {[
                        { key: 'nov', label: 'พ.ย.' },
                        { key: 'dec', label: 'ธ.ค.' },
                        { key: 'jan', label: 'ม.ค.' },
                        { key: 'feb', label: 'ก.พ.' },
                        { key: 'mar', label: 'มี.ค.' }
                      ].map(m => (
                        <div key={m.key} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="text-slate-500 text-[11px]">{m.label}</div>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={(scheduleConfig.term2MonthlyDays as any)[m.key]}
                            disabled={!canConfigureCalendar}
                            onChange={(e) => handleMonthlyDaysChange('term2', m.key, Number(e.target.value))}
                            className="w-full text-center font-bold text-blue-800 bg-white border border-slate-200 rounded mt-1 py-0.5"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Holiday Form */}
          {showAddHolidayForm && (
            <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-purple-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-700" />
                  <span>เพิ่มวันหยุดพิเศษ หรือวันหยุดสถานศึกษา</span>
                </h4>
                <button onClick={() => setShowAddHolidayForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">วันที่:</label>
                  <input
                    type="date"
                    value={newHolDate}
                    onChange={(e) => setNewHolDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ชื่อวันหยุด / กิจกรรม:</label>
                  <input
                    type="text"
                    placeholder="เช่น วันสถาปนาโรงเรียน"
                    value={newHolName}
                    onChange={(e) => setNewHolName(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ภาคเรียน:</label>
                  <select
                    value={newHolTerm}
                    onChange={(e) => setNewHolTerm(Number(e.target.value) as 1 | 2)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ประเภทวันหยุด:</label>
                  <select
                    value={newHolType}
                    onChange={(e) => setNewHolType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="วันหยุดสถานศึกษา">วันหยุดสถานศึกษา</option>
                    <option value="วันหยุดราชการ">วันหยุดราชการ</option>
                    <option value="กิจกรรมพิเศษ">กิจกรรมพิเศษ</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddHolidayForm(false)}
                  className="px-4 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveHoliday}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  บันทึกวันหยุด
                </button>
              </div>
            </div>
          )}

          {/* Holidays List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-800">รายการวันหยุดและกิจกรรมสำคัญประจำปีการศึกษา 2569</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200 w-12">ที่</th>
                    <th className="p-2.5 border-r border-slate-200 w-32">วัน เดือน ปี</th>
                    <th className="p-2.5 text-left border-r border-slate-200">ชื่อวันหยุด / กิจกรรม</th>
                    <th className="p-2.5 border-r border-slate-200 w-28">ภาคเรียน</th>
                    <th className="p-2.5 border-r border-slate-200 w-32">ประเภท</th>
                    <th className="p-2.5 w-16">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holidays.map((h, idx) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition">
                      <td className="p-2.5 border-r border-slate-200 font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{h.date}</td>
                      <td className="p-2.5 text-left border-r border-slate-200 text-slate-700">{h.name}</td>
                      <td className="p-2.5 border-r border-slate-200 font-mono">ภาคเรียนที่ {h.term}</td>
                      <td className="p-2.5 border-r border-slate-200">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          h.type === 'วันหยุดราชการ' ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {!h.isDefault && canConfigureCalendar && (
                          <button
                            onClick={() => handleDeleteHoliday(h.id)}
                            className="text-rose-600 hover:text-rose-800 p-1"
                            title="ลบวันหยุด"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: พิมพ์บัญชีเวลาเรียน ปพ.5 A4 แนวนอน (ตราครุฑ) */}
      {/* ======================================================== */}
      {isGridPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:z-auto print:bg-transparent print:p-0 print:m-0 print:overflow-visible print:block">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 overflow-hidden flex flex-col max-h-[95vh] print:shadow-none print:border-none print:rounded-none print:max-h-none print:max-w-none print:w-full print:m-0 print:p-0 print:overflow-visible print:bg-transparent">
            <div className="bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between no-print border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">พิมพ์บัญชีเวลาเรียน ปพ.5 ประจำเดือน (A4 แนวนอน)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์เอกสารนี้</span>
                </button>
                <button onClick={() => setIsGridPrintModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-200/60 flex justify-center print:p-0 print:bg-transparent print:overflow-visible print:block">
              <div className="bg-white w-full max-w-[297mm] min-h-[210mm] p-6 shadow-md border border-slate-200 text-slate-900 text-xs font-serif leading-relaxed print:shadow-none print:border-none print:p-6 print-page print-landscape">
                <div className="text-center space-y-1 mb-4">
                  <h1 className="text-sm font-bold">บัญชีลงเวลาเรียน ชั้น{classLevel} ประจำเดือน {THAI_MONTH_NAMES[selectedMonth] || selectedMonth}</h1>
                  <p className="text-[11px] text-slate-600">โรงเรียนบ้านควนโคกยา สพป.พัทลุง เขต 2 • รวมทั้งหมด {monthDays.length} วัน (วันทำการ {activeDays.length} วัน, วันหยุด {monthDays.length - activeDays.length} วัน)</p>
                </div>

                <table className="w-full text-center border-collapse border border-slate-400 text-[10px]">
                  <thead className="bg-slate-100 font-bold border-b border-slate-400">
                    <tr>
                      <th className="p-1 border-r border-slate-400 w-7">ที่</th>
                      <th className="p-1 text-left border-r border-slate-400 min-w-[120px]">ชื่อ - สกุล</th>
                      {monthDays.map(d => (
                        <th
                          key={d.day}
                          className={`p-0.5 border-r border-slate-400 min-w-[18px] font-mono text-[9px] ${
                            !d.isSchool ? (d.isWeekend ? 'bg-slate-200 text-slate-500' : 'bg-amber-100 text-amber-900') : ''
                          }`}
                          title={d.dateStr}
                        >
                          <div>{d.day}</div>
                          <div className="text-[7px] font-normal leading-none">{d.dayLabel}</div>
                        </th>
                      ))}
                      <th className="p-1 border-r border-slate-400 w-8 bg-emerald-50 text-emerald-900">มา</th>
                      <th className="p-1 border-r border-slate-400 w-7">ลา</th>
                      <th className="p-1 border-r border-slate-400 w-7">ป่วย</th>
                      <th className="p-1 w-7 text-rose-700">ขาด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {students.map((s) => {
                      const rec = records[s.studentId] || { present: 0, leave: 0, sick: 0, absent: 0, dailyRecords: {} };
                      const daily = rec.dailyRecords || {};

                      const schoolDaysInMonth = monthDays.filter(d => d.isSchool);
                      let monthPresent = 0;
                      let monthLeave = 0;
                      let monthSick = 0;
                      let monthAbsent = 0;

                      schoolDaysInMonth.forEach(d => {
                        const dateKey = `${selectedMonth}-${String(d.day).padStart(2, '0')}`;
                        const st = daily[dateKey];
                        if (st === 'present') monthPresent++;
                        else if (st === 'leave') monthLeave++;
                        else if (st === 'sick') monthSick++;
                        else if (st === 'absent') monthAbsent++;
                      });

                      return (
                        <tr key={s.id}>
                          <td className="p-1 border-r border-slate-300 font-mono">{s.seq}</td>
                          <td className="p-1 text-left border-r border-slate-300 font-medium">{s.prefix}{s.firstName} {s.lastName}</td>
                          {monthDays.map(d => {
                            if (!d.isSchool) {
                              return (
                                <td
                                  key={d.day}
                                  className={`p-0.5 border-r border-slate-300 font-mono text-[8px] select-none ${
                                    d.isWeekend ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-700 font-bold'
                                  }`}
                                  title={d.isWeekend ? 'วันหยุดสุดสัปดาห์' : 'วันหยุด'}
                                >
                                  {d.isWeekend ? '-' : 'หยุด'}
                                </td>
                              );
                            }
                            const dateKey = `${selectedMonth}-${String(d.day).padStart(2, '0')}`;
                            const st = daily[dateKey];
                            return (
                              <td key={d.day} className="p-0.5 border-r border-slate-300 font-mono">
                                {st === 'present' ? '✓' : st === 'leave' ? 'ล' : st === 'sick' ? 'ป' : st === 'late' ? 'ส' : st === 'absent' ? 'ข' : ''}
                              </td>
                            );
                          })}
                          <td className="p-1 border-r border-slate-300 font-mono font-bold text-emerald-800 bg-emerald-50/30">{monthPresent}</td>
                          <td className="p-1 border-r border-slate-300 font-mono">{monthLeave}</td>
                          <td className="p-1 border-r border-slate-300 font-mono">{monthSick}</td>
                          <td className="p-1 font-mono font-bold text-rose-700">{monthAbsent}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* ส่วนสรุปและการลงนามประจำเดือน */}
                <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-3 text-center text-[10px]">
                  <div>
                    <div>ลงชื่อ...................................................... ครูประจำชั้น</div>
                    <div className="font-semibold mt-0.5">({homeroomTeacher || 'ครูประจำชั้น'})</div>
                    <div className="text-slate-500 text-[9px]">ครูประจำชั้นประถมศึกษาปีที่ {classLevel.replace('ป.', '')}</div>
                  </div>
                  <div>
                    <div>ลงชื่อ...................................................... นายทะเบียน/วิชาการ</div>
                    <div className="font-semibold mt-0.5">({academicHeadName || 'นางสาววัชรี พรหมช่วย'})</div>
                    <div className="text-slate-500 text-[9px]">หัวหน้าฝ่ายวิชาการ</div>
                  </div>
                  <div>
                    <div>ลงชื่อ...................................................... ผู้อำนวยการโรงเรียน</div>
                    <div className="font-semibold mt-0.5">({directorName || 'นายเอกคณิต สิทธิศักดิ์'})</div>
                    <div className="text-slate-500 text-[9px]">ผู้อำนวยการโรงเรียน{schoolName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: พิมพ์ปฏิทินการศึกษา A4 ทางการ (ตราครุฑ) */}
      {/* ======================================================== */}
      {isCalendarPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:z-auto print:bg-transparent print:p-0 print:m-0 print:overflow-visible print:block">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[92vh] print:shadow-none print:border-none print:rounded-none print:max-h-none print:max-w-none print:w-full print:m-0 print:p-0 print:overflow-visible print:bg-transparent">
            <div className="bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between no-print border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">พิมพ์ปฏิทินการศึกษา A4 ทางการ (ตราครุฑ)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์เอกสารนี้</span>
                </button>
                <button onClick={() => setIsCalendarPrintModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-200/60 flex justify-center print:p-0 print:bg-transparent print:overflow-visible print:block">
              <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 shadow-md border border-slate-200 text-slate-900 text-xs font-serif leading-relaxed print:shadow-none print:border-none print:p-6 print-page print-portrait">
                <div className="text-center space-y-1 mb-6">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Garuda_Emblem_of_Thailand.svg" alt="ตราครุฑ" className="w-16 h-16 mx-auto mb-2 opacity-95" />
                  <h1 className="text-base font-bold">ปฏิทินการศึกษา ประจำปีการศึกษา ๒๕๖๙</h1>
                  <h2 className="text-sm font-bold text-slate-800">โรงเรียนบ้านควนโคกยา</h2>
                  <p className="text-xs text-slate-600">สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒</p>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">(รวมเวลาเรียนทั้งสิ้น ๒๐๘ วันทำการ ตามระเบียบกระทรวงศึกษาธิการ)</p>
                </div>

                <div className="space-y-4">
                  <table className="w-full text-center border-collapse border border-slate-400 text-[11px]">
                    <thead className="bg-slate-100 font-bold border-b border-slate-400">
                      <tr>
                        <th className="p-2 border-r border-slate-400 w-28">ภาคเรียน</th>
                        <th className="p-2 border-r border-slate-400">วันเปิด - ปิดภาคเรียน</th>
                        <th className="p-2 border-r border-slate-400">สอบกลางภาค</th>
                        <th className="p-2 border-r border-slate-400">สอบปลายภาค</th>
                        <th className="p-2 w-24">วันทำการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      <tr>
                        <td className="p-2 border-r border-slate-300 font-bold">ภาคเรียนที่ ๑</td>
                        <td className="p-2 border-r border-slate-300">๑๖ พ.ค. ๒๕๖๙ – ๑๐ ต.ค. ๒๕๖๙</td>
                        <td className="p-2 border-r border-slate-300">๒๕ – ๒๙ ก.ค. ๒๕๖๙</td>
                        <td className="p-2 border-r border-slate-300">๓ – ๗ ต.ค. ๒๕๖๙</td>
                        <td className="p-2 font-bold font-mono">๑๐๒ วัน</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-300 font-bold">ภาคเรียนที่ ๒</td>
                        <td className="p-2 border-r border-slate-300">๑ พ.ย. ๒๕๖๙ – ๓๑ มี.ค. ๒๕๗๐</td>
                        <td className="p-2 border-r border-slate-300">๑๑ – ๑๕ ม.ค. ๒๕๗๐</td>
                        <td className="p-2 border-r border-slate-300">๒๒ – ๒๖ มี.ค. ๒๕๗๐</td>
                        <td className="p-2 font-bold font-mono">๑๐๖ วัน</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: พิมพ์แบบรายงานสรุปสถิติเวลาเรียนและสิทธิ์เข้าสอบ (A4 ทางการ) */}
      {/* ======================================================== */}
      {isSummaryPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:z-auto print:bg-transparent print:p-0 print:m-0 print:overflow-visible print:block">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 overflow-hidden flex flex-col max-h-[95vh] print:shadow-none print:border-none print:rounded-none print:max-h-none print:max-w-none print:w-full print:m-0 print:p-0 print:overflow-visible print:bg-transparent">
            {/* Header Toolbar (hidden on print) */}
            <div className="bg-slate-800 text-white px-6 py-3.5 flex items-center justify-between no-print border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">พิมพ์แบบรายงานสรุปสถิติเวลาเรียนและสิทธิ์เข้าสอบ (A4 แนวตั้ง)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์เอกสารนี้</span>
                </button>
                <button 
                  onClick={() => setIsSummaryPrintModalOpen(false)} 
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Printable A4 Portrait) */}
            <div className="p-6 overflow-y-auto bg-slate-200/60 flex justify-center print:p-0 print:bg-transparent print:overflow-visible print:block">
              <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-6 shadow-md border border-slate-200 text-slate-900 text-xs font-serif leading-relaxed print:shadow-none print:border-none print:p-4 print-page print-portrait flex flex-col justify-between">
                <div>
                  {/* Official Header */}
                  <div className="text-center space-y-1 mb-3 border-b-2 border-slate-900 pb-2">
                    <img 
                      src="/garuda.png" 
                      alt="ตราครุฑ" 
                      className="w-12 h-12 mx-auto mb-1 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <h1 className="text-sm sm:text-base font-bold text-slate-900">
                      แบบรายงานสรุปสถิติเวลาเรียนและผลการตัดสินสิทธิ์เข้าสอบปลายภาคเรียน
                    </h1>
                    <h2 className="text-xs font-bold text-slate-700">
                      โรงเรียน{schoolName || 'บ้านควนโคกยา'} • ระดับชั้น{classLevel} • {scopeLabel} • ประจำปีการศึกษา ๒๕๖๙
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-slate-600">
                      สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒ • วันเปิดทำการเรียนการสอนรวม {targetDays} วัน (เกณฑ์ขั้นต่ำ ๘๐% คือไม่น้อยกว่า {Math.ceil(targetDays * 0.8)} วันทำการ)
                    </p>
                  </div>

                  {/* Summary Table */}
                  <table className="w-full text-center border-collapse border border-slate-400 text-[9.5px]">
                    <thead className="bg-slate-100 font-bold border-b border-slate-400">
                      <tr>
                        <th className="p-1 border-r border-slate-400 w-7">ที่</th>
                        <th className="p-1 border-r border-slate-400 w-14 font-mono">รหัส</th>
                        <th className="p-1 text-left px-1.5 border-r border-slate-400">ชื่อ - สกุล</th>
                        <th className="p-1 border-r border-slate-400 w-11 bg-emerald-50 text-emerald-900">มา</th>
                        <th className="p-1 border-r border-slate-400 w-9 bg-blue-50 text-blue-900">ลา</th>
                        <th className="p-1 border-r border-slate-400 w-9 bg-amber-50 text-amber-900">ป่วย</th>
                        <th className="p-1 border-r border-slate-400 w-9 bg-rose-50 text-rose-900">ขาด</th>
                        <th className="p-1 border-r border-slate-400 w-9 bg-purple-50 text-purple-900">สาย</th>
                        <th className="p-1 border-r border-slate-400 w-11 bg-slate-200 text-slate-900">รวม</th>
                        <th className="p-1 border-r border-slate-400 w-12 bg-blue-100 text-blue-950 font-bold">ร้อยละ</th>
                        <th className="p-1 w-24 font-bold">ผลสิทธิ์สอบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {evaluations.map((e) => {
                        const totalDays = (e.record.present ?? 0) + (e.record.leave ?? 0) + (e.record.sick ?? 0) + (e.record.absent ?? 0);
                        return (
                          <tr key={e.student.id} className="hover:bg-slate-50">
                            <td className="p-1 border-r border-slate-300 font-mono">{e.student.seq}</td>
                            <td className="p-1 border-r border-slate-300 font-mono text-slate-500">{e.student.studentId}</td>
                            <td className="p-1 text-left px-2 border-r border-slate-300 font-medium">
                              {e.student.prefix}{e.student.firstName} {e.student.lastName}
                            </td>
                            <td className="p-1 border-r border-slate-300 font-mono font-bold text-emerald-800 bg-emerald-50/30">
                              {e.record.present}
                            </td>
                            <td className="p-1 border-r border-slate-300 font-mono">{e.record.leave}</td>
                            <td className="p-1 border-r border-slate-300 font-mono">{e.record.sick}</td>
                            <td className="p-1 border-r border-slate-300 font-mono text-rose-700 font-bold">{e.record.absent}</td>
                            <td className="p-1 border-r border-slate-300 font-mono text-purple-700">{e.record.late || 0}</td>
                            <td className="p-1 border-r border-slate-300 font-mono font-bold bg-slate-100">{totalDays}</td>
                            <td className={`p-1 border-r border-slate-300 font-mono font-bold ${e.isEligible ? 'text-blue-900' : 'text-rose-700'}`}>
                              {e.percent}%
                            </td>
                            <td className={`p-1 font-bold ${e.isEligible ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {e.isEligible ? 'มีสิทธิ์สอบ (ปพ.5)' : 'หมดสิทธิ์สอบ (มส.)'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <tr>
                        <td colSpan={3} className="p-1 text-center border-r border-slate-300">
                          รวม / เฉลี่ยทั้งห้อง ({evaluations.length} คน)
                        </td>
                        <td className="p-1 border-r border-slate-300 font-mono text-emerald-900">
                          {evaluations.length > 0 ? (evaluations.reduce((sum, e) => sum + e.record.present, 0) / evaluations.length).toFixed(1) : 0}
                        </td>
                        <td className="p-1 border-r border-slate-300 font-mono text-blue-900">
                          {evaluations.reduce((sum, e) => sum + e.record.leave, 0)}
                        </td>
                        <td className="p-1 border-r border-slate-300 font-mono text-amber-900">
                          {evaluations.reduce((sum, e) => sum + e.record.sick, 0)}
                        </td>
                        <td className="p-1 border-r border-slate-300 font-mono text-rose-900">
                          {evaluations.reduce((sum, e) => sum + e.record.absent, 0)}
                        </td>
                        <td className="p-1 border-r border-slate-300 font-mono text-purple-900">
                          {evaluations.reduce((sum, e) => sum + (e.record.late || 0), 0)}
                        </td>
                        <td className="p-1 border-r border-slate-300 font-mono font-bold">
                          {targetDays}
                        </td>
                        <td className="p-1 border-r border-slate-300 font-mono text-slate-900">
                          เฉลี่ย {avgPercent}%
                        </td>
                        <td className="p-1 font-bold">
                          <span className="text-emerald-700">มีสิทธิ์ {eligibleCount}</span>
                          {inEligibleCount > 0 && <span className="text-rose-700 ml-1">| มส. {inEligibleCount}</span>}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Summary Notes */}
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded text-[11px] text-slate-700">
                    <div className="font-bold text-slate-900 mb-1">สรุปผลการพิจารณาสิทธิ์เข้าสอบ:</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p>• นักเรียนทั้งหมดจำนวน <strong>{evaluations.length} คน</strong></p>
                        <p>• มีเวลาเรียนครบตามเกณฑ์ร้อยละ ๘๐ (มีสิทธิ์สอบ) จำนวน <strong>{eligibleCount} คน</strong> (คิดเป็นร้อยละ {((eligibleCount / (evaluations.length || 1)) * 100).toFixed(1)}%)</p>
                      </div>
                      <div>
                        <p>• มีเวลาเรียนไม่ครบตามเกณฑ์ (หมดสิทธิ์สอบ) จำนวน <strong>{inEligibleCount} คน</strong> (คิดเป็นร้อยละ {((inEligibleCount / (evaluations.length || 1)) * 100).toFixed(1)}%)</p>
                        <p>• ร้อยละการมาเรียนเฉลี่ยทั้งชั้นเรียน: <strong>{avgPercent}%</strong></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures 3 Blocks */}
                <div className="mt-6 pt-4 border-t border-slate-400 grid grid-cols-3 text-center text-xs">
                  <div>
                    <div className="h-8"></div>
                    <div>ลงชื่อ......................................................</div>
                    <div className="font-semibold mt-1">({homeroomTeacher || 'ครูประจำชั้น'})</div>
                    <div className="text-slate-600 text-[10px]">ครูประจำชั้นประถมศึกษาปีที่ {classLevel.replace('ป.', '')}</div>
                  </div>
                  <div>
                    <div className="h-8"></div>
                    <div>ลงชื่อ......................................................</div>
                    <div className="font-semibold mt-1">({academicHeadName || 'นางสาววัชรี พรหมช่วย'})</div>
                    <div className="text-slate-600 text-[10px]">หัวหน้าฝ่ายวิชาการ / นายทะเบียน</div>
                  </div>
                  <div>
                    <div className="h-8"></div>
                    <div>ลงชื่อ......................................................</div>
                    <div className="font-semibold mt-1">({directorName || 'นายเอกคณิต สิทธิศักดิ์'})</div>
                    <div className="text-slate-600 text-[10px]">ผู้อำนวยการโรงเรียน{schoolName || 'บ้านควนโคกยา'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
