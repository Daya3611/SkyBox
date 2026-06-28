import { ReadableStream } from 'node:stream/web'

async function mockDownload(id: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`Chunk for ${id}\n`))
      controller.close()
    }
  })
}

async function run() {
  const chunks = ['1', '2', '3']
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const chunk of chunks) {
          const rawStream = await mockDownload(chunk)
          const reader = rawStream.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              reader.releaseLock()
              break
            }
            controller.enqueue(value)
          }
        }
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    }
  })

  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    console.log(new TextDecoder().decode(value))
  }
}
run()
