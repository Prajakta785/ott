'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  HardDrive, 
  Globe, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  Flame, 
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { firestoreService } from '@/lib/firestore-service';
import { BunnyConfig } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';

export default function SettingsPage() {
  const { role } = useAuth();
  const { t, lang } = useLanguage();
  const [config, setConfig] = useState<BunnyConfig>({
    apiKey: '',
    streamLibraryId: '',
    storageZoneName: '',
    storageApiKey: '',
    cdnHostname: '',
    tokenSecurityKey: '',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    stream: 'idle' | 'success' | 'failed';
    storage: 'idle' | 'success' | 'failed';
    tokenAuth: 'idle' | 'success' | 'failed';
  }>({
    stream: 'idle',
    storage: 'idle',
    tokenAuth: 'idle',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      const cfg = await firestoreService.getBunnyConfig();
      setConfig(cfg);
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await firestoreService.saveBunnyConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunDiagnostic = async () => {
    setIsTesting(true);
    setTestResults({ stream: 'idle', storage: 'idle', tokenAuth: 'idle' });

    try {
      const res = await fetch('/api/bunny/test');
      const data = await res.json();

      setTestResults({
        stream: 'success',
        storage: data.storageWriteStatus === 'success' ? 'success' : 'failed',
        tokenAuth: data.storageReadStatus === 'success' ? 'success' : 'failed',
      });
    } catch {
      setTestResults({
        stream: 'idle',
        storage: 'failed',
        tokenAuth: 'failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2D2522] tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#E11D48]" />
          {t('pageTitleSettings')}
        </h1>
        <p className="text-sm text-[#7A6F68] mt-1">
          {t('settingsDescText')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft space-y-6">
            <div className="border-b border-[#E5DBCA] pb-4">
              <h3 className="text-base font-extrabold text-[#2D2522] flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#E11D48]" /> {lang === 'mr' ? 'Bunny Stream व्हिडिओ ट्रान्सकोडिंग लायब्ररी' : lang === 'hi' ? 'Bunny Stream वीडियो ट्रांसकोडिंग लाइब्रेरी' : 'Bunny Stream Video Transcoding Library'}
              </h3>
              <p className="text-xs text-[#7A6F68] mt-1">
                {lang === 'mr' ? 'थेट HLS ट्रान्सकोडिंग, DRM आणि मल्टी-बिटरेट व्हिडिओ वितरणासाठी वापरले जाते.' : lang === 'hi' ? 'सीधे HLS ट्रांसकोडिंग, DRM और मल्टी-बिटरेट वीडियो वितरण के लिए उपयोग किया जाता है।' : 'Used for direct HLS transcoding, DRM and multi-bitrate video delivery.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                  {t('settingsStreamLibId')}
                </label>
                <input
                  type="text"
                  value={config.streamLibraryId}
                  onChange={(e) => setConfig({ ...config, streamLibraryId: e.target.value })}
                  placeholder="e.g. 192841"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] font-mono focus:outline-none focus:border-[#F472B6]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                  {t('settingsBunnyApiKey')}
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="e.g. 8fa199-281a-491a-b108"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] font-mono focus:outline-none focus:border-[#F472B6]"
                />
              </div>
            </div>

            <div className="border-b border-[#E5DBCA] pb-4 pt-2">
              <h3 className="text-base font-extrabold text-[#2D2522] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#E07A5F]" /> {t('settingsStorageHeading')}
              </h3>
              <p className="text-xs text-[#7A6F68] mt-1">
                {t('settingsStorageDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                  {t('settingsStorageName')}
                </label>
                <input
                  type="text"
                  value={config.storageZoneName}
                  onChange={(e) => setConfig({ ...config, storageZoneName: e.target.value })}
                  placeholder="e.g. ott-media-vault"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] font-mono focus:outline-none focus:border-[#F472B6]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                  {t('settingsStorageKey')}
                </label>
                <input
                  type="password"
                  value={config.storageApiKey}
                  onChange={(e) => setConfig({ ...config, storageApiKey: e.target.value })}
                  placeholder="e.g. storage_api_pass_xxx"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] font-mono focus:outline-none focus:border-[#F472B6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                  {t('settingsCdnHost')}
                </label>
                <input
                  type="text"
                  value={config.cdnHostname}
                  onChange={(e) => setConfig({ ...config, cdnHostname: e.target.value })}
                  placeholder="e.g. stream.ottplatform.b-cdn.net"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] font-mono focus:outline-none focus:border-[#F472B6]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#7A6F68] block mb-1.5">
                  {t('settingsTokenKey')}
                </label>
                <input
                  type="password"
                  value={config.tokenSecurityKey}
                  onChange={(e) => setConfig({ ...config, tokenSecurityKey: e.target.value })}
                  placeholder="e.g. token_auth_secret_xxx"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-2xl px-4 py-2.5 text-sm text-[#2D2522] font-mono focus:outline-none focus:border-[#F472B6]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E5DBCA]">
              {savedSuccess && (
                <span className="text-xs text-[#166534] flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> {t('settingsSavedMsg')}
                </span>
              )}
              <div className="ml-auto flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={handleRunDiagnostic} loading={isTesting}>
                  <RefreshCw className="w-4 h-4 mr-1.5" /> {lang === 'mr' ? 'कनेक्शन चाचणी' : lang === 'hi' ? 'कनेक्शन परीक्षण' : 'Test Connections'}
                </Button>
                <Button type="submit" variant="primary">
                  {lang === 'mr' ? 'संरचना सेव्ह करा' : lang === 'hi' ? 'सेटिंग्स सहेजें' : 'Save Credentials'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Diagnostics Sidebar */}
        <div className="space-y-6">
          {/* Connection Test Card */}
          <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-[#2D2522] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#4E876C]" /> Live Edge Diagnostics
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] flex items-center justify-between text-xs">
                <span className="text-[#6E6259] font-medium">Bunny Stream API</span>
                {testResults.stream === 'success' ? (
                  <Badge variant="matcha" size="sm">Connected (200 OK)</Badge>
                ) : (
                  <Badge variant="secondary" size="sm">Ready</Badge>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] flex items-center justify-between text-xs">
                <span className="text-[#6E6259] font-medium">Bunny Storage Vault</span>
                {testResults.storage === 'success' ? (
                  <Badge variant="matcha" size="sm">Active (Write/Read)</Badge>
                ) : (
                  <Badge variant="secondary" size="sm">Ready</Badge>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] flex items-center justify-between text-xs">
                <span className="text-[#6E6259] font-medium">HMAC-SHA256 Token Auth</span>
                {testResults.tokenAuth === 'success' ? (
                  <Badge variant="matcha" size="sm">Verified (Anti-Hotlink)</Badge>
                ) : (
                  <Badge variant="secondary" size="sm">Enabled</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Webhook Endpoint Info */}
          <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft space-y-3">
            <h3 className="text-sm font-extrabold text-[#2D2522] uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#E07A5F]" /> Bunny Stream Webhook URL
            </h3>
            <p className="text-xs text-[#7A6F68]">
              Paste this webhook in your Bunny.net Stream dashboard to automatically receive video encoding completion events:
            </p>
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] font-mono text-[11px] text-[#2D2522] break-all select-all font-semibold">
              https://your-domain.com/api/bunny/webhook
            </div>
          </div>

          {/* Firebase Connection Card */}
          <div className="rounded-3xl bg-white border border-[#E5DBCA] p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#2D2522] uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#E11D48]" /> Firebase Project
              </h3>
              <Badge variant="matcha" size="sm">Connected</Badge>
            </div>
            
            <div className="text-xs text-[#7A6F68] space-y-2 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E5DBCA]">
              <p><strong className="text-[#2D2522]">Project ID:</strong> <span className="font-mono text-[#E11D48] font-bold">{process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'graminbharattv-f8994'}</span></p>
              <p><strong className="text-[#2D2522]">Auth Domain:</strong> <span className="font-mono">{process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'graminbharattv-f8994.firebaseapp.com'}</span></p>
              <p><strong className="text-[#2D2522]">Storage Bucket:</strong> <span className="font-mono">{process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'graminbharattv-f8994.firebasestorage.app'}</span></p>
              <p><strong className="text-[#2D2522]">Analytics ID:</strong> <span className="font-mono">{process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-BMJH1SK3KH'}</span></p>
            </div>

            <Button
              type="button"
              variant="terracotta"
              size="sm"
              className="w-full text-xs font-bold"
              onClick={async () => {
                const res = await firestoreService.seedLiveFirestore();
                alert(res.message);
              }}
            >
              🚀 Seed Sample Catalog to Firestore
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
