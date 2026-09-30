// src/data/initialHolisticData.ts
// Authentic Holistic Assessment & Learner Activities Data for Ban Khuan Khok Ya School (Primary 1 / ป.1)
import { HolisticDetail } from '../types/pp5Types';

const calculateLevel = (avg: number, hasZero: boolean): { score: number; label: 'ดีเยี่ยม' | 'ดี' | 'ผ่าน' | 'ไม่ผ่าน' } => {
  if (hasZero) return { score: 1, label: 'ผ่าน' };
  if (avg >= 2.50) return { score: 3, label: 'ดีเยี่ยม' };
  if (avg >= 1.50) return { score: 2, label: 'ดี' };
  if (avg >= 1.00) return { score: 1, label: 'ผ่าน' };
  return { score: 0, label: 'ไม่ผ่าน' };
};

export const RAW_P1_HOLISTIC_LIST = [
  { no: 1, id: "3797", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 2, id: "3823", attr: [3,2,3,3,2,3,3,3], read: [3,2,3,3,2], act: [38, 40, 28, 10] },
  { no: 3, id: "3824", attr: [2,2,2,3,2,2,3,2], read: [2,2,3,2,2], act: [36, 36, 26, 8] },
  { no: 4, id: "3843", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 5, id: "3856", attr: [3,3,2,3,2,3,2,3], read: [3,2,2,3,3], act: [38, 38, 28, 10] },
  { no: 6, id: "3872", attr: [3,3,3,3,2,3,3,2], read: [3,3,2,2,3], act: [38, 38, 28, 10] },
  { no: 7, id: "3825", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 8, id: "3840", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 9, id: "3841", attr: [3,3,2,3,3,3,2,3], read: [3,3,2,3,2], act: [38, 38, 28, 10] },
  { no: 10, id: "3842", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 11, id: "3844", attr: [3,2,3,2,2,3,3,2], read: [2,3,2,3,2], act: [38, 38, 26, 10] },
  { no: 12, id: "3845", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 13, id: "3848", attr: [3,2,2,3,2,3,2,3], read: [2,2,3,2,3], act: [36, 38, 26, 8] },
  { no: 14, id: "3849", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 15, id: "3855", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 16, id: "3861", attr: [3,3,2,3,3,3,3,3], read: [3,3,2,3,3], act: [38, 38, 28, 10] },
  { no: 17, id: "3864", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] },
  { no: 18, id: "3873", attr: [3,3,3,3,3,3,3,3], read: [3,3,3,3,3], act: [40, 40, 30, 10] }
];

export const INITIAL_P1_HOLISTIC_RECORDS: Record<string, HolisticDetail> = {};

RAW_P1_HOLISTIC_LIST.forEach(item => {
  const attrTotal = item.attr.reduce((a, b) => a + b, 0);
  const attrAvg = attrTotal / 8;
  const attrLvl = calculateLevel(attrAvg, item.attr.includes(0));

  const readTotal = item.read.reduce((a, b) => a + b, 0);
  const readAvg = readTotal / 5;
  const readLvl = calculateLevel(readAvg, item.read.includes(0));

  const pass1 = item.act[0] >= 32;
  const pass2 = item.act[1] >= 32;
  const pass3 = item.act[2] >= 24;
  const pass4 = item.act[3] >= 8;
  const isAllActivitiesPassed = pass1 && pass2 && pass3 && pass4;

  INITIAL_P1_HOLISTIC_RECORDS[item.id] = {
    traitsScore: attrLvl.score,
    competencyScore: 3, // สมรรถนะสำคัญ 5 ด้าน
    readingWriting: readLvl.label,
    activityPassed: isAllActivitiesPassed,
    attributeScores: [...item.attr],
    readingScores: [...item.read],
    activities: {
      guidanceHours: item.act[0],
      guidanceResult: pass1 ? 'ผ' : 'มผ',
      scoutHours: item.act[1],
      scoutResult: pass2 ? 'ผ' : 'มผ',
      clubName: 'ชุมนุมศิลป์สร้างสรรค์',
      clubHours: item.act[2],
      clubResult: pass3 ? 'ผ' : 'มผ',
      publicServiceHours: item.act[3],
      publicServiceResult: pass4 ? 'ผ' : 'มผ'
    }
  };
});

export const INITIAL_HOLISTIC: Record<string, Record<string, HolisticDetail>> = {
  'ป.1': INITIAL_P1_HOLISTIC_RECORDS
};
