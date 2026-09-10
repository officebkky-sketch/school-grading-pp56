// src/services/authService.ts
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { DEFAULT_TEACHERS, DEFAULT_CLASS_TEACHER_MAP, TeacherProfile } from '../data/teachersData';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'director' | 'academic_head' | 'teacher';
  roleTitle: string;
  assignedClasses: string[]; // e.g. ['ป.1'] or ['*'] for all classes
  teacherProfile?: TeacherProfile;
  signatureUrl?: string;
}

// ตารางแมปอีเมลระบบหลัก -> ชั้นเรียนที่รับผิดชอบ
export const EMAIL_CLASS_MAPPING: Record<string, { role: 'admin' | 'academic_head' | 'teacher' | 'director'; classes: string[]; title: string; name: string }> = {
  'eak26082517@gmail.com': {
    role: 'director',
    classes: ['*'],
    title: 'ผู้อำนวยการโรงเรียน',
    name: 'นายเอกคณิต สิทธิศักดิ์'
  },
  'office.bkky@gmail.com': {
    role: 'admin',
    classes: ['*'],
    title: 'ผู้ดูแลระบบ / หัวหน้างานสารสนเทศ',
    name: 'นายอดิศักดิ์ ชัยฤทธิ์'
  },
  'watchan6441@gmail.com': {
    role: 'academic_head',
    classes: ['*'], // หัวหน้าวิชาการมีสิทธิ์ทุกชั้น
    title: 'หัวหน้าฝ่ายวิชาการ / ครูประจำชั้น ป.6',
    name: 'นางสาววัชรี พรหมช่วย'
  },
  'sutanya0504@gmail.com': {
    role: 'teacher',
    classes: ['ป.1'],
    title: 'ครูประจำชั้น ป.1',
    name: 'นางสุธัญญา เทพเกื้อ'
  },
  'kanda21aiedmun@gmail.com': {
    role: 'teacher',
    classes: ['ป.2'],
    title: 'ครูประจำชั้น ป.2',
    name: 'นางกานดา เอียดหมุน'
  },
  'maiyacha766@gmail.com': {
    role: 'teacher',
    classes: ['ป.3'],
    title: 'ครูประจำชั้น ป.3',
    name: 'นางสาวสุมาลี บิลยะแม'
  },
  'parichat.meen23@gmail.com': {
    role: 'teacher',
    classes: ['ป.4'],
    title: 'ครูประจำชั้น ป.4',
    name: 'นางสาวปาริชาติ แก้วนวน'
  },
  'shulila19877@gmail.com': {
    role: 'teacher',
    classes: ['ป.5'],
    title: 'ครูประจำชั้น ป.5',
    name: 'นางสาวชูไฮลา สุหรง'
  }
};

export class AuthService {
  /**
   * เข้าสู่ระบบด้วยรหัสผ่านระบบหลัก (Supabase Auth)
   * ใช้รหัสผ่านและอีเมลเดียวกันกับ school-admin-multischool
   */
  public static async signInWithMainSystem(emailOrUsername: string, password: string): Promise<{ success: boolean; user?: AuthenticatedUser; message: string }> {
    const trimmedInput = emailOrUsername.trim();

    // 1. ถ้าเชื่อมต่อ Supabase ได้ ให้ทำการ Auth กับ Supabase ระบบหลักโดยตรง
    if (isSupabaseConfigured && supabase) {
      try {
        let authEmail = trimmedInput;
        // หากผู้ใช้พิมพ์ชื่อครู ให้หา email ที่ตรงกัน
        if (!authEmail.includes('@')) {
          const matchedEntry = Object.entries(EMAIL_CLASS_MAPPING).find(([_, info]) =>
            info.name.includes(trimmedInput) || info.title.includes(trimmedInput)
          );
          if (matchedEntry) authEmail = matchedEntry[0];
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password.trim()
        });

        if (error) throw error;

        if (data.user) {
          // ดึง Profile จาก DB
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          const emailKey = (data.user.email || '').toLowerCase();
          const mapping = EMAIL_CLASS_MAPPING[emailKey];

          let role: AuthenticatedUser['role'] = (profile?.role === 'admin' ? 'admin' : (mapping?.role || 'teacher'));
          let roleTitle = mapping?.title || (role === 'admin' ? 'ผู้ดูแลระบบ' : 'ครูผู้สอน');
          let displayName = profile?.display_name || mapping?.name || data.user.email || 'ครูผู้สอน';
          let assignedClasses: string[] = [];

          // ดึงสิทธิ์ชั้นเรียนจากตาราง teacher_duties ใน Supabase แบบเรียลไทม์
          try {
            const { data: teacherRow } = await supabase
              .from('teachers')
              .select('id, position, first_name, last_name, prefix')
              .eq('email', emailKey)
              .maybeSingle();

            if (teacherRow?.id) {
              const { data: duties } = await supabase
                .from('teacher_duties')
                .select('duty_day, duty_type')
                .eq('teacher_id', teacherRow.id)
                .in('duty_type', ['ครูประจำชั้น', 'ครูประจำชั้นหลัก', 'ครูประจำชั้นร่วม', 'ครูพี่เลี้ยง']);

              if (duties && duties.length > 0) {
                assignedClasses = duties.map((d: any) => d.duty_day).filter(Boolean);
              }
              if (teacherRow.position) {
                roleTitle = teacherRow.position;
              }
            }
          } catch (e) {
            console.warn('Could not query teacher duties during auth:', e);
          }

          if (assignedClasses.length === 0) {
            assignedClasses = mapping ? mapping.classes : ['ป.1'];
          }

          if (role === 'admin' || role === 'academic_head' || emailKey === 'watchan6441@gmail.com') {
            assignedClasses = ['*'];
          }

          const authUser: AuthenticatedUser = {
            id: data.user.id,
            email: data.user.email || '',
            displayName,
            role,
            roleTitle,
            assignedClasses,
            signatureUrl: profile?.signature_url || undefined
          };

          localStorage.setItem('pp5_auth_user', JSON.stringify(authUser));
          return { success: true, user: authUser, message: `ยินดีต้อนรับ ${displayName}` };
        }
      } catch (err: any) {
        console.warn('Supabase auth failed, checking fallback credentials:', err.message);
        // หาก Error แต่ป้อนรหัสถูกต้องในระบบออฟไลน์ หรือจำลอง
        return { success: false, message: `เข้าสู่ระบบไม่สำเร็จ: ${err.message === 'Invalid login credentials' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (กรุณาใช้รหัสผ่านเดียวกับระบบหลัก)' : err.message}` };
      }
    }

    // 2. Local / Offline Fallback Mode: อนุญาตให้เลือกครูและใช้รหัสระบบหลักได้
    const matchedEntry = Object.entries(EMAIL_CLASS_MAPPING).find(([email, info]) =>
      email.toLowerCase() === trimmedInput.toLowerCase() ||
      info.name.includes(trimmedInput) ||
      info.classes.includes(trimmedInput)
    );

    if (matchedEntry) {
      const [email, info] = matchedEntry;
      const authUser: AuthenticatedUser = {
        id: 'local_' + Date.now(),
        email,
        displayName: info.name,
        role: info.role,
        roleTitle: info.title,
        assignedClasses: info.classes
      };
      localStorage.setItem('pp5_auth_user', JSON.stringify(authUser));
      return { success: true, user: authUser, message: `เข้าสู่ระบบออฟไลน์สำเร็จ (${info.name})` };
    }

    return {
      success: false,
      message: 'ไม่พบชื่อบัญชีครูในระบบ กรุณากรอกอีเมลหรือชื่อครูที่ถูกต้อง'
    };
  }

  /**
   * เข้าสู่ระบบด่วนด้วยการเลือกโปรไฟล์ครู (Quick Switch)
   */
  public static loginAsTeacher(teacher: TeacherProfile): AuthenticatedUser {
    const isAcademic = teacher.role === 'academic_head' || teacher.role === 'director' || teacher.assignedClasses.includes('*');
    const authUser: AuthenticatedUser = {
      id: teacher.id,
      email: `${teacher.id}@school.internal`,
      displayName: teacher.name,
      role: teacher.role === 'director' ? 'director' : (isAcademic ? 'academic_head' : 'teacher'),
      roleTitle: teacher.roleTitle,
      assignedClasses: teacher.role === 'director' || teacher.assignedClasses.includes('*') ? ['*'] : teacher.assignedClasses,
      teacherProfile: teacher,
      signatureUrl: teacher.signatureUrl
    };

    localStorage.setItem('pp5_auth_user', JSON.stringify(authUser));
    return authUser;
  }

  /**
   * อ่านข้อมูลผู้ใช้ปัจจุบันที่ล็อกอินค้างไว้
   */
  public static getCurrentUser(): AuthenticatedUser | null {
    const saved = localStorage.getItem('pp5_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  }

  /**
   * ออกจากระบบ
   */
  public static async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem('pp5_auth_user');
  }
}
