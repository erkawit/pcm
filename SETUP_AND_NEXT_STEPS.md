# เอกสารคู่มือการติดตั้ง ใช้งาน และแนวทางพัฒนาต่อยอด (PCM Quotation System)

> **PlayCH Channel & Quotation Management (PCM)**  
> ระบบบริหารและออกใบเสนอราคาองค์กร พร้อมระบบล็อกอิน เวิร์กโฟลว์การขออนุมัติ และลายเซ็นอิเล็กทรอนิกส์

---

## 1. สรุปการปรับปรุงและแก้ปัญหาในเวอร์ชันนี้

1. **ระบบ Login & Register จริง (Supabase Auth)**
   - ไม่มีการกระโดดเข้าหน้า Dashboard โดยตรงอีกต่อไป ผู้ใช้งานต้องผ่านหน้า **เข้าสู่ระบบ (Login)** ก่อน
   - หน้าจอออกแบบใหม่ในธีม **Clean Enterprise Business (สีขาว-เทา-น้ำเงิน สะอาดตา สบายตา อ่านง่าย)**
   - สิทธิ์อัตโนมัติ: **ผู้ใช้คนแรกที่ลงทะเบียนในระบบจะได้รับบทบาทเป็น `admin` (Super Admin) และเปิดใช้งานทันที**
   - พนักงานที่สมัครหลังจากนั้นจะได้รับบทบาท `staff` และอยู่ในสถานะรอให้ผู้ดูแลระบบเปิดใช้งาน (`is_active = true`) เพื่อความปลอดภัยของข้อมูลบริษัท

2. **เชื่อมต่อฐานข้อมูลจริง 100% (Real Database, No Mock-up)**
   - ปัญหาการแก้ไขข้อมูลแล้วไม่บันทึกหรือเด้งกลับเป็นข้อมูลเดิม เกิดจากโค้ดเดิมบันทึกลงเพียง Memory/LocalStorage และติดข้อจำกัด RLS
   - ปรับปรุงเลเยอร์การเข้าถึงข้อมูลใหม่ทั้งหมดใน `src/lib/db.ts` และ `src/lib/quotation-store.tsx`
   - ทุกการสร้าง, แก้ไข, ลบ หรือเปลี่ยนสถานะเอกสารจะส่งตรงไปยัง PostgreSQL ใน Supabase ทันที พร้อมตรวจนับแถว (`ensureAffected`) และแสดงข้อผิดพลาดภาษาไทยที่ชัดเจน

3. **ระบบอนุมัติเอกสารและลายเซ็นดิจิทัลจริง (Workflow & Digital Signature)**
   - พนักงาน (Staff) ร่างเอกสาร -> ส่งขออนุมัติโดยเลือกผู้ลงนามที่มีสิทธิ์
   - ผู้ลงนาม (Signatory) ตรวจสอบเอกสาร และเซ็นชื่อผ่าน Signature Pad ได้โดยตรง
   - มี Database Trigger ใน PostgreSQL ป้องกันไม่ให้ผู้ใช้ข้ามขั้นตอน หรืออนุมัติเอกสารที่เกินวงเงิน (`max_approval_amount`)

4. **API ฝั่งเซิร์ฟเวอร์สำหรับผู้ดูแลระบบ (`/api/admin/users`)**
   - รองรับการสร้างผู้ใช้ใหม่, เปลี่ยนบทบาท, ปรับวงเงินอนุมัติ, เปิด/ปิดการใช้งาน และลบบัญชีผู้ใช้

---

## 2. ขั้นตอนการตั้งค่า Supabase Database

### ขั้นตอนที่ 1: รัน Schema ใน Supabase SQL Editor
1. เข้าไปที่ [Supabase Dashboard](https://supabase.com/dashboard) แล้วเลือกโปรเจกต์ของคุณ
2. คลิกเมนู **SQL Editor** ที่แถบด้านซ้าย
3. เปิดไฟล์ `supabase/schema.sql` ในโฟลเดอร์โปรเจกต์นี้ คัดลอกโค้ด SQL ทั้งหมดไปวางใน SQL Editor
4. กดปุ่ม **Run** เพื่อสร้างตารางทั้งหมด:
   - `organizations` (ข้อมูลบริษัท/ร้านค้า)
   - `app_users` (โปรไฟล์ผู้ใช้งานและสิทธิ์)
   - `products` (แค็ตตาล็อกสินค้าและบริการ)
   - `quotations` (ใบเสนอราคา)
   - `quotation_items` (รายการสินค้าในแต่ละใบเสนอราคา)
   - `quotation_audit_logs` (บันทึกประวัติการแก้ไขและอนุมัติ)
   - Functions และ Triggers: `handle_new_user`, `next_quotation_number`, `replace_quotation_items`, `enforce_quotation_workflow`

### ขั้นตอนที่ 2: ตั้งค่า Supabase Auth (แนะนำสำหรับการทดสอบ)
1. ไปที่เมนู **Authentication** > **Providers** > **Email**
2. สำหรับการทดสอบที่รวดเร็ว ให้ปิดตัวเลือก **"Confirm email"** (เพื่อให้ผู้ใช้ที่สมัครสามารถล็อกอินได้ทันทีโดยไม่ต้องรอกดยืนยันในกล่องจดหมาย)
3. กด **Save**

### ขั้นตอนที่ 3: คัดลอกค่าเชื่อมต่อไปใส่ใน Environment Variables
ไปที่ **Project Settings** > **API** ใน Supabase Dashboard แล้วนำค่ามาใส่:

#### ไฟล์ `.env.local` ในเครื่องคอมพิวเตอร์ของคุณ:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tuqkftyannovyhvajyga.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### บน Vercel Dashboard:
1. เข้าสู่โปรเจกต์บน [Vercel](https://vercel.com)
2. ไปที่ **Settings** > **Environment Variables**
3. เพิ่มตัวแปร 3 ตัว:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. ทำการ **Redeploy** โปรเจกต์

---

## 3. ขั้นตอนการเริ่มใช้งานครั้งแรก (Initial Setup)

1. เปิดหน้าระบบขึ้นมา จะพบหน้า **เข้าสู่ระบบ**
2. คลิกแท็บ **"ลงทะเบียนพนักงาน"**
3. กรอกชื่อ-นามสกุล, แผนก, ตำแหน่ง, อีเมล และรหัสผ่าน
4. กดสร้างบัญชี -> **เนื่องจากเป็นบัญชีแรกของระบบ จะได้รับสิทธิ์ Super Admin โดยอัตโนมัติ**
5. เข้าสู่ระบบด้วยอีเมลและรหัสผ่านดังกล่าว
6. เข้าไปที่เมนู **"ข้อมูลองค์กร / ร้านค้า"** เพื่อตั้งค่าชื่อบริษัท, เลขผู้เสียภาษี, ที่อยู่, เบอร์โทร และเลขบัญชีธนาคารสำหรับรับเงิน
7. เข้าไปที่เมนู **"สินค้า & บริการ"** เพื่อเพิ่มรายการสินค้าหรือแพ็กเกจที่ต้องการนำไปใช้ออกใบเสนอราคา
8. เมื่อต้องการเพิ่มพนักงานหรือผู้ลงนาม ให้พนักงานคนอื่นกดลงทะเบียน หรือให้ Admin เพิ่มจากเมนู **"ผู้ใช้งาน & สิทธิ์ลงนาม"**

---

## 4. แผนงานพัฒนาต่อยอดในส่วนที่ขาด (Roadmap & Next Steps)

ระบบปัจจุบันมีฐานรากของ Database, Auth, RLS และ CRUD ครบถ้วนแล้ว ส่วนที่แนะนำให้ทำต่อในเฟสถัดไป ได้แก่:

### 1. การสร้างไฟล์ PDF ฝั่งเซิร์ฟเวอร์ (Server-Side PDF Generation)
- **สถานะปัจจุบัน**: สั่งพิมพ์หรือบันทึก PDF ผ่าน Print Dialog ของเบราว์เซอร์ (`window.print()`) ซึ่งจัดหน้าแบบ A4 สวยงามแล้ว
- **สิ่งที่ควรเพิ่ม**: ติดตั้ง `@react-pdf/renderer` หรือใช้ Puppeteer / Chromium บน Serverless API เพื่อกดปุ่มเดียวแล้วได้ไฟล์ `.pdf` ดาวน์โหลดลงเครื่องทันทีโดยไม่ต้องเปิดหน้าต่างพิมพ์

### 2. ระบบส่งอีเมลแจ้งเตือน (Email Notifications)
- **สิ่งที่ควรเพิ่ม**:
  - เมื่อพนักงานส่งขออนุมัติเอกสาร (`status = pending_approval`) -> ส่งอีเมลแจ้งเตือนไปยังผู้ลงนาม (Signatory) พร้อมลิงก์เปิดดูเอกสาร
  - เมื่อผู้ลงนามกดอนุมัติหรือส่งกลับแก้ไข -> ส่งอีเมลแจ้งเตือนกลับมายังพนักงานผู้จัดทำ
- **เครื่องมือที่แนะนำ**: ใช้ [Resend](https://resend.com) หรือ Supabase Database Webhooks เชื่อมต่อกับ Edge Functions

### 3. ระบบแนบไฟล์และรูปภาพสินค้า (File Attachments)
- **สิ่งที่ควรเพิ่ม**:
  - สร้าง Storage Bucket บน Supabase ชื่อ `quotation-files`
  - อนุญาตให้พนักงานแนบไฟล์ใบเสนอราคาจาก Supplier, เอกสารแนบท้าย หรือรูปภาพอ้างอิง
  - เพิ่มตาราง `quotation_attachments (id, quotation_id, file_name, file_url, file_size)`

### 4. การออกใบแจ้งหนี้ (Invoice) และใบเสร็จรับเงิน (Receipt) อัตโนมัติ
- **สิ่งที่ควรเพิ่ม**:
  - เพิ่มปุ่ม "แปลงเป็นใบแจ้งหนี้ (Convert to Invoice)" ในใบเสนอราคาที่ผ่านการอนุมัติแล้ว
  - สร้างตาราง `invoices` และ `receipts` โดยใช้โครงสร้างเดียวกับ `quotations` แต่เปลี่ยนคำนำหน้าเลขที่เอกสารเป็น `INV-2568-xxxx` และ `REC-2568-xxxx`

### 5. การส่งออกรายงานยอดขาย (Excel Export)
- **สิ่งที่ควรเพิ่ม**:
  - ติดตั้งแพ็กเกจ `xlsx`
  - ทำปุ่มดาวน์โหลดรายงานสรุปยอดขายแยกตามช่วงเวลา (วัน/เดือน/ปี), แยกตามลูกค้า หรือแยกตามพนักงานขาย เพื่อนำไปใช้ทางบัญชีและภาษี (ภ.พ.30)

---

## 5. โครงสร้างไฟล์สำคัญของโปรเจกต์ (File Structure)

```
pcm/
├── src/
│   ├── app/
│   │   ├── api/admin/users/route.ts  # API ดูแลผู้ใช้งานฝั่ง Admin
│   │   ├── globals.css               # สไตล์สีขาว-เทา Tailwind CSS
│   │   ├── layout.tsx                # โครงสร้าง Layout หลัก
│   │   └── page.tsx                  # Dashboard หลัก + เช็คสถานะ Login
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginView.tsx         # หน้าเข้าสู่ระบบและลงทะเบียน (Clean UI)
│   │   └── quotation/
│   │       ├── QuotationDocumentView.tsx      # เอกสารใบเสนอราคา (White A4 Sheet)
│   │       ├── QuotationEditorModal.tsx       # หน้าต่างสร้าง/แก้ไขใบเสนอราคา
│   │       ├── ProductManagementModal.tsx     # จัดการสินค้าและบริการ
│   │       ├── UserManagementModal.tsx        # จัดการผู้ใช้งานและสิทธิ์ลงนาม
│   │       ├── OrganizationManagementModal.tsx# จัดการข้อมูลองค์กร/ร้านค้า
│   │       ├── SignaturePadModal.tsx          # กระดานวาดลายเซ็นดิจิทัล
│   │       ├── AuditLogModal.tsx              # ดูประวัติการดำเนินงาน
│   │       └── SupabaseConfigModal.tsx        # หน้าต่างตรวจสอบสถานะฐานข้อมูล
│   ├── lib/
│   │   ├── db.ts                     # รวมคำสั่ง CRUD และ Mapping ข้อมูลกับ Supabase
│   │   ├── quotation-store.tsx       # State Management (Auth + Data Sync)
│   │   ├── supabase.ts               # Browser Client Singleton
│   │   └── word-exporter.ts          # ส่งออกไฟล์เป็น Microsoft Word (.doc)
│   └── types/
│       └── quotation.ts              # Data Types ทั้งหมด
└── supabase/
    └── schema.sql                    # SQL Script โครงสร้างฐานข้อมูล PostgreSQL + RLS
```
