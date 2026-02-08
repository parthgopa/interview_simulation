import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./OrgCvAnalyzer.css";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import {
  HiOutlineDocumentText,
  HiOutlineCloudArrowUp,
  HiOutlineMagnifyingGlass,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineChevronDown,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
} from "react-icons/hi2";
import {
  createScreeningJob,
  uploadResumes,
  analyzeResumes,
  getReport,
  deleteResume,
} from "../../../services/resumeScreeningApi";

// ───────────────────────────────────────────
// Constants
// ───────────────────────────────────────────
const STEPS = [
  { key: "job", label: "Job Setup", icon: HiOutlineDocumentText },
  { key: "upload", label: "Upload Resumes", icon: HiOutlineCloudArrowUp },
  { key: "analyze", label: "Analyze", icon: HiOutlineMagnifyingGlass },
  { key: "results", label: "Results", icon: HiOutlineChartBar },
];

const SENIORITY_OPTIONS = [
  "Intern",
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "VP",
  "C-Level",
];

const INDUSTRY_OPTIONS = [
  "Technology / IT",
  "Finance / Banking",
  "Healthcare / Pharma",
  "Education",
  "Manufacturing",
  "Retail / E-Commerce",
  "Consulting",
  "Media / Entertainment",
  "Government / Public Sector",
  "Energy / Utilities",
  "Logistics / Supply Chain",
  "Real Estate",
  "Legal",
  "Other",
];

const INITIAL_JOB_FORM = {
  jobTitle: "",
  jobDescription: "",
  requiredExperience: "",
  mandatorySkills: [],
  industry: "",
  seniorityLevel: "",
  scoringScale: "10",
  reportType: "SUMMARY",
};

// ───────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────
export default function OrgCvAnalyzer() {
  const navigate = useNavigate();

  // Step state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Job form state
  const [jobForm, setJobForm] = useState({ ...INITIAL_JOB_FORM });
  const [skillInput, setSkillInput] = useState("");
  const [jobErrors, setJobErrors] = useState({});
  const [jobLoading, setJobLoading] = useState(false);
  const [jobSuccess, setJobSuccess] = useState(false);
  const [jobId, setJobId] = useState(null);

  // Upload state
  const [resumeFiles, setResumeFiles] = useState([]); // { file, id?, status, error? }
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Analyze state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [analyzeError, setAnalyzeError] = useState("");

  // Results state
  const [report, setReport] = useState(null);
  const [sortField, setSortField] = useState("rank");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});

  // Global error
  const [globalError, setGlobalError] = useState("");

  // ─── Helpers ──────────────────────────────
  const markStepComplete = (idx) => {
    setCompletedSteps((prev) => (prev.includes(idx) ? prev : [...prev, idx]));
  };

  const goToStep = (idx) => setCurrentStep(idx);

  // ─── Job Form Handlers ────────────────────
  const handleJobChange = (field, value) => {
    setJobForm((prev) => ({ ...prev, [field]: value }));
    if (jobErrors[field]) setJobErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (jobForm.mandatorySkills.includes(trimmed)) return;
    handleJobChange("mandatorySkills", [...jobForm.mandatorySkills, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    handleJobChange(
      "mandatorySkills",
      jobForm.mandatorySkills.filter((s) => s !== skill)
    );
  };

  const validateJobForm = () => {
    const errs = {};
    if (!jobForm.jobTitle.trim()) errs.jobTitle = "Job title is required";
    if (!jobForm.jobDescription.trim()) errs.jobDescription = "Job description is required";
    if (!jobForm.requiredExperience.trim()) errs.requiredExperience = "Experience is required";
    if (jobForm.mandatorySkills.length === 0) errs.mandatorySkills = "Add at least one skill";
    if (!jobForm.industry) errs.industry = "Select an industry";
    if (!jobForm.seniorityLevel) errs.seniorityLevel = "Select seniority level";
    setJobErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleJobSubmit = async () => {
    if (!validateJobForm()) return;
    setJobLoading(true);
    setGlobalError("");
    try {
      const res = await createScreeningJob(jobForm);
      setJobId(res.jobId);
      setJobSuccess(true);
      markStepComplete(0);
      setTimeout(() => goToStep(1), 1200);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setJobLoading(false);
    }
  };

  // ─── Upload Handlers ──────────────────────
  const handleFilesSelected = (fileList) => {
    const newFiles = Array.from(fileList).map((f) => ({
      file: f,
      id: null,
      status: "pending",
      error: null,
    }));
    setResumeFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFilesSelected(e.dataTransfer.files);
  }, []);

  const handleRemoveFile = (index) => {
    setResumeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUploaded = async (index) => {
    const item = resumeFiles[index];
    if (item.id) {
      try {
        await deleteResume(item.id);
      } catch {
        // still remove from UI
      }
    }
    setResumeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (!jobId) return;
    setUploadLoading(true);
    setUploadError("");
    setGlobalError("");

    const pendingFiles = resumeFiles.filter((r) => r.status === "pending").map((r) => r.file);
    if (pendingFiles.length === 0) {
      setUploadLoading(false);
      return;
    }

    try {
      const res = await uploadResumes(jobId, pendingFiles);

      setResumeFiles((prev) => {
        const updated = [...prev];
        let uploadIdx = 0;
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].status === "pending") {
            const match = res.uploaded?.[uploadIdx];
            const errMatch = res.errors?.find((e) => e.filename === updated[i].file.name);
            if (errMatch) {
              updated[i] = { ...updated[i], status: "error", error: errMatch.error };
            } else if (match) {
              updated[i] = { ...updated[i], status: "uploaded", id: match.resumeId };
            }
            uploadIdx++;
          }
        }
        return updated;
      });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const uploadedCount = resumeFiles.filter((r) => r.status === "uploaded").length;
  const pendingCount = resumeFiles.filter((r) => r.status === "pending").length;
  const canProceedToAnalyze = uploadedCount > 0;

  const handleProceedToAnalyze = () => {
    markStepComplete(1);
    goToStep(2);
  };

  // ─── Analyze Handlers ─────────────────────
  const handleAnalyze = async () => {
    if (!jobId) return;
    setAnalyzing(true);
    setAnalyzeError("");
    setGlobalError("");
    setAnalyzeProgress({ current: 0, total: uploadedCount });

    // Simulate incremental progress while waiting for backend
    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev.current < prev.total - 1) {
          return { ...prev, current: prev.current + 1 };
        }
        return prev;
      });
    }, 1500);

    try {
      await analyzeResumes(jobId);
      clearInterval(progressInterval);
      setAnalyzeProgress({ current: uploadedCount, total: uploadedCount });

      // Fetch report
      const reportData = await getReport(jobId);
      setReport(reportData);
      markStepComplete(2);
      setTimeout(() => goToStep(3), 800);
    } catch (err) {
      clearInterval(progressInterval);
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Results Handlers ─────────────────────
  const getSortedCandidates = () => {
    if (!report?.candidates) return [];
    const sorted = [...report.candidates].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getScoreClass = (score, scale) => {
    const pct = scale === "100" ? score : (score / 10) * 100;
    if (pct >= 70) return "cv-score-high";
    if (pct >= 40) return "cv-score-mid";
    return "cv-score-low";
  };

  const handleStartNew = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setJobForm({ ...INITIAL_JOB_FORM });
    setSkillInput("");
    setJobErrors({});
    setJobLoading(false);
    setJobSuccess(false);
    setJobId(null);
    setResumeFiles([]);
    setUploadLoading(false);
    setUploadError("");
    setAnalyzing(false);
    setAnalyzeProgress({ current: 0, total: 0 });
    setAnalyzeError("");
    setReport(null);
    setSortField("rank");
    setSortAsc(true);
    setExpandedCards({});
    setGlobalError("");
  };

  // ─── Render ───────────────────────────────
  return (
    <div className="cv-analyzer-container fade-in">
      {/* Stepper */}
      <div className="cv-stepper">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isDone = completedSteps.includes(idx);
          return (
            <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              {idx > 0 && (
                <div className={`cv-step-divider ${isDone || completedSteps.includes(idx - 1) ? "completed" : ""}`} />
              )}
              <div className={`cv-step ${isActive ? "active" : ""} ${isDone ? "completed" : ""}`}>
                <Icon style={{ fontSize: "1.1rem" }} />
                <span>{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="cv-error-banner">
          <HiOutlineExclamationTriangle style={{ fontSize: "1.3rem", flexShrink: 0 }} />
          <span>{globalError}</span>
          <button
            onClick={() => setGlobalError("")}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--error)" }}
          >
            <HiOutlineXMark />
          </button>
        </div>
      )}

      {/* ============================
          STEP 0 – Job Setup
         ============================ */}
      {currentStep === 0 && (
        <Card>
          <div className="cv-section-header">
            <h2>Job Setup</h2>
            <p>Provide the job details so we can screen resumes against your requirements.</p>
          </div>

          {jobSuccess && (
            <div className="cv-success-banner">
              <HiOutlineCheckCircle style={{ fontSize: "1.4rem" }} />
              Job created successfully! Proceeding to resume upload...
            </div>
          )}

          <div className="cv-form-grid">
            {/* Job Title */}
            <div>
              <Input
                label="Job Title"
                placeholder="e.g. Senior Frontend Engineer"
                value={jobForm.jobTitle}
                onChange={(e) => handleJobChange("jobTitle", e.target.value)}
              />
              {jobErrors.jobTitle && <div className="cv-field-error">{jobErrors.jobTitle}</div>}
            </div>

            {/* Required Experience */}
            <div>
              <Input
                label="Required Experience"
                placeholder="e.g. 3-5 years"
                value={jobForm.requiredExperience}
                onChange={(e) => handleJobChange("requiredExperience", e.target.value)}
              />
              {jobErrors.requiredExperience && <div className="cv-field-error">{jobErrors.requiredExperience}</div>}
            </div>

            {/* Industry */}
            <div className="cv-select-group">
              <label>Industry / Domain</label>
              <select
                className="cv-select"
                value={jobForm.industry}
                onChange={(e) => handleJobChange("industry", e.target.value)}
              >
                <option value="">-- Select Industry --</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {jobErrors.industry && <div className="cv-field-error">{jobErrors.industry}</div>}
            </div>

            {/* Seniority Level */}
            <div className="cv-select-group">
              <label>Seniority Level</label>
              <select
                className="cv-select"
                value={jobForm.seniorityLevel}
                onChange={(e) => handleJobChange("seniorityLevel", e.target.value)}
              >
                <option value="">-- Select Level --</option>
                {SENIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {jobErrors.seniorityLevel && <div className="cv-field-error">{jobErrors.seniorityLevel}</div>}
            </div>

            {/* Scoring Scale */}
            <div className="cv-select-group">
              <label>Scoring Scale</label>
              <select
                className="cv-select"
                value={jobForm.scoringScale}
                onChange={(e) => handleJobChange("scoringScale", e.target.value)}
              >
                <option value="10">Out of 10</option>
                <option value="100">Out of 100</option>
              </select>
            </div>

            {/* Report Type */}
            <div className="cv-select-group">
              <label>Report Type</label>
              <select
                className="cv-select"
                value={jobForm.reportType}
                onChange={(e) => handleJobChange("reportType", e.target.value)}
              >
                <option value="SUMMARY">Summary Report</option>
                <option value="DETAILED">Detailed Report</option>
              </select>
            </div>

            {/* Job Description – full width */}
            <div className="cv-field-full">
              <div className="cv-select-group">
                <label>Job Description</label>
                <textarea
                  className="cv-textarea"
                  placeholder="Paste or type the full job description here..."
                  value={jobForm.jobDescription}
                  onChange={(e) => handleJobChange("jobDescription", e.target.value)}
                  rows={5}
                />
                {jobErrors.jobDescription && <div className="cv-field-error">{jobErrors.jobDescription}</div>}
              </div>
            </div>

            {/* Mandatory Skills – full width */}
            <div className="cv-field-full">
              <div className="cv-select-group">
                <label>Mandatory Skills</label>
                <div className="cv-skills-input-row">
                  <input
                    className="cv-select"
                    placeholder="Type a skill and press Add (e.g. React, Python)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button variant="secondary" onClick={addSkill}>
                    Add
                  </Button>
                </div>
                {jobErrors.mandatorySkills && <div className="cv-field-error">{jobErrors.mandatorySkills}</div>}
                {jobForm.mandatorySkills.length > 0 && (
                  <div className="cv-skills-tags">
                    {jobForm.mandatorySkills.map((skill) => (
                      <span key={skill} className="cv-skill-tag">
                        {skill}
                        <button onClick={() => removeSkill(skill)} title="Remove">
                          <HiOutlineXMark />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="cv-form-actions">
            <Button
              variant="secondary"
              onClick={() => navigate("/organization/dashboard/cv-analyser/history")}
            >
              <HiOutlineClock style={{ marginRight: 6 }} />
              History
            </Button>
            <Button onClick={handleJobSubmit} disabled={jobLoading || jobSuccess}>
              {jobLoading ? (
                <>
                  <span className="cv-spinner-inline" style={{ marginRight: 8 }} />
                  Creating Job...
                </>
              ) : jobSuccess ? (
                "Job Created"
              ) : (
                "Create Job & Continue"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ============================
          STEP 1 – Resume Upload
         ============================ */}
      {currentStep === 1 && (
        <Card>
          <div className="cv-section-header">
            <h2>Upload Resumes</h2>
            <p>Upload one or more resumes (PDF, DOC, DOCX) to screen against the job requirements.</p>
          </div>

          {/* Drop zone */}
          <div
            className={`cv-upload-zone ${dragOver ? "drag-over" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <HiOutlineCloudArrowUp className="cv-upload-zone-icon" />
            <p><strong>Click to browse</strong> or drag & drop resumes here</p>
            <p>Supports PDF, DOC, DOCX</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {uploadError && (
            <div className="cv-error-banner" style={{ marginTop: "var(--space-md)" }}>
              <HiOutlineExclamationTriangle style={{ fontSize: "1.3rem" }} />
              <span>{uploadError}</span>
            </div>
          )}

          {/* File list */}
          {resumeFiles.length > 0 && (
            <div className="cv-resume-list">
              {resumeFiles.map((item, idx) => (
                <div key={idx} className="cv-resume-item">
                  <div className="cv-resume-item-info">
                    <HiOutlineDocumentText className="cv-resume-item-icon" />
                    <div>
                      <div className="cv-resume-item-name">{item.file.name}</div>
                      <div className="cv-resume-item-size">
                        {(item.file.size / 1024).toFixed(1)} KB
                        {item.status === "uploaded" && (
                          <span className="cv-status-badge cv-status-completed" style={{ marginLeft: 8 }}>
                            Uploaded
                          </span>
                        )}
                        {item.status === "pending" && (
                          <span className="cv-status-badge cv-status-uploaded" style={{ marginLeft: 8 }}>
                            Pending
                          </span>
                        )}
                        {item.status === "error" && (
                          <span className="cv-resume-item-error" style={{ marginLeft: 8 }}>
                            {item.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className="cv-resume-item-delete"
                    title="Remove"
                    onClick={() =>
                      item.status === "uploaded" ? handleRemoveUploaded(idx) : handleRemoveFile(idx)
                    }
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="cv-form-actions">
            <Button variant="secondary" onClick={() => goToStep(0)}>
              Back
            </Button>

            {pendingCount > 0 && (
              <Button variant="secondary" onClick={handleUploadAll} disabled={uploadLoading}>
                {uploadLoading ? (
                  <>
                    <span className="cv-spinner-inline" style={{ marginRight: 8 }} />
                    Uploading...
                  </>
                ) : (
                  `Upload ${pendingCount} File${pendingCount > 1 ? "s" : ""}`
                )}
              </Button>
            )}

            <Button onClick={handleProceedToAnalyze} disabled={!canProceedToAnalyze}>
              Proceed to Analyze
            </Button>
          </div>
        </Card>
      )}

      {/* ============================
          STEP 2 – Analyze
         ============================ */}
      {currentStep === 2 && (
        <Card>
          <div className="cv-section-header">
            <h2>Analyze Resumes</h2>
            <p>
              {uploadedCount} resume{uploadedCount !== 1 ? "s" : ""} ready for analysis.
              Click below to start the AI-powered screening.
            </p>
          </div>

          {analyzeError && (
            <div className="cv-error-banner">
              <HiOutlineExclamationTriangle style={{ fontSize: "1.3rem" }} />
              <span>{analyzeError}</span>
            </div>
          )}

          {analyzing && (
            <div className="cv-progress-container">
              <div className="cv-progress-bar-track">
                <div
                  className="cv-progress-bar-fill"
                  style={{
                    width: `${analyzeProgress.total ? (analyzeProgress.current / analyzeProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="cv-progress-text">
                Analyzing resume {analyzeProgress.current + 1} of {analyzeProgress.total}...
              </div>
            </div>
          )}

          <div className="cv-form-actions">
            <Button variant="secondary" onClick={() => goToStep(1)} disabled={analyzing}>
              Back
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <span className="cv-spinner-inline" style={{ marginRight: 8 }} />
                  Analyzing...
                </>
              ) : (
                "Analyze Resumes"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ============================
          STEP 3 – Results
         ============================ */}
      {currentStep === 3 && report && (
        <Card>
          <div className="cv-section-header">
            <h2>Screening Results</h2>
            <p>
              {report.job?.jobTitle} — {report.candidates?.length} candidate{report.candidates?.length !== 1 ? "s" : ""} screened
              {report.job?.scoringScale && ` (scored out of ${report.job.scoringScale})`}
            </p>
          </div>

          {/* ── SUMMARY REPORT ── */}
          {report.job?.reportType === "SUMMARY" && (
            <div className="cv-results-table-wrapper">
              <table className="cv-results-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("rank")}>
                      Rank {sortField === "rank" && <span className="cv-sort-indicator">{sortAsc ? "▲" : "▼"}</span>}
                    </th>
                    <th onClick={() => handleSort("candidateName")}>
                      Name {sortField === "candidateName" && <span className="cv-sort-indicator">{sortAsc ? "▲" : "▼"}</span>}
                    </th>
                    <th onClick={() => handleSort("score")}>
                      Score {sortField === "score" && <span className="cv-sort-indicator">{sortAsc ? "▲" : "▼"}</span>}
                    </th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedCandidates().map((c) => (
                    <tr key={c.resumeId}>
                      <td>
                        <span
                          className={`cv-rank-badge ${
                            c.rank === 1 ? "cv-rank-1" : c.rank === 2 ? "cv-rank-2" : c.rank === 3 ? "cv-rank-3" : ""
                          }`}
                        >
                          {c.rank}
                        </span>
                      </td>
                      <td>{c.candidateName}</td>
                      <td>
                        <div className="cv-score-bar">
                          <span style={{ fontWeight: 600, minWidth: 36 }}>
                            {c.score}/{report.job.scoringScale}
                          </span>
                          <div className="cv-score-bar-track">
                            <div
                              className={`cv-score-bar-fill ${getScoreClass(c.score, report.job.scoringScale)}`}
                              style={{
                                width: `${(c.score / Number(report.job.scoringScale)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`cv-status-badge cv-status-${c.status}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DETAILED REPORT ── */}
          {report.job?.reportType === "DETAILED" && (
            <div className="cv-detail-cards">
              {getSortedCandidates().map((c) => (
                <div key={c.resumeId} className="cv-detail-card">
                  <div className="cv-detail-card-header" onClick={() => toggleCard(c.resumeId)}>
                    <div className="cv-detail-card-left">
                      <span
                        className={`cv-rank-badge ${
                          c.rank === 1 ? "cv-rank-1" : c.rank === 2 ? "cv-rank-2" : c.rank === 3 ? "cv-rank-3" : ""
                        }`}
                      >
                        #{c.rank}
                      </span>
                      <div>
                        <strong>{c.candidateName}</strong>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          Score: {c.score}/{report.job.scoringScale}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                      <span className={`cv-status-badge cv-status-${c.status}`}>{c.status}</span>
                      <HiOutlineChevronDown className={`cv-chevron ${expandedCards[c.resumeId] ? "open" : ""}`} />
                    </div>
                  </div>

                  {expandedCards[c.resumeId] && (
                    <div className="cv-detail-card-body">
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">File</span>
                        <span className="cv-detail-value">{c.filename}</span>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Experience Match</span>
                        <span className="cv-detail-value">{c.experienceMatch || "—"}</span>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Matched Skills</span>
                        <div className="cv-detail-skills">
                          {c.matchedSkills?.length > 0
                            ? c.matchedSkills.map((s) => (
                                <span key={s} className="cv-detail-skill-matched">{s}</span>
                              ))
                            : <span className="cv-detail-value">—</span>}
                        </div>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Missing Skills</span>
                        <div className="cv-detail-skills">
                          {c.missingSkills?.length > 0
                            ? c.missingSkills.map((s) => (
                                <span key={s} className="cv-detail-skill-missing">{s}</span>
                              ))
                            : <span className="cv-detail-value">—</span>}
                        </div>
                      </div>
                      <div className="cv-detail-row">
                        <span className="cv-detail-label">Summary</span>
                        <span className="cv-detail-value">{c.summary || "—"}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="cv-new-job-row">
            <Button variant="secondary" onClick={handleStartNew}>
              <HiOutlineArrowPath style={{ marginRight: 6 }} />
              Screen New Job
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}