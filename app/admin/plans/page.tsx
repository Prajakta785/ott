'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Check, 
  Edit, 
  Trash2, 
  Search, 
  Smartphone, 
  Sparkles,
  IndianRupee
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { firestoreService } from '@/lib/firestore-service';
import { Plan, Subscription } from '@/lib/types';
import { formatCurrency, formatDate, slugify } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';

export default function PlansPage() {
  const { canEdit, canDelete } = useAuth();
  const { t, lang } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscribers'>('plans');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
  const [featuresInput, setFeaturesInput] = useState('');
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Target
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

  const loadData = async () => {
    setLoading(true);
    let [pList, sList] = await Promise.all([
      firestoreService.getPlans(),
      firestoreService.getSubscriptions(),
    ]);
    
    if (!pList || pList.length === 0) {
      try {
        const res = await fetch('/api/plans');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            pList = json.data;
          }
        }
      } catch {}
    }

    // Ensure all plans are in INR and clean
    const inrPlans = (pList && pList.length > 0 ? pList : []).map(p => ({
      ...p,
      currency: 'INR',
      price: Number(p.price) || 0
    }));

    setPlans(inrPlans);
    setSubscriptions(sList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreatePlan = () => {
    setCurrentPlan({
      id: 'plan-' + Date.now().toString(36),
      name: '',
      slug: '',
      price: 0,
      currency: 'INR',
      durationDays: 30,
      billingCycle: 'monthly',
      resolution: '1080p Full HD',
      maxDevices: 2,
      features: ['Phone, TV & Web access', 'Unlimited streaming', 'HD Quality', 'Ad-free experience'],
      isPopular: false,
      active: true,
    });
    setFeaturesInput('Phone, TV & Web access\nUnlimited streaming\nHD Quality\nAd-free experience');
    setIsEditingPlan(false);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: Plan) => {
    setCurrentPlan({ ...plan, currency: 'INR' });
    setFeaturesInput(plan.features.join('\n'));
    setIsEditingPlan(true);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan.name?.trim()) {
      alert('Please enter a plan name');
      return;
    }

    setIsSaving(true);
    try {
      const featArray = featuresInput.split('\n').map(s => s.trim()).filter(Boolean);

      const planToSave: Plan = {
        id: currentPlan.id || 'plan-' + Date.now().toString(36),
        name: currentPlan.name.trim(),
        slug: currentPlan.slug || slugify(currentPlan.name.trim()),
        price: currentPlan.price !== undefined ? Number(currentPlan.price) : 0,
        currency: 'INR',
        durationDays: Number(currentPlan.durationDays) || 30,
        billingCycle: currentPlan.durationDays && currentPlan.durationDays >= 365 ? 'yearly' : (currentPlan.durationDays && currentPlan.durationDays >= 90 ? 'quarterly' : 'monthly'),
        resolution: currentPlan.resolution || '1080p Full HD',
        maxDevices: Number(currentPlan.maxDevices) || 2,
        features: featArray.length ? featArray : ['Unlimited streaming'],
        isPopular: !!currentPlan.isPopular,
        active: currentPlan.active !== undefined ? currentPlan.active : true,
      };

      await firestoreService.savePlan(planToSave);
      setIsPlanModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Save plan error:', err);
      alert('Could not save plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;
    await firestoreService.deletePlan(planToDelete.id);
    setPlanToDelete(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 rounded-3xl bg-white border border-slate-200 shadow-luxury">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <IndianRupee className="w-6 h-6 text-rose-600" />
            {t('pageTitlePlans')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('plansDescText')}
          </p>
        </div>
        {canEdit && (
          <button 
            onClick={handleOpenCreatePlan} 
            className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> {lang === 'mr' ? 'नवीन प्लॅन तयार करा' : lang === 'hi' ? 'नया प्लान बनाएं' : 'Create Plan'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
            activeTab === 'plans'
              ? 'bg-[#EA580C] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Subscription Tiers ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
            activeTab === 'subscribers'
              ? 'bg-[#EA580C] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Active Subscriptions ({subscriptions.length})
        </button>
      </div>

      {activeTab === 'plans' ? (
        plans.length === 0 ? (
          /* Clean Empty Slate */
          <div className="py-16 text-center rounded-3xl bg-white border border-dashed border-slate-200 p-8 shadow-sm">
            <CreditCard className="w-10 h-10 text-rose-500 mx-auto mb-3 opacity-75" />
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'mr' ? 'कोणतीही वर्गणी योजना उपलब्ध नाही' : lang === 'hi' ? 'कोई सदस्यता योजना उपलब्ध नहीं है' : 'No Plans Created Yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-6">
              {lang === 'mr'
                ? 'चाचणीसाठी आपण ₹० किंवा इच्छित दराचा (₹९९, ₹१४९, ₹२९९ इ.) नवा प्लॅन तयार करू शकता.'
                : lang === 'hi'
                ? 'परीक्षण के लिए आप ₹० या इच्छित दर का (₹९९, ₹१४९, ₹२९९ आदि) नया प्लान बना सकते हैं।'
                : 'You can create a test plan with ₹0 or standard pricing (₹99, ₹149, ₹299, etc.).'}
            </p>
            <button
              onClick={handleOpenCreatePlan}
              className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 mx-auto"
            >
                <Plus className="w-4 h-4" /> {lang === 'mr' ? 'नवीन प्लॅन तयार करा' : lang === 'hi' ? 'नया प्लान बनाएं' : 'Create Subscription Plan'}
            </button>
          </div>
        ) : (
          /* Plan Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl bg-white border p-6 flex flex-col justify-between transition-all duration-300 relative shadow-soft ${
                  plan.isPopular
                    ? 'border-rose-400 shadow-soft-lg bg-gradient-to-b from-rose-50/40 to-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
                    {t('mostPopularTier')}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-xl text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{plan.durationDays} {t('durationDaysText')}</p>
                    </div>
                    <Badge variant={plan.active ? 'matcha' : 'secondary'} size="sm">
                      {plan.active ? t('statusActive') : t('statusDisabled')}
                    </Badge>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{formatCurrency(plan.price, 'INR')}</span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {plan.durationDays >= 365 ? (lang === 'mr' ? '/ वर्ष' : lang === 'hi' ? '/ वर्ष' : '/ year') : plan.durationDays >= 90 ? (lang === 'mr' ? '/ तिमाही' : lang === 'hi' ? '/ तिमाही' : '/ quarter') : (lang === 'mr' ? '/ महिना' : lang === 'hi' ? '/ महीना' : '/ month')}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">{t('maxDevicesText')}</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-rose-600" /> {plan.maxDevices} {t('concurrentDevices')}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-bold">{t('resolutionText')}</span>
                    <span className="font-bold text-slate-900 uppercase">{plan.resolution}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'mr' ? 'समाविष्ट वैशिष्ट्ये:' : lang === 'hi' ? 'शामिल सुविधाएं:' : 'Features Included:'}</p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-6 border-t border-slate-100 mt-6">
                  {canEdit && (
                    <Button size="sm" variant="secondary" onClick={() => handleOpenEditPlan(plan)} className="gap-1.5 text-xs">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="danger" onClick={() => setPlanToDelete(plan)} className="p-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Subscriptions Table */
        <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-luxury space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Payment Transactions & Entitlements</h3>
            <div className="relative max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user or transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-3 font-bold">User & Account</th>
                  <th className="pb-3 font-bold">Plan</th>
                  <th className="pb-3 font-bold">Amount (₹)</th>
                  <th className="pb-3 font-bold">Provider & Transaction</th>
                  <th className="pb-3 font-bold">Valid Period</th>
                  <th className="pb-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions
                  .filter(s => (s.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || s.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5">
                        <p className="font-bold text-slate-900">{sub.userName || sub.userId}</p>
                        <p className="text-[11px] text-slate-500">{sub.userPhone || 'No phone'}</p>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-slate-900">{sub.planName}</span>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900">
                        {formatCurrency(sub.amount, 'INR')}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                            {sub.paymentProvider}
                          </span>
                          <span className="font-mono text-slate-500 truncate max-w-[120px]">{sub.transactionId}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500 font-mono">
                        {formatDate(sub.startDate)} → {formatDate(sub.endDate)}
                      </td>
                      <td className="py-3.5">
                        <Badge variant={sub.status === 'active' ? 'matcha' : 'secondary'} size="sm">
                          {sub.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PLAN MODAL */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={
          isEditingPlan 
            ? (lang === 'mr' ? 'वर्गणी योजना संपादित करा' : lang === 'hi' ? 'सदस्यता प्लान संपादित करें' : 'Edit Subscription Plan')
            : (lang === 'mr' ? 'नवीन वर्गणी योजना तयार करा' : lang === 'hi' ? 'नया सदस्यता प्लान बनाएं' : 'Create Subscription Plan')
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'mr' ? 'प्लॅनचे नाव *' : lang === 'hi' ? 'प्लान का नाम *' : 'Plan Name *'}
              </label>
              <input
                type="text"
                required
                value={currentPlan.name || ''}
                onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value, slug: slugify(e.target.value) })}
                placeholder={lang === 'mr' ? 'उदा. Mobile Only / Standard HD' : lang === 'hi' ? 'उदा. Mobile Only / Standard HD' : 'e.g. Mobile Only / Standard HD'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'mr' ? 'दर / किंमत (₹) *' : lang === 'hi' ? 'मूल्य (₹) *' : 'Price (₹ INR) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={currentPlan.price !== undefined ? currentPlan.price : 0}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {lang === 'mr' ? 'चाचणीसाठी ₹० किंवा कोणताही दर टाकू शकता.' : lang === 'hi' ? 'परीक्षण के लिए ₹० या कोई भी मूल्य दर्ज कर सकते हैं।' : 'Enter ₹0 for testing or any custom amount.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'mr' ? 'कालावधी (दिवसांमध्ये) *' : lang === 'hi' ? 'अवधि (दिनों में) *' : 'Duration (Days) *'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={currentPlan.durationDays || 30}
                onChange={(e) => setCurrentPlan({ ...currentPlan, durationDays: parseInt(e.target.value) || 30 })}
                placeholder="30"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'mr' ? 'कमाल उपकरणे (स्क्रीन)' : lang === 'hi' ? 'अधिकतम स्क्रीन' : 'Max Screens'}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={currentPlan.maxDevices || 2}
                onChange={(e) => setCurrentPlan({ ...currentPlan, maxDevices: parseInt(e.target.value) || 2 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'mr' ? 'व्हिडिओ गुणवत्ता' : lang === 'hi' ? 'वीडियो गुणवत्ता' : 'Video Resolution'}
              </label>
              <select
                value={currentPlan.resolution || '1080p Full HD'}
                onChange={(e) => setCurrentPlan({ ...currentPlan, resolution: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
              >
                <option value="720p HD">720p HD</option>
                <option value="1080p Full HD">1080p Full HD</option>
                <option value="4K UHD + HDR10">4K UHD + HDR10</option>
                <option value="4K UHD Dolby Vision">4K Dolby Vision</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {lang === 'mr' ? 'वैशिष्ट्ये (प्रति ओळ एक)' : lang === 'hi' ? 'सुविधाएं (प्रति पंक्ति एक)' : 'Features (One per line)'}
            </label>
            <textarea
              rows={3}
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder={
                lang === 'mr'
                  ? 'सर्व उपकरणांवर पहा (Mobile, TV, Web)\nजाहिरातमुक्त अनुभव\nऑफलाईन डाऊनलोड'
                  : lang === 'hi'
                  ? 'सभी उपकरणों पर देखें (Mobile, TV, Web)\nविज्ञापन मुक्त अनुभव\nऑफ़लाइन डाउनलोड'
                  : 'Watch on all devices (Mobile, TV, Web)\nAd-free experience\nOffline download'
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={!!currentPlan.isPopular}
                onChange={(e) => setCurrentPlan({ ...currentPlan, isPopular: e.target.checked })}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              {lang === 'mr' ? 'सर्वात लोकप्रिय (Most Popular Badge) म्हणून दर्शवा' : lang === 'hi' ? 'सर्वाधिक लोकप्रिय (Most Popular Badge) के रूप में दिखाएं' : 'Highlight as "Most Popular"'}
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsPlanModalOpen(false)}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t('cancelBtn')}
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] active:scale-95 text-white rounded-xl shadow-sm cursor-pointer"
            >
              {lang === 'mr' ? 'प्लॅन जतन करा' : lang === 'hi' ? 'प्लान सहेजें' : 'Save Plan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={lang === 'mr' ? 'प्लॅन हटवायचा?' : lang === 'hi' ? 'प्लान हटाएं?' : 'Delete Plan?'}
        message={planToDelete ? `${t('deleteConfirmPlan')} (${planToDelete.name})` : t('deleteConfirmPlan')}
        confirmText={lang === 'mr' ? 'प्लॅन हटवा' : lang === 'hi' ? 'प्लान हटाएं' : 'Delete Plan'}
      />
    </div>
  );
}
