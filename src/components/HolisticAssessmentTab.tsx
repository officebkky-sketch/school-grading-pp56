import React, { useState, useEffect } from 'react';
import { StudentProfile, HolisticDetail, LearnerActivityRecord } from '../types/pp5Types';
import { INITIAL_HOLISTIC } from '../data/initialHolisticData';
import { Award, Sparkles, CheckCircle, Compass, Users, BookOpen, CheckCircle2 } from 'lucide-react';

interface Props {
  students: StudentProfile[];
  classLevel: string;
  holisticData?: Record<string, HolisticDetail>;
  onUpdateHolistic?: (studentId: string, data: HolisticDetail) => void;
  onBulkUpdateHolistic?: (records: Record<string, HolisticDetail>) => void;
  clubName?: string;
  onUpdateClubName?: (cls: string, name: string) => void;
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
  onUpdateClubName
}) => {
  // 3 Sub-tabs: 'attributes' (คุณลักษณะ 8 ข้อ) | 'reading' (อ่าน คิดวิเคราะห์ 5 ข้อ) | 'activities' (กิจกรรมพัฒนาผู้เรียน 4 กิจกรรม)
  const [subTab, setSubTab] = useState<'attributes' | 'reading' | 'activities'>('attributes');

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
    <div className="space-y-6">
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
                    <th className="p-3 w-12 border-r border-slate-200">เลขที่</th>
                    <th className="p-3 w-20 border-r border-slate-200 font-mono">รหัส</th>
                    <th className="p-3 text-left min-w-[160px] border-r border-slate-200">ชื่อ - นามสกุล</th>
                    <th className="p-2 border-r border-slate-200 w-14" title="1. รักชาติ ศาสน์ กษัตริย์">ข้อ 1</th>
                    <th className="p-2 border-r border-slate-200 w-14" title="2. ซื่อสัตย์สุจริต">ข้อ 2</th>
                    <th className="p-2 border-r border-slate-200 w-14" title="3. มีวินัย">ข้อ 3</th>
                    <th className="p-2 border-r border-slate-200 w-14" title="4. ใฝ่เรียนรู้">ข้อ 4</th>
                    <th className="p-2 border-r border-slate-200 w-14" title="5. อยู่อย่างพอเพียง">ข้อ 5</th>
                    <th className="p-2 border-r border-slate-200 w-14" title="6. มุ่งมั่นในการทำงาน">ข้อ 6</th>
                    <th className="p-2 border-r border-slate-200 w-14" title="7. รักความเป็นไทย">ข้อ 7</th>
                    <th className="p-2 border-r border-slate-200 w-14" title="8. มีจิตสาธารณะ">ข้อ 8</th>
                    <th className="p-2 border-r border-slate-200 w-16 bg-slate-100 font-bold">รวม (24)</th>
                    <th className="p-2 border-r border-slate-200 w-16 bg-slate-100 font-bold">เฉลี่ย</th>
                    <th className="p-3 min-w-[120px] font-bold">สรุปผล ปพ.5</th>
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
                    <th className="p-3 w-12 border-r border-slate-200">เลขที่</th>
                    <th className="p-3 w-20 border-r border-slate-200 font-mono">รหัส</th>
                    <th className="p-3 text-left min-w-[160px] border-r border-slate-200">ชื่อ - นามสกุล</th>
                    <th className="p-2 border-r border-slate-200 w-16" title="1. การอ่านสื่อสิ่งพิมพ์/สื่อดิจิทัลและจับใจความสำคัญ">ตัวชี้วัด 1</th>
                    <th className="p-2 border-r border-slate-200 w-16" title="2. การระบุแนวคิด ข้อคิดสำคัญ">ตัวชี้วัด 2</th>
                    <th className="p-2 border-r border-slate-200 w-16" title="3. การเปรียบเทียบแง่มุมเชื่อมโยง">ตัวชี้วัด 3</th>
                    <th className="p-2 border-r border-slate-200 w-16" title="4. การแสดงความคิดเห็นเชิงวิเคราะห์">ตัวชี้วัด 4</th>
                    <th className="p-2 border-r border-slate-200 w-16" title="5. การเขียนถ่ายทอดอย่างเป็นระเบียบ">ตัวชี้วัด 5</th>
                    <th className="p-2 border-r border-slate-200 w-16 bg-slate-100 font-bold">รวม (15)</th>
                    <th className="p-2 border-r border-slate-200 w-16 bg-slate-100 font-bold">เฉลี่ย</th>
                    <th className="p-3 min-w-[120px] font-bold">สรุปผล ปพ.5</th>
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
  );
};

export default HolisticAssessmentTab;
