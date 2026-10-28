# PlayCH Channel & Quotation Management (PCM)
ระบบใบเสนอราคาสินค้าและบริการสำหรับช่องสตรีมเมอร์ **PlayCH (Play Channel)** และร้านค้าในสังกัด (Multi-Tenant Quotation & Signatory Management System)

---

## 🌟 ฟังก์ชันหลัก (Features)

1. **การออกใบเสนอราคาตามแบบฟอร์มมาตรฐาน (ตรงตามภาพ Image 1)**:
   - หัวเอกสาร **ใบเสนอราคา (Quotation)** พร้อมเลขที่เอกสาร
   - ข้อมูลลูกค้าครบถ้วน (ชื่อลูกค้า, ที่อยู่, เลขประจำตัวผู้เสียภาษี, เบอร์โทรศัพท์, อีเมล, วันที่ออกเอกสาร)
   - ตารางรายการสินค้า 5 คอลัมน์: **ลำดับ | รายการสินค้า | จำนวน | ราคา/หน่วย | ราคารวม**
   - กล่องช่องทางการชำระเงิน (ธนาคาร, ชื่อบัญชี, เลขที่บัญชี)
   - คำนวณอัตโนมัติ: **ราคารวม, ส่วนลด, ภาษีมูลค่าเพิ่ม 7%, และยอดเงินรวมทั้งสิ้น (Grand Total Highlighted Pill Badge เช่น 8,460.00)**
   - ช่องลงนามอนุมัติ (ลายมือชื่อดิจิทัล, ชื่อผู้ลงนาม, ตำแหน่งทางการ เช่น ผู้จัดการ)
   - แถบส่วนท้ายเอกสาร (Footer) แสดงโลโก้, ชื่อแบรนด์, อีเมล, เว็บไซต์, เบอร์โทร และที่อยู่

2. **ดีไซน์และความสวยงาม**:
   - **Gamer Edition (PlayCH Theme)**: โทนสีและแสงสะท้อนสไตล์เกมเมอร์/สตรีมเมอร์ ผสมผสานสีแดง Ruby และสีฟ้า Cyan เมทัลลิก ตามโลโก้ PlayCH
   - **Classic Clean Edition (1:1 Replica)**: ถอดแบบโครงสร้างและโทนสีมินิมอล ครีม-ฟ้า นุ่มนวลตามภาพตัวอย่าง Image 1

3. **ระบบจัดการสินค้าและบริการ (Product Catalog CRUD)**:
   - เพิ่ม/ลบ/แก้ไขสินค้าในคลัง
   - รองรับหมวดหมู่ (Media & Streaming, Content Production, Sponsorship, Hardware, Merch)
   - ดึงสินค้าจากคลังมาใส่ในใบเสนอราคาได้ทันที พร้อมกรอกราคาอัตโนมัติ

4. **ระบบจัดการผู้ใช้งานและสิทธิ์บุคลากร (User & Role Management)**:
   - 👑 **Admin**: จัดการระบบทั้งหมด, กำหนดสิทธิ์, อนุมัติเอกสาร
   - ✍️ **Signatory (ผู้ลงนาม)**: ตรวจสอบใบเสนอราคาที่ส่งเข้ามา, ลงนามอนุมัติด้วยลายมือชื่อดิจิทัล หรือส่งกลับแก้ไข
   - 💼 **Staff (บุคลากร)**: สร้างใบเสนอราคา, บันทึกแบบร่าง, ส่งเสนอผู้ลงนามเพื่อขออนุมัติ
   - ผูกบัญชีผู้ใช้งานเข้ากับสิทธิ์ผู้ลงนาม และวาด/บันทึกลายมือชื่อดิจิทัล (Digital Signature Pad)

5. **ระบบจัดการองค์กรและช่องสตรีมเมอร์ (Multi-Tenant & Multi-Store)**:
   - รองรับช่องสตรีมเมอร์หลัก **PlayCH (Play Channel)** พร้อมภาพโลโก้
   - สร้างช่องสตรีมเมอร์ ร้านค้า หรือแบรนด์อื่นๆ ในสังกัดได้ไม่จำกัด

6. **ระบบการส่งออกเอกสาร (Export Capabilities)**:
   - **Microsoft Word (.doc)**: ส่งออกเป็นไฟล์ Word ที่สามารถเปิดและแก้ไขข้อความ/ตัวเลขต่อได้ทันทีใน Microsoft Word, Apple Pages, Google Docs และ LibreOffice
   - **PDF & Direct Print**: ปรับสไตล์สำหรับกระดาษ A4 ไร้ปุ่มส่วนเกิน พิมพ์หรือ Save as PDF ได้คมชัดสูงสุด

7. **ระบบแจ้งเตือน SweetAlert2**:
   - แจ้งเตือนสวยงามในทุกขั้นตอน (ยืนยันการลบ, ส่งเสนออนุมัติ, แจ้งเตือนการลงนามสำเร็จ, ปฏิเสธพร้อมระบุเหตุผล)

---

## 🚀 วิธีการรันในเครื่อง (Local Development)

```bash
cd /Users/playch/Documents/Antigravity/pcm
npm run dev
```

เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 🌐 การ Deploy ขึ้น GitHub & Vercel

1. สร้าง GitHub Repository ใหม่
2. Push โฟลเดอร์ `pcm` ขึ้น GitHub:
   ```bash
   cd /Users/playch/Documents/Antigravity/pcm
   git init
   git add .
   git commit -m "feat: initial commit for PlayCH Quotation Management (PCM)"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB>/<REPO_NAME>.git
   git push -u origin main
   ```
3. เชื่อมต่อบน Vercel แล้ว Deploy ได้ทันที!
