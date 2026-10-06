import { SubjectAssessmentWeights } from '../types/pp5Types';

const STORAGE_KEY = 'pp5_subject_assessment_weights';

/**
 * ดึงคลังการตั้งค่าน้ำหนักคะแนนเต็ม 10 ครั้งรายวิชาทั้งหมดที่เคยบันทึกไว้ใน LocalStorage
 */
export const getSubjectAssessmentWeightsStore = (): Record<string, SubjectAssessmentWeights> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read subject assessment weights store:', err);
    return {};
  }
};

/**
 * บันทึกน้ำหนักคะแนนเต็ม 10 ครั้งของรายวิชาลง LocalStorage แบบถาวร
 * บันทึกทั้งแบบผูกชั้นเรียน (เช่น 'ป.1_ว11101') และแบบรหัสวิชาตรง (เช่น 'ว11101')
 */
export const saveSubjectAssessmentWeights = (
  classLevel: string,
  subjectCode: string,
  weights: SubjectAssessmentWeights
): void => {
  if (!subjectCode) return;
  try {
    const store = getSubjectAssessmentWeightsStore();
    const normCode = subjectCode.trim().toUpperCase();
    const normCls = (classLevel || '').trim();

    if (normCls) {
      store[`${normCls}_${normCode}`] = weights;
    }
    store[normCode] = weights;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save subject assessment weights:', err);
  }
};

/**
 * ค้นหาน้ำหนักคะแนนเต็มของรายวิชาจากคลัง LocalStorage
 */
export const findSavedAssessmentWeights = (
  classLevel: string,
  subjectCode: string,
  subjectId?: string
): SubjectAssessmentWeights | null => {
  const store = getSubjectAssessmentWeightsStore();
  const normCode = (subjectCode || '').trim().toUpperCase();
  const normCls = (classLevel || '').trim();

  // 1. ลองค้นหาด้วย classLevel + normCode (เฉพาะเจาะจงสูงสุด)
  if (normCls && normCode && store[`${normCls}_${normCode}`]) {
    return store[`${normCls}_${normCode}`];
  }

  // 2. ลองค้นหาด้วย normCode
  if (normCode && store[normCode]) {
    return store[normCode];
  }

  // 3. ลองค้นหาด้วย subjectId
  if (subjectId && store[subjectId]) {
    return store[subjectId];
  }

  return null;
};
