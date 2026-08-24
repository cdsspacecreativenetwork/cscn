import { NextRequest, NextResponse } from 'next/server';
import { mux } from '@/lib/mux';
import { db } from '@/lib/db';
import type Mux from '@mux/mux-node';
import { signMuxToken } from '@/lib/mux-jwt';
import { readTextBody, RequestBodyTooLargeError } from '@/lib/http-security';

function cleanVTT(vttText: string): string {
  const lines = vttText
    .replace(/^WEBVTT\s*/i, '')
    .replace(/\r/g, '')
    .replace(/\d+:\d+:\d+\.\d+\s*-->\s*\d+:\d+:\d+\.\d+/g, '') // remove timestamps
    .replace(/\d+:\d+\.\d+\s*-->\s*\d+:\d+\.\d+/g, '') // remove short timestamps
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !/^\d+$/.test(line)); // remove numbers
  
  return lines.join(' ');
}

async function handleTextTrack(playbackId: string, trackId: string, duration: number | null, lessonId: string) {
  try {
    const token = signMuxToken(playbackId, 't', duration);
    const vttUrl = `https://image.mux.com/${playbackId}/text/${trackId}.vtt?token=${token}`;
    const res = await fetch(vttUrl);
    if (res.ok) {
      const vttText = await res.text();
      const cleanText = cleanVTT(vttText);
      await db.lesson.update({
        where: { id: lessonId },
        data: { transcript: cleanText },
      });
      console.log(`Successfully synced transcript for lesson ${lessonId}`);
    } else {
      console.error(`Failed to fetch VTT track from Mux: ${res.statusText}`);
    }
  } catch (err) {
    console.error(`Error syncing transcript for lesson ${lessonId}:`, err);
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.MUX_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Mux webhook authentication is not configured.' }, { status: 503 });
  }

  let body: string;
  try {
    body = await readTextBody(req, 1_000_000);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    throw error;
  }
  const sig = req.headers.get('mux-signature') ?? '';

  try {
    mux.webhooks.verifySignature(
      body,
      { 'mux-signature': sig },
      process.env.MUX_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { id: string; type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body) as typeof event;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
  if (!event.id || !event.type || !event.data) {
    return NextResponse.json({ error: 'Invalid Mux event' }, { status: 400 });
  }

  try {
    await db.muxWebhookEvent.create({
      data: { eventId: event.id, eventType: event.type },
    });
  } catch {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {

  if (event.type === 'video.upload.asset_created') {
    const { upload_id, asset_id } = event.data as { upload_id: string; asset_id: string };
    // Raw SQL — single statement, no implicit transaction
    await db.$executeRaw`
      UPDATE "Lesson"
      SET "muxAssetId" = ${asset_id},
          "muxStatus"  = 'PROCESSING'::"MuxVideoStatus",
          "updatedAt"  = NOW()
      WHERE "muxUploadId" = ${upload_id}
    `;
  }

  if (event.type === 'video.asset.ready') {
    const data = event.data as unknown as Mux.Video.Asset & { upload_id?: string };
    const playbackId = data.playback_ids?.[0]?.id ?? null;
    const durationSecs = typeof data.duration === 'number' ? data.duration : null;
    const durationMins = durationSecs !== null ? Math.max(1, Math.ceil(durationSecs / 60)) : null;
    const uploadId = data.upload_id ?? null;

    // COALESCE keeps the existing duration if Mux doesn't provide one.
    // The OR handles the race where asset.ready arrives before upload.asset_created is processed.
    await db.$executeRaw`
      UPDATE "Lesson"
      SET "muxAssetId"    = ${data.id},
          "muxPlaybackId" = ${playbackId},
          "muxStatus"     = 'READY'::"MuxVideoStatus",
          "duration"      = COALESCE(${durationMins}, "duration"),
          "updatedAt"     = NOW()
      WHERE "muxAssetId"  = ${data.id}
         OR "muxUploadId" = ${uploadId}
    `;

    // Sync subtitles if already present in ready event
    if (playbackId) {
      const textTrack = data.tracks?.find((track) => track.type === 'text' && track.status === 'ready');
      if (textTrack) {
        const lesson = await db.lesson.findFirst({
          where: { muxAssetId: data.id! },
          select: { id: true, duration: true }
        });
        if (lesson) {
          handleTextTrack(playbackId, textTrack.id!, lesson.duration, lesson.id);
        }
      }
    }
  }

  if (event.type === 'video.asset.track.created') {
    const data = event.data as { id: string; asset_id: string; type: string; text_type?: string; status: string };
    if (data.type === 'text' && data.text_type === 'subtitles' && data.status === 'ready') {
      const lesson = await db.lesson.findFirst({
        where: { muxAssetId: data.asset_id },
        select: { id: true, muxPlaybackId: true, duration: true }
      });
      if (lesson && lesson.muxPlaybackId) {
        handleTextTrack(lesson.muxPlaybackId, data.id, lesson.duration, lesson.id);
      }
    }
  }

  if (event.type === 'video.asset.errored') {
    const data = event.data as { id: string };
    await db.$executeRaw`
      UPDATE "Lesson"
      SET "muxStatus" = 'ERROR'::"MuxVideoStatus",
          "updatedAt" = NOW()
      WHERE "muxAssetId" = ${data.id}
    `;
  }

    await db.muxWebhookEvent.update({
      where: { eventId: event.id },
      data: { processedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await db.muxWebhookEvent.delete({ where: { eventId: event.id } }).catch(() => undefined);
    console.error('Mux webhook processing failed:', { eventId: event.id, eventType: event.type, error });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
