import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.staffAttendance.deleteMany()
  await prisma.dLAttendance.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.staffAssignment.deleteMany()
  await prisma.dLAssignment.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.dL.deleteMany()
  await prisma.site.deleteMany()

  const sites = [
    {
      name: 'immigration / Ambasador Site',
      staff: [],
      dls: []
    },
    {
      name: 'Bambis Site',
      staff: [],
      dls: []
    },
    {
      name: 'Guto Meda Site',
      staff: [],
      dls: []
    },
    {
      name: 'Meketeya Site',
      staff: [],
      dls: []
    },
    {
      name: 'Petros Pawlos Site',
      staff: [],
      dls: []
    },
    {
      name: 'Filweha Site',
      staff: [],
      dls: []
    },
    {
      name: 'Peacock Site',
      staff: [],
      dls: []
    }
  ]

  const today = new Date().toISOString().split('T')[0]

  for (const siteData of sites) {
    const site = await prisma.site.create({
      data: {
        name: siteData.name,
      },
    })

    const createdStaff = []
    for (const staffName of siteData.staff) {
      const staff = await prisma.staff.create({
        data: {
          name: staffName,
          siteId: site.id,
          isActive: true,
        },
      })
      createdStaff.push(staff.id)
    }

    const createdDls = []
    for (const dlName of siteData.dls) {
      const dl = await prisma.dL.create({
        data: {
          name: dlName,
          siteId: site.id,
          isActive: true,
        },
      })
      createdDls.push(dl.id)
    }

    if (createdStaff.length) {
      await prisma.staffAssignment.createMany({
        data: createdStaff.map(staffId => ({
          siteId: site.id,
          staffId,
          date: today,
        })),
      })
    }

    if (createdDls.length) {
      await prisma.dLAssignment.createMany({
        data: createdDls.map(dlId => ({
          siteId: site.id,
          dlId,
          date: today,
        })),
      })
    }

    console.log(`Created site: ${site.name} with ${siteData.staff.length} staff and ${siteData.dls.length} DLs (assigned for ${today})`)
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
