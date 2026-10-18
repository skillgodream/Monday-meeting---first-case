import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  Mic,
  MicOff,
  ClipboardPaste,
  Upload,
  UserCheck,
  CheckCheck
} from 'lucide-react';
import { Lesson } from '../types';
import { PilotLearner } from '../utils/pilotManager';
import {
  ReportPeriod,
  ReportUrgency,
  ContinuousLearningRecommendation,
  buildLearnerRecordLinkage,
  analyzeReportWithGurujiIntelligence,
  analyzeBatchReportWithGurujiIntelligence,
  decideContinuousRecommendation
} from '../utils/continuousLearningEngine';
import { sounds } from '../utils/audio';

interface ContinuousLearningReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  learners: PilotLearner[];
  initialLearner?: PilotLearner | null;
  lessons: Lesson[];
  resolveAdminRoleKey: (learner: PilotLearner) => string;
  onDecisionComplete: (rec: ContinuousLearningRecommendation) => void;
}

type InputMode = 'voice' | 'paste' | 'single';

const QUICK_OBSERVATION_PRESETS = [
  {
    label: 'Skipped 10-min dwell time',
    text: 'Observed wiping high-touch door handles immediately after spraying disinfectant instead of waiting the required 10-minute wet contact dwell time.',
    urgency: 'High Priority' as ReportUrgency,
  },
  {
    label: 'Unreadable barcode handling',
    text: 'Attempted to manually key in a torn, unreadable SKU barcode during rush order picking instead of placing the item in the Hold Area for Team Lead relabeling.',
    urgency: 'Standard' as ReportUrgency,
  },
  {
    label: 'Aisle pallet stacking height',
    text: 'Stacked outbound boxes above the 60-inch height limit without 3x base stretch-wrap anchoring during shift handover.',
    urgency: 'Critical Safety' as ReportUrgency,
  },
  {
    label: 'Cleanroom gowning sequence',
    text: 'Donned sterile gloves prior to securing hood and mask inside the airlock buffer zone.',
    urgency: 'High Priority' as ReportUrgency,
  },
];

export default function ContinuousLearningReportModal({
  isOpen,
  onClose,
  learners,
  initialLearner,
  lessons,
  resolveAdminRoleKey,
  onDecisionComplete,
}: ContinuousLearningReportModalProps) {
  const realLearners = learners.filter((l) => l.cohortType !== 'simulated_persona');
  const selectableLearners = realLearners.length > 0 ? realLearners : learners;

  const firstName1 = selectableLearners[0]?.name || 'Aarav';
  const firstName2 = selectableLearners[1]?.name || 'Priya';
  const firstName3 = selectableLearners[2]?.name || 'Rohan';

  const [inputMode, setInputMode] = useState<InputMode>(initialLearner ? 'single' : 'single');
  const [period, setPeriod] = useState<ReportPeriod>('Current Shift');

  // Mode 1 & 2: Batch Voice / Paste / Upload state
  const [batchText, setBatchText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileBase64, setUploadedFileBase64] = useState<string | undefined>(undefined);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | undefined>(undefined);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mode 3: Single learner state
  const [selectedLearnerId, setSelectedLearnerId] = useState<string>(
    initialLearner?.id || selectableLearners[0]?.id || 'team_housekeeping'
  );
  const [urgency, setUrgency] = useState<ReportUrgency>('High Priority');
  const [observation, setObservation] = useState<string>(
    'Observed wiping high-touch door handles immediately after spraying disinfectant instead of waiting the required 10-minute wet contact dwell time.'
  );

  // Results state (supports 1 or multiple recommendations)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<ContinuousLearningRecommendation[]>([]);
  const [decisionsMap, setDecisionsMap] = useState<Record<string, 'approved' | 'rejected'>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedLearnerId(initialLearner?.id || selectableLearners[0]?.id || 'team_housekeeping');
      setRecommendations([]);
      setDecisionsMap({});
      setIsAnalyzing(false);
      setIsRecording(false);
      setUploadedFileName(null);
      setUploadedFileBase64(undefined);
      setUploadedMimeType(undefined);
      if (!batchText) {
        setBatchText(
          `${firstName1} skipped the 10-minute disinfectant dwell time on door handles. ${firstName2} tried to manually type an unreadable barcode instead of escalating to Hold Area. ${firstName3} stacked pallets above 60 inches without base stretch wrap.`
        );
      }
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, initialLearner]);

  if (!isOpen) return null;

  const selectedLearner = selectableLearners.find((l) => l.id === selectedLearnerId) || null;
  const roleKey = selectedLearner ? resolveAdminRoleKey(selectedLearner) : 'Housekeeping Specialist';
  const department = selectedLearner?.domain || 'Floor Operations';
  const learnerName = selectedLearner ? selectedLearner.name : 'Housekeeping Operations Team';

  const toggleVoiceRecording = () => {
    sounds.playTap();
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setBatchText(
        `In today's shift debrief, ${firstName1} wiped down room surfaces without waiting for the 10-minute chemical dwell time. Also ${firstName2} manually keyed a damaged SKU barcode during rush picking, and ${firstName3} bypassed cleanroom glove donning sequence.`
      );
      setRecommendations([]);
      setDecisionsMap({});
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      let finalTranscript = batchText ? `${batchText.trim()} ` : '';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += `${transcriptSegment} `;
          } else {
            interim += transcriptSegment;
          }
        }
        setBatchText((finalTranscript + interim).trim());
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sounds.playTap();
    setUploadedFileName(file.name);
    setRecommendations([]);
    setDecisionsMap({});

    const lower = file.name.toLowerCase();
    if (lower.endsWith('.txt') || lower.endsWith('.csv') || lower.endsWith('.log')) {
      const reader = new FileReader();
      reader.onload = () => {
        const textContent = String(reader.result || '');
        setBatchText(textContent);
        setUploadedFileBase64(undefined);
        setUploadedMimeType(undefined);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setUploadedFileBase64(base64);
        setUploadedMimeType(file.type || 'application/pdf');
        if (!batchText.trim()) {
          setBatchText(`Uploaded shift audit report: ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    sounds.playTap();
    setIsAnalyzing(true);
    setDecisionsMap({});

    try {
      if (inputMode === 'single') {
        if (!observation.trim()) return;
        const linkage = buildLearnerRecordLinkage(selectedLearner, roleKey);
        const rec = await analyzeReportWithGurujiIntelligence(
          {
            targetType: selectedLearner ? 'learner' : 'team',
            learnerId: selectedLearnerId,
            learnerName,
            roleKey,
            department,
            period,
            observation: observation.trim(),
            urgency,
            existingRecordSummary: linkage.existingRecordSummary,
            evidenceSummary: linkage.evidenceSummary,
          },
          lessons
        );
        setRecommendations([rec]);
      } else {
        if (!batchText.trim() && !uploadedFileBase64) return;
        const batchRecs = await analyzeBatchReportWithGurujiIntelligence({
          rawInputText: batchText.trim(),
          fileBase64: uploadedFileBase64,
          mimeType: uploadedMimeType,
          period,
          learners: selectableLearners,
          approvedCourses: lessons,
          resolveAdminRoleKey,
        });
        setRecommendations(batchRecs);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSingleDecision = (rec: ContinuousLearningRecommendation, decision: 'approved' | 'rejected') => {
    sounds.playTap();
    const finalized = decideContinuousRecommendation(rec, decision);
    setRecommendations((prev) => prev.map((r) => (r.id === rec.id ? finalized : r)));
    setDecisionsMap((prev) => ({ ...prev, [rec.id]: decision }));
    onDecisionComplete(finalized);
  };

  const handleApproveAll = () => {
    sounds.playTap();
    const nextMap: Record<string, 'approved' | 'rejected'> = { ...decisionsMap };
    const updatedList = recommendations.map((rec) => {
      if (nextMap[rec.id] === 'approved') return rec;
      const finalized = decideContinuousRecommendation(rec, 'approved');
      nextMap[rec.id] = 'approved';
      onDecisionComplete(finalized);
      return finalized;
    });
    setRecommendations(updatedList);
    setDecisionsMap(nextMap);
  };

  const allApproved =
    recommendations.length > 0 &&
    recommendations.every((r) => decisionsMap[r.id] === 'approved');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0A0A0C] border border-white/15 rounded-3xl p-5 sm:p-6 text-white space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Submit Performance Report
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                Select a staff member or use voice / shift log to match the right course
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] hover:bg-white/20 border border-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector Tabs — Soft Light Non-Neon Styling */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#141417] border border-white/10">
          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setInputMode('single');
              setRecommendations([]);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              inputMode === 'single'
                ? 'bg-[#F4F4F6] text-[#18181B] shadow-sm'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck size={14} />
            <span>Single Staff</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setInputMode('voice');
              setRecommendations([]);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              inputMode === 'voice'
                ? 'bg-[#F4F4F6] text-[#18181B] shadow-sm'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            <Mic size={14} />
            <span>Voice Shift Debrief</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playTap();
              setInputMode('paste');
              setRecommendations([]);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              inputMode === 'paste'
                ? 'bg-[#F4F4F6] text-[#18181B] shadow-sm'
                : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
            }`}
          >
            <ClipboardPaste size={14} />
            <span>Paste / Upload Log</span>
          </button>
        </div>

        {/* MODE 1: SINGLE STAFF REPORT */}
        {inputMode === 'single' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#BAE6FD] block mb-1">
                  Team / Learner
                </label>
                <select
                  value={selectedLearnerId}
                  onChange={(e) => {
                    setSelectedLearnerId(e.target.value);
                    setRecommendations([]);
                  }}
                  className="w-full h-9 px-2.5 rounded-xl bg-[#24113E] border border-[#5B2E91]/60 text-xs text-[#BAE6FD] font-semibold focus:outline-none focus:border-[#8B5CF6]"
                >
                  {selectableLearners.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#24113E] text-[#BAE6FD]">
                      {l.name} ({l.role})
                    </option>
                  ))}
                  <option value="team_housekeeping" className="bg-[#24113E] text-[#BAE6FD]">Entire Housekeeping Team</option>
                  <option value="team_warehouse" className="bg-[#24113E] text-[#BAE6FD]">Entire Warehouse Picking Team</option>
                  <option value="team_cleanroom" className="bg-[#24113E] text-[#BAE6FD]">Entire Cleanroom Team</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#BAE6FD] block mb-1">
                  Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                  className="w-full h-9 px-2.5 rounded-xl bg-[#24113E] border border-[#5B2E91]/60 text-xs text-[#BAE6FD] font-semibold focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="Current Shift" className="bg-[#24113E] text-[#BAE6FD]">Current Shift</option>
                  <option value="Last 7 Days" className="bg-[#24113E] text-[#BAE6FD]">Last 7 Days</option>
                  <option value="Weekly Floor Audit" className="bg-[#24113E] text-[#BAE6FD]">Weekly Floor Audit</option>
                  <option value="Monthly Review" className="bg-[#24113E] text-[#BAE6FD]">Monthly Review</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#BAE6FD] block mb-1">
                  Urgency
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as ReportUrgency)}
                  className="w-full h-9 px-2.5 rounded-xl bg-[#24113E] border border-[#5B2E91]/60 text-xs text-[#BAE6FD] font-semibold focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="Standard" className="bg-[#24113E] text-[#BAE6FD]">Standard</option>
                  <option value="High Priority" className="bg-[#24113E] text-[#BAE6FD]">High Priority</option>
                  <option value="Critical Safety" className="bg-[#24113E] text-[#BAE6FD]">Critical Safety</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                  Observation Details
                </label>
              </div>

              {/* Observation Details Tabs — Very Light Non-Neon Color */}
              <div className="flex flex-wrap gap-2">
                {QUICK_OBSERVATION_PRESETS.map((preset) => {
                  const isSelected = observation.trim() === preset.text.trim();
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setObservation(preset.text);
                        setUrgency(preset.urgency);
                        setRecommendations([]);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#E2E8F0] text-[#0F172A] border-[#CBD5E1] font-semibold shadow-xs'
                          : 'bg-[#F4F4F6] hover:bg-[#E8E8ED] text-[#27272A] border-[#E4E4E7]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={observation}
                onChange={(e) => {
                  setObservation(e.target.value);
                  if (recommendations.length > 0) setRecommendations([]);
                }}
                rows={3}
                placeholder="Describe what was observed on the floor..."
                className="w-full p-3 rounded-xl bg-[#2A1447] border border-[#5B2E91]/70 text-xs text-white placeholder:text-purple-200/40 focus:outline-none focus:border-[#8B5CF6] leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* MODE 2: VOICE SHIFT DEBRIEF */}
        {inputMode === 'voice' && (
          <div className="space-y-4 p-4 rounded-2xl bg-[#0B1930] border border-[#1E3A8A]/50">
            <div className="p-4 rounded-2xl bg-[#112240] border border-[#1D4ED8]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-[#E0F2FE] flex items-center gap-2">
                  <span>30-Second Voice Shift Debrief</span>
                  {isRecording && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold">
                      ● Recording...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#93C5FD]/80">
                  Speak naturally about multiple team members (e.g., &ldquo;{firstName1} missed dwell time, {firstName2} skipped barcode check&rdquo;).
                </p>
              </div>

              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 shrink-0 cursor-pointer transition-all border ${
                  isRecording
                    ? 'bg-[#FEE2E2] text-[#7F1D1D] border-[#FECACA] hover:bg-[#FECACA]'
                    : 'bg-[#172554] text-[#DBEAFE] border-[#2563EB]/60 hover:bg-[#1E3A8A]'
                }`}
              >
                {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                <span>{isRecording ? 'Stop Recording' : 'Tap to Speak'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#BAE6FD] block">
                Observation Details
              </label>

              <textarea
                value={batchText}
                onChange={(e) => {
                  setBatchText(e.target.value);
                  if (recommendations.length > 0) setRecommendations([]);
                }}
                rows={4}
                placeholder={`Speak or type observations for multiple staff (e.g. "${firstName1} skipped 10-min dwell time, ${firstName2} missed barcode scan...")`}
                className="w-full p-3 rounded-xl bg-[#112240] border border-[#1E3A8A]/80 text-xs text-white placeholder:text-blue-200/40 focus:outline-none focus:border-[#3B82F6] leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* MODE 3: PASTE / UPLOAD WHATSAPP, DMS, OR SHIFT AUDIT SUMMARY */}
        {inputMode === 'paste' && (
          <div className="space-y-4 p-4 rounded-2xl bg-[#0B1930] border border-[#1E3A8A]/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#BAE6FD] block">
                  Observation Details (Paste Shift Log / Upload File)
                </label>
                <p className="text-[11px] text-[#93C5FD]/80">
                  Paste shift handover notes or upload a log — each employee is matched to the right refresher course.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.log,.pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-[#172554] hover:bg-[#1E3A8A] border border-[#2563EB]/60 text-xs font-semibold text-[#DBEAFE] flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload size={13} />
                  <span>{uploadedFileName ? uploadedFileName : 'Upload Log / Sheet'}</span>
                </button>
              </div>
            </div>

            <textarea
              value={batchText}
              onChange={(e) => {
                setBatchText(e.target.value);
                if (recommendations.length > 0) setRecommendations([]);
              }}
              rows={4}
              placeholder="Paste WhatsApp shift messages, floor audit bullet points, or DMS notes here..."
              className="w-full p-3 rounded-xl bg-[#112240] border border-[#1E3A8A]/80 text-xs text-white placeholder:text-blue-200/40 focus:outline-none focus:border-[#3B82F6] leading-relaxed font-mono"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-[#8E8E93]">
            {inputMode !== 'single' && (
              <span>Automatically detects each employee &amp; matches approved courses</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={
              isAnalyzing ||
              (inputMode === 'single' ? !observation.trim() : !batchText.trim() && !uploadedFileBase64)
            }
            className="px-4 py-2.5 rounded-xl bg-[#F4F4F6] text-[#18181B] hover:bg-[#E4E4E7] disabled:opacity-50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Sparkles size={14} />
            <span>
              {isAnalyzing
                ? 'Matching Courses...'
                : recommendations.length > 0
                ? 'Refresh Recommendation'
                : inputMode === 'single'
                ? 'Get Course Recommendation'
                : 'Extract & Match Courses'}
            </span>
          </button>
        </div>

        {/* Recommendations List (Batch or Single) — Soft Non-Neon Colors */}
        {recommendations.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-white/10 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white">
                Matched Course Recommendations ({recommendations.length})
              </span>

              {recommendations.length > 1 && (
                <button
                  type="button"
                  disabled={allApproved}
                  onClick={handleApproveAll}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                    allApproved
                      ? 'bg-[#E2E8F0] border-[#CBD5E1] text-[#334155] opacity-80'
                      : 'bg-[#F4F4F6] hover:bg-[#E4E4E7] border-[#E4E4E7] text-[#18181B] shadow-xs'
                  }`}
                >
                  <CheckCheck size={14} />
                  <span>{allApproved ? 'All Approved & Assigned' : `Approve & Assign All (${recommendations.length})`}</span>
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {recommendations.map((rec) => {
                const decision = decisionsMap[rec.id];
                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-[#121215] border border-white/15 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{rec.learnerName}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#F4F4F6] text-[#27272A] text-[10px] font-semibold">
                            {rec.urgency}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-200 mt-1">
                          Skill Gap: <span className="text-white">{rec.skillGap}</span>
                        </p>
                      </div>

                      {decision === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full bg-[#E2E8F0] text-[#0F172A] text-[11px] font-semibold">
                          Assigned
                        </span>
                      )}
                      {decision === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-[11px] font-semibold">
                          Dismissed
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] flex items-center gap-1.5">
                        <BookOpen size={11} />
                        <span>Recommended Course</span>
                      </label>
                      <select
                        value={rec.recommendedCourseId}
                        onChange={(e) => {
                          const matched = lessons.find((l) => l.id === e.target.value);
                          if (matched) {
                            setRecommendations((prev) =>
                              prev.map((item) =>
                                item.id === rec.id
                                  ? {
                                      ...item,
                                      recommendedCourseId: matched.id,
                                      recommendedCourseTitle: matched.title,
                                    }
                                  : item
                              )
                            );
                          }
                        }}
                        className="w-full h-9 px-3 rounded-xl bg-[#1C1C1E] border border-white/20 text-xs font-semibold text-white focus:outline-none"
                      >
                        {lessons.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{rec.reason}</p>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        disabled={decision === 'approved'}
                        onClick={() => handleSingleDecision(rec, 'approved')}
                        className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ${
                          decision === 'approved'
                            ? 'bg-[#E2E8F0] border-[#CBD5E1] text-[#0F172A]'
                            : 'bg-[#F4F4F6] hover:bg-[#E4E4E7] border-[#E4E4E7] text-[#18181B]'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                        <span>{decision === 'approved' ? 'Approved & Assigned' : 'Approve & Assign'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={decision === 'rejected'}
                        onClick={() => handleSingleDecision(rec, 'rejected')}
                        className={`py-2 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-60 ${
                          decision === 'rejected'
                            ? 'bg-white/15 border-white/20 text-white/80'
                            : 'bg-[#1C1C1E] hover:bg-white/10 border-white/15 text-slate-200'
                        }`}
                      >
                        <XCircle size={14} />
                        <span>{decision === 'rejected' ? 'Rejected' : 'Reject'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
