import { prisma } from './lib/db'

async function main() {
  const quotas = await prisma.storageQuota.findMany()
  console.log(JSON.stringify(quotas, null, 2))
}

main()
