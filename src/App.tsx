// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AcademicConfig, StudentProfile, StudentScoreRecord, SubjectConfig, AttendanceDetail, HolisticDetail } from './types/pp5Types';
import { INITIAL_ROSTER } from './data/initialRosterData';
import { CLASS_SUBJECTS_MAP } from './data/classSubjectsData';
import { INITIAL_SCORES } from './data/initialScoresData';
import {
  DEFAULT_TEACHERS,
  DEFAULT_CLASS_TEACHER_MAP,
  AUTHENTIC_DIRECTOR,
  TeacherProfile
} from './data/teachersData';
import { AuthService, AuthenticatedUser } from './services/authService';
import { StudentSyncService } from './services/studentSyncService';
import { Header } from './components/Header';
import { TeacherAssignmentModal } from './components/TeacherAssignmentModal';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { OnlineStudentResultPortal } from './components/OnlineStudentResultPortal';
import { ClassroomRosterTab } from './components/ClassroomRosterTab';
import { SubjectMarksheetTab } from './components/SubjectMarksheetTab';
import { GradeSummaryAnalyticsTab } from './components/GradeSummaryAnalyticsTab';
import { HealthGrowthStudioTab } from './components/HealthGrowthStudioTab';
import { AttendanceTrackerTab } from './components/AttendanceTrackerTab';
import { HolisticAssessmentTab } from './components/HolisticAssessmentTab';
import { SarDashboardTab } from './components/SarDashboardTab';
import { PrintableStudioTab } from './components/PrintableStudioTab';
import { KindergartenAssessmentTab } from './components/KindergartenAssessmentTab';
import { KindergartenPrintableTab } from './components/KindergartenPrintableTab';
import { INITIAL_KINDERGARTEN_ASSESSMENTS } from './data/initialKindergartenData';
import { KindergartenStudentAssessment } from './types/kindergartenTypes';
import { sortSubjectConfigs } from './utils/subjectSortUtils';
import { CloudSyncBar } from './components/CloudSyncBar';
import { CloudSyncEngine } from './services/syncService';
import { OnlineAnnouncementControlModal } from './components/OnlineAnnouncementControlModal';
import { PortalQrModal } from './components/PortalQrModal';
import { INITIAL_ATTENDANCE } from './data/initialAttendanceData';
import { INITIAL_HOLISTIC } from './data/initialHolisticData';
import { AnnouncementService, AnnouncementConfig } from './services/announcementService';
import { CertificateVerifyPage } from './components/CertificateVerifyPage';
import { findSavedAssessmentWeights, saveSubjectAssessmentWeights } from './utils/weightStorage';

const hydrateSubjectsWithSavedWeights = (subjectsByClass: Record<string, SubjectConfig[]>): Record<string, SubjectConfig[]> => {
  const hydrated: Record<string, SubjectConfig[]> = {};
  for (const [cls, list] of Object.entries(subjectsByClass)) {
    hydrated[cls] = (list || []).map(s => {
      const weights = s.assessmentWeights || findSavedAssessmentWeights(cls, s.code, s.id);
      if (weights) {
        const term1 = (weights.c1 + weights.c2 + weights.c3 + weights.c4) + weights.c5;
        const term2 = (weights.c6 + weights.c7 + weights.c8 + weights.c9) + weights.c10;
        return {
          ...s,
          assessmentWeights: weights,
          fullScoreTerm1: term1,
          fullScoreTerm2: term2
        };
      }
      return s;
    });
  }
  return hydrated;
};
import {
  Users,
  BookOpen,
  GraduationCap,
  HeartPulse,
  CalendarCheck,
  Award,
  Printer,
  ShieldCheck,
  UserCheck,
  Baby,
  FileSpreadsheet
} from 'lucide-react';

const AUTHENTIC_SCHOOL_LOGO_URL = 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/school_logo_1779071201388.png';

export const App: React.FC = () => {
  const availableClasses = Object.keys(INITIAL_ROSTER);

  // ตรวจสอบ URL สำหรับ Certificate Verify Mode
  const isVerifyMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('verify') === '1';
  if (isVerifyMode) {
    return <CertificateVerifyPage />;
  }

  // View Mode: 'teacher' = ระบบจัดการ ปพ.5-6 ของครู | 'student_portal' = ระบบตรวจสอบผลการเรียน นร./ผู้ปกครอง
  const [viewMode, setViewMode] = useState<'teacher' | 'student_portal'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'portal' || params.has('nid') || params.has('sid')) {
        return 'student_portal';
      }
    }
    return 'teacher';
  });

  // Teacher Authentication & Scoping State
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(() => AuthService.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => {
    // เมื่อเปิดโปรแกรมเดสก์ท็อป/เว็บขึ้นมา ให้ตรวจสอบระบบจดจำการเข้าสู่ระบบอัตโนมัติ
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'portal' || params.has('nid') || params.has('sid')) {
        return false; // โหมดเช็คผลการเรียนนักเรียน/ผู้ปกครอง ไม่ต้องเด้ง Modal ครู
      }
      const remember = localStorage.getItem('pp5_remember_login') === 'true';
      const user = AuthService.getCurrentUser();
      if (remember && user) {
        return false; // Desktop Auto-Login: จดจำการเข้าสู่ระบบ ไม่ต้องเปิดหน้าต่างซ้ำ
      }
    }
    return true;
  });

  // Teacher Profiles & Class Mapping
  const [teachers, setTeachers] = useState<TeacherProfile[]>(() => {
    const saved = localStorage.getItem('pp5_teachers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_TEACHERS;
  });
  const [currentTeacher, setCurrentTeacher] = useState<TeacherProfile>(() => {
    if (authUser?.teacherProfile) return authUser.teacherProfile;
    const found = DEFAULT_TEACHERS.find(t => t.name === authUser?.displayName);
    return found || DEFAULT_TEACHERS[0];
  });

  const [classTeacherMap, setClassTeacherMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('pp5_class_teachers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_CLASS_TEACHER_MAP, ...parsed };
      } catch {}
    }
    return DEFAULT_CLASS_TEACHER_MAP;
  });
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // Online Announcement State (เฉพาะ ผอ. / หัวหน้าวิชาการ มีสิทธิ์เปิด/ปิดประกาศผล)
  const [announcementConfig, setAnnouncementConfig] = useState<AnnouncementConfig>(() => AnnouncementService.getConfig());
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isPortalQrModalOpen, setIsPortalQrModalOpen] = useState(false);

  // Academic Config
  const [config, setConfig] = useState<AcademicConfig>(() => {
    const saved = localStorage.getItem('pp5_config');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      academicYear: '2569',
      semester: 1,
      schoolId: import.meta.env.VITE_SCHOOL_ID || '93010069',
      schoolName: import.meta.env.VITE_SCHOOL_NAME || 'บ้านควนโคกยา',
      directorName: AUTHENTIC_DIRECTOR.name,
      homeroomTeacher: DEFAULT_CLASS_TEACHER_MAP['ป.1'] || 'นางสุธัญญา เทพเกื้อ',
      classLevel: 'ป.1',
      room: 1,
      totalSchoolDaysSemester1: 102,
      totalSchoolDaysSemester2: 106
    };
  });

  const [activeTab, setActiveTab] = useState<
    'roster' | 'marksheet' | 'analytics' | 'health' | 'attendance' | 'holistic' | 'sar' | 'print' | 'k_assessment' | 'k_print'
  >('marksheet');

  // บันทึกการประเมินพัฒนาการระดับปฐมวัย (อ.1 - อ.3) 12 มาตรฐาน 4 ด้าน
  const [kindergartenAssessments, setKindergartenAssessments] = useState<Record<string, Record<string, KindergartenStudentAssessment>>>(() => {
    const saved = localStorage.getItem('pp5_kindergarten_assessments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...INITIAL_KINDERGARTEN_ASSESSMENTS, ...parsed };
      } catch {}
    }
    return INITIAL_KINDERGARTEN_ASSESSMENTS;
  });

  const handleUpdateKindergartenAssessment = (studentId: string, assessment: KindergartenStudentAssessment) => {
    setKindergartenAssessments(prev => {
      const clsData = prev[config.classLevel] || {};
      const updated = {
        ...prev,
        [config.classLevel]: {
          ...clsData,
          [studentId]: assessment
        }
      };
      localStorage.setItem(`pp5_kindergarten_assessments_${config.academicYear}`, JSON.stringify(updated));
      localStorage.setItem('pp5_kindergarten_assessments', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBulkUpdateKindergartenAssessments = (records: Record<string, KindergartenStudentAssessment>) => {
    setKindergartenAssessments(prev => {
      const clsData = prev[config.classLevel] || {};
      const updated = {
        ...prev,
        [config.classLevel]: {
          ...clsData,
          ...records
        }
      };
      localStorage.setItem(`pp5_kindergarten_assessments_${config.academicYear}`, JSON.stringify(updated));
      localStorage.setItem('pp5_kindergarten_assessments', JSON.stringify(updated));
      return updated;
    });
  };

  // Students per class (อิงข้อมูลนักเรียนที่มีตัวตนอยู่จริง กรองคนย้ายออก)
  const [classStudents, setClassStudents] = useState<Record<string, StudentProfile[]>>(() => {
    const saved = localStorage.getItem('pp5_students');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_ROSTER;
  });

  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string>(() => {
    return localStorage.getItem('pp5_school_logo') || AUTHENTIC_SCHOOL_LOGO_URL;
  });
  const [directorSignatureUrl, setDirectorSignatureUrl] = useState<string>(() => {
    return localStorage.getItem('pp5_director_sig') || 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/director_sig_1778032124756.png';
  });

  const [classTeacherSigMap, setClassTeacherSigMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('pp5_class_teacher_sigs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
    }
    return {
      'ป.1': 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/user_sig_181e17f2-e998-4c9f-a3e0-6f1334a8f7cb_1778037929138.png'
    };
  });

  const [teacherNameSigMap, setTeacherNameSigMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('pp5_teacher_name_sigs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {}
    }
    return {
      'นายไพโรจน์ มากแก้ว': 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/user_sig_181e17f2-e998-4c9f-a3e0-6f1334a8f7cb_1778037929138.png',
      'นายเอกคณิต สิทธิศักดิ์': 'https://vzrrpxrmtjpgfbbvhjra.supabase.co/storage/v1/object/public/system/user_sig_b0a7a211-5962-43a1-bdeb-e9004543c9c6_1781579315885.png'
    };
  });

  // สถานะล็อคคะแนนภาคเรียนที่ 1 หลังประกาศผลทางการ
  const [isTerm1Locked, setIsTerm1Locked] = useState<boolean>(() => {
    const saved = localStorage.getItem('pp5_term1_locked');
    return saved ? JSON.parse(saved) : false;
  });

  // Hydration Lock: ป้องกัน Auto-Sync ยิงทับ Supabase ก่อนดึงข้อมูลสดจาก Cloud เสร็จสมบูรณ์
  const isCloudHydratedRef = useRef(false);
  const handleToggleTerm1Lock = () => {
    setIsTerm1Locked(prev => {
      const next = !prev;
      localStorage.setItem('pp5_term1_locked', JSON.stringify(next));
      return next;
    });
  };

  // ชื่อชุมนุมประจำระดับชั้น (สำหรับกิจกรรมพัฒนาผู้เรียน ตาม ปพ.1)
  const DEFAULT_CLUB_NAMES: Record<string, string> = {
    'ป.1': 'ชุมนุมศิลป์สร้างสรรค์',
    'ป.2': 'ชุมนุมนิทานหรรษา',
    'ป.3': 'ชุมนุมภาษาพาสนุก',
    'ป.4': 'ชุมนุมหุ่นยนต์และวิทยาศาสตร์',
    'ป.5': 'ชุมนุมรักสิ่งแวดล้อม',
    'ป.6': 'ชุมนุมสื่อ AI สร้างสรรค์',
    'อ.2': 'กิจกรรมเสริมสร้างพัฒนาการ',
    'อ.3': 'กิจกรรมเตรียมความพร้อม'
  };
  const [clubNameMap, setClubNameMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('pp5_club_names');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_CLUB_NAMES;
  });
  const handleUpdateClubName = (cls: string, name: string) => {
    setClubNameMap(prev => {
      const updated = { ...prev, [cls]: name };
      localStorage.setItem('pp5_club_names', JSON.stringify(updated));
      return updated;
    });
  };

  // ดึงข้อมูลและลายเซ็นของหัวหน้าฝ่ายวิชาการแบบไดนามิก
  const academicTeacher = teachers.find(t => t.role === 'academic_head') || 
                          DEFAULT_TEACHERS.find(t => t.role === 'academic_head');
  const academicHeadName = config.academicHead || academicTeacher?.name || 'นางสาววัชรี พรหมช่วย';
  const academicSignatureUrl = academicTeacher?.signatureUrl || 
                              teacherNameSigMap[academicHeadName] || 
                              teacherNameSigMap['นางสาววัชรี พรหมช่วย'] || 
                              '';

  // Fetch active students & homeroom assignments & school branding from Supabase (ระบบหลัก) on initial load
  useEffect(() => {
    StudentSyncService.fetchSchoolSettingsFromSupabase().then((settingsData) => {
      if (settingsData) {
        if (settingsData.schoolLogoUrl) {
          setSchoolLogoUrl(settingsData.schoolLogoUrl);
          localStorage.setItem('pp5_school_logo', settingsData.schoolLogoUrl);
        }
        if (settingsData.directorSignatureUrl) {
          setDirectorSignatureUrl(settingsData.directorSignatureUrl);
          localStorage.setItem('pp5_director_sig', settingsData.directorSignatureUrl);
        }
        if (settingsData.directorName || settingsData.schoolName) {
          setConfig(prev => ({
            ...prev,
            directorName: settingsData.directorName || prev.directorName,
            schoolName: settingsData.schoolName || prev.schoolName
          }));
        }
      }
    });

    StudentSyncService.fetchActiveStudentsFromSupabase().then((activeRoster) => {
      if (activeRoster && Object.keys(activeRoster).length > 0) {
        setClassStudents(prev => ({ ...prev, ...activeRoster }));
      }
    });

    StudentSyncService.fetchHomeroomAssignmentsFromSupabase().then((dutyData) => {
      if (dutyData) {
        if (dutyData.classTeacherMap && Object.keys(dutyData.classTeacherMap).length > 0) {
          setClassTeacherMap(prev => ({ ...prev, ...dutyData.classTeacherMap }));
        }
        if (dutyData.classTeacherSigMap && Object.keys(dutyData.classTeacherSigMap).length > 0) {
          setClassTeacherSigMap(prev => ({ ...prev, ...dutyData.classTeacherSigMap }));
          localStorage.setItem('pp5_class_teacher_sigs', JSON.stringify(dutyData.classTeacherSigMap));
        }
        if (dutyData.teacherNameSigMap && Object.keys(dutyData.teacherNameSigMap).length > 0) {
          setTeacherNameSigMap(prev => ({ ...prev, ...dutyData.teacherNameSigMap }));
          localStorage.setItem('pp5_teacher_name_sigs', JSON.stringify(dutyData.teacherNameSigMap));
        }
        if (dutyData.teachers && dutyData.teachers.length > 0) {
          setTeachers(dutyData.teachers);
          localStorage.setItem('pp5_teachers', JSON.stringify(dutyData.teachers));
        }
      }
    });

    // Network Online Listener: auto-flush pending outbox queue
    const handleOnline = () => {
      CloudSyncEngine.processPendingOutbox();
    };
    window.addEventListener('online', handleOnline);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      CloudSyncEngine.processPendingOutbox();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleRefreshTeachers = async () => {
    const dutyData = await StudentSyncService.fetchHomeroomAssignmentsFromSupabase();
    if (dutyData) {
      if (dutyData.teachers && dutyData.teachers.length > 0) {
        setTeachers(dutyData.teachers);
        localStorage.setItem('pp5_teachers', JSON.stringify(dutyData.teachers));
      }
      if (dutyData.classTeacherMap && Object.keys(dutyData.classTeacherMap).length > 0) {
        setClassTeacherMap(prev => ({ ...prev, ...dutyData.classTeacherMap }));
      }
      if (dutyData.classTeacherSigMap && Object.keys(dutyData.classTeacherSigMap).length > 0) {
        setClassTeacherSigMap(prev => ({ ...prev, ...dutyData.classTeacherSigMap }));
        localStorage.setItem('pp5_class_teacher_sigs', JSON.stringify(dutyData.classTeacherSigMap));
      }
      if (dutyData.teacherNameSigMap && Object.keys(dutyData.teacherNameSigMap).length > 0) {
        setTeacherNameSigMap(prev => ({ ...prev, ...dutyData.teacherNameSigMap }));
        localStorage.setItem('pp5_teacher_name_sigs', JSON.stringify(dutyData.teacherNameSigMap));
      }
    }
  };

  // Scores store: classLevel -> (subjectId -> (studentId -> scoreRecord))
  const [scoresStore, setScoresStore] = useState<Record<string, Record<string, Record<string, StudentScoreRecord>>>>(() => {
    const saved = localStorage.getItem('pp5_scores');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Object.keys(parsed).length > 0) return { ...INITIAL_SCORES, ...parsed };
      } catch {}
    }
    return INITIAL_SCORES;
  });

  // Dynamic Subjects per Class
  const [classSubjects, setClassSubjects] = useState<Record<string, SubjectConfig[]>>(() => {
    const saved = localStorage.getItem('pp5_class_subjects_2569') || localStorage.getItem('pp5_class_subjects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return hydrateSubjectsWithSavedWeights({ ...CLASS_SUBJECTS_MAP, ...parsed });
        }
      } catch {}
    }
    return hydrateSubjectsWithSavedWeights(CLASS_SUBJECTS_MAP);
  });

  // Auto-persist academic config whenever it changes (e.g. academicYear, semester, classLevel)
  useEffect(() => {
    localStorage.setItem('pp5_config', JSON.stringify(config));
  }, [config]);

  // Rehydrate scores & subjects from cloud whenever academicYear changes
  useEffect(() => {
    // 1. ลองโหลดจาก Local Cache ประจำปีการศึกษาก่อนเพื่อความรวดเร็ว (Instant UI)
    const cachedYearSubjects = localStorage.getItem(`pp5_class_subjects_${config.academicYear}`) || localStorage.getItem('pp5_class_subjects');
    if (cachedYearSubjects) {
      try {
        const parsed = JSON.parse(cachedYearSubjects);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          setClassSubjects(prev => hydrateSubjectsWithSavedWeights({ ...CLASS_SUBJECTS_MAP, ...prev, ...parsed }));
        }
      } catch {}
    }

    const cachedYearScores = localStorage.getItem(`pp5_scores_${config.academicYear}`);
    if (cachedYearScores) {
      try {
        const parsed = JSON.parse(cachedYearScores);
        if (parsed && Object.keys(parsed).length > 0) {
          setScoresStore(parsed);
        }
      } catch {}
    } else if (config.academicYear === '2569') {
      const baseScores = localStorage.getItem('pp5_scores');
      if (baseScores) {
        try {
          const parsed = JSON.parse(baseScores);
          if (parsed && Object.keys(parsed).length > 0) {
            setScoresStore({ ...INITIAL_SCORES, ...parsed });
          }
        } catch {}
      }
    } else {
      setScoresStore(INITIAL_SCORES);
    }

    // โหลดผลประเมินพัฒนาการปฐมวัยจาก Local Cache ประจำปีการศึกษา
    const cachedYearK = localStorage.getItem(`pp5_kindergarten_assessments_${config.academicYear}`);
    if (cachedYearK) {
      try {
        const parsed = JSON.parse(cachedYearK);
        if (parsed && Object.keys(parsed).length > 0) {
          setKindergartenAssessments(parsed);
        }
      } catch {}
    } else if (config.academicYear === '2569') {
      const baseK = localStorage.getItem('pp5_kindergarten_assessments');
      if (baseK) {
        try {
          const parsed = JSON.parse(baseK);
          if (parsed && Object.keys(parsed).length > 0) {
            setKindergartenAssessments({ ...INITIAL_KINDERGARTEN_ASSESSMENTS, ...parsed });
          }
        } catch {}
      }
    } else {
      setKindergartenAssessments(INITIAL_KINDERGARTEN_ASSESSMENTS);
    }

    // 2. ดึงข้อมูลคะแนนและรายวิชาล่าสุดของปีการศึกษานั้นจาก Supabase Cloud
    let isSubscribed = true;
    const pickScore = (cloudVal: any, localVal: any) => {
      if (cloudVal !== null && cloudVal !== undefined && cloudVal !== '') return Number(cloudVal);
      if (localVal !== null && localVal !== undefined && localVal !== '') return Number(localVal);
      return null;
    };

    // 2. ระบายคิว Outbox ที่อาจค้างอยู่จากการทำงานออฟไลน์ขึ้น Cloud ก่อน แล้วจึงดึงข้อมูลล่าสุด
    CloudSyncEngine.processPendingOutbox().finally(() => {
      if (!isSubscribed) return;
      CloudSyncEngine.fetchAllScoresFromCloud(config.academicYear).then((cloudData) => {
        if (!isSubscribed || !cloudData) return;
        if (cloudData.scores && Object.keys(cloudData.scores).length > 0) {
        setScoresStore(prev => {
          const merged = { ...prev };
          for (const [cls, subMap] of Object.entries(cloudData.scores)) {
            if (!merged[cls]) merged[cls] = {};
            for (const [subId, stuMap] of Object.entries(subMap)) {
              if (!merged[cls][subId]) merged[cls][subId] = {};
              for (const [stuId, cloudRec] of Object.entries(stuMap)) {
                const localRec = merged[cls][subId][stuId];
                const resolvedC1 = pickScore(cloudRec.c1, localRec?.c1);
                const resolvedC2 = pickScore(cloudRec.c2, localRec?.c2);
                const resolvedC3 = pickScore(cloudRec.c3, localRec?.c3);
                const resolvedC4 = pickScore(cloudRec.c4, localRec?.c4);
                const resolvedC5 = pickScore(cloudRec.c5 ?? cloudRec.midterm1, localRec?.c5 ?? localRec?.midterm1);
                const resolvedRetake = pickScore(cloudRec.cRetakeMidterm, localRec?.cRetakeMidterm);
                const resolvedC6 = pickScore(cloudRec.c6, localRec?.c6);
                const resolvedC7 = pickScore(cloudRec.c7, localRec?.c7);
                const resolvedC8 = pickScore(cloudRec.c8, localRec?.c8);
                const resolvedC9 = pickScore(cloudRec.c9, localRec?.c9);
                const resolvedC10 = pickScore(cloudRec.c10 ?? cloudRec.final2, localRec?.c10 ?? localRec?.final2);

                const hasPre = (resolvedC1 !== null) || (resolvedC2 !== null) || (resolvedC3 !== null) || (resolvedC4 !== null);
                const sumPre = hasPre ? ((resolvedC1 ?? 0) + (resolvedC2 ?? 0) + (resolvedC3 ?? 0) + (resolvedC4 ?? 0)) : (cloudRec.formative1 ?? localRec?.formative1 ?? null);
                const hasPost = (resolvedC6 !== null) || (resolvedC7 !== null) || (resolvedC8 !== null) || (resolvedC9 !== null);
                const sumPost = hasPost ? ((resolvedC6 ?? 0) + (resolvedC7 ?? 0) + (resolvedC8 ?? 0) + (resolvedC9 ?? 0)) : (cloudRec.formative2 ?? localRec?.formative2 ?? null);

                merged[cls][subId][stuId] = {
                  ...cloudRec,
                  c1: resolvedC1,
                  c2: resolvedC2,
                  c3: resolvedC3,
                  c4: resolvedC4,
                  c5: resolvedC5,
                  cRetakeMidterm: resolvedRetake,
                  c6: resolvedC6,
                  c7: resolvedC7,
                  c8: resolvedC8,
                  c9: resolvedC9,
                  c10: resolvedC10,
                  cSumPre: sumPre,
                  cSumPost: sumPost,
                  cSumFormative: (sumPre !== null ? sumPre : 0) + (resolvedC5 ?? 0) + (sumPost !== null ? sumPost : 0),
                  formative1: sumPre,
                  midterm1: resolvedC5,
                  total1: (sumPre !== null || resolvedC5 !== null) ? ((sumPre ?? 0) + (resolvedC5 ?? 0)) : null,
                  formative2: sumPost,
                  final2: resolvedC10,
                  total2: (sumPost !== null || resolvedC10 !== null) ? ((sumPost ?? 0) + (resolvedC10 ?? 0)) : null,
                  yearlyTotal: cloudRec.yearlyTotal ?? localRec?.yearlyTotal ?? null,
                  grade: (cloudRec.grade && cloudRec.grade !== '-') ? cloudRec.grade : (localRec?.grade || '-'),
                  isPassed: cloudRec.isPassed ?? localRec?.isPassed ?? false
                };
              }
            }
          }
          localStorage.setItem(`pp5_scores_${config.academicYear}`, JSON.stringify(merged));
          localStorage.setItem('pp5_scores', JSON.stringify(merged));
          return merged;
        });
      }
      if (cloudData.subjectsMap && Object.keys(cloudData.subjectsMap).length > 0) {
        setClassSubjects(prev => {
          const merged: Record<string, SubjectConfig[]> = { ...prev };
          for (const [cls, cloudSubs] of Object.entries(cloudData.subjectsMap)) {
            const existingList = merged[cls] || CLASS_SUBJECTS_MAP[cls] || [];
            merged[cls] = existingList.map(existing => {
              const normCode = (existing.code || '').trim().toUpperCase();
              const cloudSub = (cloudSubs || []).find(cs => (cs.code && cs.code.trim().toUpperCase() === normCode) || cs.id === existing.id);
              const weights =
                cloudSub?.assessmentWeights ||
                findSavedAssessmentWeights(cls, existing.code, existing.id) ||
                existing.assessmentWeights;

              const targetId = cloudSub?.id || existing.id;
              if (weights) {
                saveSubjectAssessmentWeights(cls, existing.code, weights);
                const term1 = (weights.c1 + weights.c2 + weights.c3 + weights.c4) + weights.c5;
                const term2 = (weights.c6 + weights.c7 + weights.c8 + weights.c9) + weights.c10;
                return {
                  ...existing,
                  id: targetId,
                  assessmentWeights: weights,
                  fullScoreTerm1: term1,
                  fullScoreTerm2: term2
                };
              }
              return {
                ...existing,
                id: targetId
              };
            });
          }
          localStorage.setItem(`pp5_class_subjects_${config.academicYear}`, JSON.stringify(merged));
          localStorage.setItem('pp5_class_subjects', JSON.stringify(merged));
          return merged;
        });
      }
      isCloudHydratedRef.current = true;
    }).catch(err => {
      console.warn('fetchAllScoresFromCloud failed:', err);
      isCloudHydratedRef.current = true;
    });
    });

    // 3. ดึงข้อมูลประเมินพัฒนาการระดับปฐมวัย (อ.1 - อ.3) จาก Supabase Cloud
    CloudSyncEngine.fetchKindergartenFromCloud(config.academicYear).then((cloudKData) => {
      if (!isSubscribed || !cloudKData || Object.keys(cloudKData).length === 0) return;
      setKindergartenAssessments(prev => {
        const merged = { ...prev };
        for (const [cls, stuMap] of Object.entries(cloudKData)) {
          if (!merged[cls]) merged[cls] = {};
          merged[cls] = { ...merged[cls], ...stuMap };
        }
        localStorage.setItem(`pp5_kindergarten_assessments_${config.academicYear}`, JSON.stringify(merged));
        localStorage.setItem('pp5_kindergarten_assessments', JSON.stringify(merged));
        return merged;
      });
    });

    // 4. ดึงข้อมูลสรุปเวลาเรียนล่าสุด (student_attendance_summary) จาก Supabase Cloud
    CloudSyncEngine.fetchAttendanceFromCloud(config.academicYear).then((cloudAtt) => {
      if (!isSubscribed || !cloudAtt || Object.keys(cloudAtt).length === 0) return;
      setAttendanceStore(prev => {
        const merged = { ...prev };
        Object.entries(cloudAtt).forEach(([studentId, attDetail]) => {
          let foundCls: string | null = null;
          for (const [cls, students] of Object.entries(classStudents)) {
            if (students.some(s => s.studentId === studentId)) {
              foundCls = cls;
              break;
            }
          }
          if (!foundCls) {
            for (const [cls, students] of Object.entries(INITIAL_ROSTER)) {
              if (students.some(s => s.studentId === studentId)) {
                foundCls = cls;
                break;
              }
            }
          }
          if (foundCls) {
            if (!merged[foundCls]) merged[foundCls] = {};
            const existing = merged[foundCls][studentId];
            merged[foundCls][studentId] = {
              present: attDetail.present,
              leave: attDetail.leave,
              sick: attDetail.sick,
              absent: attDetail.absent,
              late: existing?.late || 0,
              dailyRecords: existing?.dailyRecords && Object.keys(existing.dailyRecords).length > 0
                ? existing.dailyRecords
                : (existing?.dailyRecords || {}),
              monthlyRecords: existing?.monthlyRecords || {}
            };
          }
        });
        localStorage.setItem('pp5_attendance', JSON.stringify(merged));
        return merged;
      });
    });

    return () => {
      isSubscribed = false;
    };
  }, [config.academicYear]);

  // Attendance Detail Store: classLevel -> (studentId -> AttendanceDetail)
  const [attendanceStore, setAttendanceStore] = useState<Record<string, Record<string, AttendanceDetail>>>(() => {
    const saved = localStorage.getItem('pp5_attendance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return { ...INITIAL_ATTENDANCE, ...parsed };
        }
      } catch {}
    }
    return INITIAL_ATTENDANCE;
  });

  // Holistic Detail Store: classLevel -> (studentId -> HolisticDetail)
  const [holisticStore, setHolisticStore] = useState<Record<string, Record<string, HolisticDetail>>>(() => {
    const saved = localStorage.getItem('pp5_holistic');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return { ...INITIAL_HOLISTIC, ...parsed };
        }
      } catch {}
    }
    return INITIAL_HOLISTIC;
  });

  // Auto-persist state
  useEffect(() => {
    localStorage.setItem('pp5_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('pp5_students', JSON.stringify(classStudents));
  }, [classStudents]);

  useEffect(() => {
    localStorage.setItem('pp5_scores', JSON.stringify(scoresStore));
  }, [scoresStore]);

  useEffect(() => {
    localStorage.setItem(`pp5_class_subjects_${config.academicYear}`, JSON.stringify(classSubjects));
    localStorage.setItem('pp5_class_subjects', JSON.stringify(classSubjects));
  }, [classSubjects, config.academicYear]);

  useEffect(() => {
    localStorage.setItem('pp5_class_teachers', JSON.stringify(classTeacherMap));
  }, [classTeacherMap]);

  useEffect(() => {
    localStorage.setItem('pp5_attendance', JSON.stringify(attendanceStore));
  }, [attendanceStore]);

  useEffect(() => {
    localStorage.setItem('pp5_holistic', JSON.stringify(holisticStore));
  }, [holisticStore]);

  // Adjust current class on teacher login / switch based on assigned classes
  useEffect(() => {
    if (authUser && !authUser.assignedClasses.includes('*') && authUser.assignedClasses.length > 0) {
      if (!authUser.assignedClasses.includes(config.classLevel)) {
        setConfig(prev => ({ ...prev, classLevel: authUser.assignedClasses[0] }));
      }
    }
  }, [authUser]);

  // Auto-sync homeroom teacher and director name on class level switch
  useEffect(() => {
    const teacherForClass = classTeacherMap[config.classLevel] || '';
    setConfig(prev => {
      if (prev.homeroomTeacher === teacherForClass && prev.directorName === AUTHENTIC_DIRECTOR.name) {
        return prev;
      }
      return {
        ...prev,
        homeroomTeacher: teacherForClass,
        directorName: AUTHENTIC_DIRECTOR.name
      };
    });
  }, [config.classLevel, classTeacherMap]);

  // Current Class Subjects & Students (จัดเรียงรายวิชาพื้นฐานตามมาตรฐาน สพฐ. ท, ค, ว, ส(สังคม), ส(ประวัติศาสตร์), พ, ศ, ง, อ)
  const currentSubjects = React.useMemo(() => {
    const raw = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
    const seen = new Set<string>();
    const deduped: SubjectConfig[] = [];
    raw.forEach(s => {
      const k = (s.code || '').replace(/\s+/g, '').toUpperCase();
      if (k && !seen.has(k)) {
        seen.add(k);
        deduped.push(s);
      } else if (!k && !seen.has(s.id)) {
        seen.add(s.id);
        deduped.push(s);
      }
    });
    return sortSubjectConfigs(deduped);
  }, [classSubjects, config.classLevel]);
  const currentStudents = classStudents[config.classLevel] || [];
  const currentClassScores = scoresStore[config.classLevel] || {};

  // Check write permission for current authenticated teacher on active class
  const canEditClass =
    !authUser ||
    authUser.role === 'admin' ||
    authUser.role === 'director' ||
    authUser.role === 'academic_head' ||
    authUser.assignedClasses.includes('*') ||
    authUser.assignedClasses.includes(config.classLevel);

  const handleLoginSuccess = (user: AuthenticatedUser) => {
    setAuthUser(user);
    if (user.teacherProfile) {
      setCurrentTeacher(user.teacherProfile);
    } else {
      const match = DEFAULT_TEACHERS.find(t => t.name.includes(user.displayName) || user.displayName.includes(t.name));
      if (match) setCurrentTeacher(match);
    }
    if (!user.assignedClasses.includes('*') && user.assignedClasses.length > 0) {
      setConfig(prev => ({ ...prev, classLevel: user.assignedClasses[0] }));
    }
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    localStorage.removeItem('pp5_remember_login');
    setAuthUser(null);
    setIsLoginModalOpen(true);
  };

  const handleSelectTeacher = (teacher: TeacherProfile) => {
    setCurrentTeacher(teacher);
    const user = AuthService.loginAsTeacher(teacher);
    setAuthUser(user);
    if (teacher.assignedClasses.length > 0 && teacher.assignedClasses[0] !== '*') {
      const targetRoom = teacher.assignedClasses[0];
      if (availableClasses.includes(targetRoom)) {
        setConfig(prev => ({ ...prev, classLevel: targetRoom }));
      }
    }
  };

  const handleAddSubject = (newSub: SubjectConfig) => {
    const list = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
    const norm = (c: string) => (c || '').replace(/\s+/g, '').toUpperCase();
    const existingIdx = list.findIndex(s => norm(s.code) === norm(newSub.code));
    let updatedList: SubjectConfig[];
    if (existingIdx >= 0) {
      updatedList = list.map((s, idx) => idx === existingIdx ? { ...s, ...newSub, id: s.id } : s);
    } else {
      updatedList = [...list, newSub];
    }
    const newState = { ...classSubjects, [config.classLevel]: updatedList };
    setClassSubjects(newState);
    localStorage.setItem(`pp5_class_subjects_${config.academicYear}`, JSON.stringify(newState));
    localStorage.setItem('pp5_class_subjects', JSON.stringify(newState));

    const currentStudents = classStudents[config.classLevel] || [];
    const currentClassScores = scoresStore[config.classLevel] || {};
    CloudSyncEngine.autoSyncClassToCloud(
      config.classLevel,
      updatedList,
      currentStudents,
      currentClassScores,
      config
    );
  };

  const handleUpdateSubject = (updatedSub: SubjectConfig) => {
    const list = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
    const updatedList = list.map(s => s.id === updatedSub.id ? updatedSub : s);
    const newState = { ...classSubjects, [config.classLevel]: updatedList };
    setClassSubjects(newState);
    localStorage.setItem(`pp5_class_subjects_${config.academicYear}`, JSON.stringify(newState));
    localStorage.setItem('pp5_class_subjects', JSON.stringify(newState));

    // บันทึกค่าน้ำหนักคะแนนเต็มลง LocalStorage แบบถาวร
    if (updatedSub.assessmentWeights && updatedSub.code) {
      saveSubjectAssessmentWeights(config.classLevel, updatedSub.code, updatedSub.assessmentWeights);
    }

    const currentStudents = classStudents[config.classLevel] || [];
    const currentClassScores = scoresStore[config.classLevel] || {};
    CloudSyncEngine.autoSyncClassToCloud(
      config.classLevel,
      updatedList,
      currentStudents,
      currentClassScores,
      config
    );
  };

  const handleForceSyncScores = async () => {
    const currentSubs = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
    const currentStudents = classStudents[config.classLevel] || INITIAL_ROSTER[config.classLevel] || [];
    const currentClassScores = scoresStore[config.classLevel] || {};
    const currentAttendance = attendanceStore[config.classLevel] || {};

    // 1. บันทึกลง LocalStorage ทันที (Instant Commit)
    localStorage.setItem(`pp5_scores_${config.academicYear}`, JSON.stringify(scoresStore));
    localStorage.setItem('pp5_scores', JSON.stringify(scoresStore));
    localStorage.setItem(`pp5_class_subjects_${config.academicYear}`, JSON.stringify(classSubjects));
    localStorage.setItem('pp5_class_subjects', JSON.stringify(classSubjects));

    // 2. Direct Sync ขึ้น Supabase Cloud ทันที (ไม่ต้องรอ 2 วินาที)
    await CloudSyncEngine.autoSyncClassToCloud(
      config.classLevel,
      currentSubs,
      currentStudents,
      currentClassScores,
      config,
      currentAttendance
    );
  };

  const handlePullFromCloud = async () => {
    const cloudData = await CloudSyncEngine.fetchAllScoresFromCloud(config.academicYear);
    if (!cloudData) return;
    if (cloudData.scores && Object.keys(cloudData.scores).length > 0) {
      setScoresStore(prev => {
        const merged = { ...prev };
        for (const [cls, subMap] of Object.entries(cloudData.scores)) {
          if (!merged[cls]) merged[cls] = {};
          for (const [subId, stuMap] of Object.entries(subMap)) {
            if (!merged[cls][subId]) merged[cls][subId] = {};
            for (const [stuId, cloudRec] of Object.entries(stuMap)) {
              merged[cls][subId][stuId] = cloudRec;
            }
          }
        }
        localStorage.setItem(`pp5_scores_${config.academicYear}`, JSON.stringify(merged));
        localStorage.setItem('pp5_scores', JSON.stringify(merged));
        return merged;
      });
    }
    if (cloudData.subjectsMap && Object.keys(cloudData.subjectsMap).length > 0) {
      setClassSubjects(prev => {
        const merged: Record<string, SubjectConfig[]> = { ...prev };
        for (const [cls, cloudSubs] of Object.entries(cloudData.subjectsMap)) {
          const existingList = merged[cls] || CLASS_SUBJECTS_MAP[cls] || [];
          merged[cls] = existingList.map(existing => {
            const normC = (existing.code || '').replace(/\s+/g, '').toUpperCase();
            const cloudSub = (cloudSubs || []).find(cs => (cs.code && (cs.code || '').replace(/\s+/g, '').toUpperCase() === normC) || cs.id === existing.id);
            const weights = cloudSub?.assessmentWeights || findSavedAssessmentWeights(cls, existing.code, existing.id) || existing.assessmentWeights;
            const targetId = cloudSub?.id || existing.id;
            if (weights) {
              saveSubjectAssessmentWeights(cls, existing.code, weights);
              return {
                ...existing,
                id: targetId,
                assessmentWeights: weights,
                fullScoreTerm1: (weights.c1 + weights.c2 + weights.c3 + weights.c4) + weights.c5,
                fullScoreTerm2: (weights.c6 + weights.c7 + weights.c8 + weights.c9) + weights.c10
              };
            }
            return {
              ...existing,
              id: targetId
            };
          });
        }
        localStorage.setItem(`pp5_class_subjects_${config.academicYear}`, JSON.stringify(merged));
        localStorage.setItem('pp5_class_subjects', JSON.stringify(merged));
        return merged;
      });
    }
    isCloudHydratedRef.current = true;
  };

  const handleDeleteSubject = async (id: string) => {
    const list = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
    const subjectToDelete = list.find(s => s.id === id);
    const updatedList = list.filter(s => s.id !== id);

    // 1. ลบออกจาก classSubjects ทันที (Instant UI) พร้อมบันทึกลง LocalStorage
    const nextSubjects = { ...classSubjects, [config.classLevel]: updatedList };
    setClassSubjects(nextSubjects);
    localStorage.setItem(`pp5_class_subjects_${config.academicYear}`, JSON.stringify(nextSubjects));
    localStorage.setItem('pp5_class_subjects', JSON.stringify(nextSubjects));

    // 2. ลบคะแนนของวิชาที่ถูกลบออกจาก scoresStore ทั้งใน state และ localStorage ทันที
    setScoresStore(prev => {
      const updated = { ...prev };
      if (updated[config.classLevel]) {
        const clsScores = { ...updated[config.classLevel] };
        delete clsScores[id];
        if (subjectToDelete?.code) {
          delete clsScores[subjectToDelete.code.trim()];
          delete clsScores[subjectToDelete.code.replace(/\s+/g, '').toUpperCase()];
        }
        updated[config.classLevel] = clsScores;
        localStorage.setItem(`pp5_scores_${config.academicYear}`, JSON.stringify(updated));
        localStorage.setItem('pp5_scores', JSON.stringify(updated));
      }
      return updated;
    });

    // 3. สั่งลบวิชาและคะแนนที่เกี่ยวข้องบน Cloud ทันที (DB-First)
    await CloudSyncEngine.deleteSubjectAndGrades(
      id,
      subjectToDelete?.code,
      config.classLevel,
      config.academicYear
    );

    // 4. สั่ง sync อัปเดตข้อมูลชั้นเรียนขึ้น Cloud เพื่อล้าง orphan subjects และปรับปรุงสถิติ
    const currentClassScores = scoresStore[config.classLevel] || {};
    const filteredClassScores = { ...currentClassScores };
    delete filteredClassScores[id];
    if (subjectToDelete?.code) {
      delete filteredClassScores[subjectToDelete.code.trim()];
      delete filteredClassScores[subjectToDelete.code.replace(/\s+/g, '').toUpperCase()];
    }

    CloudSyncEngine.autoSyncClassToCloud(
      config.classLevel,
      updatedList,
      currentStudents,
      filteredClassScores,
      config
    );
  };

  const handleUpdateScore = (subjectId: string, studentId: string, updatedRecord: StudentScoreRecord) => {
    isCloudHydratedRef.current = true;
    setScoresStore(prev => {
      const clsScores = prev[config.classLevel] || {};
      const newCls = { ...clsScores };

      // Identify subject to alias across UUID, mock ID, raw code, and normalized code
      const currentSubs = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
      const normC = (c?: string) => (c || '').replace(/\s+/g, '').toUpperCase();
      const matchedSub = currentSubs.find(s => s.id === subjectId || s.code === subjectId || normC(s.code) === normC(subjectId));

      const targetKeys = new Set<string>();
      targetKeys.add(subjectId);
      if (matchedSub?.id) targetKeys.add(matchedSub.id);
      if (matchedSub?.code) {
        targetKeys.add(matchedSub.code.trim());
        targetKeys.add(normC(matchedSub.code));
      }
      // Also match CLASS_SUBJECTS_MAP mock ID
      const defaultSubs = CLASS_SUBJECTS_MAP[config.classLevel] || [];
      const matchedDefault = defaultSubs.find(ds => normC(ds.code) === normC(matchedSub?.code || subjectId));
      if (matchedDefault?.id) {
        targetKeys.add(matchedDefault.id);
        if (matchedDefault.id.startsWith('sub_p')) {
          targetKeys.add(matchedDefault.id.replace(/sub_p\d+_/, 'sub_'));
        }
      }

      targetKeys.forEach(k => {
        newCls[k] = {
          ...(newCls[k] || {}),
          [studentId]: updatedRecord
        };
      });

      const updated = {
        ...prev,
        [config.classLevel]: newCls
      };
      localStorage.setItem(`pp5_scores_${config.academicYear}`, JSON.stringify(updated));
      localStorage.setItem('pp5_scores', JSON.stringify(updated));
      return updated;
    });
  };

  // Debounced Auto-Sync เมื่อครูกรอกหรือแก้ไขคะแนน (หน่วง 2 วินาทีหลังจากพิมพ์เสร็จ)
  useEffect(() => {
    if (!isCloudHydratedRef.current) return;
    const currentClassScores = scoresStore[config.classLevel];
    if (!currentClassScores || Object.keys(currentClassScores).length === 0) return;

    const currentSubs = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
    const currentStudents = classStudents[config.classLevel] || INITIAL_ROSTER[config.classLevel] || [];
    const currentAttendance = attendanceStore[config.classLevel] || {};

    const timer = setTimeout(() => {
      CloudSyncEngine.autoSyncClassToCloud(
        config.classLevel,
        currentSubs,
        currentStudents,
        currentClassScores,
        config,
        currentAttendance
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, [scoresStore, config.classLevel, config.academicYear]);

  // Debounced Auto-Sync เมื่อครูลงเวลาเรียน (หน่วง 2 วินาทีหลังจากติ๊กหรือบันทึกเวลาเรียน)
  useEffect(() => {
    if (!isCloudHydratedRef.current) return;
    if (config.classLevel.startsWith('อ.')) return;
    const currentAttendance = attendanceStore[config.classLevel];
    if (!currentAttendance || Object.keys(currentAttendance).length === 0) return;

    const currentSubs = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
    const currentStudents = classStudents[config.classLevel] || INITIAL_ROSTER[config.classLevel] || [];
    const currentClassScores = scoresStore[config.classLevel] || {};

    const timer = setTimeout(() => {
      CloudSyncEngine.autoSyncClassToCloud(
        config.classLevel,
        currentSubs,
        currentStudents,
        currentClassScores,
        config,
        currentAttendance
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, [attendanceStore, config.classLevel, config.academicYear]);

  // Debounced Auto-Sync เมื่อครูปฐมวัยประเมินพัฒนาการ ๑๒ มาตรฐาน (หน่วง 2 วินาทีหลังจากบันทึก)
  useEffect(() => {
    if (!isCloudHydratedRef.current) return;
    if (!config.classLevel.startsWith('อ.')) return;
    const currentKAssessments = kindergartenAssessments[config.classLevel];
    if (!currentKAssessments || Object.keys(currentKAssessments).length === 0) return;

    const currentStudents = classStudents[config.classLevel] || INITIAL_ROSTER[config.classLevel] || [];

    const timer = setTimeout(() => {
      CloudSyncEngine.autoSyncKindergartenToCloud(
        config.classLevel,
        currentStudents,
        currentKAssessments,
        config
      );
    }, 2000);

    return () => clearTimeout(timer);
  }, [kindergartenAssessments, config.classLevel, config.academicYear]);

  const handleUpdateStudentGrowth = (studentId: string, weight: number, height: number) => {
    setClassStudents(prev => {
      const list = prev[config.classLevel] || [];
      const updated = list.map(s => s.studentId === studentId ? { ...s, weight, height } : s);
      return { ...prev, [config.classLevel]: updated };
    });
  };

  const [isAttendanceSyncing, setIsAttendanceSyncing] = useState(false);
  const handleAttendanceManualSync = async () => {
    if (!canEditClass) {
      alert('เฉพาะครูประจำชั้นของห้องนี้ หรือหัวหน้าวิชาการเท่านั้นที่สามารถซิงค์ข้อมูลขึ้นระบบได้');
      return;
    }
    setIsAttendanceSyncing(true);
    try {
      const currentSubs = classSubjects[config.classLevel] || CLASS_SUBJECTS_MAP[config.classLevel] || [];
      const currentStudents = classStudents[config.classLevel] || INITIAL_ROSTER[config.classLevel] || [];
      const currentClassScores = scoresStore[config.classLevel] || {};
      const currentAttendance = attendanceStore[config.classLevel] || {};

      const result = await CloudSyncEngine.syncClassToCloud(
        config.classLevel,
        currentSubs,
        currentStudents,
        currentClassScores,
        config,
        currentAttendance
      );

      if (result.success) {
        alert(`✓ ${result.message}`);
      } else {
        alert(`⚠️ ${result.message}`);
      }
    } catch (e: any) {
      alert(`⚠️ เกิดข้อผิดพลาดในการซิงค์: ${e.message}`);
    } finally {
      setIsAttendanceSyncing(false);
    }
  };

  const handleUpdateAttendance = (studentId: string, data: AttendanceDetail) => {
    setAttendanceStore(prev => {
      const updated = {
        ...prev,
        [config.classLevel]: {
          ...(prev[config.classLevel] || {}),
          [studentId]: data
        }
      };
      localStorage.setItem('pp5_attendance', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBulkUpdateAttendance = (records: Record<string, AttendanceDetail>) => {
    setAttendanceStore(prev => {
      const updated = {
        ...prev,
        [config.classLevel]: {
          ...(prev[config.classLevel] || {}),
          ...records
        }
      };
      localStorage.setItem('pp5_attendance', JSON.stringify(updated));
      return updated;
    });
  };

  const handleUpdateHolistic = (studentId: string, data: HolisticDetail) => {
    setHolisticStore(prev => ({
      ...prev,
      [config.classLevel]: {
        ...(prev[config.classLevel] || {}),
        [studentId]: data
      }
    }));
  };

  const handleBulkUpdateHolistic = (records: Record<string, HolisticDetail>) => {
    setHolisticStore(prev => ({
      ...prev,
      [config.classLevel]: {
        ...(prev[config.classLevel] || {}),
        ...records
      }
    }));
  };

  const isKindergarten = config.classLevel.startsWith('อ.');

  // Auto-switch tab if transitioning between Kindergarten and Primary
  useEffect(() => {
    if (config.classLevel.startsWith('อ.')) {
      if (['marksheet', 'analytics', 'holistic', 'print'].includes(activeTab)) {
        setActiveTab('k_assessment');
      }
    } else {
      if (['k_assessment', 'k_print'].includes(activeTab)) {
        setActiveTab('marksheet');
      }
    }
  }, [config.classLevel]);

  const navItems = isKindergarten
    ? [
        { id: 'roster', label: 'ทะเบียนนักเรียน', icon: Users, count: currentStudents.length },
        { id: 'k_assessment', label: 'ประเมินพัฒนาการ (อบ.๐๒)', icon: Baby },
        { id: 'health', label: 'สุขภาพ & โภชนาการ (BMI)', icon: HeartPulse },
        { id: 'attendance', label: 'เวลาเรียน', icon: CalendarCheck },
        { id: 'k_print', label: 'พิมพ์สมุดรายงาน แบบ อบ.๐๑', icon: Printer }
      ]
    : [
        { id: 'roster', label: 'ทะเบียนนักเรียน', icon: Users, count: currentStudents.length },
        { id: 'marksheet', label: 'กรอกคะแนน & ตัดเกรด', icon: BookOpen },
        { id: 'analytics', label: 'สรุปผลการเรียน & GPA', icon: GraduationCap },
        { id: 'health', label: 'สุขภาพ & โภชนาการ (BMI)', icon: HeartPulse },
        { id: 'attendance', label: 'เวลาเรียน', icon: CalendarCheck },
        { id: 'holistic', label: 'คุณลักษณะ & สมรรถนะ', icon: Award },
        { id: 'sar', label: 'รายงาน SAR', icon: FileSpreadsheet },
        { id: 'print', label: 'ศูนย์จัดพิมพ์ ปพ.5/ปพ.6', icon: Printer }
      ];

  // If in Online Student / Parent Portal View Mode
  if (viewMode === 'student_portal') {
    return (
      <>
        <OnlineStudentResultPortal
          localStudents={classStudents}
          localScores={scoresStore}
          localClassSubjects={classSubjects}
          localAttendance={attendanceStore}
          localHolistic={holisticStore}
          localKindergartenAssessments={kindergartenAssessments}
          academicYear={config.academicYear}
          schoolName={config.schoolName}
          schoolId={config.schoolId}
          logoUrl={schoolLogoUrl}
          directorName={config.directorName}
          directorSignatureUrl={directorSignatureUrl}
          classTeacherMap={classTeacherMap}
          classTeacherSigMap={classTeacherSigMap}
          teacherNameSigMap={teacherNameSigMap}
          authUser={authUser}
          announcementConfig={announcementConfig}
          onOpenAnnouncementModal={() => setIsAnnouncementModalOpen(true)}
          onBackToAdmin={() => setViewMode('teacher')}
        />

        {/* Online Announcement Control Modal (สำหรับ ผอ. / วิชาการ) */}
        <OnlineAnnouncementControlModal
          isOpen={isAnnouncementModalOpen}
          onClose={() => setIsAnnouncementModalOpen(false)}
          authUser={authUser}
          currentTeacher={currentTeacher}
          availableClasses={availableClasses}
          schoolName={config.schoolName}
          schoolId={config.schoolId}
          academicYear={config.academicYear}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
          onOpenQrModal={() => setIsPortalQrModalOpen(true)}
          onPreviewPortal={() => setIsAnnouncementModalOpen(false)}
          onConfigUpdated={(newCfg) => setAnnouncementConfig(newCfg)}
        />

        {/* QR Code Modal สำหรับประชาสัมพันธ์ */}
        <PortalQrModal
          isOpen={isPortalQrModalOpen}
          onClose={() => setIsPortalQrModalOpen(false)}
          schoolName={config.schoolName}
          schoolId={config.schoolId}
          academicYear={config.academicYear}
          logoUrl={schoolLogoUrl}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header with School, Role, Class Switcher & Portal Button */}
      <Header
        config={config}
        onConfigChange={setConfig}
        availableClasses={availableClasses}
        logoUrl={schoolLogoUrl}
        teachers={teachers}
        currentTeacher={currentTeacher}
        authUser={authUser}
        announcementConfig={announcementConfig}
        onSelectTeacher={handleSelectTeacher}
        onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenAnnouncementModal={() => setIsAnnouncementModalOpen(true)}
        onSignOut={handleSignOut}
        onSwitchToPortal={() => setViewMode('student_portal')}
      />

      {/* 1-Click Cloud Sync Toolbar (Class-Scoped Atomic Upsert) */}
      <CloudSyncBar
        classLevel={config.classLevel}
        subjects={currentSubjects}
        students={currentStudents}
        scores={currentClassScores}
        kindergartenAssessments={kindergartenAssessments[config.classLevel] || {}}
        attendanceRecords={attendanceStore[config.classLevel] || {}}
        config={config}
        canSync={canEditClass}
      />

      {/* Teacher Login Modal (Supabase Auth / Offline Switch) */}
      <TeacherLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={authUser}
        teachers={teachers}
        onRefreshTeachers={handleRefreshTeachers}
      />

      {/* Teacher Assignment Modal for Academic Head */}
      <TeacherAssignmentModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        classTeacherMap={classTeacherMap}
        onSaveAssignments={setClassTeacherMap}
        availableClasses={availableClasses}
      />

      {/* Online Announcement Control Modal (สำหรับ ผอ. / วิชาการ) */}
      <OnlineAnnouncementControlModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        authUser={authUser}
        currentTeacher={currentTeacher}
        availableClasses={availableClasses}
        schoolName={config.schoolName}
        schoolId={config.schoolId}
        academicYear={config.academicYear}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenQrModal={() => setIsPortalQrModalOpen(true)}
        onPreviewPortal={() => {
          setIsAnnouncementModalOpen(false);
          setViewMode('student_portal');
        }}
        onConfigUpdated={(newCfg) => setAnnouncementConfig(newCfg)}
      />

      {/* QR Code Modal สำหรับประชาสัมพันธ์ */}
      <PortalQrModal
        isOpen={isPortalQrModalOpen}
        onClose={() => setIsPortalQrModalOpen(false)}
        schoolName={config.schoolName}
        schoolId={config.schoolId}
        academicYear={config.academicYear}
        logoUrl={schoolLogoUrl}
      />

      {/* Navigation Workflow Tabs (7 Tabs) */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-xs border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Active Role & Class Notification Banner */}
      <div className="bg-emerald-50/80 border-b border-emerald-100 py-1.5 px-4 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs text-emerald-900 gap-2">
          <div className="flex items-center gap-2">
            {authUser?.role === 'academic_head' || authUser?.role === 'admin' ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                สิทธิ์ฝ่ายวิชาการ / ผู้ดูแลระบบ (ทุกชั้นเรียน)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                ครูประจำชั้น (เฉพาะชั้นที่รับผิดชอบ)
              </span>
            )}
            <span>
              กำลังดู/บันทึกข้อมูล <strong>ชั้น {config.classLevel}</strong> (ครูประจำชั้น: <strong>{config.homeroomTeacher}</strong>)
            </span>
          </div>

          <div className="text-emerald-700 font-medium">
            {isKindergarten
              ? 'ประเมิน ๔ ด้านพัฒนาการ ๑๒ มาตรฐานคุณลักษณะ (สพฐ. ๒๕๖๐)'
              : `${currentSubjects.length} รายวิชาที่เปิดสอนในระดับชั้น ${config.classLevel}`}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0 print:max-w-none">
        {activeTab === 'roster' && (
          <ClassroomRosterTab
            students={currentStudents}
            classLevel={config.classLevel}
            onUpdateStudents={(updated) =>
              setClassStudents(prev => ({ ...prev, [config.classLevel]: updated }))
            }
          />
        )}

        {activeTab === 'marksheet' && (
          <SubjectMarksheetTab
            students={currentStudents}
            subjects={currentSubjects}
            scores={currentClassScores}
            onUpdateScore={handleUpdateScore}
            semester={config.semester}
            config={{
              ...config,
              term1Locked: isTerm1Locked,
              clubNameMap,
              academicHead: academicHeadName
            }}
            teacherName={authUser?.displayName || config.homeroomTeacher}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            canEdit={canEditClass}
            isTerm1Locked={isTerm1Locked}
            onToggleTerm1Lock={handleToggleTerm1Lock}
            canToggleLock={
              authUser?.role === 'director' ||
              authUser?.role === 'academic_head' ||
              authUser?.role === 'admin'
            }
            onForceSync={handleForceSyncScores}
            onPullCloud={handlePullFromCloud}
          />
        )}

        {activeTab === 'analytics' && (
          <GradeSummaryAnalyticsTab
            students={currentStudents}
            subjects={currentSubjects}
            scores={currentClassScores}
            classLevel={config.classLevel}
            semester={config.semester}
            config={config}
          />
        )}

        {activeTab === 'health' && (
          <HealthGrowthStudioTab
            students={currentStudents}
            classLevel={config.classLevel}
            semester={config.semester}
            onUpdateStudentGrowth={handleUpdateStudentGrowth}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTrackerTab
            students={currentStudents}
            classLevel={config.classLevel}
            semester={config.semester}
            totalDays={config.semester === 1 ? config.totalSchoolDaysSemester1 : config.totalSchoolDaysSemester2}
            attendanceData={attendanceStore[config.classLevel] || {}}
            onUpdateAttendance={handleUpdateAttendance}
            onBulkUpdateAttendance={handleBulkUpdateAttendance}
            onUpdateTotalDays={(sem, days) => {
              setConfig(prev => {
                const updated = {
                  ...prev,
                  [sem === 1 ? 'totalSchoolDaysSemester1' : 'totalSchoolDaysSemester2']: days
                };
                localStorage.setItem('pp5_config', JSON.stringify(updated));
                return updated;
              });
            }}
            canConfigureCalendar={currentTeacher?.role === 'academic_head' || currentTeacher?.role === 'director' || authUser?.role === 'admin'}
            schoolName={config.schoolName}
            homeroomTeacher={config.homeroomTeacher}
            academicHeadName={academicHeadName}
            directorName={config.directorName}
            onManualSync={handleAttendanceManualSync}
            isSyncing={isAttendanceSyncing}
          />
        )}

        {activeTab === 'holistic' && (
          <HolisticAssessmentTab
            students={currentStudents}
            classLevel={config.classLevel}
            holisticData={holisticStore[config.classLevel] || {}}
            onUpdateHolistic={handleUpdateHolistic}
            onBulkUpdateHolistic={handleBulkUpdateHolistic}
            clubName={clubNameMap[config.classLevel] || ''}
            onUpdateClubName={handleUpdateClubName}
            schoolName={config.schoolName}
            academicYear={config.academicYear}
            homeroomTeacher={config.homeroomTeacher}
            directorName={config.directorName}
            academicHeadName={academicHeadName}
            logoUrl={schoolLogoUrl}
          />
        )}

        {activeTab === 'sar' && (
          <SarDashboardTab
            students={currentStudents}
            subjects={currentSubjects}
            scores={scoresStore[config.classLevel] || {}}
            attendanceData={attendanceStore[config.classLevel] || {}}
            holisticData={holisticStore[config.classLevel] || {}}
            classLevel={config.classLevel}
            academicYear={config.academicYear}
            schoolName={config.schoolName}
            directorName={config.directorName}
            homeroomTeacher={config.homeroomTeacher}
            totalSchoolDays={config.totalSchoolDaysSemester1 + config.totalSchoolDaysSemester2}
          />
        )}

        {activeTab === 'print' && (
          <PrintableStudioTab
            students={currentStudents}
            subjects={currentSubjects}
            scores={currentClassScores}
            config={{
              ...config,
              term1Locked: isTerm1Locked,
              clubNameMap,
              academicHead: academicHeadName
            }}
            logoUrl={schoolLogoUrl}
            directorSignatureUrl={directorSignatureUrl}
            homeroomTeacherSignatureUrl={
              classTeacherSigMap[config.classLevel] ||
              teacherNameSigMap[config.homeroomTeacher] ||
              authUser?.signatureUrl ||
              ''
            }
            academicHeadName={academicHeadName}
            academicSignatureUrl={academicSignatureUrl}
            attendanceData={attendanceStore[config.classLevel] || {}}
            holisticData={holisticStore[config.classLevel] || {}}
          />
        )}

        {activeTab === 'k_assessment' && (
          <KindergartenAssessmentTab
            students={currentStudents}
            classLevel={config.classLevel}
            academicYear={config.academicYear}
            semester={config.semester}
            assessments={kindergartenAssessments[config.classLevel] || {}}
            onUpdateAssessment={handleUpdateKindergartenAssessment}
            onBulkUpdateAssessments={handleBulkUpdateKindergartenAssessments}
            onNavigateToPrint={() => setActiveTab('k_print')}
            canEdit={canEditClass}
          />
        )}

        {activeTab === 'k_print' && (
          <KindergartenPrintableTab
            students={currentStudents}
            classLevel={config.classLevel}
            academicYear={config.academicYear}
            semester={config.semester}
            assessments={kindergartenAssessments[config.classLevel] || {}}
            logoUrl={schoolLogoUrl}
            directorName={config.directorName}
            directorSignatureUrl={directorSignatureUrl}
            homeroomTeacherName={config.homeroomTeacher}
            homeroomTeacherSignatureUrl={
              classTeacherSigMap[config.classLevel] ||
              teacherNameSigMap[config.homeroomTeacher] ||
              authUser?.signatureUrl ||
              ''
            }
            attendanceData={attendanceStore[config.classLevel] || {}}
            totalSchoolDays={config.semester === 1 ? config.totalSchoolDaysSemester1 : config.totalSchoolDaysSemester2}
          />
        )}
      </main>

      {/* Footer (hidden on print) */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 no-print">
        ระบบวัดผลและประเมินผล ปพ.5-6 ดิจิทัล (สพฐ.) • สำหรับโรงเรียน{config.schoolName} • Standalone Local Mode (100% Offline)
      </footer>
    </div>
  );
};

export default App;
