// services/media.ts
// Image uploads → Cloudflare R2 (S3-compatible).
// Video uploads → Cloudflare Stream (handles transcoding + adaptive bitrate).
//
// We expose:
//   - uploadImage(buffer, prefix) → { url, key }
//   - uploadVideo(buffer, filename) → { streamId, playbackUrl }
//   - deleteImage(key)
//
// Cloudflare R2 is configured as an S3-compatible bucket; we use the
// official AWS SDK with a custom endpoint.

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'node:crypto'

// ── R2 client (lazy) ────────────────────────────────────────
let _r2: S3Client | null = null
function r2(): S3Client {
  if (_r2) return _r2
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are not configured')
  }
  _r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return _r2
}

const BUCKET = () => process.env.R2_BUCKET || 'golocal-media'
const PUBLIC_BASE = () =>
  (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '')

// ── Image upload (R2) ───────────────────────────────────────
export interface UploadResult {
  url: string  // public CDN URL
  key: string  // bucket key (for later deletion)
}

/**
 * Upload an image buffer to R2.
 * @param buffer Raw image bytes
 * @param prefix Path prefix inside the bucket, e.g. "avatars" or "posts/<userId>"
 * @param contentType Mime type, e.g. "image/webp"
 * @param ext Optional file extension override (default derived from contentType)
 */
export async function uploadImage(
  buffer: Buffer,
  prefix: string,
  contentType: string = 'image/webp',
  ext?: string
): Promise<UploadResult> {
  const extension = ext ?? mimeToExt(contentType)
  const key = `${prefix.replace(/^\/+|\/+$/g, '')}/${randomUUID()}.${extension}`

  await r2().send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  const url = PUBLIC_BASE()
    ? `${PUBLIC_BASE()}/${key}`
    : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET()}/${key}`

  return { url, key }
}

export async function deleteImage(key: string): Promise<void> {
  await r2().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }))
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'bin'
  }
}

// ── Video upload (Cloudflare Stream) ────────────────────────
//
// Stream's "direct upload" flow: POST the file as multipart to the
// videos endpoint. Response carries the new video's UID + playback URLs.
//
// Docs: https://developers.cloudflare.com/stream/uploading-videos/upload-video-file/

export interface VideoUploadResult {
  streamId: string         // Cloudflare Stream video UID
  playbackUrl: string      // HLS manifest URL
  thumbnailUrl: string     // Stream-generated thumbnail
}

export async function uploadVideo(
  buffer: Buffer,
  filename: string = 'video.mp4',
  contentType: string = 'video/mp4'
): Promise<VideoUploadResult> {
  const accountId = process.env.CF_STREAM_ACCOUNT_ID
  const token = process.env.CF_STREAM_API_TOKEN
  if (!accountId || !token) {
    throw new Error('Cloudflare Stream credentials are not configured')
  }

  const form = new FormData()
  form.append(
    'file',
    new Blob([new Uint8Array(buffer)], { type: contentType }),
    filename
  )

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  )

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Cloudflare Stream upload failed: ${res.status} ${txt}`)
  }

  const data = (await res.json()) as {
    success: boolean
    result: {
      uid: string
      playback: { hls: string; dash: string }
      thumbnail: string
    }
    errors?: unknown
  }

  if (!data.success) {
    throw new Error(`Cloudflare Stream error: ${JSON.stringify(data.errors)}`)
  }

  return {
    streamId: data.result.uid,
    playbackUrl: data.result.playback.hls,
    thumbnailUrl: data.result.thumbnail,
  }
}

// ── Helpers ────────────────────────────────────────────────
export function isImageMime(mime: string | undefined): boolean {
  if (!mime) return false
  return mime.startsWith('image/')
}

export function isVideoMime(mime: string | undefined): boolean {
  if (!mime) return false
  return mime.startsWith('video/')
}
