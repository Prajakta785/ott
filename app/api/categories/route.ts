import { NextRequest, NextResponse } from 'next/server';
import { syncDocToFirestore, deleteDocFromFirestore, fetchDocsFromFirestore, recordDeletedContentInFirestore, getDeletedContentIds, removeDeletedContentFromFirestore } from '@/lib/firestore-admin-sync';
import { initialCategories } from '@/lib/mock-data';
import { ContentCategory } from '@/lib/types';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getStoreCategories(): ContentCategory[] {
  try {
    const storePath = path.join(process.cwd(), 'data', 'server-store.json');
    if (fs.existsSync(storePath)) {
      const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        return data.categories;
      }
    }
  } catch (e) {
    console.warn('Error reading store categories:', e);
  }
  return initialCategories;
}

function saveStoreCategories(categories: ContentCategory[]): void {
  try {
    const storePath = path.join(process.cwd(), 'data', 'server-store.json');
    let data: any = {};
    if (fs.existsSync(storePath)) {
      data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }
    data.categories = categories;
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving store categories:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    let categories = getStoreCategories();
    const deletedIds = await getDeletedContentIds();

    // Check if remote Firestore has more categories
    try {
      const remote = await fetchDocsFromFirestore('categories');
      if (remote && remote.length > 0) {
        const map = new Map<string, ContentCategory>();
        categories.forEach(c => map.set(c.id, c));
        remote.forEach((r: any) => {
          if (!deletedIds.includes(r.id)) {
            map.set(r.id, r as ContentCategory);
          }
        });
        categories = Array.from(map.values());
        saveStoreCategories(categories);
      }
    } catch (err: any) {
      console.warn('Firestore categories notice:', err?.message);
    }

    if (deletedIds && deletedIds.length > 0) {
      categories = categories.filter(c => !deletedIds.includes(c.id));
    }

    categories.sort((a, b) => ((a.order ?? 99) - (b.order ?? 99)));

    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cat: ContentCategory = await req.json();
    if (!cat.id || !cat.nameEnglish) {
      return NextResponse.json({ success: false, error: 'Category id and English name required' }, { status: 400 });
    }

    const current = getStoreCategories();
    if (cat.order === undefined || cat.order === null) {
      cat.order = current.length > 0 ? Math.max(...current.map(c => c.order || 0), 0) + 1 : 1;
    }

    const idx = current.findIndex(c => c.id === cat.id);
    const updated = idx >= 0 ? current.map(c => c.id === cat.id ? cat : c) : [...current, cat];
    saveStoreCategories(updated);

    // Sync to Cloud Firestore & remove from deleted content list if present
    try {
      await syncDocToFirestore('categories', cat.id, cat);
      await removeDeletedContentFromFirestore(cat.id);
    } catch (err: any) {
      console.warn('Firestore sync notice for category:', err?.message);
    }

    return NextResponse.json({ success: true, data: cat });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Category id required' }, { status: 400 });
    }

    const current = getStoreCategories();
    const updated = current.filter(c => c.id !== id);
    saveStoreCategories(updated);

    try {
      await deleteDocFromFirestore('categories', id);
      await recordDeletedContentInFirestore(id, { type: 'category' });
    } catch (err: any) {
      console.warn('Firestore delete notice for category:', err?.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
