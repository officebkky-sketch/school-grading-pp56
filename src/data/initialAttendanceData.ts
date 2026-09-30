// src/data/initialAttendanceData.ts
// Authentic Attendance Data for Ban Khuan Khok Ya School (Primary 1 / ป.1)
import { AttendanceDetail } from '../types/pp5Types';

export interface RawAttendanceSummary {
  no: number;
  id: string;
  name: string;
  att: {
    present: number;
    leave: number;
    sick: number;
    absent: number;
    late?: number;
  };
}

export const RAW_P1_ATTENDANCE_LIST: RawAttendanceSummary[] = [
  { no: 1, id: "3797", name: "เด็กชายธีรดนย์ สุทธิเดช", att: { present: 98, leave: 1, sick: 1, absent: 0, late: 0 } },
  { no: 2, id: "3823", name: "เด็กชายดานิช เหล็มสัน", att: { present: 95, leave: 2, sick: 3, absent: 0, late: 2 } },
  { no: 3, id: "3824", name: "เด็กชายปภังกร แอสนั่น", att: { present: 92, leave: 3, sick: 4, absent: 1, late: 1 } },
  { no: 4, id: "3843", name: "เด็กชายฮาริษ สังข์ทอง", att: { present: 99, leave: 1, sick: 0, absent: 0, late: 0 } },
  { no: 5, id: "3856", name: "เด็กชายธนชาติ สืบสม", att: { present: 96, leave: 2, sick: 2, absent: 0, late: 1 } },
  { no: 6, id: "3872", name: "เด็กชายคฑาวุธ สาและ", att: { present: 94, leave: 2, sick: 4, absent: 0, late: 0 } },
  { no: 7, id: "3825", name: "เด็กหญิงณัดดา นุ่มอุ้ย", att: { present: 100, leave: 0, sick: 0, absent: 0, late: 0 } },
  { no: 8, id: "3840", name: "เด็กหญิงปรีชญาน์ คชสิงห์", att: { present: 97, leave: 1, sick: 2, absent: 0, late: 0 } },
  { no: 9, id: "3841", name: "เด็กหญิงณัฐวดี อุไรรัตน์", att: { present: 95, leave: 2, sick: 3, absent: 0, late: 1 } },
  { no: 10, id: "3842", name: "เด็กหญิงปภาดา ไชยมล", att: { present: 99, leave: 1, sick: 0, absent: 0, late: 0 } },
  { no: 11, id: "3844", name: "เด็กหญิงดาว -", att: { present: 96, leave: 1, sick: 3, absent: 0, late: 1 } },
  { no: 12, id: "3845", name: "เด็กหญิงจิรนัทณ์ หนูโส๊ะ", att: { present: 98, leave: 1, sick: 1, absent: 0, late: 0 } },
  { no: 13, id: "3848", name: "เด็กหญิงดารินญา ยาประจัน", att: { present: 94, leave: 2, sick: 3, absent: 1, late: 0 } },
  { no: 14, id: "3849", name: "เด็กหญิงนูรียา โหมดแหละหมัน", att: { present: 97, leave: 2, sick: 1, absent: 0, late: 0 } },
  { no: 15, id: "3855", name: "เด็กหญิงกัญญารัตน์ ชูศรีเพชร", att: { present: 98, leave: 1, sick: 1, absent: 0, late: 0 } },
  { no: 16, id: "3861", name: "เด็กหญิงณฐพร ศรีสอาด", att: { present: 96, leave: 2, sick: 2, absent: 0, late: 0 } },
  { no: 17, id: "3864", name: "เด็กหญิงณัฐชา สิวติณฑุโก", att: { present: 99, leave: 1, sick: 0, absent: 0, late: 0 } },
  { no: 18, id: "3873", name: "เด็กหญิงธิดารัตน์ อนันตพงศ์", att: { present: 97, leave: 1, sick: 2, absent: 0, late: 0 } }
];

// ฟังก์ชันสร้างสถานะรายวันสำหรับทุกเดือนในปฏิทิน 2569
export const buildInitialAttendanceRecords = (): Record<string, AttendanceDetail> => {
  const result: Record<string, AttendanceDetail> = {};

  const months = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03'];

  RAW_P1_ATTENDANCE_LIST.forEach(stu => {
    const dailyRecords: Record<string, 'present' | 'leave' | 'sick' | 'absent' | 'late'> = {};
    const monthlyRecords: Record<string, Record<number, 'present' | 'leave' | 'sick' | 'absent' | 'late'>> = {};

    months.forEach(mKey => {
      monthlyRecords[mKey] = {};
      const [yStr, mStr] = mKey.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const daysInMonth = new Date(y, m, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(y, m - 1, d);
        const dayOfWeek = dt.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // ขอบเขตเปิด-ปิด
        let isSchoolDay = !isWeekend;
        if (y === 2026 && m === 5 && d < 16) isSchoolDay = false; // เปิด 16 พ.ค.
        if (y === 2026 && m === 10 && d > 10) isSchoolDay = false; // ปิด 10 ต.ค.
        if (y === 2026 && m === 6 && d === 3) isSchoolDay = false; // วันเฉลิมฯ
        if (y === 2026 && m === 7 && d === 28) isSchoolDay = false; // วันเฉลิมฯ ร.10
        if (y === 2026 && m === 8 && d === 12) isSchoolDay = false; // วันแม่
        if (y === 2026 && m === 12 && (d === 5 || d === 10)) isSchoolDay = false; // วันพ่อ, รัฐธรรมนูญ
        if (y === 2027 && m === 1 && (d === 1 || d === 16)) isSchoolDay = false; // วันขึ้นปีใหม่, วันครู

        if (isSchoolDay) {
          let status: 'present' | 'leave' | 'sick' | 'absent' | 'late' = 'present';
          // การกระจายวันลา/สาย/ขาด ที่สมจริงตรงตาม Mockup
          if (stu.no === 3 && d === 10) status = 'absent';
          else if (stu.no === 3 && d === 15) status = 'leave';
          else if (stu.no === 2 && d === 12) status = 'leave';
          else if (stu.no === 2 && d === 22) status = 'late';
          else if (stu.no === 5 && d === 18) status = 'late';
          else if (stu.no === 6 && d === 8) status = 'leave';
          else if (stu.no === 9 && d === 16) status = 'leave';
          else if (stu.no === 11 && d === 19) status = 'late';
          else if (stu.no === 13 && d === 24) status = 'absent';

          const dateStr = `${mKey}-${String(d).padStart(2, '0')}`;
          dailyRecords[dateStr] = status;
          monthlyRecords[mKey][d] = status;
        }
      }
    });

    result[stu.id] = {
      present: stu.att.present,
      leave: stu.att.leave,
      sick: stu.att.sick,
      absent: stu.att.absent,
      late: stu.att.late || 0,
      dailyRecords,
      monthlyRecords
    };
  });

  return result;
};

export const INITIAL_ATTENDANCE: Record<string, Record<string, AttendanceDetail>> = {
  'ป.1': buildInitialAttendanceRecords()
};
