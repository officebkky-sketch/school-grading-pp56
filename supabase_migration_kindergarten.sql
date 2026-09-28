-- ==============================================================================
-- สคริปต์ฐานข้อมูล Supabase: ระบบประเมินพัฒนาการระดับปฐมวัย (อ.๑ - อ.๓) ดิจิทัล
-- โรงเรียนบ้านควนโคกยา สำนักงานเขตพื้นที่การศึกษาประถมศึกษาพัทลุง เขต ๒
-- อ้างอิง: หลักสูตรการศึกษาปฐมวัย พุทธศักราช ๒๕๖๐ (สพฐ. กระทรวงศึกษาธิการ)
-- ไฟล์: supabase_migration_kindergarten.sql
-- ==============================================================================

-- ๑. สร้างตารางบันทึกการประเมินพัฒนาการปฐมวัย ๑๒ มาตรฐาน ๔ ด้าน (แบบ อบ.๐๒)
CREATE TABLE IF NOT EXISTS public.kindergarten_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL,
    class_level TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    term SMALLINT NOT NULL DEFAULT 1,
    standards JSONB NOT NULL DEFAULT '{}'::jsonb,
    teacher_comment TEXT,
    health_info JSONB DEFAULT '{}'::jsonb,
    attendance JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT kindergarten_assessments_student_year_term_key UNIQUE (student_id, academic_year, term)
);

-- ดัชนีสำหรับการสืบค้นรวดเร็ว
CREATE INDEX IF NOT EXISTS idx_kindergarten_lookup ON public.kindergarten_assessments (student_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_kindergarten_class ON public.kindergarten_assessments (class_level, academic_year);

-- ๒. เปิดใช้งาน Row Level Security (RLS)
ALTER TABLE public.kindergarten_assessments ENABLE ROW LEVEL SECURITY;

-- ๓. กำหนดนโยบายความปลอดภัย RLS Policies
DROP POLICY IF EXISTS "Enable read access on kindergarten_assessments" ON public.kindergarten_assessments;
CREATE POLICY "Enable read access on kindergarten_assessments" ON public.kindergarten_assessments FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Enable all access on kindergarten_assessments" ON public.kindergarten_assessments;
CREATE POLICY "Enable all access on kindergarten_assessments" ON public.kindergarten_assessments FOR ALL TO public USING (true) WITH CHECK (true);

-- ๔. กำหนดสิทธิ์ Data API (Explicit GRANT Invariant ตามมาตรฐาน Supabase)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kindergarten_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kindergarten_assessments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kindergarten_assessments TO anon;
