// src/data/teachersData.ts

export interface TeacherProfile {
  id: string;
  name: string;
  role: 'academic_head' | 'homeroom_teacher' | 'director';
  roleTitle: string;
  assignedClasses: string[]; // e.g. ['ป.1'] or ['*'] for all classes
  phoneNumber?: string;
  signatureUrl?: string;
}

export const AUTHENTIC_DIRECTOR = {
  id: 'dir_01',
  name: 'นายเอกคณิต สิทธิศักดิ์',
  role: 'director' as const,
  roleTitle: 'ผู้อำนวยการโรงเรียน',
  assignedClasses: ['*']
};

export const DEFAULT_TEACHERS: TeacherProfile[] = [
  AUTHENTIC_DIRECTOR,
  {
    id: 'tch_head_academic',
    name: 'นางสาววัชรี พรหมช่วย',
    role: 'academic_head',
    roleTitle: 'หัวหน้าฝ่ายวิชาการ / นายทะเบียน',
    assignedClasses: ['*'], // Full access to all classes
    phoneNumber: '08X-XXX-XXXX'
  },
  {
    id: 'tch_k2_k3',
    name: 'นางสาวณัฐหทัย สงแสง',
    role: 'homeroom_teacher',
    roleTitle: 'ครูประจำชั้น อ.2 - อ.3',
    assignedClasses: ['อ.2', 'อ.3']
  },
  {
    id: 'tch_p1',
    name: 'นางสุธัญญา เทพเกื้อ',
    role: 'homeroom_teacher',
    roleTitle: 'ครูประจำชั้น ป.1',
    assignedClasses: ['ป.1']
  },
  {
    id: 'tch_p2',
    name: 'นางกานดา เอียดหมุน',
    role: 'homeroom_teacher',
    roleTitle: 'ครูประจำชั้น ป.2',
    assignedClasses: ['ป.2']
  },
  {
    id: 'tch_p3',
    name: 'นางสาวสุมาลี บิลยะแม',
    role: 'homeroom_teacher',
    roleTitle: 'ครูประจำชั้น ป.3',
    assignedClasses: ['ป.3']
  },
  {
    id: 'tch_p4',
    name: 'นางสาวปาริชาติ แก้วนวน',
    role: 'homeroom_teacher',
    roleTitle: 'ครูประจำชั้น ป.4',
    assignedClasses: ['ป.4']
  },
  {
    id: 'tch_p5',
    name: 'นางสาวชูไฮลา สุหรง',
    role: 'homeroom_teacher',
    roleTitle: 'ครูประจำชั้น ป.5',
    assignedClasses: ['ป.5']
  },
  {
    id: 'tch_p6',
    name: 'นางสาววัชรี พรหมช่วย',
    role: 'homeroom_teacher',
    roleTitle: 'ครูประจำชั้น ป.6',
    assignedClasses: ['ป.6']
  }
];

export const DEFAULT_CLASS_TEACHER_MAP: Record<string, string> = {
  'อ.2': 'นางสาวณัฐหทัย สงแสง',
  'อ.3': 'นางสาวณัฐหทัย สงแสง',
  'ป.1': 'นางสุธัญญา เทพเกื้อ',
  'ป.2': 'นางกานดา เอียดหมุน',
  'ป.3': 'นางสาวสุมาลี บิลยะแม',
  'ป.4': 'นางสาวปาริชาติ แก้วนวน',
  'ป.5': 'นางสาวชูไฮลา สุหรง',
  'ป.6': 'นางสาววัชรี พรหมช่วย'
};
