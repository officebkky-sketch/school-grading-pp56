// src/data/initialKindergartenData.ts
import { KindergartenStudentAssessment } from '../types/kindergartenTypes';

// ข้อมูลตั้งต้นการประเมินพัฒนาการระดับปฐมวัย (อ.2 และ อ.3) โรงเรียนบ้านควนโคกยา
export const INITIAL_KINDERGARTEN_ASSESSMENTS: Record<string, Record<string, KindergartenStudentAssessment>> = {
  // key: classLevel (เช่น 'อ.2', 'อ.3') -> key: studentId -> Assessment
  'อ.2': {
    'stu_3865': {
      studentId: 'stu_3865',
      classLevel: 'อ.2',
      academicYear: '2569',
      term: 1,
      standards: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 2, 11: 3, 12: 3
      },
      teacherComment: 'เด็กหญิงณิรินทร์รดา มีพัฒนาการด้านร่างกายและอารมณ์ดีมาก อารมณ์ร่าเริงแจ่มใส ชอบร่วมกิจกรรมดนตรีและศิลปะ มีน้ำใจแบ่งปันของเล่นกับเพื่อนๆ ในห้องเรียน ด้านสติปัญญาสามารถสื่อสารเล่าเรื่องราวได้ดี ควรส่งเสริมทักษะการสังเกตและจำแนกสิ่งของเพิ่มเติมร่วมกับผู้ปกครองค่ะ',
      healthInfo: {
        weight: 21,
        height: 107,
        teethCheck: 'ปกติ',
        teethCavitiesCount: 0,
        hairCleanliness: 'สะอาด',
        nailCleanliness: 'สะอาด',
        nutritionStatus: 'สมส่วน',
        growthHeightStatus: 'สูงตามเกณฑ์'
      },
      attendance: {
        presentDays: 96,
        totalDays: 100,
        leaveDays: 2,
        sickDays: 2
      }
    }
  },
  'อ.3': {
    'stu_3853': {
      studentId: 'stu_3853',
      classLevel: 'อ.3',
      academicYear: '2569',
      term: 1,
      standards: {
        1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3
      },
      teacherComment: 'เด็กชายณัฐภัทร มีพัฒนาการสมวัยทั้ง 4 ด้านอย่างดีเยี่ยม ร่างกายแข็งแรง คล่องแคล่ว มีความเป็นผู้นำ ช่วยเหลือคุณครูและเพื่อนๆ ได้ดี มีความกระตือรือร้นในการเรียนรู้และแก้ปัญหาได้ด้วยตนเอง มีมารยาทดีมากค่ะ',
      healthInfo: {
        weight: 24,
        height: 111,
        teethCheck: 'ปกติ',
        teethCavitiesCount: 0,
        hairCleanliness: 'สะอาด',
        nailCleanliness: 'สะอาด',
        nutritionStatus: 'สมส่วน',
        growthHeightStatus: 'สูงตามเกณฑ์'
      },
      attendance: {
        presentDays: 98,
        totalDays: 100,
        leaveDays: 1,
        sickDays: 1
      }
    },
    'stu_3863': {
      studentId: 'stu_3863',
      classLevel: 'อ.3',
      academicYear: '2569',
      term: 1,
      standards: {
        1: 2, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 3, 8: 2, 9: 3, 10: 2, 11: 3, 12: 3
      },
      teacherComment: 'เด็กชายเตชิน มีความสุขในการร่วมกิจกรรม ร่าเริง อัธยาศัยดี มีความคิดสร้างสรรค์ในการวาดภาพระบายสี ควรส่งเสริมการรับประทานอาหารให้หลากหลายและดูแลโภชนาการเพิ่มน้ำหนักตัวให้สมส่วนยิ่งขึ้น รวมถึงฝึกการช่วยเหลือตนเองในการจัดเก็บของใช้ประจำตัวค่ะ',
      healthInfo: {
        weight: 14.3,
        height: 105,
        teethCheck: 'มีฟันผุ',
        teethCavitiesCount: 1,
        hairCleanliness: 'สะอาด',
        nailCleanliness: 'สะอาด',
        nutritionStatus: 'ค่อนข้างผอม',
        growthHeightStatus: 'สูงตามเกณฑ์'
      },
      attendance: {
        presentDays: 94,
        totalDays: 100,
        leaveDays: 3,
        sickDays: 3
      }
    }
  }
};
