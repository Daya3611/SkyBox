import { createHash } from 'crypto'

/**
 * Computes the SHA-256 checksum of a buffer
 */
export function computeChecksum(buffer: Buffer | ArrayBuffer): string {
  const hash = createHash('sha256')
  hash.update(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer))
  return hash.digest('hex')
}

/**
 * Formats bytes into a human-readable string (e.g. KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
