// Plain JS (bukan .ts) sengaja — dijalankan langsung dengan `node` di container
// production yang tidak punya tsx/TypeScript, cuma @prisma/client & bcryptjs
// (dua-duanya sudah pasti ada karena ke-trace oleh Next.js standalone output).
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "ADMIN_EMAIL / ADMIN_PASSWORD tidak diset — lewati pembuatan admin. Set env lalu jalankan ulang `npm run db:seed` jika perlu."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Admin" },
  });

  console.log(`Admin user siap: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
