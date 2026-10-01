// Seed: tạo dữ liệu nền (role USER) mà app cần có sẵn để chạy.
// Chạy: npm run seed. Dùng upsert nên chạy nhiều lần không bị trùng (idempotent = chạy lại an toàn).
import { prisma } from "../config/prisma";

async function main() {
  const role = await prisma.role.upsert({
    where: { name: "USER" },
    update: {},
    create: { name: "USER" },
  });
  console.log("Seeded role:", role.name, role.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
