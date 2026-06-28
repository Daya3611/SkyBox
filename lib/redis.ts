import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

const redisClientSingleton = () => {
  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        // limit retry attempts during local dev if Redis is down
        if (times > 3) {
          console.warn('Redis connection failed. Running with degraded cache/queue features.')
          return null
        }
        return Math.min(times * 100, 2000)
      }
    })

    client.on('error', (err) => {
      // Catch errors silently so the application does not crash
      console.warn('Redis Error:', err.message)
    })

    return client
  } catch (error) {
    console.error('Failed to initialize Redis client:', error)
    return null
  }
}

declare global {
  var redisGlobal: undefined | ReturnType<typeof redisClientSingleton>
}

export const redis = globalThis.redisGlobal ?? redisClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.redisGlobal = redis
}
