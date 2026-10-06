// src/services/syncService.ts
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDb } from '../db/localDb';
import { StudentProfile, SubjectConfig, StudentScoreRecord, AcademicConfig, AttendanceDetail } from '../types/pp5Types';
import { GrowthEngine } from '../engines/growthEngine';
import { KINDERGARTEN_STANDARDS, KindergartenStudentAssessment, QualityLevel } from '../types/kindergartenTypes';
import { CLASS_SUBJECTS_MAP } from '../data/classSubjectsData';
import { saveSubjectAssessmentWeights } from '../utils/weightStorage';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
  error?: string;
  timestamp: string;
}

const isUuid = (val?: string): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

const generateUuid = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

export class CloudSyncEngine {
  /**
   * Sync a single class room's entire data to Supabase (Class-Scoped Atomic Upsert)
   * Guaranteed Zero-Conflict: Modifies only records belonging to this specific class room.
   */
  static async syncClassToCloud(
    classLevel: string,
    subjects: SubjectConfig[],
    students: StudentProfile[],
    scores: Record<string, Record<string, StudentScoreRecord>>,
    config: AcademicConfig,
    attendanceRecords?: Record<string, AttendanceDetail>
  ): Promise<SyncResult> {
    const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        syncedCount: 0,
        message: 'ยังไม่ได้เชื่อมต่อ Supabase หรืออยู่ในโหมดออฟไลน์',
        timestamp
      };
    }

    if (!subjects || subjects.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: 'ไม่มีรายวิชาที่ต้องซิงค์',
        timestamp
      };
    }

    try {
      let totalSynced = 0;

      // 1. Sync Subjects for this class (Smart ID matching & schema resilience)
      const { data: dbSubjectsExisting } = await supabase
        .from('subjects')
        .select('id, code')
        .eq('class_level', classLevel)
        .eq('academic_year', config.academicYear);

      const normCode = (c: string) => (c || '').replace(/\s+/g, '').toUpperCase();
      const existingMap = new Map<string, string>(); // normCode/id -> id
      dbSubjectsExisting?.forEach(es => {
        if (es.code) existingMap.set(normCode(es.code), es.id);
        if (es.id) existingMap.set(es.id, es.id);
      });

      // Pre-resolve IDs before orphan detection and batch upsert (Strict Deduplication Guarantee)
      const oldIdMap = new Map<string, string>();
      const activeIds = new Set<string>();
      const activeNormCodes = new Set<string>();
      const usedTargetIds = new Set<string>();
      const dedupedSubjectsMap = new Map<string, any>(); // normCode -> subject payload row

      for (const s of subjects) {
        const nCode = normCode(s.code);
        if (!nCode) continue;

        // ป้องกันวิชาซ้ำซ้อนในระดับชั้นเดียวกัน (Deduplicate duplicate subject code in same class)
        if (dedupedSubjectsMap.has(nCode)) {
          continue;
        }

        const oldId = s.id;
        let targetId: string | undefined = undefined;

        // 1) Match existing DB UUID by matching s.id if not already used
        if (s.id && existingMap.has(s.id) && !usedTargetIds.has(existingMap.get(s.id)!)) {
          targetId = existingMap.get(s.id);
        }
        // 2) Match existing DB UUID by normalized code if not already used
        else if (existingMap.has(nCode) && !usedTargetIds.has(existingMap.get(nCode)!)) {
          targetId = existingMap.get(nCode);
        }
        // 3) Keep s.id if it's already a valid UUID and not already used
        else if (isUuid(s.id) && !usedTargetIds.has(s.id)) {
          targetId = s.id;
        }

        // 4) Otherwise generate a brand new UUID
        if (!targetId || !isUuid(targetId) || usedTargetIds.has(targetId)) {
          targetId = generateUuid();
        }

        usedTargetIds.add(targetId);

        if (oldId && oldId !== targetId) {
          oldIdMap.set(oldId, targetId);
          oldIdMap.set(targetId, oldId);
          s.id = targetId;
        }

        activeIds.add(targetId);
        activeNormCodes.add(nCode);

        dedupedSubjectsMap.set(nCode, {
          id: targetId,
          code: s.code.trim(),
          name: s.name.trim(),
          type: s.type,
          credits: s.credits,
          hours_per_year: s.hoursPerYear !== undefined ? Number(s.hoursPerYear) : 80,
          full_score_term1: s.fullScoreTerm1 !== undefined ? Number(s.fullScoreTerm1) : 50,
          full_score_term2: s.fullScoreTerm2 !== undefined ? Number(s.fullScoreTerm2) : 50,
          class_level: classLevel,
          academic_year: config.academicYear
        });
      }

      const subjectsPayload = Array.from(dedupedSubjectsMap.values());

      // ตรวจจับและลบวิชาที่ไม่อยู่ในรายการ subjects ของห้องนี้แล้ว (Orphaned / Deleted Subjects)
      const orphanSubjects = (dbSubjectsExisting || []).filter(es => {
        const esNorm = normCode(es.code);
        return !activeNormCodes.has(esNorm) && !activeIds.has(es.id);
      });

      if (orphanSubjects.length > 0) {
        const orphanIds = orphanSubjects.map(os => os.id);
        // ลบคะแนนของวิชาที่ถูกลบออกจากตาราง student_grades
        await supabase
          .from('student_grades')
          .delete()
          .in('subject_id', orphanIds)
          .eq('academic_year', config.academicYear);

        // ลบวิชาออกจากตาราง subjects
        await supabase
          .from('subjects')
          .delete()
          .in('id', orphanIds);
      }

      if (subjectsPayload.length > 0) {
        const { error: subErr } = await supabase
          .from('subjects')
          .upsert(subjectsPayload, { onConflict: 'id' });
        if (subErr) {
          throw new Error(`ไม่สามารถซิงค์รายวิชา: ${subErr.message}`);
        }
      }

      // Fetch refreshed subject mapping from Supabase to obtain actual UUIDs
      const { data: dbSubjects, error: fetchSubErr } = await supabase
        .from('subjects')
        .select('id, code')
        .eq('class_level', classLevel)
        .eq('academic_year', config.academicYear);

      if (fetchSubErr) throw new Error(`ไม่สามารถอ่านข้อมูลรายวิชา: ${fetchSubErr.message}`);

      const subjectIdMap = new Map<string, string>(); // normCode/uuid -> uuid
      dbSubjects?.forEach(ds => {
        if (ds.code) subjectIdMap.set(normCode(ds.code), ds.id);
        if (ds.id) subjectIdMap.set(ds.id, ds.id);
      });

      // 2. Sync Student Grades
      const gradesPayload: any[] = [];
      for (const sub of subjects) {
        const subDbId = subjectIdMap.get(normCode(sub.code)) || subjectIdMap.get(sub.id) || sub.id;
        if (!subDbId) continue;

        const nCode = normCode(sub.code);
        // Universal lookup across all possible key aliases (UUID, mock ID, raw code, normalized code)
        const candidateScoresMaps = [
          scores[sub.id],
          scores[subDbId],
          oldIdMap.get(sub.id) ? scores[oldIdMap.get(sub.id)!] : undefined,
          oldIdMap.get(subDbId) ? scores[oldIdMap.get(subDbId)!] : undefined,
          sub.code ? scores[sub.code.trim()] : undefined,
          nCode ? scores[nCode] : undefined
        ].filter(Boolean) as Record<string, StudentScoreRecord>[];

        for (const s of students) {
          let rec: StudentScoreRecord | undefined = undefined;
          for (const m of candidateScoresMaps) {
            const cand = m[s.studentId];
            if (cand) {
              if (!rec || (cand.c1 !== null && cand.c1 !== undefined) || (cand.formative1 !== null && cand.formative1 !== undefined && rec.formative1 === null)) {
                rec = cand;
              }
            }
          }
          if (!rec) continue;

          // Encode 10-score records and custom weights into updated_by (Carrier Pattern)
          const baseTeacher = config.homeroomTeacher || 'ครูประจำชั้น';
          const c1Val = rec.c1 !== null && rec.c1 !== undefined
            ? rec.c1
            : (rec.formative1 !== null && rec.formative1 !== undefined && rec.c2 === null && rec.c3 === null && rec.c4 === null ? rec.formative1 : '');
          const c5Val = rec.c5 !== null && rec.c5 !== undefined
            ? rec.c5
            : (rec.midterm1 !== null && rec.midterm1 !== undefined ? rec.midterm1 : '');
          const c10Val = rec.c10 !== null && rec.c10 !== undefined
            ? rec.c10
            : (rec.final2 !== null && rec.final2 !== undefined ? rec.final2 : '');

          const subScoresTag = [
            c1Val,
            rec.c2 !== null && rec.c2 !== undefined ? rec.c2 : '',
            rec.c3 !== null && rec.c3 !== undefined ? rec.c3 : '',
            rec.c4 !== null && rec.c4 !== undefined ? rec.c4 : '',
            c5Val,
            rec.cRetakeMidterm !== null && rec.cRetakeMidterm !== undefined ? rec.cRetakeMidterm : '',
            rec.c6 !== null && rec.c6 !== undefined ? rec.c6 : '',
            rec.c7 !== null && rec.c7 !== undefined ? rec.c7 : '',
            rec.c8 !== null && rec.c8 !== undefined ? rec.c8 : '',
            rec.c9 !== null && rec.c9 !== undefined ? rec.c9 : '',
            c10Val
          ].join(',');

          let carrier = `${baseTeacher}#MIS:${subScoresTag}`;
          if (sub.assessmentWeights) {
            const w = sub.assessmentWeights;
            carrier += `#W:${w.c1},${w.c2},${w.c3},${w.c4},${w.c5},${w.c6},${w.c7},${w.c8},${w.c9},${w.c10}`;
          }

          gradesPayload.push({
            student_id: s.studentId,
            subject_id: subDbId,
            academic_year: config.academicYear,
            semester: config.semester,
            formative1: rec.formative1,
            midterm1: rec.midterm1,
            final1: rec.final1,
            total1: rec.total1,
            formative2: rec.formative2,
            midterm2: rec.midterm2,
            final2: rec.final2,
            total2: rec.total2,
            yearly_total: rec.yearlyTotal,
            grade: rec.grade || '-',
            is_passed: rec.isPassed ?? true,
            updated_by: carrier,
            updated_at: new Date().toISOString()
          });
        }
      }

      if (gradesPayload.length > 0) {
        const { error: gradeErr } = await supabase
          .from('student_grades')
          .upsert(gradesPayload, { onConflict: 'student_id,subject_id,academic_year' });
        if (gradeErr) throw new Error(`ไม่สามารถซิงค์คะแนน: ${gradeErr.message}`);
        totalSynced += gradesPayload.length;
      }

      // 3. Sync Health & Growth (BMI)
      const healthPayload = students.map(s => {
        const evalResult = GrowthEngine.evaluateGrowth(s.gender, s.ageYears, s.weight, s.height);

        return {
          student_id: s.studentId,
          academic_year: config.academicYear,
          semester: config.semester,
          age_years: s.ageYears,
          weight: s.weight,
          height: s.height,
          bmi: evalResult.bmi,
          weight_for_height: evalResult.weightForHeight,
          height_for_age: evalResult.heightForAge,
          weight_for_age: evalResult.weightForAge,
          recorded_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        };
      });

      if (healthPayload.length > 0) {
        const { error: healthErr } = await supabase
          .from('student_health_growth')
          .upsert(healthPayload, { onConflict: 'student_id,academic_year,semester' });
        if (healthErr) throw new Error(`ไม่สามารถซิงค์ข้อมูลสุขภาพ: ${healthErr.message}`);
        totalSynced += healthPayload.length;
      }

      // 4. Sync Attendance Summary if available
      if (attendanceRecords && Object.keys(attendanceRecords).length > 0) {
        const attPayload = students.map(s => {
          const att = attendanceRecords[s.studentId] || { present: 200, leave: 0, sick: 0, absent: 0, late: 0 };
          const present = Number(att.present ?? 200);
          const leave = Number(att.leave ?? 0);
          const sick = Number(att.sick ?? 0);
          const absent = Number(att.absent ?? 0);
          const late = Number(att.late ?? 0);
          const total = present + leave + sick + absent + late || 200;
          const percent = total > 0 ? Math.round((present / total) * 1000) / 10 : 100.0;

          return {
            student_id: s.studentId,
            academic_year: config.academicYear,
            semester: config.semester,
            present_days: present,
            leave_days: leave,
            sick_days: sick,
            absent_days: absent,
            total_school_days: total,
            attendance_percent: percent,
            has_exam_eligibility: percent >= 80,
            updated_at: new Date().toISOString()
          };
        });

        if (attPayload.length > 0) {
          try {
            const { error: attErr } = await supabase
              .from('student_attendance_summary')
              .upsert(attPayload, { onConflict: 'student_id,academic_year,semester' });
            if (!attErr) {
              totalSynced += attPayload.length;
            }
          } catch (e) {
            console.warn('Cannot sync student_attendance_summary:', e);
          }
        }
      }

      // Log successful sync locally
      await localDb.syncLogs.add({
        timestamp: new Date().toISOString(),
        classLevel,
        scope: 'full_class_sync',
        recordCount: totalSynced,
        status: 'success',
        message: `ซิงค์คะแนนและข้อมูลชั้น ${classLevel} สำเร็จ (${totalSynced} รายการ)`
      });

      return {
        success: true,
        syncedCount: totalSynced,
        message: `ซิงค์ข้อมูลชั้น ${classLevel} ขึ้นระบบโรงเรียนเรียบร้อย (${totalSynced} รายการ)`,
        timestamp
      };

    } catch (err: any) {
      console.error('Cloud Sync Error:', err);
      // Log failed sync locally
      await localDb.syncLogs.add({
        timestamp: new Date().toISOString(),
        classLevel,
        scope: 'full_class_sync',
        recordCount: 0,
        status: 'failed',
        message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase'
      });

      return {
        success: false,
        syncedCount: 0,
        message: `การซิงค์ล้มเหลว: ${err.message || 'เน็ตหลุดหรือไม่สามารถเข้าถึงเซิร์ฟเวอร์'}`,
        error: err.message,
        timestamp
      };
    }
  }

  /**
   * ตรวจสอบจำนวนรายการที่รอซิงค์ใน Outbox (Offline Queue)
   */
  static async getOutboxCount(): Promise<number> {
    try {
      return await localDb.outbox.count();
    } catch {
      return 0;
    }
  }

  /**
   * ซิงค์ข้อมูลการประเมินพัฒนาการระดับปฐมวัย (อ.1 - อ.3) ขึ้น Supabase Cloud จริง
   * บันทึกข้อมูลสุขภาพ (student_health_growth), เวลาเรียน (student_attendance_summary), 
   * และผลการประเมิน 12 มาตรฐาน (subjects + student_grades และ kindergarten_assessments)
   */
  static async syncKindergartenClassToCloud(
    classLevel: string,
    academicYear: string,
    semester: number,
    students: StudentProfile[],
    assessments: Record<string, KindergartenStudentAssessment>,
    config: AcademicConfig
  ): Promise<SyncResult> {
    const timestamp = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!isSupabaseConfigured || !supabase) {
      return {
        success: false,
        syncedCount: 0,
        message: 'ยังไม่ได้เชื่อมต่อ Supabase หรืออยู่ในโหมดออฟไลน์',
        timestamp
      };
    }

    try {
      let totalSynced = 0;

      // 1. ซิงค์มาตรฐานปฐมวัย 12 มาตรฐานเข้าตาราง subjects
      const stdSubjectsPayload = KINDERGARTEN_STANDARDS.map(std => {
        const code = `K-STD-${String(std.id).padStart(2, '0')}`;
        return {
          code,
          name: std.title,
          type: 'ปฐมวัย',
          credits: 0,
          class_level: classLevel,
          academic_year: academicYear
        };
      });

      await supabase
        .from('subjects')
        .upsert(stdSubjectsPayload, { onConflict: 'code,class_level,academic_year' });

      // ดึง mapping ของ subject id
      const { data: dbSubjects } = await supabase
        .from('subjects')
        .select('id, code')
        .eq('class_level', classLevel)
        .eq('academic_year', academicYear);

      const codeToIdMap = new Map<string, string>();
      dbSubjects?.forEach(s => {
        if (s.code) codeToIdMap.set(s.code.trim().toUpperCase(), s.id);
      });

      // 2. ซิงค์ผลการประเมิน 12 มาตรฐานลง student_grades
      const gradesPayload: any[] = [];
      for (const s of students) {
        const stuAssess = assessments[s.studentId];
        if (!stuAssess?.standards) continue;

        for (let stdId = 1; stdId <= 12; stdId++) {
          const code = `K-STD-${String(stdId).padStart(2, '0')}`;
          const subId = codeToIdMap.get(code);
          if (!subId) continue;

          const level = stuAssess.standards[stdId] || 3;
          gradesPayload.push({
            student_id: s.studentId,
            subject_id: subId,
            academic_year: academicYear,
            semester,
            yearly_total: level,
            grade: String(level),
            is_passed: true,
            updated_by: stuAssess.teacherComment || config.homeroomTeacher || 'ครูประจำชั้นอนุบาล',
            updated_at: new Date().toISOString()
          });
        }
      }

      if (gradesPayload.length > 0) {
        const { error: gradesErr } = await supabase
          .from('student_grades')
          .upsert(gradesPayload, { onConflict: 'student_id,subject_id,academic_year' });
        if (!gradesErr) {
          totalSynced += gradesPayload.length;
        }
      }

      // 3. ซิงค์ข้อมูลสุขภาพและการเจริญเติบโตลง student_health_growth
      const healthPayload = students.map(s => {
        const stuAssess = assessments[s.studentId];
        const weight = s.weight || stuAssess?.healthInfo?.weight || 0;
        const height = s.height || stuAssess?.healthInfo?.height || 0;
        const evalResult = GrowthEngine.evaluateGrowth(s.gender, s.ageYears || 5, weight, height);

        return {
          student_id: s.studentId,
          academic_year: academicYear,
          semester,
          age_years: s.ageYears || 5,
          weight,
          height,
          bmi: evalResult.bmi,
          weight_for_height: evalResult.weightForHeight,
          height_for_age: evalResult.heightForAge,
          weight_for_age: evalResult.weightForAge,
          recorded_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        };
      }).filter(h => h.weight > 0 && h.height > 0);

      if (healthPayload.length > 0) {
        await supabase
          .from('student_health_growth')
          .upsert(healthPayload, { onConflict: 'student_id,academic_year,semester' });
        totalSynced += healthPayload.length;
      }

      // 4. ซิงค์สถิติเวลาเรียนลง student_attendance_summary
      const attPayload = students.map(s => {
        const stuAssess = assessments[s.studentId];
        const att = stuAssess?.attendance || { presentDays: 98, totalDays: 100, leaveDays: 1, sickDays: 1 };
        const total = att.totalDays || 100;
        const present = att.presentDays || 98;
        const percent = total > 0 ? Math.round((present / total) * 1000) / 10 : 98.0;

        return {
          student_id: s.studentId,
          academic_year: academicYear,
          semester,
          present_days: present,
          leave_days: att.leaveDays || 0,
          sick_days: att.sickDays || 0,
          absent_days: 0,
          total_school_days: total,
          attendance_percent: percent,
          has_exam_eligibility: percent >= 80,
          updated_at: new Date().toISOString()
        };
      });

      if (attPayload.length > 0) {
        await supabase
          .from('student_attendance_summary')
          .upsert(attPayload, { onConflict: 'student_id,academic_year,semester' });
        totalSynced += attPayload.length;
      }

      // 5. บันทึกลงตารางเฉพาะ kindergarten_assessments (หากมีการรัน migration แล้ว)
      try {
        const kTablePayload = students.map(s => {
          const a = assessments[s.studentId];
          if (!a) return null;
          return {
            student_id: s.studentId,
            class_level: classLevel,
            academic_year: academicYear,
            term: semester,
            standards: a.standards || {},
            teacher_comment: a.teacherComment || '',
            health_info: a.healthInfo || {},
            attendance: a.attendance || {},
            updated_at: new Date().toISOString()
          };
        }).filter(Boolean);

        if (kTablePayload.length > 0) {
          await supabase.from('kindergarten_assessments').upsert(kTablePayload, { onConflict: 'student_id,academic_year,term' });
        }
      } catch (kTableErr) {
        // ข้ามหากยังไม่ได้สร้างตาราง kindergarten_assessments (เพราะข้อมูลถูก sync ลง student_grades เรียบร้อยแล้ว)
      }

      return {
        success: true,
        syncedCount: totalSynced,
        message: `ซิงค์ข้อมูลพัฒนาการชั้น ${classLevel} ขึ้นฐานข้อมูลจริงสำเร็จ (${totalSynced} รายการ)`,
        timestamp
      };
    } catch (err: any) {
      console.error('Kindergarten Cloud Sync Error:', err);
      return {
        success: false,
        syncedCount: 0,
        message: `การซิงค์ล้มเหลว: ${err.message}`,
        error: err.message,
        timestamp
      };
    }
  }

  /**
   * ดึงข้อมูลพัฒนาการระดับปฐมวัยจาก Supabase Cloud
   */
  static async fetchKindergartenFromCloud(academicYear: string = '2569'): Promise<Record<string, Record<string, KindergartenStudentAssessment>> | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      // 1. ลองดึงจากตาราง kindergarten_assessments
      const { data: kData, error: kErr } = await supabase
        .from('kindergarten_assessments')
        .select('*')
        .eq('academic_year', academicYear);

      if (!kErr && kData && kData.length > 0) {
        const result: Record<string, Record<string, KindergartenStudentAssessment>> = {};
        kData.forEach((row: any) => {
          const cls = row.class_level || 'อ.2';
          if (!result[cls]) result[cls] = {};
          result[cls][row.student_id] = {
            studentId: row.student_id,
            classLevel: cls,
            academicYear: row.academic_year,
            term: row.term || 1,
            standards: row.standards || {},
            teacherComment: row.teacher_comment || '',
            healthInfo: row.health_info || {},
            attendance: row.attendance || { presentDays: 98, totalDays: 100 }
          };
        });
        return result;
      }

      // 2. ดึงจาก subjects + student_grades ที่เชื่อมโยงไว้
      const { data: dbSubjects } = await supabase
        .from('subjects')
        .select('id, code, class_level')
        .eq('type', 'ปฐมวัย')
        .eq('academic_year', academicYear);

      if (!dbSubjects || dbSubjects.length === 0) return null;

      const subIdToStdId = new Map<string, number>();
      dbSubjects.forEach(s => {
        const match = s.code?.match(/K-STD-(\d+)/);
        if (match) {
          subIdToStdId.set(s.id, parseInt(match[1], 10));
        }
      });

      const { data: dbGrades } = await supabase
        .from('student_grades')
        .select('*')
        .in('subject_id', Array.from(subIdToStdId.keys()))
        .eq('academic_year', academicYear);

      if (!dbGrades || dbGrades.length === 0) return null;

      const result: Record<string, Record<string, KindergartenStudentAssessment>> = {};

      dbGrades.forEach((g: any) => {
        const stdId = subIdToStdId.get(g.subject_id);
        if (!stdId) return;

        const sub = dbSubjects.find(s => s.id === g.subject_id);
        const cls = sub?.class_level || 'อ.2';
        if (!result[cls]) result[cls] = {};
        if (!result[cls][g.student_id]) {
          result[cls][g.student_id] = {
            studentId: g.student_id,
            classLevel: cls,
            academicYear,
            term: g.semester || 1,
            standards: {},
            teacherComment: g.updated_by || ''
          };
        }
        const val = Number(g.yearly_total) || Number(g.grade) || 3;
        result[cls][g.student_id].standards[stdId] = val as QualityLevel;
      });

      return Object.keys(result).length > 0 ? result : null;
    } catch (e) {
      console.warn('Cannot fetch kindergarten from cloud:', e);
      return null;
    }
  }

  private static isFlushingOutbox = false;

  /**
   * ดึงข้อมูลสรุปเวลาเรียนจาก Supabase Cloud (student_attendance_summary)
   * เพื่อ Rehydrate สถานะเวลาเรียนของทุกชั้นเรียน (ป.1 - ป.6) เมื่อเปิดแอปหรือซิงค์ข้อมูล
   */
  static async fetchAttendanceFromCloud(academicYear: string = '2569'): Promise<Record<string, AttendanceDetail> | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('student_attendance_summary')
        .select('*')
        .eq('academic_year', academicYear);

      if (error) {
        console.warn('Cannot fetch attendance from cloud:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const result: Record<string, AttendanceDetail> = {};
      data.forEach((row: any) => {
        result[row.student_id] = {
          present: Number(row.present_days) || 0,
          leave: Number(row.leave_days) || 0,
          sick: Number(row.sick_days) || 0,
          absent: Number(row.absent_days) || 0,
          late: 0,
          dailyRecords: {},
          monthlyRecords: {}
        };
      });

      return result;
    } catch (e) {
      console.warn('Exception in fetchAttendanceFromCloud:', e);
      return null;
    }
  }

  /**
   * ดึงข้อมูลคะแนนทั้งหมดจาก Supabase Cloud (On-Launch Rehydration)
   * เพื่อนำมาผสานเข้ากับ Local State ทันทีที่เปิดแอป
   */
  static async fetchAllScoresFromCloud(academicYear: string = '2569'): Promise<{
    scores: Record<string, Record<string, Record<string, StudentScoreRecord>>>;
    subjectsMap: Record<string, SubjectConfig[]>;
  } | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const [gradesRes, subjectsRes] = await Promise.all([
        supabase
          .from('student_grades')
          .select('*')
          .eq('academic_year', academicYear)
          .limit(5000),
        supabase
          .from('subjects')
          .select('*')
          .eq('academic_year', academicYear)
          .limit(5000)
      ]);

      if (gradesRes.error || subjectsRes.error) {
        console.warn('Cannot fetch cloud scores/subjects:', gradesRes.error || subjectsRes.error);
        return null;
      }

      const dbGrades = gradesRes.data || [];
      const dbSubjects = subjectsRes.data || [];

      if (dbGrades.length === 0 && dbSubjects.length === 0) return null;

      const normCode = (c: string) => (c || '').replace(/\s+/g, '').toUpperCase();
      // จัดกลุ่มวิชาตาม class_level พร้อมตัดวิชาที่ซ้ำกัน (Deduplicate by normalized code)
      const subjectsMap: Record<string, SubjectConfig[]> = {};
      const subjectLookup = new Map<string, { classLevel: string; subjectId: string }>();

      dbSubjects.forEach(s => {
        const cls = s.class_level?.trim() || 'ป.1';
        if (!subjectsMap[cls]) subjectsMap[cls] = [];

        const nCode = normCode(s.code);
        const existingInCls = subjectsMap[cls].find(item => normCode(item.code) === nCode);

        let activeSubId = s.id;
        if (existingInCls) {
          activeSubId = existingInCls.id;
        } else {
          const subConfig: SubjectConfig = {
            id: s.id,
            code: s.code?.trim() || '',
            name: s.name?.trim() || '',
            type: (s.type || 'พื้นฐาน') as any,
            credits: Number(s.credits) || 1,
            hoursPerYear: Number(s.hours_per_year) || 80,
            fullScoreTerm1: Number(s.full_score_term1) || 50,
            fullScoreTerm2: Number(s.full_score_term2) || 50
          };
          subjectsMap[cls].push(subConfig);
        }

        subjectLookup.set(s.id, { classLevel: cls, subjectId: activeSubId });
        if (s.code) {
          subjectLookup.set(s.code.trim(), { classLevel: cls, subjectId: activeSubId });
          subjectLookup.set(nCode, { classLevel: cls, subjectId: activeSubId });
        }
      });

      // จัดกลุ่มคะแนน: classLevel -> subjectId -> studentId -> StudentScoreRecord
      const scores: Record<string, Record<string, Record<string, StudentScoreRecord>>> = {};

      dbGrades.forEach(g => {
        const lookup = subjectLookup.get(g.subject_id) || subjectLookup.get(normCode(g.subject_id));
        if (!lookup) return;

        const { classLevel, subjectId } = lookup;
        if (!scores[classLevel]) scores[classLevel] = {};
        if (!scores[classLevel][subjectId]) scores[classLevel][subjectId] = {};

        // Parse carrier from g.updated_by
        let c1: number | null = null;
        let c2: number | null = null;
        let c3: number | null = null;
        let c4: number | null = null;
        let c5: number | null = null;
        let cRetakeMidterm: number | null = null;
        let c6: number | null = null;
        let c7: number | null = null;
        let c8: number | null = null;
        let c9: number | null = null;
        let c10: number | null = null;

        const rawUpdatedBy: string = g.updated_by || '';
        if (rawUpdatedBy.includes('#MIS:')) {
          const misPart = rawUpdatedBy.split('#MIS:')[1]?.split('#')[0];
          if (misPart) {
            const parts = misPart.split(',');
            const parseVal = (v?: string) => (v === undefined || v === '' || isNaN(Number(v))) ? null : Number(v);
            c1 = parseVal(parts[0]);
            c2 = parseVal(parts[1]);
            c3 = parseVal(parts[2]);
            c4 = parseVal(parts[3]);
            c5 = parseVal(parts[4]);
            cRetakeMidterm = parseVal(parts[5]);
            c6 = parseVal(parts[6]);
            c7 = parseVal(parts[7]);
            c8 = parseVal(parts[8]);
            c9 = parseVal(parts[9]);
            c10 = parseVal(parts[10]);
          }
        }

        // Parse custom weights for the subject from g.updated_by (if present)
        if (rawUpdatedBy.includes('#W:')) {
          const wPart = rawUpdatedBy.split('#W:')[1]?.split('#')[0];
          if (wPart) {
            const wVals = wPart.split(',').map(Number);
            if (wVals.length === 10 && !wVals.some(isNaN)) {
              const parsedWeights = {
                c1: wVals[0], c2: wVals[1], c3: wVals[2], c4: wVals[3], c5: wVals[4],
                c6: wVals[5], c7: wVals[6], c8: wVals[7], c9: wVals[8], c10: wVals[9]
              };
              if (subjectsMap[classLevel]) {
                const subObj = subjectsMap[classLevel].find(s => s.id === subjectId || normCode(s.code) === normCode(lookup.subjectId));
                if (subObj) {
                  subObj.assessmentWeights = parsedWeights;
                  subObj.fullScoreTerm1 = (parsedWeights.c1 + parsedWeights.c2 + parsedWeights.c3 + parsedWeights.c4) + parsedWeights.c5;
                  subObj.fullScoreTerm2 = (parsedWeights.c6 + parsedWeights.c7 + parsedWeights.c8 + parsedWeights.c9) + parsedWeights.c10;
                  saveSubjectAssessmentWeights(classLevel, subObj.code, parsedWeights);
                }
              }
            }
          }
        }

        // Smart fallback for c1, c5, c6, c10 from legacy summary columns if #MIS: was empty
        const effectiveC1 = c1 !== null ? c1 : (g.formative1 !== null && g.formative1 !== undefined && c2 === null && c3 === null && c4 === null ? Number(g.formative1) : null);
        const effectiveC5 = c5 !== null ? c5 : (g.midterm1 !== null && g.midterm1 !== undefined ? Number(g.midterm1) : null);
        const effectiveC6 = c6 !== null ? c6 : (g.formative2 !== null && g.formative2 !== undefined && c7 === null && c8 === null && c9 === null ? Number(g.formative2) : null);
        const effectiveC10 = c10 !== null ? c10 : (g.final2 !== null && g.final2 !== undefined ? Number(g.final2) : null);

        // Calculated sum helpers
        const hasPre = (effectiveC1 !== null) || (c2 !== null) || (c3 !== null) || (c4 !== null);
        const sumPre = hasPre ? ((effectiveC1 ?? 0) + (c2 ?? 0) + (c3 ?? 0) + (c4 ?? 0)) : g.formative1;
        const hasPost = (effectiveC6 !== null) || (c7 !== null) || (c8 !== null) || (c9 !== null);
        const sumPost = hasPost ? ((effectiveC6 ?? 0) + (c7 ?? 0) + (c8 ?? 0) + (c9 ?? 0)) : g.formative2;

        const scoreRecord: StudentScoreRecord = {
          studentId: g.student_id,
          formative1: sumPre,
          midterm1: effectiveC5,
          final1: g.final1,
          total1: (sumPre !== null || effectiveC5 !== null) ? ((sumPre ?? 0) + (effectiveC5 ?? 0)) : g.total1,
          formative2: sumPost,
          midterm2: g.midterm2,
          final2: effectiveC10,
          total2: (sumPost !== null || effectiveC10 !== null) ? ((sumPost ?? 0) + (effectiveC10 ?? 0)) : g.total2,
          yearlyTotal: g.yearly_total,
          grade: g.grade || '-',
          isPassed: g.is_passed ?? true,
          c1: effectiveC1,
          c2: c2,
          c3: c3,
          c4: c4,
          c5: effectiveC5,
          cRetakeMidterm: cRetakeMidterm,
          c6: effectiveC6,
          c7: c7,
          c8: c8,
          c9: c9,
          c10: effectiveC10,
          cSumPre: sumPre,
          cSumPost: sumPost,
          cSumFormative: (sumPre !== null && sumPre !== undefined ? sumPre : 0) + (effectiveC5 ?? 0) + (sumPost !== null && sumPost !== undefined ? sumPost : 0)
        };

        // Populate to ALL alias keys for this subject (UUID, code, normCode, mock IDs)
        const targetKeys = new Set<string>();
        targetKeys.add(subjectId);
        const dbSub = dbSubjects.find(s => s.id === g.subject_id);
        const subCode = dbSub?.code?.trim();
        if (subCode) {
          targetKeys.add(subCode);
          targetKeys.add(normCode(subCode));
        }

        // Match with default mock IDs in CLASS_SUBJECTS_MAP
        const defaultList = CLASS_SUBJECTS_MAP[classLevel] || [];
        const nCode = normCode(subCode || '');
        const matchedDefault = defaultList.find(item => normCode(item.code) === nCode);
        if (matchedDefault?.id) {
          targetKeys.add(matchedDefault.id);
          if (matchedDefault.id.startsWith('sub_p')) {
            const shortMockId = matchedDefault.id.replace(/sub_p\d+_/, 'sub_');
            targetKeys.add(shortMockId);
          }
        }

        targetKeys.forEach(k => {
          if (!scores[classLevel][k]) scores[classLevel][k] = {};
          scores[classLevel][k][g.student_id] = scoreRecord;
        });
      });

      return { scores, subjectsMap };
    } catch (err) {
      console.warn('Rehydration error from cloud:', err);
      return null;
    }
  }

  /**
   * ลบรายวิชาและคะแนนที่เกี่ยวข้องออกจาก Supabase Cloud ทันที (DB-First)
   */
  static async deleteSubjectAndGrades(
    subjectId: string,
    subjectCode?: string,
    classLevel?: string,
    academicYear: string = '2569'
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const normCode = (c: string) => (c || '').replace(/\s+/g, '').toUpperCase();
      const targetNormCode = subjectCode ? normCode(subjectCode) : '';

      let query = supabase
        .from('subjects')
        .select('id, code')
        .eq('academic_year', academicYear);

      if (classLevel) {
        query = query.eq('class_level', classLevel);
      }

      const { data: dbSubs, error } = await query;
      if (error) throw error;

      const matchedIds: string[] = [];
      dbSubs?.forEach(s => {
        if (s.id === subjectId) {
          matchedIds.push(s.id);
        } else if (targetNormCode && s.code && normCode(s.code) === targetNormCode) {
          matchedIds.push(s.id);
        }
      });

      if (matchedIds.length === 0 && subjectId) {
        matchedIds.push(subjectId);
      }

      if (matchedIds.length > 0) {
        // 1. ลบคะแนนใน student_grades ที่เชื่อมโยงกับวิชานี้
        await supabase
          .from('student_grades')
          .delete()
          .in('subject_id', matchedIds)
          .eq('academic_year', academicYear);

        // 2. ลบ subject_id ที่ตรงกับ code ตรงๆ (กรณีมี record เก่าที่เก็บ code เป็น subject_id)
        if (subjectCode) {
          await supabase
            .from('student_grades')
            .delete()
            .eq('subject_id', subjectCode.trim())
            .eq('academic_year', academicYear);
          if (targetNormCode) {
            await supabase
              .from('student_grades')
              .delete()
              .eq('subject_id', targetNormCode)
              .eq('academic_year', academicYear);
          }
        }

        // 3. ลบวิชาออกจากตาราง subjects
        await supabase
          .from('subjects')
          .delete()
          .in('id', matchedIds);
      }
    } catch (e) {
      console.warn('Error deleting subject and grades from cloud:', e);
    }
  }

  /**
   * ระบายคิว Outbox ที่ค้างอยู่ขึ้น Supabase (Auto-Sync Flush)
   * ป้องกัน Race Condition ด้วย Concurrency Lock
   */
  static async processPendingOutbox(): Promise<number> {
    if (this.isFlushingOutbox) return 0;
    if (!isSupabaseConfigured || !supabase) return 0;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

    this.isFlushingOutbox = true;
    try {
      const items = await localDb.outbox.orderBy('id').limit(50).toArray();
      if (!items || items.length === 0) return 0;

      let flushedCount = 0;
      for (const item of items) {
        try {
          if (item.entity === 'student_grades' && Array.isArray(item.payload)) {
            // Deduplicate payload within batch by composite key
            const dedupMap = new Map<string, any>();
            item.payload.forEach((p: any) => {
              const k = `${p.student_id}_${p.subject_id}_${p.academic_year}`;
              dedupMap.set(k, p);
            });
            const dedupedPayload = Array.from(dedupMap.values());

            const { error } = await supabase
              .from('student_grades')
              .upsert(dedupedPayload, { onConflict: 'student_id,subject_id,academic_year' });
            if (error) throw error;
          } else if (item.entity === 'student_health_growth' && Array.isArray(item.payload)) {
            const { error } = await supabase
              .from('student_health_growth')
              .upsert(item.payload, { onConflict: 'student_id,academic_year,semester' });
            if (error) throw error;
          } else if (item.entity === 'subjects' && Array.isArray(item.payload)) {
            const sanitized = item.payload.map((p: any) => ({
              ...p,
              id: isUuid(p.id) ? p.id : generateUuid()
            }));
            const { error } = await supabase
              .from('subjects')
              .upsert(sanitized, { onConflict: 'id' });
            if (error) throw error;
          }

          if (item.id) await localDb.outbox.delete(item.id);
          flushedCount++;
        } catch (itemErr: any) {
          console.warn(`Outbox item ${item.id} retry failed:`, itemErr);
          if (item.id) {
            await localDb.outbox.update(item.id, {
              tries: (item.tries || 0) + 1,
              lastError: itemErr.message
            });
          }
        }
      }
      return flushedCount;
    } catch (err) {
      console.warn('Error processing outbox:', err);
      return 0;
    } finally {
      this.isFlushingOutbox = false;
    }
  }

  /**
   * ระบบ Auto-Sync เบื้องหลัง (Non-blocking Background Auto-Sync)
   * บันทึก Local-First ทันที หากต่อเน็ตได้จะ Push ขึ้น Cloud หากเน็ตหลุดจะเก็บเข้า Outbox
   */
  static async autoSyncClassToCloud(
    classLevel: string,
    subjects: SubjectConfig[],
    students: StudentProfile[],
    scores: Record<string, Record<string, StudentScoreRecord>>,
    config: AcademicConfig,
    attendanceRecords?: Record<string, AttendanceDetail>
  ): Promise<void> {
    const isOnline = typeof navigator === 'undefined' || navigator.onLine;

    if (isOnline && isSupabaseConfigured && supabase) {
      // ซิงค์ตรงแบบ background
      this.syncClassToCloud(classLevel, subjects, students, scores, config, attendanceRecords)
        .catch(async () => {
          // หากเกิดข้อผิดพลาด ให้พักใส่ Outbox
          await this.queueClassToOutbox(classLevel, subjects, students, scores, config);
        });
    } else {
      // ออฟไลน์: พักใส่ Outbox ทันที
      await this.queueClassToOutbox(classLevel, subjects, students, scores, config);
    }
  }

  /**
   * ระบบ Auto-Sync สำหรับระดับปฐมวัย (อ.1 - อ.3)
   */
  static async autoSyncKindergartenToCloud(
    classLevel: string,
    students: StudentProfile[],
    assessments: Record<string, KindergartenStudentAssessment>,
    config: AcademicConfig
  ): Promise<void> {
    const isOnline = typeof navigator === 'undefined' || navigator.onLine;

    if (isOnline && isSupabaseConfigured && supabase) {
      this.syncKindergartenClassToCloud(
        classLevel,
        config.academicYear,
        config.semester,
        students,
        assessments,
        config
      ).catch(err => console.warn('Auto sync kindergarten failed:', err));
    }
  }

  private static async queueClassToOutbox(
    classLevel: string,
    subjects: SubjectConfig[],
    students: StudentProfile[],
    scores: Record<string, Record<string, StudentScoreRecord>>,
    config: AcademicConfig
  ): Promise<void> {
    try {
      const normCode = (c: string) => (c || '').replace(/\s+/g, '').toUpperCase();
      const gradesPayload: any[] = [];

      for (const sub of subjects) {
        const nCode = normCode(sub.code);
        const candidateScoresMaps = [
          scores[sub.id],
          sub.code ? scores[sub.code.trim()] : undefined,
          nCode ? scores[nCode] : undefined
        ].filter(Boolean) as Record<string, StudentScoreRecord>[];

        for (const s of students) {
          let rec: StudentScoreRecord | undefined = undefined;
          for (const m of candidateScoresMaps) {
            const cand = m[s.studentId];
            if (cand) {
              if (!rec || (cand.c1 !== null && cand.c1 !== undefined) || (cand.formative1 !== null && cand.formative1 !== undefined && rec.formative1 === null)) {
                rec = cand;
              }
            }
          }
          if (!rec) continue;

          // Encode 10-score records and custom weights into updated_by (Carrier Pattern)
          const baseTeacher = config.homeroomTeacher || 'ครูประจำชั้น';
          const c1Val = rec.c1 !== null && rec.c1 !== undefined
            ? rec.c1
            : (rec.formative1 !== null && rec.formative1 !== undefined && rec.c2 === null && rec.c3 === null && rec.c4 === null ? rec.formative1 : '');
          const c5Val = rec.c5 !== null && rec.c5 !== undefined
            ? rec.c5
            : (rec.midterm1 !== null && rec.midterm1 !== undefined ? rec.midterm1 : '');
          const c10Val = rec.c10 !== null && rec.c10 !== undefined
            ? rec.c10
            : (rec.final2 !== null && rec.final2 !== undefined ? rec.final2 : '');

          const subScoresTag = [
            c1Val,
            rec.c2 !== null && rec.c2 !== undefined ? rec.c2 : '',
            rec.c3 !== null && rec.c3 !== undefined ? rec.c3 : '',
            rec.c4 !== null && rec.c4 !== undefined ? rec.c4 : '',
            c5Val,
            rec.cRetakeMidterm !== null && rec.cRetakeMidterm !== undefined ? rec.cRetakeMidterm : '',
            rec.c6 !== null && rec.c6 !== undefined ? rec.c6 : '',
            rec.c7 !== null && rec.c7 !== undefined ? rec.c7 : '',
            rec.c8 !== null && rec.c8 !== undefined ? rec.c8 : '',
            rec.c9 !== null && rec.c9 !== undefined ? rec.c9 : '',
            c10Val
          ].join(',');

          let carrier = `${baseTeacher}#MIS:${subScoresTag}`;
          if (sub.assessmentWeights) {
            const w = sub.assessmentWeights;
            carrier += `#W:${w.c1},${w.c2},${w.c3},${w.c4},${w.c5},${w.c6},${w.c7},${w.c8},${w.c9},${w.c10}`;
          }

          gradesPayload.push({
            student_id: s.studentId,
            subject_id: sub.id,
            academic_year: config.academicYear,
            semester: config.semester,
            formative1: rec.formative1,
            midterm1: rec.midterm1,
            final1: rec.final1,
            total1: rec.total1,
            formative2: rec.formative2,
            midterm2: rec.midterm2,
            final2: rec.final2,
            total2: rec.total2,
            yearly_total: rec.yearlyTotal,
            grade: rec.grade || '-',
            is_passed: rec.isPassed ?? true,
            updated_by: carrier,
            updated_at: new Date().toISOString()
          });
        }
      }

      if (gradesPayload.length > 0) {
        await localDb.outbox.add({
          entity: 'student_grades',
          classLevel,
          payload: gradesPayload,
          createdAt: new Date().toISOString(),
          tries: 0
        });
      }
    } catch (e) {
      console.warn('Failed to queue to outbox:', e);
    }
  }
}
