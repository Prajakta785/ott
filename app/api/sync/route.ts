import { NextRequest, NextResponse } from 'next/server';
import { readServerStore, writeServerStore, saveServerContent } from '@/lib/server-store';
import { syncDocToFirestore } from '@/lib/firestore-admin-sync';
import { ContentItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientItems: ContentItem[] = body.content || [];

    if (Array.isArray(clientItems) && clientItems.length > 0) {
      for (const item of clientItems) {
        if (item && item.title) {
          const toSave = {
            ...item,
            status: item.status || 'published',
          };
          saveServerContent(toSave);
          syncDocToFirestore('content', toSave.id, toSave).catch(() => {});
        }
      }
    }

    if (body.companyInfo) {
      const store = readServerStore();
      writeServerStore({
        companyInfo: {
          ...store.companyInfo,
          ...body.companyInfo,
        }
      });
      syncDocToFirestore('company_info', 'main', body.companyInfo).catch(() => {});
    }

    const updated = readServerStore();
    return NextResponse.json({
      success: true,
      message: 'Client catalog successfully synced with server and Android app',
      contentCount: updated.content.length,
      data: updated.content,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Sync failed'
    }, { status: 500 });
  }
}

export async function GET() {
  const store = readServerStore();
  return NextResponse.json({
    success: true,
    content: store.content,
    liveChannels: store.liveChannels,
    companyInfo: store.companyInfo,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  });
}
