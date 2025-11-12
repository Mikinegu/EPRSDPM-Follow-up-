import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.staffAttendance.deleteMany()
  await prisma.dLAttendance.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.dL.deleteMany()
  await prisma.site.deleteMany()

  const sites = [
    {
      name: 'Entoto Main',
      staff: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown'],
      dls: ['Driver Alex', 'Driver Mike', 'Driver Sarah']
    },
    {
      name: 'Peacock Villa',
      staff: ['Emma Davis', 'Michael Chen', 'Sophia Rodriguez', 'Liam Taylor'],
      dls: ['Driver Tom', 'Driver Lisa']
    },
    {
      name: 'Entoto Hills',
      staff: ['Olivia Martinez', 'Noah Anderson', 'Ava Thomas', 'William Jackson', 'Isabella White', 'James Harris'],
      dls: ['Driver David', 'Driver Emma', 'Driver Robert']
    },
    {
      name: 'Forest Lodge',
      staff: ['Mia Martin', 'Lucas Thompson', 'Charlotte Garcia'],
      dls: ['Driver John', 'Driver Mary']
    }
  ]

  for (const siteData of sites) {
    const site = await prisma.site.create({
      data: {
        name: siteData.name,
      },
    })

    for (const staffName of siteData.staff) {
      await prisma.staff.create({
        data: {
          name: staffName,
          siteId: site.id,
        },
      })
    }

    for (const dlName of siteData.dls) {
      await prisma.dL.create({
        data: {
          name: dlName,
          siteId: site.id,
        },
      })
    }

    console.log(`Created site: ${site.name} with ${siteData.staff.length} staff and ${siteData.dls.length} DLs`)
  }
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
