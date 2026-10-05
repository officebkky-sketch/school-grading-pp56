import React, { useState, useEffect } from 'react';
import { StudentProfile, HolisticDetail, LearnerActivityRecord } from '../types/pp5Types';
import { INITIAL_HOLISTIC } from '../data/initialHolisticData';
import { Award, Sparkles, CheckCircle, Compass, Users, BookOpen, CheckCircle2, Printer, X } from 'lucide-react';

interface Props {
  students: StudentProfile[];
  classLevel: string;
  holisticData?: Record<string, HolisticDetail>;
  onUpdateHolistic?: (studentId: string, data: HolisticDetail) => void;
  onBulkUpdateHolistic?: (records: Record<string, HolisticDetail>) => void;
  clubName?: string;
  onUpdateClubName?: (cls: string, name: string) => void;
  schoolName?: string;
  academicYear?: string;
  homeroomTeacher?: string;
  directorName?: string;
  academicHeadName?: string;
  logoUrl?: string;
}

const calculateLevel = (avg: number, hasZero: boolean): { score: number; label: 'ดีเยี่ยม' | 'ดี' | 'ผ่าน' | 'ไม่ผ่าน'; badgeClass: string } => {
  if (hasZero) return { score: 1, label: 'ผ่าน', badgeClass: 'bg-rose-100 text-rose-800 font-bold border border-rose-200' };
  if (avg >= 2.50) return { score: 3, label: 'ดีเยี่ยม', badgeClass: 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' };
  if (avg >= 1.50) return { score: 2, label: 'ดี', badgeClass: 'bg-blue-100 text-blue-800 font-bold border border-blue-300' };
  if (avg >= 1.00) return { score: 1, label: 'ผ่าน', badgeClass: 'bg-amber-100 text-amber-800 font-bold border border-amber-300' };
  return { score: 0, label: 'ไม่ผ่าน', badgeClass: 'bg-rose-100 text-rose-800 font-bold border border-rose-300' };
};

export const HolisticAssessmentTab: React.FC<Props> = ({ 
  students, 
  classLevel,
  holisticData,
  onUpdateHolistic,
  onBulkUpdateHolistic,
  clubName = '',
  onUpdateClubName,
  schoolName = 'บ้านควนโคกยา',
  academicYear = '2569',
  homeroomTeacher = '',
  directorName = 'นายเอกคณิต สิทธิศักดิ์',
  academicHeadName = 'นางสาววัชรี พรหมช่วย',
  logoUrl
}) => {
  // 3 Sub-tabs: 'attributes' (คุณลักษณะ 8 ข้อ) | 'reading' (อ่าน คิดวิเคราะห์ 5 ข้อ) | 'activities' (กิจกรรมพัฒนาผู้เรียน 4 กิจกรรม)
  const [subTab, setSubTab] = useState<'attributes' | 'reading' | 'activities'>('attributes');

  // State สำหรับ Modal จัดพิมพ์เอกสาร A4 แนวนอน
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printSection, setPrintSection] = useState<'attributes' | 'reading' | 'activities' | 'all'>('attributes');

  const [currentClubName, setCurrentClubName] = useState<string>(() => {
    return clubName || (classLevel === 'ป.6' ? 'ชุมนุมสื่อ AI สร้างสรรค์' : 'ชุมนุมศิลป์สร้างสรรค์');
  });

  useEffect(() => {
    if (clubName) setCurrentClubName(clubName);
  }, [clubName]);

  const defaultActivityRecord = (cName?: string): LearnerActivityRecord => ({
    guidanceHours: 40,
    guidanceResult: 'ผ',
    scoutHours: 40,
    scoutResult: 'ผ',
    clubName: cName || currentClubName,
    clubHours: 30,
    clubResult: 'ผ',
    publicServiceHours: 10,
    publicServiceResult: 'ผ'
  });

  const [evaluations, setEvaluations] = useState<Record<string, HolisticDetail>>(() => {
    if (holisticData && Object.keys(holisticData).length > 0) {
      return holisticData;
    }
    if (classLevel === 'ป.1' && INITIAL_HOLISTIC['ป.1']) {
      return INITIAL_HOLISTIC['ป.1'];
    }
    const init: Record<string, HolisticDetail> = {};
    students.forEach(s => {
      init[s.studentId] = {
        traitsScore: 3,
        competencyScore: 3,
        readingWriting: 'ดีเยี่ยม',
        activityPassed: true,
        attributeScores: [3, 3, 3, 3, 3, 3, 3, 3],
        readingScores: [3, 3, 3, 3, 3],
        activities: defaultActivityRecord()
      };
    });
    return init;
  });

  useEffect(() => {
    if (holisticData && Object.keys(holisticData).length > 0) {
      setEvaluations(holisticData);
    } else if (classLevel === 'ป.1' && INITIAL_HOLISTIC['ป.1']) {
      setEvaluations(INITIAL_HOLISTIC['ป.1']);
    }
  }, [holisticData, classLevel]);

  // จัดการคะแนนคุณลักษณะ 8 ข้อ
  const handleAttributeScoreChange = (studentId: string, attrIdx: number, val: number) => {
    const cur = evaluations[studentId] || {
      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
      attributeScores: [3, 3, 3, 3, 3, 3, 3, 3],
      readingScores: [3, 3, 3, 3, 3],
      activities: defaultActivityRecord()
    };
    const scores = cur.attributeScores ? [...cur.attributeScores] : [3, 3, 3, 3, 3, 3, 3, 3];
    scores[attrIdx] = val;

    const total = scores.reduce((a, b) => a + b, 0);
    const avg = total / 8;
    const lvl = calculateLevel(avg, scores.includes(0));

    const updated: HolisticDetail = {
      ...cur,
      attributeScores: scores,
      traitsScore: lvl.score
    };

    setEvaluations(prev => ({ ...prev, [studentId]: updated }));
    if (onUpdateHolistic) onUpdateHolistic(studentId, updated);
  };

  // ปุ่มลัด คุณลักษณะ 8 ข้อ (Batch Set)
  const handleBatchSetAttributes = (score: number) => {
    const updated: Record<string, HolisticDetail> = {};
    students.forEach(s => {
      const cur = evaluations[s.studentId] || {
        traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
        readingScores: [3, 3, 3, 3, 3],
        activities: defaultActivityRecord()
      };
      const scores = [score, score, score, score, score, score, score, score];
      const lvl = calculateLevel(score, score === 0);
      updated[s.studentId] = {
        ...cur,
        attributeScores: scores,
        traitsScore: lvl.score
      };
    });
    setEvaluations(updated);
    if (onBulkUpdateHolistic) onBulkUpdateHolistic(updated);
  };

  // จัดการคะแนนอ่าน คิดวิเคราะห์ 5 ข้อ
  const handleReadingScoreChange = (studentId: string, readIdx: number, val: number) => {
    const cur = evaluations[studentId] || {
      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
      attributeScores: [3, 3, 3, 3, 3, 3, 3, 3],
      readingScores: [3, 3, 3, 3, 3],
      activities: defaultActivityRecord()
    };
    const scores = cur.readingScores ? [...cur.readingScores] : [3, 3, 3, 3, 3];
    scores[readIdx] = val;

    const total = scores.reduce((a, b) => a + b, 0);
    const avg = total / 5;
    const lvl = calculateLevel(avg, scores.includes(0));

    const updated: HolisticDetail = {
      ...cur,
      readingScores: scores,
      readingWriting: lvl.label
    };

    setEvaluations(prev => ({ ...prev, [studentId]: updated }));
    if (onUpdateHolistic) onUpdateHolistic(studentId, updated);
  };

  // ปุ่มลัด อ่านคิดวิเคราะห์ (Batch Set)
  const handleBatchSetReading = (score: number) => {
    const updated: Record<string, HolisticDetail> = {};
    students.forEach(s => {
      const cur = evaluations[s.studentId] || {
        traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
        attributeScores: [3, 3, 3, 3, 3, 3, 3, 3],
        activities: defaultActivityRecord()
      };
      const scores = [score, score, score, score, score];
      const lvl = calculateLevel(score, score === 0);
      updated[s.studentId] = {
        ...cur,
        readingScores: scores,
        readingWriting: lvl.label
      };
    });
    setEvaluations(updated);
    if (onBulkUpdateHolistic) onBulkUpdateHolistic(updated);
  };

  // จัดการกิจกรรมพัฒนาผู้เรียน
  const handleActivityItemChange = (studentId: string, field: keyof LearnerActivityRecord, val: any) => {
    const cur = evaluations[studentId] || {
      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
      attributeScores: [3, 3, 3, 3, 3, 3, 3, 3],
      readingScores: [3, 3, 3, 3, 3],
      activities: defaultActivityRecord()
    };
    const act = cur.activities || defaultActivityRecord();
    const updatedAct = { ...act, [field]: val };

    const isAllPass = 
      (updatedAct.guidanceResult ?? 'ผ') === 'ผ' &&
      (updatedAct.scoutResult ?? 'ผ') === 'ผ' &&
      (updatedAct.clubResult ?? 'ผ') === 'ผ' &&
      (updatedAct.publicServiceResult ?? 'ผ') === 'ผ';

    const updated: HolisticDetail = {
      ...cur,
      activityPassed: isAllPass,
      activities: updatedAct
    };

    setEvaluations(prev => ({ ...prev, [studentId]: updated }));
    if (onUpdateHolistic) onUpdateHolistic(studentId, updated);
  };

  // ปุ่มลัดกิจกรรมพัฒนาผู้เรียน ผ่านทั้งหมด
  const handleBulkPassActivities = () => {
    const updated: Record<string, HolisticDetail> = {};
    students.forEach(s => {
      const cur = evaluations[s.studentId] || {
        traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
        attributeScores: [3, 3, 3, 3, 3, 3, 3, 3],
        readingScores: [3, 3, 3, 3, 3]
      };
      updated[s.studentId] = {
        ...cur,
        activityPassed: true,
        activities: {
          guidanceHours: 40,
          guidanceResult: 'ผ',
          scoutHours: 40,
          scoutResult: 'ผ',
          clubName: currentClubName,
          clubHours: 30,
          clubResult: 'ผ',
          publicServiceHours: 10,
          publicServiceResult: 'ผ'
        }
      };
    });
    setEvaluations(updated);
    if (onBulkUpdateHolistic) onBulkUpdateHolistic(updated);
  };

  const handleSaveClubName = (name: string) => {
    setCurrentClubName(name);
    if (onUpdateClubName) {
      onUpdateClubName(classLevel, name);
    }
  };

  return (
    <>
      <div className={`space-y-6 ${isPrintModalOpen ? 'print:hidden' : ''}`}>
        {/* Top Banner & Sub-Tabs Navigation (3 แท็บตาม Mockup เป๊ะๆ) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                ชั้น {classLevel}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ที่มาของผลการตัดสิน ปพ.5 และ เล่มรายงาน SAR (นักเรียน {students.length} คน)
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-1">
              <Award className="w-5 h-5 text-emerald-600" />
              การประเมินคุณภาพผู้เรียน & กิจกรรมพัฒนาผู้เรียน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คุณลักษณะอันพึงประสงค์ 8 ข้อ • อ่านคิดวิเคราะห์ 5 ข้อ • กิจกรรมพัฒนาผู้เรียน 4 กิจกรรม (120 ชม./ปี)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 flex-wrap">
              <button
                onClick={() => setSubTab('attributes')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  subTab === 'attributes'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. คุณลักษณะ 8 ข้อ</span>
              </button>

              <button
                onClick={() => setSubTab('reading')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  subTab === 'reading'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. อ่าน คิดวิเคราะห์ 5 ข้อ</span>
              </button>

              <button
                onClick={() => setSubTab('activities')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  subTab === 'activities'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-amber-600" />
                <span>3. กิจกรรมพัฒนาผู้เรียน</span>
              </button>
            </div>

            {/* ปุ่มเปิด Modal พิมพ์แบบประเมิน A4 แนวตั้ง (ในลักษณะเดียวกับหน้าบันทึกเวลาเรียน) */}
            <button
              type="button"
              onClick={() => {
                setPrintSection(subTab);
                setIsPrintModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์แบบประเมิน (A4 แนวตั้ง)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: แบบประเมินคุณลักษณะอันพึงประสงค์ (8 ประการ) ตาม Mockup          */}
      {/* ========================================================================= */}
      {subTab === 'attributes' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">แบบประเมินคุณลักษณะอันพึงประสงค์ (8 ประการ)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">ที่มาของผลการประเมิน ปพ.5</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                เกณฑ์การให้คะแนน: <strong>3 = ดีเยี่ยม</strong>, <strong>2 = ดี</strong>, <strong>1 = ผ่าน</strong>, <strong>0 = ไม่ผ่าน</strong> | สรุปผลอัตโนมัติ: ค่าเฉลี่ย &ge; 2.50 = ดีเยี่ยม, &ge; 1.50 = ดี, &ge; 1.00 = ผ่าน
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">ปุ่มลัดให้คะแนนทั้งห้อง:</span>
              <button
                type="button"
                onClick={() => handleBatchSetAttributes(3)}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-200 transition"
              >
                ดีเยี่ยม (3) ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => handleBatchSetAttributes(2)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200 transition"
              >
                ดี (2) ทั้งหมด
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 w-12 align-bottom pb-2">เลขที่</th>
                    <th className="p-2 border-r border-slate-200 w-16 align-bottom pb-2 font-mono">รหัส</th>
                    <th className="p-2 text-left px-3 border-r border-slate-200 min-w-[160px] align-bottom pb-2">ชื่อ - นามสกุล</th>
                    {[
                      { num: 1, label: '1. รักชาติ ศาสน์ กษัตริย์' },
                      { num: 2, label: '2. ซื่อสัตย์สุจริต' },
                      { num: 3, label: '3. มีวินัย' },
                      { num: 4, label: '4. ใฝ่เรียนรู้' },
                      { num: 5, label: '5. อยู่อย่างพอเพียง' },
                      { num: 6, label: '6. มุ่งมั่นในการทำงาน' },
                      { num: 7, label: '7. รักความเป็นไทย' },
                      { num: 8, label: '8. มีจิตสาธารณะ' },
                    ].map(item => (
                      <th key={item.num} className="th-diagonal border-r border-slate-200 w-14 min-w-[56px] max-w-[56px]">
                        <svg className="diagonal-line-svg">
                          <line x1="56" y1="125" x2="125" y2="0" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="2 2" />
                        </svg>
                        <span className="diagonal-text">{item.label}</span>
                        <div className="relative z-10">
                          <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                            ข้อ {item.num}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="p-2 border-r border-slate-200 w-16 bg-slate-100 font-bold align-bottom pb-2">รวม (24)</th>
                    <th className="p-2 border-r border-slate-200 w-16 bg-slate-100 font-bold align-bottom pb-2">เฉลี่ย</th>
                    <th className="p-3 min-w-[120px] font-bold align-bottom pb-2">สรุปผล ปพ.5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s, sIdx) => {
                    const cur = evaluations[s.studentId] || {
                      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
                      attributeScores: [3, 3, 3, 3, 3, 3, 3, 3]
                    };
                    const scores = cur.attributeScores || [3, 3, 3, 3, 3, 3, 3, 3];
                    const total = scores.reduce((a, b) => a + b, 0);
                    const avg = (total / 8).toFixed(2);
                    const lvl = calculateLevel(Number(avg), scores.includes(0));

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="p-2 border-r border-slate-200 font-bold">{sIdx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-500">{s.studentId}</td>
                        <td className="p-2 text-left border-r border-slate-200 font-bold text-slate-800">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>
                        {scores.map((val, aIdx) => (
                          <td key={aIdx} className="p-1 border-r border-slate-100">
                            <select
                              value={val}
                              onChange={(e) => handleAttributeScoreChange(s.studentId, aIdx, Number(e.target.value))}
                              className={`w-12 py-1 text-center font-mono font-bold rounded border cursor-pointer ${
                                val === 3
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : val === 2
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : val === 1
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                              }`}
                            >
                              <option value={3}>3</option>
                              <option value={2}>2</option>
                              <option value={1}>1</option>
                              <option value={0}>0</option>
                            </select>
                          </td>
                        ))}
                        <td className="p-2 border-r border-slate-200 font-bold font-mono text-slate-700 bg-slate-50">{total}</td>
                        <td className="p-2 border-r border-slate-200 font-bold font-mono text-slate-700 bg-slate-50">{avg}</td>
                        <td className="p-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs ${lvl.badgeClass}`}>
                            {lvl.label} ({lvl.score})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: แบบประเมินการอ่าน คิดวิเคราะห์ และเขียน (5 ตัวชี้วัด) ตาม Mockup */}
      {/* ========================================================================= */}
      {subTab === 'reading' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">แบบประเมินการอ่าน คิดวิเคราะห์ และเขียน (5 ตัวชี้วัด)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">ที่มาของผลการประเมิน ปพ.5</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ตัวชี้วัด สพฐ.: 1) อ่านจับใจความ 2) ระบุแนวคิดสำคัญ 3) เปรียบเทียบเชื่อมโยง 4) แสดงความเห็นวิเคราะห์ 5) เขียนถ่ายทอด
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">ปุ่มลัดให้คะแนนทั้งห้อง:</span>
              <button
                type="button"
                onClick={() => handleBatchSetReading(3)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg border border-indigo-200 transition"
              >
                ดีเยี่ยม (3) ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => handleBatchSetReading(2)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200 transition"
              >
                ดี (2) ทั้งหมด
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2 border-r border-slate-200 w-12 align-bottom pb-2">เลขที่</th>
                    <th className="p-2 border-r border-slate-200 w-16 align-bottom pb-2 font-mono">รหัส</th>
                    <th className="p-2 text-left px-3 border-r border-slate-200 min-w-[160px] align-bottom pb-2">ชื่อ - นามสกุล</th>
                    {[
                      { num: 1, label: '1. การอ่านและจับใจความ' },
                      { num: 2, label: '2. ระบุแนวคิดสำคัญ' },
                      { num: 3, label: '3. เปรียบเทียบเชื่อมโยง' },
                      { num: 4, label: '4. แสดงความเห็นวิเคราะห์' },
                      { num: 5, label: '5. เขียนถ่ายทอดความคิด' },
                    ].map(item => (
                      <th key={item.num} className="th-diagonal border-r border-slate-200 w-16 min-w-[64px] max-w-[64px]">
                        <svg className="diagonal-line-svg">
                          <line x1="64" y1="125" x2="133" y2="0" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="2 2" />
                        </svg>
                        <span className="diagonal-text">{item.label}</span>
                        <div className="relative z-10">
                          <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                            ตัวชี้วัด {item.num}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="p-2 border-r border-slate-200 w-16 bg-slate-100 font-bold align-bottom pb-2">รวม (15)</th>
                    <th className="p-2 border-r border-slate-200 w-16 bg-slate-100 font-bold align-bottom pb-2">เฉลี่ย</th>
                    <th className="p-3 min-w-[120px] font-bold align-bottom pb-2">สรุปผล ปพ.5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s, sIdx) => {
                    const cur = evaluations[s.studentId] || {
                      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
                      readingScores: [3, 3, 3, 3, 3]
                    };
                    const scores = cur.readingScores || [3, 3, 3, 3, 3];
                    const total = scores.reduce((a, b) => a + b, 0);
                    const avg = (total / 5).toFixed(2);
                    const lvl = calculateLevel(Number(avg), scores.includes(0));

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="p-2 border-r border-slate-200 font-bold">{sIdx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-500">{s.studentId}</td>
                        <td className="p-2 text-left border-r border-slate-200 font-bold text-slate-800">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>
                        {scores.map((val, rIdx) => (
                          <td key={rIdx} className="p-1 border-r border-slate-100">
                            <select
                              value={val}
                              onChange={(e) => handleReadingScoreChange(s.studentId, rIdx, Number(e.target.value))}
                              className={`w-12 py-1 text-center font-mono font-bold rounded border cursor-pointer ${
                                val === 3
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                  : val === 2
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : val === 1
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                              }`}
                            >
                              <option value={3}>3</option>
                              <option value={2}>2</option>
                              <option value={1}>1</option>
                              <option value={0}>0</option>
                            </select>
                          </td>
                        ))}
                        <td className="p-2 border-r border-slate-200 font-bold font-mono text-slate-700 bg-slate-50">{total}</td>
                        <td className="p-2 border-r border-slate-200 font-bold font-mono text-slate-700 bg-slate-50">{avg}</td>
                        <td className="p-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs ${lvl.badgeClass}`}>
                            {lvl.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: กิจกรรมพัฒนาผู้เรียน (4 กิจกรรมบังคับ) ตาม Mockup              */}
      {/* ========================================================================= */}
      {subTab === 'activities' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">แบบบันทึกที่มากิจกรรมพัฒนาผู้เรียน (4 กิจกรรมบังคับ)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">เวลาเรียน &ge; 80% + จุดประสงค์</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                เกณฑ์การตัดสิน: 1) เวลาเรียนไม่น้อยกว่าร้อยละ 80 2) ผ่านจุดประสงค์สำคัญทุกกิจกรรม 3) ต้องได้ <strong>"ผ" ครบทั้ง 4 กิจกรรม</strong> จึงจะถือว่าผ่านปลายปี
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkPassActivities}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-300 transition shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ประเมิน "ผ่าน (ผ)" ทุกกิจกรรมทั้งห้อง</span>
              </button>
            </div>
          </div>

          {/* Club Customization Bar */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-bold text-emerald-950">กำหนดชื่อชุมนุมประจำชั้น {classLevel}:</span>
              <input
                type="text"
                value={currentClubName}
                onChange={(e) => handleSaveClubName(e.target.value)}
                placeholder="เช่น ชุมนุมศิลป์สร้างสรรค์ หรือ ชุมนุมสื่อ AI สร้างสรรค์"
                className="px-3 py-1 bg-white border border-emerald-300 rounded-lg text-slate-800 font-semibold w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
              <span className="text-emerald-700 text-[11px]">(บันทึกลง ปพ.1 / ปพ.5 / ปพ.6 อัตโนมัติ)</span>
            </div>

            <div className="flex items-center gap-4 text-slate-600 text-[11px]">
              <span>เกณฑ์เวลาเรียน: <strong>120 ชม./ปี</strong></span>
              <span>• แนะแนว 40 ชม.</span>
              <span>• ลูกเสือ 40 ชม.</span>
              <span>• ชุมนุม 30 ชม.</span>
              <span>• สาธารณประโยชน์ 10 ชม.</span>
            </div>
          </div>

          {/* Activities Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th rowSpan={2} className="p-3 w-12 border-r border-slate-200">เลขที่</th>
                    <th rowSpan={2} className="p-3 w-20 border-r border-slate-200 font-mono">รหัส</th>
                    <th rowSpan={2} className="p-3 text-left min-w-[160px] border-r border-slate-200">ชื่อ - นามสกุล</th>
                    <th colSpan={2} className="p-2 border-r border-slate-200 bg-sky-50 text-sky-900">1. กิจกรรมแนะแนว (40 ชม.)</th>
                    <th colSpan={2} className="p-2 border-r border-slate-200 bg-emerald-50 text-emerald-900">2. ลูกเสือ/เนตรนารี (40 ชม.)</th>
                    <th colSpan={2} className="p-2 border-r border-slate-200 bg-purple-50 text-purple-900">3. {currentClubName || 'ชุมนุมประจำชั้น'} (30 ชม.)</th>
                    <th colSpan={2} className="p-2 border-r border-slate-200 bg-rose-50 text-rose-900">4. เพื่อสังคมฯ (10 ชม.)</th>
                    <th rowSpan={2} className="p-3 min-w-[120px] font-bold">ผลรวมปลายปี</th>
                  </tr>
                  <tr className="text-[11px] bg-slate-100">
                    <th className="p-1 border-r border-slate-200">ชม. (&ge;32)</th>
                    <th className="p-1 border-r border-slate-200">ผล</th>
                    <th className="p-1 border-r border-slate-200">ชม. (&ge;32)</th>
                    <th className="p-1 border-r border-slate-200">ผล</th>
                    <th className="p-1 border-r border-slate-200">ชม. (&ge;24)</th>
                    <th className="p-1 border-r border-slate-200">ผล</th>
                    <th className="p-1 border-r border-slate-200">ชม. (&ge;8)</th>
                    <th className="p-1 border-r border-slate-200">ผล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s, sIdx) => {
                    const cur = evaluations[s.studentId] || {
                      traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true
                    };
                    const act = cur.activities || defaultActivityRecord(currentClubName);
                    const pass1 = (act.guidanceHours || 40) >= 32 && (act.guidanceResult ?? 'ผ') === 'ผ';
                    const pass2 = (act.scoutHours || 40) >= 32 && (act.scoutResult ?? 'ผ') === 'ผ';
                    const pass3 = (act.clubHours || 30) >= 24 && (act.clubResult ?? 'ผ') === 'ผ';
                    const pass4 = (act.publicServiceHours || 10) >= 8 && (act.publicServiceResult ?? 'ผ') === 'ผ';
                    const overallPass = pass1 && pass2 && pass3 && pass4;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="p-2 border-r border-slate-200 font-bold">{sIdx + 1}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-slate-500">{s.studentId}</td>
                        <td className="p-2 text-left border-r border-slate-200 font-bold text-slate-800">
                          {s.prefix}{s.firstName} {s.lastName}
                        </td>

                        {/* 1. แนะแนว */}
                        <td className="p-1 border-r border-slate-100 font-mono font-bold">
                          <input
                            type="number"
                            value={act.guidanceHours ?? 40}
                            onChange={(e) => handleActivityItemChange(s.studentId, 'guidanceHours', Number(e.target.value))}
                            className="w-12 text-center font-bold bg-white border border-slate-200 rounded py-0.5"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleActivityItemChange(s.studentId, 'guidanceResult', act.guidanceResult === 'ผ' ? 'มผ' : 'ผ')}
                            className={`px-2 py-0.5 rounded text-xs font-bold border transition ${
                              pass1 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {act.guidanceResult || 'ผ'}
                          </button>
                        </td>

                        {/* 2. ลูกเสือ/เนตรนารี */}
                        <td className="p-1 border-r border-slate-100 font-mono font-bold">
                          <input
                            type="number"
                            value={act.scoutHours ?? 40}
                            onChange={(e) => handleActivityItemChange(s.studentId, 'scoutHours', Number(e.target.value))}
                            className="w-12 text-center font-bold bg-white border border-slate-200 rounded py-0.5"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleActivityItemChange(s.studentId, 'scoutResult', act.scoutResult === 'ผ' ? 'มผ' : 'ผ')}
                            className={`px-2 py-0.5 rounded text-xs font-bold border transition ${
                              pass2 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {act.scoutResult || 'ผ'}
                          </button>
                        </td>

                        {/* 3. ชุมนุม */}
                        <td className="p-1 border-r border-slate-100 font-mono font-bold">
                          <input
                            type="number"
                            value={act.clubHours ?? 30}
                            onChange={(e) => handleActivityItemChange(s.studentId, 'clubHours', Number(e.target.value))}
                            className="w-12 text-center font-bold bg-white border border-slate-200 rounded py-0.5"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleActivityItemChange(s.studentId, 'clubResult', act.clubResult === 'ผ' ? 'มผ' : 'ผ')}
                            className={`px-2 py-0.5 rounded text-xs font-bold border transition ${
                              pass3 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {act.clubResult || 'ผ'}
                          </button>
                        </td>

                        {/* 4. สาธารณประโยชน์ */}
                        <td className="p-1 border-r border-slate-100 font-mono font-bold">
                          <input
                            type="number"
                            value={act.publicServiceHours ?? 10}
                            onChange={(e) => handleActivityItemChange(s.studentId, 'publicServiceHours', Number(e.target.value))}
                            className="w-12 text-center font-bold bg-white border border-slate-200 rounded py-0.5"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleActivityItemChange(s.studentId, 'publicServiceResult', act.publicServiceResult === 'ผ' ? 'มผ' : 'ผ')}
                            className={`px-2 py-0.5 rounded text-xs font-bold border transition ${
                              pass4 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {act.publicServiceResult || 'ผ'}
                          </button>
                        </td>

                        {/* ผลรวมปลายปี */}
                        <td className="p-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${
                            overallPass
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-600 text-white'
                          }`}>
                            {overallPass ? 'ผ่าน (ผ)' : 'ไม่ผ่าน (มผ)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: พิมพ์แบบประเมินคุณภาพผู้เรียน & กิจกรรมพัฒนาผู้เรียน A4 แนวตั้ง (ตราครุฑ) */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:z-auto print:bg-transparent print:p-0 print:m-0 print:overflow-visible print:block">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8 overflow-hidden flex flex-col max-h-[95vh] print:shadow-none print:border-none print:rounded-none print:max-h-none print:max-w-none print:w-full print:m-0 print:p-0 print:overflow-visible print:bg-transparent">
            
            {/* Modal Header Bar (ซ่อนเมื่อพิมพ์) */}
            <div className="bg-slate-800 text-white px-6 py-3.5 flex flex-wrap items-center justify-between no-print border-b border-slate-700 shrink-0 gap-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  พิมพ์แบบประเมินคุณภาพผู้เรียน & กิจกรรมพัฒนาผู้เรียน (ปพ.๕ A4 แนวตั้ง)
                </h3>
              </div>

              {/* Selector เลือกฟอร์มพิมพ์ */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setPrintSection('attributes')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    printSection === 'attributes'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ๑. คุณลักษณะ ๘ ข้อ
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSection('reading')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    printSection === 'reading'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ๒. อ่าน คิดวิเคราะห์ ๕ ข้อ
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSection('activities')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    printSection === 'activities'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  ๓. กิจกรรมพัฒนาผู้เรียน
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSection('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    printSection === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  🖨️ พิมพ์ครบทั้ง ๓ ฟอร์ม (๓ หน้า)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>สั่งพิมพ์เอกสารนี้</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)} 
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Portrait Document View */}
            <div className="p-6 overflow-y-auto bg-slate-200/60 flex flex-col items-center gap-6 print:p-0 print:bg-transparent print:gap-0 print:overflow-visible print:block">
              
              {/* ============================================================== */}
              {/* FORM 1: แบบประเมินคุณลักษณะอันพึงประสงค์ ๘ ประการ (ปพ.๕)         */}
              {/* ============================================================== */}
              {(printSection === 'attributes' || printSection === 'all') && (
                <div 
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white p-6 sm:p-8 shadow-md border border-slate-300 text-slate-900 text-xs font-serif leading-relaxed print:shadow-none print:border-none print:p-6 print-page print-portrait mb-6 print:mb-0"
                  style={{ pageBreakAfter: printSection === 'all' ? 'always' : 'auto' }}
                >
                  {/* Header */}
                  <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                    <div className="flex items-center justify-center gap-3">
                      <img src="/garuda.png" alt="ตราครุฑ" className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <div>
                        <h1 className="text-base font-bold text-slate-900">
                          แบบประเมินคุณลักษณะอันพึงประสงค์ ๘ ประการ (ปพ.๕)
                        </h1>
                        <div className="text-xs font-semibold text-slate-700">
                          โรงเรียน{schoolName} • ชั้นประถมศึกษาปีที่ {classLevel.replace('ป.', '')} • ปีการศึกษา {academicYear} • สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table — 2-Row Standard OBEC Header (แบบ สพฐ. 2 ชั้น) */}
                  <table className="w-full text-center border-collapse border border-slate-400 text-[10px]">
                    <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-400">
                      {/* ชั้นที่ 1 — หัวกลุ่ม */}
                      <tr>
                        <th rowSpan={2} className="p-1 border-r border-b border-slate-400 w-7 font-bold">ที่</th>
                        <th rowSpan={2} className="p-1 border-r border-b border-slate-400 w-12 font-bold font-mono">รหัส</th>
                        <th rowSpan={2} className="p-1 text-left px-2 border-r border-b border-slate-400 min-w-[125px] font-bold">ชื่อ - นามสกุล</th>
                        <th colSpan={8} className="p-1 border-r border-b border-slate-400 bg-blue-50 text-blue-900 font-bold text-[10px]">
                          คุณลักษณะอันพึงประสงค์ ๘ ประการ
                        </th>
                        <th rowSpan={2} className="p-1 border-r border-b border-slate-400 w-11 bg-slate-100/70 font-bold">
                          รวม<br/><span className="text-[8px] font-normal">(๒๔)</span>
                        </th>
                        <th rowSpan={2} className="p-1 border-r border-b border-slate-400 w-11 bg-slate-100/70 font-bold">
                          เฉลี่ย
                        </th>
                        <th rowSpan={2} className="p-1 border-b border-slate-400 w-16 bg-emerald-50 font-bold text-emerald-900">
                          ผลประเมิน
                        </th>
                      </tr>
                      {/* ชั้นที่ 2 — ข้อ ๑–๘ */}
                      <tr>
                        {['๑','๒','๓','๔','๕','๖','๗','๘'].map((n) => (
                          <th key={n} className="p-1 border-r border-slate-400 w-8 font-bold text-[10px]">
                            ข้อ {n}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono text-[10px]">
                      {students.map((s, idx) => {
                        const cur = evaluations[s.studentId] || {
                          traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
                          attributeScores: [3, 3, 3, 3, 3, 3, 3, 3]
                        };
                        const scores = cur.attributeScores || [3, 3, 3, 3, 3, 3, 3, 3];
                        const total = scores.reduce((a, b) => a + b, 0);
                        const avg = (total / 8).toFixed(2);
                        const lvl = calculateLevel(Number(avg), scores.includes(0));

                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-1 border-r border-slate-300 font-sans font-semibold">{s.seq || (idx + 1)}</td>
                            <td className="p-1 border-r border-slate-300">{s.studentId}</td>
                            <td className="p-1 text-left font-sans px-2 border-r border-slate-300 truncate font-medium">
                              {s.prefix}{s.firstName} {s.lastName}
                            </td>
                            {scores.map((sc, i) => (
                              <td key={i} className="p-1 border-r border-slate-300 font-bold">{sc}</td>
                            ))}
                            <td className="p-1 border-r border-slate-300 font-bold bg-slate-50">{total}</td>
                            <td className="p-1 border-r border-slate-300 font-bold bg-slate-50">{avg}</td>
                            <td className="p-1 font-sans font-bold">
                              <span className={lvl.score >= 2 ? 'text-emerald-800' : lvl.score === 1 ? 'text-amber-800' : 'text-rose-700'}>
                                {lvl.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* เกณฑ์และการลงนาม */}
                  <div className="mt-2.5 pt-2 text-[9.5px] text-slate-600 border-t border-slate-200 space-y-0.5">
                    <div className="truncate">
                      <strong>หมายเหตุ:</strong> ๑.รักชาติ ศาสน์ กษัตริย์ | ๒.ซื่อสัตย์สุจริต | ๓.มีวินัย | ๔.ใฝ่เรียนรู้ | ๕.อยู่อย่างพอเพียง | ๖.มุ่งมั่นในการทำงาน | ๗.รักความเป็นไทย | ๘.มีจิตสาธารณะ
                    </div>
                    <div className="flex justify-between items-center text-[9.5px] text-slate-600">
                      <div>เกณฑ์คะแนน: ๓ = ดีเยี่ยม (๒.๕๐ - ๓.๐๐), ๒ = ดี (๑.๕๐ - ๒.๔๙), ๑ = ผ่าน (๑.๐๐ - ๑.๔๙), ๐ = ไม่ผ่าน</div>
                      <div className="italic text-slate-500">(ต้องไม่มีข้อใดได้ ๐ คะแนน)</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-3 text-center text-[10.5px]">
                    <div>
                      <div>ลงชื่อ...................................................... ครูประจำชั้น</div>
                      <div className="font-semibold mt-1">({homeroomTeacher || 'ครูประจำชั้น'})</div>
                      <div className="text-slate-500 text-[10px]">ครูประจำชั้นประถมศึกษาปีที่ {classLevel.replace('ป.', '')}</div>
                    </div>
                    <div>
                      <div>ลงชื่อ...................................................... นายทะเบียน/วิชาการ</div>
                      <div className="font-semibold mt-1">({academicHeadName || 'นางสาววัชรี พรหมช่วย'})</div>
                      <div className="text-slate-500 text-[10px]">หัวหน้าฝ่ายวิชาการ</div>
                    </div>
                    <div>
                      <div>ลงชื่อ...................................................... ผู้อำนวยการโรงเรียน</div>
                      <div className="font-semibold mt-1">({directorName || 'นายเอกคณิต สิทธิศักดิ์'})</div>
                      <div className="text-slate-500 text-[10px]">ผู้อำนวยการโรงเรียน{schoolName}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* FORM 2: แบบประเมินการอ่าน คิดวิเคราะห์ และเขียน ๕ ข้อ (ปพ.๕)      */}
              {/* ============================================================== */}
              {(printSection === 'reading' || printSection === 'all') && (
                <div 
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white p-6 sm:p-8 shadow-md border border-slate-300 text-slate-900 text-xs font-serif leading-relaxed print:shadow-none print:border-none print:p-6 print-page print-portrait mb-6 print:mb-0"
                  style={{ pageBreakAfter: printSection === 'all' ? 'always' : 'auto' }}
                >
                  {/* Header */}
                  <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                    <div className="flex items-center justify-center gap-3">
                      <img src="/garuda.png" alt="ตราครุฑ" className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <div>
                        <h1 className="text-base font-bold text-slate-900">
                          แบบประเมินการอ่าน คิดวิเคราะห์ และเขียน (ปพ.๕)
                        </h1>
                        <div className="text-xs font-semibold text-slate-700">
                          โรงเรียน{schoolName} • ชั้นประถมศึกษาปีที่ {classLevel.replace('ป.', '')} • ปีการศึกษา {academicYear} • สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table — 2-Row Standard OBEC Header (แบบ สพฐ. 2 ชั้น) */}
                  <table className="w-full text-center border-collapse border border-slate-400 text-[10px]">
                    <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-400">
                      {/* ชั้นที่ 1 — หัวกลุ่ม */}
                      <tr>
                        <th rowSpan={2} className="p-1 border-r border-b border-slate-400 w-7 font-bold">ที่</th>
                        <th rowSpan={2} className="p-1 border-r border-b border-slate-400 w-12 font-bold font-mono">รหัส</th>
                        <th rowSpan={2} className="p-1 text-left px-2 border-r border-b border-slate-400 min-w-[125px] font-bold">ชื่อ - นามสกุล</th>
                        <th colSpan={5} className="p-1 border-r border-b border-slate-400 bg-indigo-50 text-indigo-900 font-bold text-[10px]">
                          การอ่าน คิดวิเคราะห์ และเขียน
                        </th>
                        <th rowSpan={2} className="p-1 border-r border-b border-slate-400 w-11 bg-slate-100/70 font-bold">
                          รวม<br/><span className="text-[8px] font-normal">(๑๕)</span>
                        </th>
                        <th rowSpan={2} className="p-1 border-r border-b border-slate-400 w-11 bg-slate-100/70 font-bold">
                          เฉลี่ย
                        </th>
                        <th rowSpan={2} className="p-1 border-b border-slate-400 w-16 bg-indigo-50 font-bold text-indigo-900">
                          ผลตัดสิน
                        </th>
                      </tr>
                      {/* ชั้นที่ 2 — ข้อ ๑–๕ */}
                      <tr>
                        {['๑','๒','๓','๔','๕'].map((n) => (
                          <th key={n} className="p-1 border-r border-slate-400 w-11 font-bold text-[10px]">
                            ข้อ {n}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono text-[10px]">
                      {students.map((s, idx) => {
                        const cur = evaluations[s.studentId] || {
                          traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true,
                          attributeScores: [3, 3, 3, 3, 3, 3, 3, 3],
                          readingScores: [3, 3, 3, 3, 3]
                        };
                        const scores = cur.readingScores || [3, 3, 3, 3, 3];
                        const total = scores.reduce((a, b) => a + b, 0);
                        const avg = (total / 5).toFixed(2);
                        const lvl = calculateLevel(Number(avg), scores.includes(0));

                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-1 border-r border-slate-300 font-sans font-semibold">{s.seq || (idx + 1)}</td>
                            <td className="p-1 border-r border-slate-300">{s.studentId}</td>
                            <td className="p-1 text-left font-sans px-2 border-r border-slate-300 truncate font-medium">
                              {s.prefix}{s.firstName} {s.lastName}
                            </td>
                            {scores.map((sc, i) => (
                              <td key={i} className="p-1 border-r border-slate-300 font-bold">{sc}</td>
                            ))}
                            <td className="p-1 border-r border-slate-300 font-bold bg-slate-50">{total}</td>
                            <td className="p-1 border-r border-slate-300 font-bold bg-slate-50">{avg}</td>
                            <td className="p-1 font-sans font-bold">
                              <span className={lvl.score >= 2 ? 'text-indigo-800' : lvl.score === 1 ? 'text-amber-800' : 'text-rose-700'}>
                                {cur.readingWriting || lvl.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* เกณฑ์และการลงนาม */}
                  <div className="mt-2.5 pt-2 text-[9.5px] text-slate-600 flex justify-between items-center border-t border-slate-200">
                    <div>เกณฑ์การประเมิน: ๓ = ดีเยี่ยม (๒.๕๐ - ๓.๐๐), ๒ = ดี (๑.๕๐ - ๒.๔๙), ๑ = ผ่าน (๑.๐๐ - ๑.๔๙), ๐ = ไม่ผ่าน</div>
                    <div className="italic text-slate-500">ตามมาตรฐานหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. ๒๕๕๑</div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-3 text-center text-[10.5px]">
                    <div>
                      <div>ลงชื่อ...................................................... ครูประจำชั้น</div>
                      <div className="font-semibold mt-1">({homeroomTeacher || 'ครูประจำชั้น'})</div>
                      <div className="text-slate-500 text-[10px]">ครูประจำชั้นประถมศึกษาปีที่ {classLevel.replace('ป.', '')}</div>
                    </div>
                    <div>
                      <div>ลงชื่อ...................................................... นายทะเบียน/วิชาการ</div>
                      <div className="font-semibold mt-1">({academicHeadName || 'นางสาววัชรี พรหมช่วย'})</div>
                      <div className="text-slate-500 text-[10px]">หัวหน้าฝ่ายวิชาการ</div>
                    </div>
                    <div>
                      <div>ลงชื่อ...................................................... ผู้อำนวยการโรงเรียน</div>
                      <div className="font-semibold mt-1">({directorName || 'นายเอกคณิต สิทธิศักดิ์'})</div>
                      <div className="text-slate-500 text-[10px]">ผู้อำนวยการโรงเรียน{schoolName}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* FORM 3: แบบบันทึกผลการประเมินกิจกรรมพัฒนาผู้เรียน ๔ กิจกรรม (ปพ.๕) */}
              {/* ============================================================== */}
              {/* ============================================================== */}
              {/* FORM 3: แบบบันทึกผลการประเมินกิจกรรมพัฒนาผู้เรียน ๔ กิจกรรม (ปพ.๕) */}
              {/* ============================================================== */}
              {(printSection === 'activities' || printSection === 'all') && (
                <div 
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white p-6 sm:p-8 shadow-md border border-slate-300 text-slate-900 text-xs font-serif leading-relaxed print:shadow-none print:border-none print:p-6 print-page print-portrait mb-6 print:mb-0"
                >
                  {/* Header */}
                  <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                    <div className="flex items-center justify-center gap-3">
                      <img src="/garuda.png" alt="ตราครุฑ" className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <div>
                        <h1 className="text-base font-bold text-slate-900">
                          แบบบันทึกผลการประเมินกิจกรรมพัฒนาผู้เรียน (ปพ.๕)
                        </h1>
                        <div className="text-xs font-semibold text-slate-700">
                          โรงเรียน{schoolName} • ชั้นประถมศึกษาปีที่ {classLevel.replace('ป.', '')} • ปีการศึกษา {academicYear} • สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-center border-collapse border border-slate-400 text-[10px]">
                    <thead className="bg-slate-100 font-bold border-b border-slate-400">
                      <tr>
                        <th rowSpan={2} className="p-1 border-r border-slate-400 w-7">ที่</th>
                        <th rowSpan={2} className="p-1 border-r border-slate-400 w-14">รหัส</th>
                        <th rowSpan={2} className="p-1 text-left px-2 border-r border-slate-400 min-w-[125px]">ชื่อ - นามสกุล</th>
                        <th colSpan={2} className="p-1 border-r border-slate-400 bg-sky-50/60">๑. แนะแนว<br/><span className="text-[8px] font-normal">(๔๐ ชม.)</span></th>
                        <th colSpan={2} className="p-1 border-r border-slate-400 bg-emerald-50/60">๒. ลูกเสือฯ<br/><span className="text-[8px] font-normal">(๔๐ ชม.)</span></th>
                        <th colSpan={2} className="p-1 border-r border-slate-400 bg-purple-50/60">๓. ชุมนุม<br/><span className="text-[8px] font-normal">(๓๐ ชม.)</span></th>
                        <th colSpan={2} className="p-1 border-r border-slate-400 bg-rose-50/60">๔. เพื่อสังคม<br/><span className="text-[8px] font-normal">(๑๐ ชม.)</span></th>
                        <th rowSpan={2} className="p-1 w-11 bg-slate-50 border-r border-slate-400">รวมเวลา<br/><span className="text-[8px] font-normal">(๑๒๐)</span></th>
                        <th rowSpan={2} className="p-1 w-16 bg-amber-100/70 text-amber-900">ผลตัดสิน</th>
                      </tr>
                      <tr className="text-[9px] border-t border-slate-400 bg-slate-50">
                        <th className="p-0.5 border-r border-slate-400 w-7">ชม.</th>
                        <th className="p-0.5 border-r border-slate-400 w-6">ผล</th>
                        <th className="p-0.5 border-r border-slate-400 w-7">ชม.</th>
                        <th className="p-0.5 border-r border-slate-400 w-6">ผล</th>
                        <th className="p-0.5 border-r border-slate-400 w-7">ชม.</th>
                        <th className="p-0.5 border-r border-slate-400 w-6">ผล</th>
                        <th className="p-0.5 border-r border-slate-400 w-7">ชม.</th>
                        <th className="p-0.5 border-r border-slate-400 w-6">ผล</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono text-[10px]">
                      {students.map((s, idx) => {
                        const cur = evaluations[s.studentId] || {
                          traitsScore: 3, competencyScore: 3, readingWriting: 'ดีเยี่ยม', activityPassed: true
                        };
                        const act = cur.activities || defaultActivityRecord(currentClubName);
                        const totalHours = (act.guidanceHours || 40) + (act.scoutHours || 40) + (act.clubHours || 30) + (act.publicServiceHours || 10);
                        const pass1 = (act.guidanceHours || 40) >= 32 && (act.guidanceResult ?? 'ผ') === 'ผ';
                        const pass2 = (act.scoutHours || 40) >= 32 && (act.scoutResult ?? 'ผ') === 'ผ';
                        const pass3 = (act.clubHours || 30) >= 24 && (act.clubResult ?? 'ผ') === 'ผ';
                        const pass4 = (act.publicServiceHours || 10) >= 8 && (act.publicServiceResult ?? 'ผ') === 'ผ';
                        const overallPass = pass1 && pass2 && pass3 && pass4;

                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-1 border-r border-slate-300 font-sans font-semibold">{s.seq || (idx + 1)}</td>
                            <td className="p-1 border-r border-slate-300">{s.studentId}</td>
                            <td className="p-1 text-left font-sans px-2 border-r border-slate-300 truncate font-medium">
                              {s.prefix}{s.firstName} {s.lastName}
                            </td>
                            <td className="p-1 border-r border-slate-300">{act.guidanceHours || 40}</td>
                            <td className={`p-1 border-r border-slate-300 font-sans font-bold ${pass1 ? 'text-emerald-700' : 'text-rose-600'}`}>{act.guidanceResult || 'ผ'}</td>
                            <td className="p-1 border-r border-slate-300">{act.scoutHours || 40}</td>
                            <td className={`p-1 border-r border-slate-300 font-sans font-bold ${pass2 ? 'text-emerald-700' : 'text-rose-600'}`}>{act.scoutResult || 'ผ'}</td>
                            <td className="p-1 border-r border-slate-300">{act.clubHours || 30}</td>
                            <td className={`p-1 border-r border-slate-300 font-sans font-bold ${pass3 ? 'text-emerald-700' : 'text-rose-600'}`}>{act.clubResult || 'ผ'}</td>
                            <td className="p-1 border-r border-slate-300">{act.publicServiceHours || 10}</td>
                            <td className={`p-1 border-r border-slate-300 font-sans font-bold ${pass4 ? 'text-emerald-700' : 'text-rose-600'}`}>{act.publicServiceResult || 'ผ'}</td>
                            <td className="p-1 border-r border-slate-300 font-bold bg-slate-50">{totalHours}</td>
                            <td className="p-1 font-sans font-bold">
                              <span className={overallPass ? 'text-emerald-700' : 'text-rose-600'}>
                                {overallPass ? 'ผ่าน (ผ)' : 'ไม่ผ่าน (มผ)'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* เกณฑ์และการลงนาม */}
                  <div className="mt-2.5 pt-2 text-[9.5px] text-slate-600 border-t border-slate-200 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <div>เกณฑ์การตัดสิน: ๑) เวลาเรียนไม่น้อยกว่าร้อยละ ๘๐ ของเวลาเรียนแต่ละกิจกรรม ๒) ผ่านจุดประสงค์สำคัญทุกกิจกรรม ๓) ต้องได้ "ผ" ครบทั้ง ๔ กิจกรรม</div>
                      <div className="font-semibold text-slate-700">รวม ๑๒๐ ชม./ปี</div>
                    </div>
                    <div className="text-[9px] text-slate-500 italic">
                      * กิจกรรมชุมนุม: {currentClubName || 'ชุมนุมประจำชั้น'} (เกณฑ์ผ่าน &ge; ๒๔ ชม.), แนะแนว &ge; ๓๒ ชม., ลูกเสือ &ge; ๓๒ ชม., เพื่อสังคม &ge; ๘ ชม.
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-3 text-center text-[10.5px]">
                    <div>
                      <div>ลงชื่อ...................................................... ครูประจำชั้น</div>
                      <div className="font-semibold mt-1">({homeroomTeacher || 'ครูประจำชั้น'})</div>
                      <div className="text-slate-500 text-[10px]">ครูประจำชั้นประถมศึกษาปีที่ {classLevel.replace('ป.', '')}</div>
                    </div>
                    <div>
                      <div>ลงชื่อ...................................................... นายทะเบียน/วิชาการ</div>
                      <div className="font-semibold mt-1">({academicHeadName || 'นางสาววัชรี พรหมช่วย'})</div>
                      <div className="text-slate-500 text-[10px]">หัวหน้าฝ่ายวิชาการ</div>
                    </div>
                    <div>
                      <div>ลงชื่อ...................................................... ผู้อำนวยการโรงเรียน</div>
                      <div className="font-semibold mt-1">({directorName || 'นายเอกคณิต สิทธิศักดิ์'})</div>
                      <div className="text-slate-500 text-[10px]">ผู้อำนวยการโรงเรียน{schoolName}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HolisticAssessmentTab;
