import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper: ตรวจสอบสิทธิ์ผู้เรียก API ว่าล็อกอินอยู่และมีบทบาทเป็น admin
async function verifyAdminCaller(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return { ok: false, status: 401, error: 'ไม่พบ Access Token กรุณาเข้าสู่ระบบ' };
  }

  const adminClient = getAdminClient();
  if (!adminClient) {
    return {
      ok: false,
      status: 500,
      error: 'ระบบยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน Environment Variables',
    };
  }

  // ตรวจสอบ JWT Token กับ Supabase Auth
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) {
    return { ok: false, status: 401, error: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' };
  }

  // ตรวจสอบในตาราง app_users ว่ามี role = 'admin' และ is_active = true หรือไม่
  const { data: profile, error: profileError } = await adminClient
    .from('app_users')
    .select('id, role, is_active')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (profileError || !profile || !profile.is_active || profile.role !== 'admin') {
    return { ok: false, status: 403, error: 'สิทธิ์ไม่เพียงพอ: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' };
  }

  return { ok: true, adminClient, caller: profile };
}

// POST: สร้างผู้ใช้งานใหม่
export async function POST(req: NextRequest) {
  const check = await verifyAdminCaller(req);
  if (!check.ok || !check.adminClient) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { adminClient } = check;
  try {
    const body = await req.json();
    const {
      email,
      password,
      fullName,
      username,
      role = 'staff',
      department = '',
      position = '',
      phone = '',
      canSign = false,
      maxApprovalAmount = 0,
      isActive = true,
      signatureDataUrl,
    } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    // 1. สร้างบัญชีใน Supabase Auth
    const { data: createdAuth, error: createAuthErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: username || email.split('@')[0],
      },
    });

    if (createAuthErr) {
      return NextResponse.json({ error: createAuthErr.message }, { status: 400 });
    }

    const authUserId = createdAuth.user.id;

    // 2. ปรับปรุงข้อมูลใน app_users (เนื่องจากมี trigger handle_new_user สร้างแถวไว้อัตโนมัติแล้ว)
    const { data: updatedProfile, error: updateErr } = await adminClient
      .from('app_users')
      .update({
        username: username || email.split('@')[0],
        full_name: fullName || email.split('@')[0],
        role,
        department,
        position,
        phone,
        can_sign: Boolean(canSign),
        max_approval_amount: Number(maxApprovalAmount) || 0,
        is_active: Boolean(isActive),
        signature_data_url: signatureDataUrl || null,
      })
      .eq('auth_user_id', authUserId)
      .select('*')
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างผู้ใช้';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH: แก้ไขข้อมูลผู้ใช้ หรือรีเซ็ตรหัสผ่าน
export async function PATCH(req: NextRequest) {
  const check = await verifyAdminCaller(req);
  if (!check.ok || !check.adminClient) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { adminClient } = check;
  try {
    const body = await req.json();
    const { id, authUserId, password, ...profileUpdates } = body;

    if (!id && !authUserId) {
      return NextResponse.json({ error: 'ไม่พบ ID ผู้ใช้งาน' }, { status: 400 });
    }

    // ถ้าระบุ password ใหม่
    if (password && authUserId) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
      }
      const { error: pwdErr } = await adminClient.auth.admin.updateUserById(authUserId, {
        password,
      });
      if (pwdErr) {
        return NextResponse.json({ error: pwdErr.message }, { status: 400 });
      }
    }

    // ปรับปรุงฟิลด์ใน app_users ถ้ามี
    const rowUpdates: Record<string, unknown> = {};
    if (profileUpdates.fullName !== undefined) rowUpdates.full_name = profileUpdates.fullName;
    if (profileUpdates.username !== undefined) rowUpdates.username = profileUpdates.username;
    if (profileUpdates.role !== undefined) rowUpdates.role = profileUpdates.role;
    if (profileUpdates.department !== undefined) rowUpdates.department = profileUpdates.department;
    if (profileUpdates.position !== undefined) rowUpdates.position = profileUpdates.position;
    if (profileUpdates.phone !== undefined) rowUpdates.phone = profileUpdates.phone;
    if (profileUpdates.canSign !== undefined) rowUpdates.can_sign = profileUpdates.canSign;
    if (profileUpdates.maxApprovalAmount !== undefined)
      rowUpdates.max_approval_amount = profileUpdates.maxApprovalAmount;
    if (profileUpdates.isActive !== undefined) rowUpdates.is_active = profileUpdates.isActive;
    if (profileUpdates.signatureDataUrl !== undefined)
      rowUpdates.signature_data_url = profileUpdates.signatureDataUrl;

    if (Object.keys(rowUpdates).length > 0) {
      const query = adminClient.from('app_users').update(rowUpdates);
      if (id) {
        query.eq('id', id);
      } else {
        query.eq('auth_user_id', authUserId);
      }
      const { error: updErr } = await query;
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: ลบผู้ใช้งาน
export async function DELETE(req: NextRequest) {
  const check = await verifyAdminCaller(req);
  if (!check.ok || !check.adminClient) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { adminClient } = check;
  try {
    const body = await req.json();
    const { id, authUserId } = body;

    if (!id && !authUserId) {
      return NextResponse.json({ error: 'ไม่พบ ID ผู้ใช้งานที่ต้องการลบ' }, { status: 400 });
    }

    // ถ้ามี authUserId ให้ลบจาก auth.users (จะ cascade ลบ app_users อัตโนมัติ)
    if (authUserId) {
      const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(authUserId);
      if (delAuthErr) {
        return NextResponse.json({ error: delAuthErr.message }, { status: 400 });
      }
    } else if (id) {
      const { error: delErr } = await adminClient.from('app_users').delete().eq('id', id);
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบผู้ใช้';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
