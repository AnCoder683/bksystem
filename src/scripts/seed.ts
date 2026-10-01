// Seed: tạo dữ liệu nền (role, permission, admin đầu tiên) mà app cần có sẵn để chạy.
// Chạy: npm run seed. Dùng upsert nên chạy nhiều lần không bị trùng (idempotent = chạy lại an toàn).
// Seed chỉ THÊM, không xoá: bỏ 1 permission khỏi map dưới đây thì nó vẫn còn trong DB.
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";

// Nguồn sự thật cho RBAC: role nào có permission nào. Thêm quyền mới = thêm dòng rồi chạy lại seed.
const ROLE_PERMISSIONS: Record<string, string[]> = {
  USER: ["room:read"],
  ADMIN: ["room:read", "room:create", "room:update", "room:delete"],
};

async function main() {
  // 1. Permission: gom mọi action (Set loại trùng) rồi upsert theo `action` (@unique).
  const actions = new Set(Object.values(ROLE_PERMISSIONS).flat());
  const permissionIds = new Map<string, string>();
  for (const action of actions) {
    const permission = await prisma.permission.upsert({
      where: { action },
      update: {},
      create: { action },
    });
    permissionIds.set(action, permission.id);
  }

  // 2. Role + RolePermission: phải có Role và Permission trước (khoá ngoại).
  const roleIds = new Map<string, string>();
  for (const [roleName, roleActions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    roleIds.set(roleName, role.id);

    for (const action of roleActions) {
      const permissionId = permissionIds.get(action)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
    console.log(`Seeded role ${roleName}: ${roleActions.join(", ")}`);
  }

  // 3. Admin đầu tiên: đọc từ .env (không hard-code mật khẩu vào git). Thiếu thì bỏ qua, không làm hỏng seed.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.warn("Bỏ qua tạo admin: thiếu ADMIN_EMAIL hoặc ADMIN_PASSWORD trong .env");
    return;
  }

  // Cost factor 10 phải khớp với register trong auth.service.ts.
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {}, // rỗng: chạy lại seed không ghi đè mật khẩu/role của admin đã có
    create: { email: adminEmail, passwordHash, roleId: roleIds.get("ADMIN")! },
  });
  console.log("Seeded admin:", admin.email);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
