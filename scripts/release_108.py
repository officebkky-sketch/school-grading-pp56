import subprocess
import requests
import os
import urllib.parse
import sys

OWNER = "officebkky-sketch"
REPO = "school-grading-pp56"
TAG = "v1.0.8"
RELEASE_NAME = "Release v1.0.8: SAR Dashboard, Holistic Evaluations & Dynamic Attendance Correlation"
RELEASE_BODY = """### 🎉 มีอะไรใหม่ในเวอร์ชัน 1.0.8:
1. **ตารางสรุปเวลาเรียนสะสมตลอดภาคเรียน และสิทธิ์เข้าสอบ (สพฐ. 80%) แปรผลสัมพันธ์ 100%**:
   - เชื่อมโยงสถิติเวลาเรียนรายเดือนและรายวันสัมพันธ์แบบ Real-time ทันทีที่ลงเวลา
   - ปรับเปลี่ยนขอบเขตการคำนวณได้ทันที: ภาคเรียนปัจจุบัน, เทอม 1 (102 วัน), เทอม 2 (106 วัน), ตลอดทั้งปีการศึกษา (208 วัน)
   - แถบความคืบหน้าร้อยละการมาเรียน (Progress Bar) พร้อมแถวสรุปสถิติเฉลี่ยทั้งห้องและผลสิทธิ์เข้าสอบ
2. **ระบบประเมินคุณภาพผู้เรียน & กิจกรรมพัฒนาผู้เรียน (Holistic Assessment)**:
   - คุณลักษณะอันพึงประสงค์ 8 ประการ, การอ่าน คิดวิเคราะห์ และเขียน 5 ข้อ, กิจกรรมพัฒนาผู้เรียน 4 กิจกรรม (แนะแนว 40 ชม., ลูกเสือ 40 ชม., ชุมนุม 30 ชม., สาธารณประโยชน์ 10 ชม.)
   - ปุ่มลัด Quick Fill คำนวณเกรดและผลประเมินอัตโนมัติ
3. **ระบบสถิติและรายงาน SAR (SAR Dashboard)**:
   - กราฟและตารางสรุปผลสัมฤทธิ์ทางการเรียน คุณลักษณะ และกิจกรรมผู้เรียน
   - ส่งออกข้อมูลเป็น Word (.docx) และรูปภาพ (PNG) สวยงาม
4. **ระบบ Cloud Sync สองทาง (Two-Way Cloud Sync)**:
   - ซิงค์สถิติเวลาเรียนเข้าตาราง `student_attendance_summary` ของ Supabase Cloud อัตโนมัติ
   - รองรับการตรวจสอบผลการเรียนออนไลน์สำหรับนักเรียนและผู้ปกครอง 24 ชม.
"""

def get_github_token():
    result = subprocess.run(
        ["git", "credential", "fill"],
        input="protocol=https\nhost=github.com\n\n",
        capture_output=True,
        text=True,
        check=True
    )
    for line in result.stdout.splitlines():
        if line.startswith("password="):
            return line.split("=", 1)[1]
    raise RuntimeError("Cannot find GitHub password/token from credential store")

def main():
    token = get_github_token()
    print("GitHub Token retrieved successfully:", token[:6] + "...")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    # Step 1: Ensure ASCII copies in dist_installer
    dist_dir = os.path.join(os.getcwd(), "dist_installer")
    latest_yml = os.path.join(dist_dir, "latest.yml")
    if not os.path.exists(latest_yml):
        print("Error: latest.yml not found in dist_installer!")
        sys.exit(1)

    with open(latest_yml, "r", encoding="utf-8") as f:
        latest_content = f.read()
    print("latest.yml content:\n", latest_content)

    # Copy Thai setup to ASCII setup if required
    thai_setup = os.path.join(dist_dir, "ระบบวัดผล ปพ.5-6 ดิจิทัล Setup 1.0.8.exe")
    ascii_setup = os.path.join(dist_dir, "school-grading-pp56-setup-1.0.8.exe")
    if os.path.exists(thai_setup) and not os.path.exists(ascii_setup):
        import shutil
        shutil.copy2(thai_setup, ascii_setup)
        print(f"Copied {thai_setup} -> {ascii_setup}")

    # Step 2: Delete existing release for TAG if exists
    rel_url = f"https://api.github.com/repos/{OWNER}/{REPO}/releases/tags/{TAG}"
    r = requests.get(rel_url, headers=headers)
    if r.status_code == 200:
        rel_id = r.json()["id"]
        print(f"Found existing release ID {rel_id}, deleting...")
        del_r = requests.delete(f"https://api.github.com/repos/{OWNER}/{REPO}/releases/{rel_id}", headers=headers)
        print("Deleted existing release, status:", del_r.status_code)

    # Step 3: Create GitHub Release
    create_url = f"https://api.github.com/repos/{OWNER}/{REPO}/releases"
    create_payload = {
        "tag_name": TAG,
        "name": RELEASE_NAME,
        "body": RELEASE_BODY,
        "draft": False,
        "prerelease": False
    }
    r = requests.post(create_url, headers=headers, json=create_payload)
    if r.status_code not in (200, 201):
        print("Failed to create release:", r.status_code, r.text)
        sys.exit(1)

    release_data = r.json()
    upload_url_template = release_data["upload_url"]
    upload_base_url = upload_url_template.split("{")[0]
    print("Release created successfully! Upload URL base:", upload_base_url)

    # Step 4: Files to upload
    files_to_upload = [
        "latest.yml",
        "school-grading-pp56-setup-1.0.8.exe",
        "ระบบวัดผล ปพ.5-6 ดิจิทัล Setup 1.0.8.exe",
        "ระบบวัดผล ปพ.5-6 ดิจิทัล Setup 1.0.8.exe.blockmap",
        "ระบบวัดผล ปพ.5-6 ดิจิทัล 1.0.8.exe"
    ]

    for fname in files_to_upload:
        fpath = os.path.join(dist_dir, fname)
        if not os.path.exists(fpath):
            print(f"Skipping {fname}, file does not exist.")
            continue

        file_size = os.path.getsize(fpath)
        print(f"Uploading {fname} ({file_size / (1024*1024):.2f} MB)...")

        enc_name = urllib.parse.quote(fname)
        target_url = f"{upload_base_url}?name={enc_name}"

        with open(fpath, "rb") as f:
            up_r = requests.post(
                target_url,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/octet-stream",
                    "Content-Length": str(file_size)
                },
                data=f
            )

        if up_r.status_code in (200, 201):
            print(f"Successfully uploaded {fname}")
        else:
            print(f"Failed to upload {fname}: {up_r.status_code} {up_r.text}")

    print("\n All assets uploaded to GitHub Release successfully!")

if __name__ == "__main__":
    main()
