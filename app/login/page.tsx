'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAuthLoaded } = useAuth();
  const { lang } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // If already authenticated with a valid session, redirect to /admin
  React.useEffect(() => {
    if (isAuthLoaded && isAuthenticated) {
      const isExplicitLogout = typeof window !== 'undefined' && localStorage.getItem('ott_admin_explicit_logout') === 'true';
      if (!isExplicitLogout) {
        router.push('/admin');
      }
    }
  }, [isAuthLoaded, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(
        lang === 'mr' 
          ? 'कृपया वैध ईमेल प्रविष्ट करा.' 
          : lang === 'hi' 
          ? 'कृपया मान्य ईमेल दर्ज करें।' 
          : 'Please enter a valid email address.'
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        lang === 'mr' 
          ? 'कृपया संकेतशब्द (पासवर्ड) प्रविष्ट करा.' 
          : lang === 'hi' 
          ? 'कृपया पासवर्ड दर्ज करें।' 
          : 'Please enter your password.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        if (rememberMe) {
          localStorage.setItem('ott_admin_remember_email', email.trim());
        } else {
          localStorage.removeItem('ott_admin_remember_email');
        }
        if (typeof window !== 'undefined') {
          window.location.replace('/admin');
        } else {
          router.push('/admin');
        }
      } else {
        setErrorMessage(
          res.error || (
            lang === 'mr'
              ? 'अवैध ईमेल किंवा पासवर्ड. कृपया पुन्हा प्रयत्न करा.'
              : lang === 'hi'
              ? 'अमान्य ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।'
              : 'Invalid email or password. Please try again.'
          )
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || (
          lang === 'mr'
            ? 'लॉगिन करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.'
            : lang === 'hi'
            ? 'लॉगिन करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
            : 'An unexpected error occurred during login. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EC] to-[#F3EDE2] text-[#2D2522] flex flex-col justify-between overflow-hidden selection:bg-amber-200 selection:text-[#2D2522]">
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-amber-400/25 via-orange-300/15 to-transparent blur-3xl pointer-events-none animate-blob" />
      <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-gradient-to-tl from-emerald-500/20 via-teal-400/15 to-transparent blur-3xl pointer-events-none animate-blob [animation-delay:3s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-200/30 via-rose-200/20 to-transparent blur-3xl pointer-events-none" />

      {/* Visible Decorative Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E5DBCA40_1px,transparent_1px),linear-gradient(to_bottom,#E5DBCA40_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Bar with Brand & Language Switcher */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DBCA] p-1 shadow-xs flex items-center justify-center">
            <img src="/logo.png" alt="ग्रामीण भारत TV" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#2D2522] tracking-tight leading-none">
              ग्रामीण भारत TV
            </h2>
            <p className="text-[10px] sm:text-xs text-[#7A6F68] font-bold mt-0.5">
              OTT Console • Admin Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="light" mode="segmented" />
        </div>
      </header>

      {/* Main Login Card Center */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[420px] bg-white border border-[#E5DBCA] rounded-3xl shadow-[0_25px_60px_-15px_rgba(217,119,6,0.18),0_15px_30px_-10px_rgba(45,37,34,0.08)] px-6 sm:px-8 py-9 sm:py-11 space-y-6 sm:space-y-7 relative overflow-hidden transition-all duration-300">
          {/* Animated Accent Gradient Top Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D97706] via-[#EA580C] to-[#166534] bg-[length:200%_100%] animate-gradient-flow" />

          {/* Brand Logo & Header */}
          <div className="text-center space-y-3 pt-1">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#FAF7F2] border border-[#E5DBCA] p-2 mx-auto flex items-center justify-center shadow-xs transition-transform duration-300 hover:scale-105">
              <img src="/logo.png" alt="ग्रामीण भारत TV" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[10.5px] font-extrabold uppercase tracking-wider shadow-2xs">
                {lang === 'mr' ? 'प्रशासक पोर्टल' : lang === 'hi' ? 'व्यवस्थापक पोर्टल' : 'Admin Portal'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#2D2522] mt-2 tracking-tight">
                {lang === 'mr' ? 'स्वागत आहे' : lang === 'hi' ? 'स्वागत है' : 'Welcome Back'}
              </h1>
              <p className="text-xs text-[#7A6F68] font-medium mt-1.5 leading-relaxed max-w-xs mx-auto">
                {lang === 'mr'
                  ? 'ग्रामीण भारत टीव्ही कन्सोलमध्ये प्रवेश करण्यासाठी माहिती भरा'
                  : lang === 'hi'
                  ? 'ग्रामीण भारत टीवी कंसोल तक पहुंचने के लिए लॉगिन करें'
                  : 'Enter your credentials to access Gramin Bharat TV Console'}
              </p>
            </div>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FFE4E6] text-[#DC2626] flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2D2522]">
                {lang === 'mr' ? 'ईमेल किंवा वापरकर्ता नाव' : lang === 'hi' ? 'ईमेल या उपयोगकर्ता नाम' : 'Email or Username'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@graminbharat.tv"
                  autoComplete="username"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#2D2522]">
                  {lang === 'mr' ? 'संकेतशब्द (Password)' : lang === 'hi' ? 'पासवर्ड (Password)' : 'Password'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-[#D97706] hover:text-[#B45309] hover:underline cursor-pointer"
                >
                  {lang === 'mr' ? 'पासवर्ड विसरलात?' : lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#FAF7F2] border border-[#E5DBCA] rounded-xl pl-10 pr-10 py-3 text-sm font-semibold text-[#0F172A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/15 focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A6F68] hover:text-[#2D2522] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5DBCA] text-[#166534] focus:ring-[#166534] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#7A6F68]">
                  {lang === 'mr' ? 'माझे लॉगिन लक्षात ठेवा' : lang === 'hi' ? 'मुझे याद रखें' : 'Remember Me'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 px-4 rounded-xl bg-gradient-to-r from-[#166534] via-[#15803D] to-[#14532D] hover:from-[#14532D] hover:to-[#052E16] text-white text-sm font-bold transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'mr' ? 'तपासत आहे...' : lang === 'hi' ? 'जांच हो रही है...' : 'Authenticating...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {lang === 'mr' ? 'प्रशासक पॅनेलमध्ये प्रवेश करा' : lang === 'hi' ? 'व्यवस्थापक पैनल में प्रवेश करें' : 'Login to Admin Panel'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5DBCA] rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-[#2D2522]">
                <HelpCircle className="w-5 h-5 text-[#D97706]" />
                <span>{lang === 'mr' ? 'पासवर्ड विसरलात?' : lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-[#7A6F68] hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              {lang === 'mr'
                ? 'सुरक्षिततेच्या कारणास्तव पासवर्ड रीसेट करण्यासाठी कृपया मुख्य प्रशासक (Superadmin) किंवा तांत्रिक विभागाशी संपर्क साधा:'
                : lang === 'hi'
                ? 'सुरक्षा कारणों से पासवर्ड रीसेट करने के लिए कृपया सुपरएडमिन या तकनीकी विभाग से संपर्क करें:'
                : 'For security reasons, to reset your administrative credentials, please contact the Superadmin or IT Department:'}
            </p>
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E5DBCA] text-xs font-semibold text-[#2D2522] space-y-1">
              <p>📧 contact@graminbharat.tv</p>
              <p>📞 +91 94220 00000</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {lang === 'mr' ? 'समजले' : lang === 'hi' ? 'समझ गया' : 'Got it'}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-5 px-4 text-xs text-[#7A6F68] space-y-1">
        <p className="font-semibold">
          © 2026 Gramin Bharat TV Entertainment And Media Private Limited. All rights reserved.
        </p>
        <p className="text-[11px] text-[#A89C94]">
          🔒 256-Bit SSL Encrypted Admin Console
        </p>
      </footer>
    </div>
  );
}
