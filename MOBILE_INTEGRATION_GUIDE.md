# 📱 Aurora OTT Platform — Mobile Application Developer Integration Guide

This document contains everything needed for mobile developers (**Flutter**, **React Native**, **Android / Kotlin**, or **iOS / Swift**) to connect, fetch all data, authenticate users, and stream video content from the Aurora OTT backend.

---

## 📑 Table of Contents
1. [Architecture & Services Overview](#1-architecture--services-overview)
2. [Project Credentials & Configuration](#2-project-credentials--configuration)
3. [Firestore Database Schema & Queries](#3-firestore-database-schema--queries)
   - [A. Home Screen Banners (`banners`)](#a-home-screen-banners-collection-banners)
   - [B. Movies & Web Series (`content`)](#b-movies--web-series-collection-content)
   - [C. Seasons & Episodes (Subcollections)](#c-seasons--episodes-subcollections)
   - [D. Subscription Plans (`plans`)](#d-subscription-plans-collection-plans)
   - [E. User Profile & Watchlist (`users`)](#e-user-profile--watchlist-collection-users)
4. [Video Streaming (Bunny.net HLS Playback)](#4-video-streaming-bunnynet-hls-playback)
5. [Ready-to-Use Code Snippets](#5-ready-to-use-code-snippets)
   - [Flutter (Dart)](#flutter-dart-implementation)
   - [React Native (TypeScript)](#react-native-typescript-implementation)
   - [Android (Kotlin + ExoPlayer)](#android-kotlin--media3-exoplayer)
   - [iOS (Swift + AVPlayer)](#ios-swift--avplayer)
6. [Common Pitfalls & Checklist](#6-common-pitfalls--troubleshooting)

---

## 1. Architecture & Services Overview

* **Database & Auth:** Google Cloud Firestore + Firebase Authentication (`cinora-9d4ab`)
* **Video Transcoding & Streaming:** Bunny.net Stream (Adaptive HLS `.m3u8` Multi-bitrate 4K/1080p/720p/480p)
* **Global CDN Hostname:** `vz-1192802e-f33.b-cdn.net`
* **Static Assets (Podcasts, Images):** Bunny.net Storage + CDN

```
┌─────────────────────────────────────────────────────────────┐
│                       Mobile App                            │
│  (Flutter / React Native / Native Android / Native iOS)     │
└──────────────┬───────────────────────────────┬──────────────┘
               │ 1. Fetch Metadata (JSON)      │ 2. Stream HLS (.m3u8)
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   Google Cloud Firestore     │ │     Bunny.net CDN Edge     │
│   • Banners                  │ │  vz-1192802e-f33.b-cdn.net │
│   • Movies & Series          │ │   • HLS Adaptive Bitrate   │
│   • Seasons & Episodes       │ │   • Fast low-latency VOD   │
│   • Plans & User Profiles    │ │   • Token-protected DRM    │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 2. Project Credentials & Configuration

### Firebase Client Config
```json
{
  "apiKey": "AIzaSyCZTSgR2V8WRJFA81I7Eg_KXGbYGoze9_0",
  "authDomain": "graminbharattv-f8994.firebaseapp.com",
  "projectId": "graminbharattv-f8994",
  "storageBucket": "graminbharattv-f8994.firebasestorage.app",
  "messagingSenderId": "243987460177",
  "appId": "1:243987460177:web:5f2a16ec50fe3f08fc4870",
  "measurementId": "G-BMJH1SK3KH"
}
```

* **Android Native:** Google Services configuration for project `graminbharattv-f8994` (located at `android/app/google-services.json`).

### Bunny.net Storage Configuration (Zone: `graminbharat`)
* **Storage Zone:** `graminbharat`
* **Storage Host:** `storage.bunnycdn.com`
* **Storage Endpoint:** `https://storage.bunnycdn.com/graminbharat`
* **Access Key (Password):** `2d3836f0-1ac0-4550-bc5638b69bd8-18c0-45d9`
* **Read-Only Access Key:** `0dfda11e-aa10-45de-9869ff9c29df-e295-4589`
* **Stream Library ID:** `737060`
* **CDN Hostname:** `vz-1192802e-f33.b-cdn.net`

---

## 3. Firestore Database Schema & Queries

### A. Home Screen Banners (Collection: `banners`)
Use this to render the top hero slider/carousel on the home page.

* **Firestore Path:** `/banners`
* **Query:** `.where('active', '==', true).orderBy('order', 'asc')`
* **Data Model:**
```typescript
interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;      // URL or base64 data for the banner image
  contentId: string;     // ID of the movie/series to open on click
  badge?: string;        // e.g. "Trending #1", "New Release"
  order: number;         // Sort order (1, 2, 3...)
  active: boolean;
}
```

---

### B. Movies & Web Series (Collection: `content`)
Used for catalog browsing, search, and category listing.

* **Firestore Path:** `/content`
* **Query for Movies:** `.where('type', '==', 'movie').where('status', '==', 'published')`
* **Query for Series:** `.where('type', '==', 'series').where('status', '==', 'published')`
* **Data Model:**
```typescript
interface ContentItem {
  id: string;
  type: 'movie' | 'series' | 'podcast';
  title: string;
  slug: string;
  description: string;
  genres: string[];          // e.g. ["Action", "Sci-Fi"]
  cast: string[];            // e.g. ["Timothée Chalamet", "Zendaya"]
  director: string;
  language: string[];        // e.g. ["English", "Hindi"]
  releaseDate: string;       // e.g. "2024-11-15"
  poster: string;            // Poster Image URL or Base64
  banner: string;            // Backdrop Image URL or Base64
  trailerUrl?: string;       // YouTube or MP4 trailer URL
  isPremium: boolean;        // true = requires paid subscription
  isFeatured: boolean;       // true = show in Featured section
  status: 'published' | 'draft' | 'archived';
  rating: string;            // e.g. "PG-13", "18+", "TV-MA"
  imdbScore?: number;        // e.g. 8.8
  views: number;

  // Movie Specific fields:
  videoId?: string;          // Bunny Video GUID (e.g. "guid-abc123-xyz")
  duration?: number;         // Duration in seconds (e.g. 7200 = 2 hours)
  videoStatus?: 'ready' | 'processing' | 'failed';
  resolution?: string;       // "4K UHD HDR", "1080p Full HD"
}
```

---

### C. Seasons & Episodes (Subcollections)
Web Series are structured hierarchically: `content` ➔ `seasons` ➔ `episodes`.

#### 1. Fetch Seasons for a Series:
* **Firestore Path:** `/content/{seriesId}/seasons`
* **Query:** `.orderBy('seasonNumber', 'asc')`
```typescript
interface Season {
  id: string;
  contentId: string;         // Parent Series ID
  seasonNumber: number;      // 1, 2, 3...
  title: string;             // e.g. "Season 1: Awakening"
  poster?: string;
  overview?: string;
  episodeCount?: number;
}
```

#### 2. Fetch Episodes for a Season:
* **Firestore Path:** `/content/{seriesId}/seasons/{seasonId}/episodes`
* **Query:** `.orderBy('episodeNumber', 'asc')`
```typescript
interface Episode {
  id: string;
  seasonId: string;          // Parent Season ID
  contentId: string;         // Parent Series ID
  episodeNumber: number;     // 1, 2, 3...
  title: string;             // e.g. "Episode 1: The Beginning"
  description: string;
  videoId: string;           // Bunny Video GUID to play in video player
  duration: number;          // Duration in seconds
  thumbnail: string;         // Thumbnail URL
  isFreePreview: boolean;    // If true, playable without active subscription
  videoStatus: 'ready' | 'processing';
  resolution?: string;
}
```

---

### D. Subscription Plans (Collection: `plans`)
Used to display paywalls and upgrade screens.

* **Firestore Path:** `/plans`
* **Query:** `.where('active', '==', true)`
* **Data Model:**
```typescript
interface Plan {
  id: string;
  name: string;              // "Premium 4K", "Standard HD"
  slug: string;
  price: number;             // 499
  currency: string;          // "INR", "USD"
  durationDays: number;      // 30, 365
  resolution: string;        // "4K UHD HDR", "1080p"
  maxDevices: number;        // 1, 2, 4
  features: string[];        // ["Ad-free", "Offline Downloads", "Ultra HD"]
  isPopular?: boolean;
}
```

---

### E. User Profile & Watchlist (Collection: `users`)
* **Firestore Path:** `/users/{firebaseAuthUid}`
```typescript
interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  subscriptionStatus: 'active' | 'expired' | 'canceled' | 'none';
  planId?: string;
  planExpiry?: string;       // ISO Date String
  watchlist: string[];       // Array of contentIds
  continueWatching: {
    [contentId: string]: {
      position: number;      // Last watched position in seconds
      duration: number;      // Total duration in seconds
      updatedAt: string;
    };
  };
}
```

---

## 4. Video Streaming (Bunny.net HLS Playback)

Videos are delivered via **Bunny.net Storage** (`storage.bunnycdn.com/graminbharat`) and **Adaptive HLS Streaming (`.m3u8`)**.

### How to build the Playback Stream URL:
Given a `videoId` from any movie or episode document:

#### Option A: Bunny Storage Direct Video (MP4 / WebM from Website Upload)
When videos are uploaded from the admin panel, `videoId` contains the storage URL or path (e.g. `https://storage.bunnycdn.com/graminbharat/videos/myvideo.mp4` or `videos/myvideo.mp4`):
* URL: `https://storage.bunnycdn.com/graminbharat/{path}`
* Required HTTP Header: `AccessKey: 0dfda11e-aa10-45de-9869ff9c29df-e295-4589` (Read-only key)
* Handled automatically in Flutter via `VideoPlayerController.networkUrl(url, httpHeaders: BunnyService.getHeadersForUrl(url))`.

#### Option B: Direct HLS Stream URL (Bunny Stream / Pull Zone)
```
https://vz-1192802e-f33.b-cdn.net/{videoId}/playlist.m3u8
```
*Example:* `https://vz-1192802e-f33.b-cdn.net/sample-bunny-video-01/playlist.m3u8`

#### Option C: Token-Authenticated Stream URL (For Premium / DRM Protection)
If token authentication is enabled on the CDN, request a signed playback URL from the backend before starting the player:
* **Endpoint:** `POST https://<your-backend-api-url>/api/bunny/token`
* **Request Body:**
```json
{
  "userId": "firebase_user_uid_123",
  "videoGuid": "guid-abc123-xyz",
  "isFreePreview": false
}
```
* **Response:**
```json
{
  "success": true,
  "playbackUrl": "https://vz-1192802e-f33.b-cdn.net/guid-abc123-xyz/playlist.m3u8?token=af71b...&expires=1740000000",
  "expiresIn": 7200
}
```

---

## 5. Ready-to-Use Code Snippets

### Flutter (Dart) Implementation

```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:video_player/video_player.dart';

class OTTService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  static const String bunnyCdn = "vz-1192802e-f33.b-cdn.net";

  // 1. Fetch Home Banners
  Future<List<Map<String, dynamic>>> getBanners() async {
    final snap = await _db
        .collection('banners')
        .where('active', isEqualTo: true)
        .orderBy('order')
        .get();
    return snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
  }

  // 2. Fetch Movies
  Future<List<Map<String, dynamic>>> getMovies() async {
    final snap = await _db
        .collection('content')
        .where('type', isEqualTo: 'movie')
        .where('status', isEqualTo: 'published')
        .get();
    return snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
  }

  // 3. Fetch Series Episodes
  Future<List<Map<String, dynamic>>> getEpisodes(String seriesId, String seasonId) async {
    final snap = await _db
        .collection('content')
        .doc(seriesId)
        .collection('seasons')
        .doc(seasonId)
        .collection('episodes')
        .orderBy('episodeNumber')
        .get();
    return snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
  }

  // 4. Generate HLS Stream URL
  String getHlsStreamUrl(String videoId) {
    return "https://$bunnyCdn/$videoId/playlist.m3u8";
  }
}

// 5. Video Player Initialization
void playHlsVideo(String videoId) {
  final String streamUrl = OTTService().getHlsStreamUrl(videoId);
  final controller = VideoPlayerController.networkUrl(Uri.parse(streamUrl));
  controller.initialize().then((_) {
    controller.play();
  });
}
```

---

### React Native (TypeScript) Implementation

```typescript
import firestore from '@react-native-firebase/firestore';
import Video from 'react-native-video';

const BUNNY_CDN_HOSTNAME = 'vz-1192802e-f33.b-cdn.net';

// 1. Fetch Published Movies
export async function fetchPublishedMovies() {
  const snapshot = await firestore()
    .collection('content')
    .where('type', '==', 'movie')
    .where('status', '==', 'published')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 2. Fetch Episodes
export async function fetchEpisodes(seriesId: string, seasonId: string) {
  const snapshot = await firestore()
    .collection('content')
    .doc(seriesId)
    .collection('seasons')
    .doc(seasonId)
    .collection('episodes')
    .orderBy('episodeNumber', 'asc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 3. Render Video Player Component
export function HLSPlayer({ videoId }: { videoId: string }) {
  const streamUrl = `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;

  return (
    <Video
      source={{
        uri: streamUrl,
        type: 'm3u8',
      }}
      controls={true}
      resizeMode="contain"
      style={{ width: '100%', height: 250 }}
    />
  );
}
```

---

### Android (Kotlin + Media3 ExoPlayer)

```kotlin
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.exoplayer.ExoPlayer

fun setupPlayer(context: Context, videoId: String): ExoPlayer {
    val player = ExoPlayer.Builder(context).build()
    val streamUri = "https://vz-1192802e-f33.b-cdn.net/$videoId/playlist.m3u8"
    
    val mediaItem = MediaItem.Builder()
        .setUri(streamUri)
        .setMimeType(MimeTypes.APPLICATION_M3U8)
        .build()
        
    player.setMediaItem(mediaItem)
    player.prepare()
    player.play()
    return player
}
```

---

### iOS (Swift + AVPlayer)

```swift
import AVKit
import SwiftUI

struct VideoPlayerView: View {
    let videoId: String
    
    var body: some View {
        let streamUrlString = "https://vz-1192802e-f33.b-cdn.net/\(videoId)/playlist.m3u8"
        if let url = URL(string: streamUrlString) {
            VideoPlayer(player: AVPlayer(url: url))
                .edgesIgnoringSafeArea(.all)
        } else {
            Text("Invalid video stream URL")
        }
    }
}
```

---

## 6. Common Pitfalls & Troubleshooting

1. **Why is a newly added movie not showing in the mobile app?**
   * Check the document's `status` field. The mobile query filters for `status == 'published'`. If the item is marked as `'draft'`, it will not appear in the mobile app.
2. **Episode list returning empty?**
   * Episodes are nested under `/content/{seriesId}/seasons/{seasonId}/episodes`. They cannot be queried with `collection('episodes')` directly; you must either query by the full nested path or use a collection group query (`collectionGroup('episodes')`).
3. **Black screen or error during HLS playback?**
   * Ensure your mobile video player has HLS enabled (`m3u8` MIME type).
   * Verify the `videoId` string is not empty.
4. **Offline Cache & Resume Watching:**
   * Update the user's document at `/users/{userId}` under the `continueWatching.{contentId}` object with `{ "position": currentSeconds, "duration": totalSeconds, "updatedAt": ISO_STRING }` to sync resume positions across devices.
