import { prisma } from './lib/db'

async function test() {
  const file = await prisma.file.findFirst({
    where: { name: { contains: 'Antigravity IDE' } },
  })
  if (!file) return console.log('File not found')
  console.log('Downloading file:', file.id, file.name)
  
  // We need to bypass auth by using a server-side fetch to Telegram directly to test the chunks!
  const chunks = await prisma.fileChunk.findMany({
    where: { fileId: file.id },
    orderBy: { chunkIndex: 'asc' },
  })
  console.log(`Found ${chunks.length} chunks`)
  
  for (const chunk of chunks) {
    console.log(`Chunk ${chunk.chunkIndex} size: ${chunk.chunkSize} telegramId: ${chunk.telegramFileId}`)
  }
}
test()
