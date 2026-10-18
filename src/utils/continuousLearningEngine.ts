import { Lesson } from '../types';
import { PilotLearner } from './pilotManager';
import { logAuditEvent } from '../services/firestorePersistence';

export type ReportUrgency = 'Standard' | 'High Priority' | 'Critical Safety';
export type ReportPeriod = 'Current Shift' | 'Last 7 Days' | 'Weekly Floor Audit' | 'Monthly Review';

export interface ContinuousLearningReportInput {
  targetType: 'learner' | 'team';
  learnerId: string;
  learnerName: string;
  roleKey: string;
  department: string;
  period: ReportPeriod;
  observation: string;
  urgency: ReportUrgency;
  existingRecordSummary: string;
  evidenceSummary: string;
}

export interface ContinuousLearningRecommendation {
  id: string;
  targetType: 'learner' | 'team';
  learnerId: string;
  learnerName: string;
  roleKey: string;
  department: string;
  period: ReportPeriod;
  observation: string;
  urgency: ReportUrgency;
  existingRecordSummary: string;
  evidenceSummary: string;
  skillGap: string;
  recommendedCourseId: string;
  recommendedCourseTitle: string;
  reason: string;
  status: 'pending_review' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string;
  learnerStatus: 'not_started' | 'in_progress' | 'completed';
  progressPct: number;
  completedAt?: string;
}

const STORAGE_KEY = 'guruji_continuous_learning_assignments';

export function getContinuousLearningRecommendations(): ContinuousLearningRecommendation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveContinuousLearningRecommendations(list: ContinuousLearningRecommendation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[ContinuousLearning] Failed to save recommendations:', e);
  }
}

export function buildLearnerRecordLinkage(learner: PilotLearner | null, teamRoleName?: string): {
  existingRecordSummary: string;
  evidenceSummary: string;
} {
  if (!learner) {
    const roleLabel = teamRoleName || 'Operations Team';
    return {
      existingRecordSummary: `Team Cohort (${roleLabel}) · Phase 1 Onboarding 92% Complete · Phase 2 Continuous 82% Complete`,
      evidenceSummary: `Recent floor audit logs indicate recurring execution variance across ${roleLabel} shift handovers.`,
    };
  }

  const attemptsCount = learner.attempts?.length || 1;
  const lastScore =
    learner.attempts?.[learner.attempts.length - 1]?.score ||
    (learner.workplaceReadiness === 'workplace_demonstration_passed' ? 95 : 82);
  const readinessLabel =
    learner.workplaceReadiness === 'workplace_demonstration_passed'
      ? 'Floor Certified'
      : 'In Supervised Training';

  return {
    existingRecordSummary: `${readinessLabel} · Current SOP: ${learner.assignedSopTitle || 'Core Operations'} · Last Assessment: ${lastScore}% (${attemptsCount} attempt${attemptsCount > 1 ? 's' : ''})`,
    evidenceSummary:
      learner.supervisorObservation?.overallNotes ||
      `Linked to ${learner.name}'s ${learner.domain} training record and recent floor observation history.`,
  };
}

/**
 * Deterministic keyword fallback matcher against the existing approved course library
 */
export function matchApprovedCourseFallback(
  input: ContinuousLearningReportInput,
  approvedCourses: Lesson[]
): {
  skillGap: string;
  recommendedCourseId: string;
  recommendedCourseTitle: string;
  reason: string;
} {
  const obsLower = `${input.observation} ${input.roleKey} ${input.department}`.toLowerCase();

  let bestLesson = approvedCourses[0] || {
    id: 'housekeeping_sanitization',
    title: 'Housekeeping: Room Sanitization',
    description: 'Standard room sanitization and dwell time procedure.',
  };
  let bestScore = -1;

  for (const lesson of approvedCourses) {
    let score = 0;
    const haystack = `${lesson.id} ${lesson.title} ${lesson.description || ''} ${lesson.category || ''}`.toLowerCase();

    if (obsLower.includes('dwell') || obsLower.includes('chemical') || obsLower.includes('sanitize') || obsLower.includes('clean') || obsLower.includes('wipe') || obsLower.includes('disinfect')) {
      if (haystack.includes('sanitiz') || haystack.includes('housekeeping')) score += 10;
    }
    if (obsLower.includes('gown') || obsLower.includes('aseptic') || obsLower.includes('sterile') || obsLower.includes('gloves') || obsLower.includes('cleanroom') || obsLower.includes('hygiene')) {
      if (haystack.includes('aseptic') || haystack.includes('hygiene') || haystack.includes('cleanroom')) score += 10;
    }
    if (obsLower.includes('scan') || obsLower.includes('barcode') || obsLower.includes('pick') || obsLower.includes('tote') || obsLower.includes('sku') || obsLower.includes('order')) {
      if (haystack.includes('pick') || haystack.includes('order')) score += 10;
    }
    if (obsLower.includes('forklift') || obsLower.includes('pallet') || obsLower.includes('safety') || obsLower.includes('aisle') || obsLower.includes('stop') || obsLower.includes('hazard') || obsLower.includes('chock')) {
      if (haystack.includes('safety') || haystack.includes('pallet') || haystack.includes('forklift')) score += 10;
    }
    if (obsLower.includes('count') || obsLower.includes('inventory') || obsLower.includes('variance') || obsLower.includes('bin') || obsLower.includes('stock')) {
      if (haystack.includes('inventory') || haystack.includes('count')) score += 10;
    }
    if (obsLower.includes('pack') || obsLower.includes('dunnage') || obsLower.includes('box') || obsLower.includes('seal')) {
      if (haystack.includes('pack')) score += 10;
    }

    const words = input.observation
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    for (const w of words) {
      if (haystack.includes(w)) score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestLesson = lesson;
    }
  }

  let skillGap = 'Procedural Compliance & Critical Control Execution Gap';
  if (obsLower.includes('dwell') || obsLower.includes('chemical') || obsLower.includes('disinfect')) {
    skillGap = 'Chemical Contact Dwell Time & High-Touch Surface Protocol';
  } else if (obsLower.includes('scan') || obsLower.includes('barcode') || obsLower.includes('sku')) {
    skillGap = 'Barcode Verification & Unreadable Label Escalation';
  } else if (obsLower.includes('gown') || obsLower.includes('glove') || obsLower.includes('aseptic')) {
    skillGap = 'Aseptic Hand Hygiene & Donning Sequence Adherence';
  } else if (obsLower.includes('count') || obsLower.includes('variance') || obsLower.includes('bin')) {
    skillGap = 'Blind Cycle Counting & Discrepancy Recount Thresholds';
  } else if (obsLower.includes('safety') || obsLower.includes('pallet') || obsLower.includes('forklift') || obsLower.includes('hazard')) {
    skillGap = 'Floor Safety Controls & Hazard Stop-Work Protocol';
  } else if (input.observation.trim().length > 8) {
    const trimmed = input.observation.trim().replace(/\.$/, '');
    skillGap = trimmed.length > 68 ? `${trimmed.slice(0, 65)}...` : trimmed;
  }

  const reason = `Observation (${input.period}, ${input.urgency}) identifies a floor execution gap for ${input.learnerName}. "${bestLesson.title}" reinforces the required operating controls and verification steps.`;

  return {
    skillGap,
    recommendedCourseId: bestLesson.id,
    recommendedCourseTitle: bestLesson.title,
    reason,
  };
}

/**
 * Analyzes a single manager report and selects the best course from the approved course library.
 */
export async function analyzeReportWithGurujiIntelligence(
  input: ContinuousLearningReportInput,
  approvedCourses: Lesson[]
): Promise<ContinuousLearningRecommendation> {
  const catalogList = approvedCourses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    category: c.category || 'Operations',
  }));

  const fallbackResult = matchApprovedCourseFallback(input, approvedCourses);

  let skillGap = fallbackResult.skillGap;
  let recommendedCourseId = fallbackResult.recommendedCourseId;
  let recommendedCourseTitle = fallbackResult.recommendedCourseTitle;
  let reason = fallbackResult.reason;

  try {
    const prompt = `Manager Performance Report:
- Target Learner / Team: ${input.learnerName} (${input.roleKey} · ${input.department})
- Observation Period: ${input.period}
- Urgency Level: ${input.urgency}
- Manager Observation: "${input.observation}"
- Linked Learning Record: ${input.existingRecordSummary}
- Performance Evidence: ${input.evidenceSummary}

Existing Approved Course Library (MUST select strictly from this list):
${JSON.stringify(catalogList, null, 2)}

Tasks:
1. Identify the specific operational skill gap indicated by the manager's report.
2. Select the single most suitable course strictly from the Existing Approved Course Library above (use its exact "id" and "title").
3. Prepare a concise, practical 1-2 sentence recommendation reason linking the learner, skill gap, and recommended course.

Return JSON:
{
  "skillGap": "Concise 4-9 word description of the identified skill gap",
  "recommendedCourseId": "exact id from the approved course library",
  "recommendedCourseTitle": "exact title from the approved course library",
  "reason": "1-2 sentence explanation of why this course resolves the observed gap"
}`;

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction:
          'You are Guruji Intelligence, the single operational intelligence engine. Analyze the manager performance report, identify the skill gap, and select the best matching course strictly from the provided approved course library. Respond with valid JSON.',
        maxOutputTokens: 600,
        temperature: 0.2,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.skillGap && data.recommendedCourseId) {
        const matchedCourse = approvedCourses.find(
          (c) =>
            c.id === data.recommendedCourseId ||
            c.title.toLowerCase() === String(data.recommendedCourseTitle || '').toLowerCase()
        );
        if (matchedCourse) {
          skillGap = String(data.skillGap).trim();
          recommendedCourseId = matchedCourse.id;
          recommendedCourseTitle = matchedCourse.title;
          reason = String(data.reason || fallbackResult.reason).trim();
        }
      }
    }
  } catch (err) {
    console.warn('[Guruji Intelligence] Using deterministic approved-library matcher fallback:', err);
  }

  const recommendation: ContinuousLearningRecommendation = {
    id: `cl_rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    targetType: input.targetType,
    learnerId: input.learnerId,
    learnerName: input.learnerName,
    roleKey: input.roleKey,
    department: input.department,
    period: input.period,
    observation: input.observation,
    urgency: input.urgency,
    existingRecordSummary: input.existingRecordSummary,
    evidenceSummary: input.evidenceSummary,
    skillGap,
    recommendedCourseId,
    recommendedCourseTitle,
    reason,
    status: 'pending_review',
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    learnerStatus: 'not_started',
    progressPct: 0,
  };

  return recommendation;
}

/**
 * Local deterministic parser fallback for multi-person Voice Debriefs or Pasted Shift/WhatsApp Summaries
 */
function parseBatchNotesFallback(
  rawNotes: string,
  period: ReportPeriod,
  learners: PilotLearner[],
  approvedCourses: Lesson[],
  resolveAdminRoleKey: (learner: PilotLearner) => string
): ContinuousLearningRecommendation[] {
  const results: ContinuousLearningRecommendation[] = [];
  const lines = rawNotes
    .split(/\n|(?<=[.!?])\s+|\s*;\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 6);

  const matchedLearnerIds = new Set<string>();

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    // Find which learners are mentioned in this line/segment
    const mentionedLearners = learners.filter((l) => {
      const firstName = l.name.split(' ')[0].toLowerCase();
      return lineLower.includes(l.name.toLowerCase()) || (firstName.length >= 3 && lineLower.includes(firstName));
    });

    const urgency: ReportUrgency =
      lineLower.includes('critical') || lineLower.includes('safety') || lineLower.includes('hazard') || lineLower.includes('forklift') || lineLower.includes('pallet')
        ? 'Critical Safety'
        : lineLower.includes('urgent') || lineLower.includes('dwell') || lineLower.includes('skip') || lineLower.includes('failed') || lineLower.includes('error')
        ? 'High Priority'
        : 'Standard';

    if (mentionedLearners.length > 0) {
      for (const learner of mentionedLearners) {
        matchedLearnerIds.add(learner.id);
        const roleKey = resolveAdminRoleKey(learner);
        const linkage = buildLearnerRecordLinkage(learner, roleKey);
        const input: ContinuousLearningReportInput = {
          targetType: 'learner',
          learnerId: learner.id,
          learnerName: learner.name,
          roleKey,
          department: learner.domain || 'Floor Operations',
          period,
          observation: line,
          urgency,
          existingRecordSummary: linkage.existingRecordSummary,
          evidenceSummary: linkage.evidenceSummary,
        };
        const matched = matchApprovedCourseFallback(input, approvedCourses);
        results.push({
          id: `cl_rec_${Date.now()}_${learner.id}_${results.length}`,
          ...input,
          ...matched,
          status: 'pending_review',
          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          learnerStatus: 'not_started',
          progressPct: 0,
        });
      }
    } else if (
      lineLower.includes('housekeeping') ||
      lineLower.includes('warehouse') ||
      lineLower.includes('cleanroom') ||
      lineLower.includes('team') ||
      lineLower.includes('shift')
    ) {
      let teamId = 'team_housekeeping';
      let teamName = 'Entire Housekeeping Team';
      let roleKey = 'Housekeeping Specialist';
      if (lineLower.includes('warehouse') || lineLower.includes('pick') || lineLower.includes('barcode') || lineLower.includes('pallet')) {
        teamId = 'team_warehouse';
        teamName = 'Entire Warehouse Picking Team';
        roleKey = 'Warehouse Order Picker';
      } else if (lineLower.includes('cleanroom') || lineLower.includes('gown') || lineLower.includes('aseptic')) {
        teamId = 'team_cleanroom';
        teamName = 'Entire Cleanroom Team';
        roleKey = 'Cleanroom Operator';
      }
      const linkage = buildLearnerRecordLinkage(null, roleKey);
      const input: ContinuousLearningReportInput = {
        targetType: 'team',
        learnerId: teamId,
        learnerName: teamName,
        roleKey,
        department: 'Floor Operations',
        period,
        observation: line,
        urgency,
        existingRecordSummary: linkage.existingRecordSummary,
        evidenceSummary: linkage.evidenceSummary,
      };
      const matched = matchApprovedCourseFallback(input, approvedCourses);
      results.push({
        id: `cl_rec_${Date.now()}_${teamId}_${results.length}`,
        ...input,
        ...matched,
        status: 'pending_review',
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        learnerStatus: 'not_started',
        progressPct: 0,
      });
    }
  }

  // If no specific learner or team keywords matched, attach to the first learner or default team
  if (results.length === 0 && rawNotes.trim()) {
    const firstLearner = learners[0] || null;
    const roleKey = firstLearner ? resolveAdminRoleKey(firstLearner) : 'Housekeeping Specialist';
    const linkage = buildLearnerRecordLinkage(firstLearner, roleKey);
    const input: ContinuousLearningReportInput = {
      targetType: firstLearner ? 'learner' : 'team',
      learnerId: firstLearner ? firstLearner.id : 'team_housekeeping',
      learnerName: firstLearner ? firstLearner.name : 'Entire Housekeeping Team',
      roleKey,
      department: firstLearner?.domain || 'Floor Operations',
      period,
      observation: rawNotes.trim(),
      urgency: 'High Priority',
      existingRecordSummary: linkage.existingRecordSummary,
      evidenceSummary: linkage.evidenceSummary,
    };
    const matched = matchApprovedCourseFallback(input, approvedCourses);
    results.push({
      id: `cl_rec_${Date.now()}_batch_0`,
      ...input,
      ...matched,
      status: 'pending_review',
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      learnerStatus: 'not_started',
      progressPct: 0,
    });
  }

  return results;
}

/**
 * Smart Batch Analysis for Option #1 (Voice Shift Debrief) and Option #3 (Paste / Upload Shift Summary, DMS Log, or WhatsApp Notes)
 * Extracts multiple learners/teams, their individual observations, skill gaps, and matches each to an approved course in one shot.
 */
export async function analyzeBatchReportWithGurujiIntelligence(params: {
  rawInputText: string;
  fileBase64?: string;
  mimeType?: string;
  period: ReportPeriod;
  learners: PilotLearner[];
  approvedCourses: Lesson[];
  resolveAdminRoleKey: (learner: PilotLearner) => string;
}): Promise<ContinuousLearningRecommendation[]> {
  const { rawInputText, fileBase64, mimeType, period, learners, approvedCourses, resolveAdminRoleKey } = params;

  const rosterList = [
    ...learners.map((l) => ({
      learnerId: l.id,
      learnerName: l.name,
      roleKey: resolveAdminRoleKey(l),
      department: l.domain || 'Floor Operations',
      targetType: 'learner',
    })),
    {
      learnerId: 'team_housekeeping',
      learnerName: 'Entire Housekeeping Team',
      roleKey: 'Housekeeping Specialist',
      department: 'Hospitality & Facilities',
      targetType: 'team',
    },
    {
      learnerId: 'team_warehouse',
      learnerName: 'Entire Warehouse Picking Team',
      roleKey: 'Warehouse Order Picker',
      department: 'Logistics & Fulfillment',
      targetType: 'team',
    },
    {
      learnerId: 'team_cleanroom',
      learnerName: 'Entire Cleanroom Team',
      roleKey: 'Cleanroom Operator',
      department: 'Pharma & Cleanroom',
      targetType: 'team',
    },
  ];

  const catalogList = approvedCourses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description || '',
    category: c.category || 'Operations',
  }));

  try {
    const prompt = `Analyze this manager shift debrief, voice transcript, WhatsApp handover summary, or audit report and extract ALL individual learner or team performance observations.

Manager Input / Shift Log (${period}):
"""
${rawInputText || 'See attached document/image.'}
"""

Active Team Roster (Match names or roles to this roster; if a whole department/team is mentioned, use the matching team entry):
${JSON.stringify(rosterList, null, 2)}

Existing Approved Course Library (MUST select strictly from this list for each extracted item):
${JSON.stringify(catalogList, null, 2)}

Instructions:
1. Extract every distinct person or team mentioned with a performance issue, audit error, or refresher need.
2. If multiple people share the same observation (e.g. "Aarav and Priya skipped barcode verification"), create a separate entry for each person so each gets their course assigned.
3. For each entry, determine urgency ("Standard", "High Priority", or "Critical Safety"), concise skillGap (4-9 words), exact recommendedCourseId and recommendedCourseTitle from the Approved Course Library, and a 1-sentence reason.

Return JSON:
{
  "items": [
    {
      "learnerId": "matched learnerId from Active Team Roster",
      "learnerName": "matched learnerName from Active Team Roster",
      "targetType": "learner" | "team",
      "observation": "Specific observation extracted for this person/team",
      "urgency": "Standard" | "High Priority" | "Critical Safety",
      "skillGap": "Concise 4-9 word skill gap",
      "recommendedCourseId": "exact id from Approved Course Library",
      "recommendedCourseTitle": "exact title from Approved Course Library",
      "reason": "1-sentence explanation of why this course resolves the gap"
    }
  ]
}`;

    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        fileBase64,
        mimeType,
        systemInstruction:
          'You are Guruji Intelligence. Parse multi-person manager voice notes, shift logs, WhatsApp summaries, or audit sheets into individual learner course recommendations strictly from the approved course library. Respond with valid JSON.',
        maxOutputTokens: 2000,
        temperature: 0.2,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        const extractedRecs: ContinuousLearningRecommendation[] = [];

        for (let idx = 0; idx < data.items.length; idx++) {
          const item = data.items[idx];
          const matchedRoster =
            rosterList.find(
              (r) =>
                r.learnerId === item.learnerId ||
                r.learnerName.toLowerCase().includes(String(item.learnerName || '').toLowerCase()) ||
                String(item.learnerName || '')
                  .toLowerCase()
                  .includes(r.learnerName.split(' ')[0].toLowerCase())
            ) || rosterList[0];

          const matchedLearnerObj = learners.find((l) => l.id === matchedRoster.learnerId) || null;
          const linkage = buildLearnerRecordLinkage(matchedLearnerObj, matchedRoster.roleKey);

          const matchedCourse =
            approvedCourses.find(
              (c) =>
                c.id === item.recommendedCourseId ||
                c.title.toLowerCase() === String(item.recommendedCourseTitle || '').toLowerCase()
            ) ||
            approvedCourses.find(
              (c) =>
                c.id ===
                matchApprovedCourseFallback(
                  {
                    targetType: matchedRoster.targetType as 'learner' | 'team',
                    learnerId: matchedRoster.learnerId,
                    learnerName: matchedRoster.learnerName,
                    roleKey: matchedRoster.roleKey,
                    department: matchedRoster.department,
                    period,
                    observation: String(item.observation || rawInputText),
                    urgency: (item.urgency as ReportUrgency) || 'High Priority',
                    existingRecordSummary: linkage.existingRecordSummary,
                    evidenceSummary: linkage.evidenceSummary,
                  },
                  approvedCourses
                ).recommendedCourseId
            ) ||
            approvedCourses[0];

          const validUrgency: ReportUrgency =
            item.urgency === 'Critical Safety' || item.urgency === 'High Priority' || item.urgency === 'Standard'
              ? item.urgency
              : 'High Priority';

          extractedRecs.push({
            id: `cl_rec_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
            targetType: matchedRoster.targetType as 'learner' | 'team',
            learnerId: matchedRoster.learnerId,
            learnerName: matchedRoster.learnerName,
            roleKey: matchedRoster.roleKey,
            department: matchedRoster.department,
            period,
            observation: String(item.observation || rawInputText).trim(),
            urgency: validUrgency,
            existingRecordSummary: linkage.existingRecordSummary,
            evidenceSummary: linkage.evidenceSummary,
            skillGap: String(item.skillGap || 'Operational Compliance & Control Execution Gap').trim(),
            recommendedCourseId: matchedCourse.id,
            recommendedCourseTitle: matchedCourse.title,
            reason: String(
              item.reason ||
                `Recommended "${matchedCourse.title}" to address the observed execution gap for ${matchedRoster.learnerName}.`
            ).trim(),
            status: 'pending_review',
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            learnerStatus: 'not_started',
            progressPct: 0,
          });
        }

        if (extractedRecs.length > 0) {
          return extractedRecs;
        }
      }
    }
  } catch (err) {
    console.warn('[Guruji Batch Intelligence] Using deterministic multi-learner parser fallback:', err);
  }

  return parseBatchNotesFallback(rawInputText, period, learners, approvedCourses, resolveAdminRoleKey);
}

/**
 * Manager — Review & Approve (or Reject)
 */
export function decideContinuousRecommendation(
  recommendation: ContinuousLearningRecommendation,
  decision: 'approved' | 'rejected'
): ContinuousLearningRecommendation {
  const updatedRec: ContinuousLearningRecommendation = {
    ...recommendation,
    status: decision,
    decidedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  const existing = getContinuousLearningRecommendations();
  const filtered = existing.filter((r) => r.id !== recommendation.id);
  const nextList = [updatedRec, ...filtered];
  saveContinuousLearningRecommendations(nextList);

  if (decision === 'approved') {
    try {
      const savedMap = JSON.parse(localStorage.getItem('guruji_role_phase_modules') || '{}');
      const phaseKey = `continuous__${recommendation.roleKey}`;
      const currentMods = Array.isArray(savedMap[phaseKey]) ? savedMap[phaseKey] : [];
      const alreadyExists = currentMods.some(
        (m: any) => m.sopId === recommendation.recommendedCourseId || m.title === recommendation.recommendedCourseTitle
      );
      if (!alreadyExists) {
        const newMod = {
          id: `ct_guruji_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          title: recommendation.recommendedCourseTitle,
          subtitle: `Assigned · Gap: ${recommendation.skillGap}`,
          sopId: recommendation.recommendedCourseId,
        };
        savedMap[phaseKey] = [newMod, ...currentMods];
        localStorage.setItem('guruji_role_phase_modules', JSON.stringify(savedMap));
      }
    } catch (e) {
      console.warn('[ContinuousLearning] Role module sync warning:', e);
    }

    try {
      const savedCampaigns = JSON.parse(localStorage.getItem('guruji_admin_campaigns') || '[]');
      const campEntry = {
        id: `camp_${recommendation.id}`,
        title: `${recommendation.recommendedCourseTitle} (${recommendation.skillGap})`,
        sop: recommendation.recommendedCourseTitle,
        sopId: recommendation.recommendedCourseId,
        target: recommendation.learnerName,
        department: recommendation.department,
        location: 'Floor Operations',
        completion: 0,
        journeyPhase: 'Phase 2: Continuous / Mandate',
      };
      localStorage.setItem(
        'guruji_admin_campaigns',
        JSON.stringify([campEntry, ...(Array.isArray(savedCampaigns) ? savedCampaigns : [])])
      );
    } catch (e) {
      console.warn('[ContinuousLearning] Campaign sync warning:', e);
    }

    logAuditEvent(
      'CONTINUOUS_LEARNING_APPROVED',
      `Manager approved recommendation "${recommendation.recommendedCourseTitle}" for ${recommendation.learnerName} (Skill Gap: ${recommendation.skillGap})`
    ).catch(() => {});
  } else {
    logAuditEvent(
      'CONTINUOUS_LEARNING_REJECTED',
      `Manager rejected recommendation "${recommendation.recommendedCourseTitle}" for ${recommendation.learnerName}`
    ).catch(() => {});
  }

  return updatedRec;
}

export function updateLearnerContinuousCourseProgress(
  recIdOrCourseId: string,
  learnerStatus: 'in_progress' | 'completed'
): ContinuousLearningRecommendation[] {
  const list = getContinuousLearningRecommendations();
  const updated = list.map((item) => {
    if (
      item.status === 'approved' &&
      (item.id === recIdOrCourseId || item.recommendedCourseId === recIdOrCourseId)
    ) {
      return {
        ...item,
        learnerStatus,
        progressPct: learnerStatus === 'completed' ? 100 : Math.max(item.progressPct, 50),
        completedAt:
          learnerStatus === 'completed'
            ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : item.completedAt,
      };
    }
    return item;
  });
  saveContinuousLearningRecommendations(updated);
  return updated;
}
