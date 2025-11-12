import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@entoto.com'
  const password = 'admin123'
  const name = 'Admin User'

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log('Admin user already exists')
    console.log('Email:', email)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'admin',
    },
  })

  console.log('Admin user created successfully!')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Please change the password after first login')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
