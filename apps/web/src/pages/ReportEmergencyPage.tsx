import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Waves,
  HeartPulse,
  Car,
  ShieldAlert,
  Biohazard,
  Upload,
  MapPin,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { SeverityBadge } from '../components/SeverityBadge';
import confetti from 'canvas-confetti';

const QUICK_CATEGORIES = [
  { id: 'FIRE', label: 'Fire & Smoke', icon: Flame, color: 'text-orange-400', border: 'border-orange-500/50' },
  { id: 'MEDICAL', label: 'Medical Emergency', icon: HeartPulse, color: 'text-red-400', border: 'border-red-500/50' },
  { id: 'FLOOD', label: 'Flood & Water Leak', icon: Waves, color: 'text-blue-400', border: 'border-blue-500/50' },
  { id: 'ACCIDENT', label: 'Traffic Collision', icon: Car, color: 'text-amber-400', border: 'border-amber-500/50' },
  { id: 'SECURITY', label: 'Security Threat', icon: ShieldAlert, color: 'text-indigo-400', border: 'border-indigo-500/50' },
  { id: 'HAZMAT', label: 'Hazmat / Chemical', icon: Biohazard, color: 'text-lime-400', border: 'border-lime-500/50' },
];

const SAMPLE_PRESETS = [
  {
    label: 'Campus Chemical Fire',
    text: 'Smoke and fire detected near Chemistry Building Block C. 12 students are trapped inside on the 2nd floor laboratory.',
    cat: 'FIRE',
    addr: 'Chemistry Building Block C, East Campus Way',
    lat: 37.7758,
    lon: -122.4182,
  },
  {
    label: 'Basement Dorm Flooding',
    text: 'Water has entered Block C basement and two elderly individuals are trapped on the lower floor.',
    cat: 'FLOOD',
    addr: 'Oak Ridge Residences Block C',
    lat: 37.7735,
    lon: -122.4175,
  },
  {
    label: 'Cardiac Emergency at Gym',
    text: '52-year-old faculty collapsed on the track, bystander performing CPR with AED.',
    cat: 'MEDICAL',
    addr: 'Student Recreation Center, Fieldhouse Track',
    lat: 37.7765,
    lon: -122.4135,
  },
];

export const ReportEmergencyPage: React.FC = () => {
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [address, setAddress] = useState('Campus Chemistry Building, East Campus Way');
  const [latitude, setLatitude] = useState(37.7758);
  const [longitude, setLongitude] = useState(-122.4182);
  const [phone, setPhone] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Analysis State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [submittedResult, setSubmittedResult] = useState<any | null>(null);

  const applyPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setText(preset.text);
    setSelectedCategory(preset.cat);
    setAddress(preset.addr);
    setLatitude(preset.lat);
    setLongitude(preset.lon);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const data = await api.uploadMedia(file, 'citizen-reports');
      if (data.success) {
        setUploadedMediaUrl(data.data.url);
        setHasPhoto(true);
      } else {
        alert('File upload failed: ' + data.message);
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    setAnalysisStep(1);

    // Animate the 4 extraction phases for judges
    const timer1 = setTimeout(() => setAnalysisStep(2), 700);
    const timer2 = setTimeout(() => setAnalysisStep(3), 1400);
    const timer3 = setTimeout(() => setAnalysisStep(4), 2100);

    try {
      const res = await api.submitReport({
        text,
        category: selectedCategory || undefined,
        latitude,
        longitude,
        address,
        mediaUrl: uploadedMediaUrl || undefined,
        source: 'WEB_CITIZEN_PORTAL',
      });

      setTimeout(() => {
        setAnalysisStep(5);
        setSubmittedResult(res);
        setIsSubmitting(false);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
      }, 2800);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsSubmitting(false);
      alert(`Submission error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/70 border border-red-500/50 text-red-400 text-xs font-mono mb-3">
          <Flame size={14} className="animate-pulse" />
          <span>CITIZEN EMERGENCY REPORTING DISPATCH</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white font-mono">Report an Emergency Incident</h1>
        <p className="text-sm text-slate-400 mt-1">
          Your report will be processed instantly by the ResQGrid AI signal engine to extract casualties, hazards, and dispatch units.
        </p>
      </div>

      {/* Preset Quick Fill Buttons */}
      <div className="mb-8 p-4 rounded-xl bg-surface-card border border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Sparkles size={14} className="text-blue-400" />
          <span>Quick Hackathon Test Scenarios:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <span>{p.label}</span>
              <span className="text-slate-500">➔</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Reporting Form */}
      {!submittedResult ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Emergency Category (Optional - AI detects if omitted)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {QUICK_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? `bg-surface-100 ${cat.border} text-white shadow-lg`
                        : 'bg-surface-card border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon size={20} className={cat.color} />
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2. Emergency Description (Natural Language)
              </label>
              <span className="text-xs text-slate-500">Include location hints, casualties, or trapped individuals</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Smoke and fire near the chemistry building. Students are trapped on the second floor. Need firefighters and ambulance immediately."
              rows={4}
              required
              className="w-full p-4 rounded-xl bg-surface-card border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Location & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                3. Street Address / Landmark
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-card border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2831"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-card border border-slate-800 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Real Media / Photo Evidence Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              4. Media / Photo Evidence (Optional)
            </label>
            <label
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors block ${
                hasPhoto
                  ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 hover:border-slate-700 bg-surface-card text-slate-400'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploadingPhoto}
              />
              <Upload size={24} className="mx-auto mb-2 text-slate-400" />
              {isUploadingPhoto ? (
                <p className="text-xs font-medium text-blue-400 animate-pulse">Uploading media to secure storage...</p>
              ) : hasPhoto ? (
                <div>
                  <p className="text-xs font-medium text-emerald-400">✓ Image verified & uploaded</p>
                  <span className="text-[10px] text-slate-400 font-mono break-all">{uploadedMediaUrl}</span>
                </div>
              ) : (
                <p className="text-xs">Click to browse or drop emergency scene photograph</p>
              )}
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !text.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-base shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Running AI Signal Fusion...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Transmit Emergency Report</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* Result Confirmation Card */
        <div className="p-8 rounded-2xl bg-surface-card border border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.2)] animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                TRANSMISSION CONFIRMED
              </span>
              <h2 className="text-2xl font-bold text-white font-mono">
                {submittedResult.isDuplicate ? 'Report Fused with Active Incident' : 'Incident Registered in Command Grid'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-200/60 border border-slate-800 mb-6">
            <div>
              <span className="text-xs text-slate-400">Tracking Code:</span>
              <p className="text-xl font-bold font-mono text-cyan-300 mt-0.5">{submittedResult.incidentCode}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Severity Tier:</span>
              <div className="mt-1">
                <SeverityBadge severity={submittedResult.aiAnalysis.severity} size="md" />
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-400">AI Confidence:</span>
              <p className="text-sm font-semibold text-white mt-0.5">
                {Math.round(submittedResult.aiAnalysis.confidenceScore * 100)}%
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Estimated Casualties:</span>
              <p className="text-sm font-semibold text-white mt-0.5">
                {submittedResult.aiAnalysis.affectedPeople} affected ({submittedResult.aiAnalysis.vulnerablePeople} trapped/vulnerable)
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 mb-8">
            <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">AI Executive Summary</h4>
            <p className="text-xs text-slate-200">{submittedResult.aiAnalysis.summary}</p>
            <p className="text-[11px] text-slate-400 mt-2 italic">{submittedResult.aiAnalysis.reasoning}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/command')}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <span>Track in Command Center</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => {
                setSubmittedResult(null);
                setText('');
                setSelectedCategory('');
              }}
              className="py-3 px-6 rounded-xl bg-surface-100 hover:bg-surface-50 text-slate-300 font-medium text-sm border border-slate-700"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      )}

      {/* Live AI Analysis Animated Modal Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface-card border border-blue-500/50 shadow-2xl text-center space-y-6">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-blue-950 flex items-center justify-center text-blue-400">
                <Sparkles size={20} className="animate-pulse" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white font-mono">ResQGrid AI Signal Pipeline</h3>
              <p className="text-xs text-slate-400 mt-1">Fusing multi-modal emergency signals...</p>
            </div>

            {/* Steps progression */}
            <div className="space-y-2.5 text-left text-xs font-mono">
              <div className={`p-2.5 rounded-lg flex items-center gap-2.5 ${analysisStep >= 1 ? 'bg-blue-950/80 text-blue-200 border border-blue-800' : 'text-slate-600'}`}>
                {analysisStep >= 1 ? <CheckCircle2 size={16} className="text-blue-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>1. Extracting incident category & entities...</span>
              </div>
              <div className={`p-2.5 rounded-lg flex items-center gap-2.5 ${analysisStep >= 2 ? 'bg-blue-950/80 text-blue-200 border border-blue-800' : 'text-slate-600'}`}>
                {analysisStep >= 2 ? <CheckCircle2 size={16} className="text-blue-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>2. Identifying geolocation & spatial radius...</span>
              </div>
              <div className={`p-2.5 rounded-lg flex items-center gap-2.5 ${analysisStep >= 3 ? 'bg-blue-950/80 text-blue-200 border border-blue-800' : 'text-slate-600'}`}>
                {analysisStep >= 3 ? <CheckCircle2 size={16} className="text-blue-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>3. Assessing casualty severity & threat level...</span>
              </div>
              <div className={`p-2.5 rounded-lg flex items-center gap-2.5 ${analysisStep >= 4 ? 'bg-blue-950/80 text-blue-200 border border-blue-800' : 'text-slate-600'}`}>
                {analysisStep >= 4 ? <CheckCircle2 size={16} className="text-blue-400" /> : <div className="w-4 h-4 rounded-full border border-slate-700" />}
                <span>4. Matching nearest responder units...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
