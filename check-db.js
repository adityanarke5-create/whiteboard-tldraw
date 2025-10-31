import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSnapshots() {
  const snapshots = await prisma.snapshot.findMany({
    include: { board: true }
  })

  console.log(`\n📊 Found ${snapshots.length} snapshots:\n`)
  
  for (const snap of snapshots) {
    const recordCount = snap.data?.store ? Object.keys(snap.data.store).length : 0
    console.log(`Board: ${snap.board.title} (${snap.boardId})`)
    console.log(`  Records: ${recordCount}`)
    console.log(`  Created: ${snap.createdAt}`)
    console.log(`  Has data: ${!!snap.data}`)
    console.log(`  Has store: ${!!snap.data?.store}`)
    console.log('')
  }

  await prisma.$disconnect()
}

checkSnapshots()
