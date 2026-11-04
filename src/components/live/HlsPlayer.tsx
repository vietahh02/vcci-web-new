/** Trình phát video của phòng xem: HLS live (hls.js, Safari phát native) và bản ghi (MP4 từ storage hoặc m3u8). */
import type HlsType from 'hls.js'
import { ExternalLink, Maximize2, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { LiveDot } from '@/components/effects'
import { useI18n } from '@/lib/i18n'
import { liveText } from './liveText'

const HLS_TYPE = 'application/vnd.apple.mpegurl'
const isM3u8 = (url: string) => /\.m3u8(\?|#|$)/i.test(url)

function useHlsSource(ref: React.RefObject<HTMLVideoElement | null>, src: string, live: boolean, onFatal?: () => void) {
  const fatal = useEffectEvent(() => onFatal?.())

  useEffect(() => {
    const video = ref.current
    if (!video) return
    let cancelled = false
    let hls: HlsType | null = null
    const play = () => { video.play().catch(() => undefined) }
    const fail = () => { if (!cancelled) fatal() }

    void import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return
      if (Hls.isSupported()) {
        const player = new Hls(live ? { enableWorker: true, lowLatencyMode: true, liveSyncDurationCount: 3, liveMaxLatencyDurationCount: 5, maxLiveSyncPlaybackRate: 1.5 } : { enableWorker: true })
        hls = player
        player.loadSource(src)
        player.attachMedia(video)
        player.on(Hls.Events.MANIFEST_PARSED, play)
        player.on(Hls.Events.ERROR, (_ev, data) => {
          if (!data.fatal) return
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) player.recoverMediaError()
          else fail()
        })
      } else if (video.canPlayType(HLS_TYPE)) {
        video.src = src
        video.addEventListener('loadedmetadata', play, { once: true })
        video.addEventListener('error', fail, { once: true })
      } else {
        fail()
      }
    }, fail)

    return () => {
      cancelled = true
      hls?.destroy()
      video.removeEventListener('loadedmetadata', play)
      video.removeEventListener('error', fail)
      video.removeAttribute('src')
      video.load()
    }
  }, [ref, src, live])
}

/** Live: bắt đầu tắt tiếng để trình duyệt cho tự phát, có nút bật tiếng rõ ràng. onFatal: mất luồng, phòng xem quyết định thử lại. */
export function HlsPlayer({ src, onFatal, onPlaying }: { src: string; onFatal: () => void; onPlaying?: () => void }) {
  const { t } = useI18n()
  const lt = liveText()
  const video = useRef<HTMLVideoElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [muted, setMuted] = useState(true)
  useHlsSource(video, src, true, onFatal)

  const toggleMute = () => {
    const el = video.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }

  return (
    <div ref={box} className="absolute inset-0 bg-black">
      <video ref={video} muted autoPlay playsInline onPlaying={onPlaying} className="size-full object-contain" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <img src="/imgs/lg1.png" alt="VCCI" className="h-5 w-auto rounded bg-white/90 px-1.5 py-0.5" />
        <span className="rounded bg-black/40 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">HLS</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-live"><LiveDot /> LIVE</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-full w-full bg-live" /></div>
        <button type="button" onClick={toggleMute} className="inline-flex items-center gap-1.5 rounded p-1 text-xs font-semibold text-white/80 hover:text-white" aria-label={muted ? lt.unmute : lt.mute}>
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          {muted && <span>{lt.unmute}</span>}
        </button>
        <button type="button" onClick={() => void box.current?.requestFullscreen?.()} className="rounded p-1 text-white/80 hover:text-white" aria-label={t.ui.fullscreen}><Maximize2 className="size-4" /></button>
      </div>
    </div>
  )
}

function M3u8Video({ url, onFatal }: { url: string; onFatal: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  useHlsSource(video, url, false, onFatal)
  return <video ref={video} controls playsInline className="size-full object-contain" />
}

/** Bản ghi: MP4 phát native, m3u8 qua hls.js. URL không phát được (trang ngoài) thì cho mở sang tab mới. */
export function ReplayPlayer({ url }: { url: string }) {
  useI18n()
  const lt = liveText()
  const [failed, setFailed] = useState(false)
  return (
    <div className="absolute inset-0 grid place-items-center bg-black">
      {failed ? (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15">
          <ExternalLink className="size-4" /> {lt.openRecording}
        </a>
      ) : isM3u8(url) ? (
        <M3u8Video url={url} onFatal={() => setFailed(true)} />
      ) : (
        <video src={url} controls playsInline onError={() => setFailed(true)} className="size-full object-contain" />
      )}
    </div>
  )
}
