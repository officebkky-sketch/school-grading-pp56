// src/components/SubjectScoreConfigModal.tsx
import React, { useState, useEffect } from 'react';
import { SubjectConfig, SubjectAssessmentWeights, DEFAULT_SCHOOL_MIS_WEIGHTS } from '../types/pp5Types';
import {
  X,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subject: SubjectConfig;
  onSaveWeights: (updatedWeights: SubjectAssessmentWeights) => void;
}

export const SubjectScoreConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  subject,
  onSaveWeights
}) => {
  const initialWeights: SubjectAssessmentWeights = subject.assessmentWeights
    ? { ...subject.assessmentWeights }
    : { ...DEFAULT_SCHOOL_MIS_WEIGHTS };

  const [weights, setWeights] = useState<SubjectAssessmentWeights>(initialWeights);

  // Sync state whenever subject changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setWeights(
        subject.assessmentWeights
          ? { ...subject.assessmentWeights }
          : { ...DEFAULT_SCHOOL_MIS_WEIGHTS }
      );
    }
  }, [isOpen, subject]);

  if (!isOpen) return null;

  // Realtime calculations
  const c1 = Number(weights.c1) || 0;
  const c2 = Number(weights.c2) || 0;
  const c3 = Number(weights.c3) || 0;
  const c4 = Number(weights.c4) || 0;
  const sumPre = c1 + c2 + c3 + c4;

  const c5 = Number(weights.c5) || 0;
  const term1Total = sumPre + c5;

  const c6 = Number(weights.c6) || 0;
  const c7 = Number(weights.c7) || 0;
  const c8 = Number(weights.c8) || 0;
  const c9 = Number(weights.c9) || 0;
  const sumPost = c6 + c7 + c8 + c9;

  const c10 = Number(weights.c10) || 0;
  const term2Total = sumPost + c10;

  const formativeTotal = sumPre + sumPost;
  const examTotal = c5 + c10;
  const totalYear = term1Total + term2Total;
  const isValidTotal = totalYear === 100;

  const handleChange = (field: keyof SubjectAssessmentWeights, valStr: string) => {
    const num = valStr === '' ? 0 : Math.max(0, Math.min(100, Number(valStr)));
    setWeights(prev => ({
      ...prev,
      [field]: num
    }));
  };

  const handleApplyPreset = (preset: 'mis' | 'ratio70_30' | 'ratio80_20') => {
    if (preset === 'mis') {
      setWeights({ ...DEFAULT_SCHOOL_MIS_WEIGHTS });
    } else if (preset === 'ratio70_30') {
      // ระหว่างภาค 70 : ปลายภาค 30 (เทอม 1: 35+15=50, เทอม 2: 35+15=50)
      setWeights({
        c1: 10,
        c2: 10,
        c3: 10,
        c4: 5,
        c5: 15,
        c6: 10,
        c7: 10,
        c8: 15,
        c9: 0,
        c10: 15
      });
    } else if (preset === 'ratio80_20') {
      // ระหว่างเรียน 80 : สอบ 20 (เทอม 1: 40+10=50, เทอม 2: 40+10=50)
      setWeights({
        c1: 10,
        c2: 10,
        c3: 10,
        c4: 10,
        c5: 10,
        c6: 10,
        c7: 10,
        c8: 10,
        c9: 10,
        c10: 10
      });
    }
  };

  const handleSave = () => {
    if (!isValidTotal) {
      alert(`⚠️ ผลรวมคะแนนเต็มต้องได้ 100 คะแนนพอดี (ปัจจุบันรวมได้ ${totalYear} คะแนน)`);
      return;
    }
    onSaveWeights(weights);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-6">
        
        {/* Header */}
        <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-800 rounded-xl border border-indigo-700">
              <SlidersHorizontal className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>ตั้งค่าคะแนนเต็ม 10 ครั้ง</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-700/80 font-mono text-indigo-100">
                  {subject.code}
                </span>
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                รายวิชา {subject.name} ({subject.type} • {subject.credits} หน่วยกิต)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-indigo-50/70 px-6 py-2.5 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>แม่แบบสัดส่วนด่วน:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('mis')}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-medium transition shadow-2xs"
            >
              มาตรฐาน School MIS (35:15:35:15)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ratio80_20')}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-medium transition shadow-2xs"
            >
              สัดส่วน 80:20 (เก็บ 80 / สอบ 20)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-200px)] overflow-y-auto">
          
          {/* Note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              ฝ่ายวิชาการสามารถกำหนดคะแนนเต็มของแต่ละครั้ง (ครั้งที่ 1 ถึง 10) ให้ตรงตามแผนการจัดการเรียนรู้ของกลุ่มสาระได้ โดยที่ผลรวมคะแนนตลอดทั้งปีต้องเท่ากับ <strong>100 คะแนน</strong> เพื่อให้เข้ากันได้กับระบบ <strong>School MIS (สพฐ.)</strong> และการส่งออก CSV 21 คอลัมน์
            </div>
          </div>

          {/* SECTION 1: Term 1 */}
          <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-blue-200/80">
              <span className="font-bold text-sm text-blue-900">
                📘 ภาคเรียนที่ 1 (คะแนนรวม: {term1Total} คะแนน)
              </span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                ก่อนกลาง {sumPre} + กลางภาค {c5}
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* c1 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ครั้งที่ 1 (เก็บ)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c1}
                  onChange={(e) => handleChange('c1', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* c2 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ครั้งที่ 2 (เก็บ)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c2}
                  onChange={(e) => handleChange('c2', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* c3 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ครั้งที่ 3 (เก็บ)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c3}
                  onChange={(e) => handleChange('c3', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* c4 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ครั้งที่ 4 (เก็บ)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c4}
                  onChange={(e) => handleChange('c4', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* c5 กลางภาค */}
              <div className="bg-amber-50/80 p-1.5 rounded-lg border border-amber-200">
                <label className="block text-[11px] font-bold text-amber-900 mb-0.5">ครั้งที่ 5 (กลางภาค)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c5}
                  onChange={(e) => handleChange('c5', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Term 2 */}
          <div className="border border-purple-200 bg-purple-50/30 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-purple-200/80">
              <span className="font-bold text-sm text-purple-900">
                📙 ภาคเรียนที่ 2 (คะแนนรวม: {term2Total} คะแนน)
              </span>
              <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                หลังกลาง {sumPost} + ปลายภาค {c10}
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* c6 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ครั้งที่ 6 (เก็บ)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c6}
                  onChange={(e) => handleChange('c6', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* c7 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ครั้งที่ 7 (เก็บ)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c7}
                  onChange={(e) => handleChange('c7', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* c8 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ครั้งที่ 8 (เก็บ)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c8}
                  onChange={(e) => handleChange('c8', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* c9 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ครั้งที่ 9 (เก็บ/สำรอง)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c9}
                  onChange={(e) => handleChange('c9', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* c10 ปลายภาค */}
              <div className="bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200">
                <label className="block text-[11px] font-bold text-emerald-900 mb-0.5">ครั้งที่ 10 (ปลายภาค)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weights.c10}
                  onChange={(e) => handleChange('c10', e.target.value)}
                  className="w-full text-center py-1.5 px-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Validation & Live Summary Card */}
          <div className="rounded-xl border p-4 bg-slate-50 transition-all">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pb-3 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">รวมก่อนกลาง</span>
                <p className="font-bold font-mono text-slate-800 text-sm mt-0.5">{sumPre}</p>
              </div>
              <div>
                <span className="text-slate-500">สอบกลางภาค (c5)</span>
                <p className="font-bold font-mono text-amber-700 text-sm mt-0.5">{c5}</p>
              </div>
              <div>
                <span className="text-slate-500">รวมหลังกลาง</span>
                <p className="font-bold font-mono text-slate-800 text-sm mt-0.5">{sumPost}</p>
              </div>
              <div>
                <span className="text-slate-500">สอบปลายภาค (c10)</span>
                <p className="font-bold font-mono text-emerald-700 text-sm mt-0.5">{c10}</p>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-slate-600">สัดส่วนระหว่างเรียน : สอบ = </span>
                <span className="font-bold text-indigo-900">{formativeTotal} : {examTotal}</span>
                <span className="mx-2 text-slate-300">•</span>
                <span className="text-slate-600">เทอม 1 : เทอม 2 = </span>
                <span className="font-bold text-indigo-900">{term1Total} : {term2Total}</span>
              </div>

              {/* Total Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">ผลรวมคะแนนเต็ม:</span>
                <span className={`text-base font-extrabold font-mono px-3 py-1 rounded-lg border ${
                  isValidTotal
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}>
                  {totalYear} / 100
                </span>
              </div>
            </div>

            {/* Validation Message */}
            <div className="mt-3">
              {isValidTotal ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✓ ผลรวมคะแนนเต็มครบ 100 คะแนนพอดี ถูกต้องตามเกณฑ์ สพฐ. พร้อมบันทึก</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    ⚠️ ผลรวมต้องได้ 100 คะแนนพอดี (ปัจจุบัน{totalYear > 100 ? `เกินอยู่ ${totalYear - 100}` : `ขาดอีก ${100 - totalYear}`} คะแนน)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleApplyPreset('mis')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่ามาตรฐาน School MIS</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={!isValidTotal}
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition ${
                isValidTotal
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกคะแนนเต็มวิชานี้</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
