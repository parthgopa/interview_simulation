import { useState, useEffect } from "react";
import { getToken } from "../../../services/token";
import { useNavigate } from "react-router-dom";
import "./ScheduleInterview.css";
import { HiOutlineClipboard ,HiOutlineSparkles ,HiOutlinePencilSquare, HiOutlineDocumentText, HiOutlineCloudArrowUp, HiOutlineCalendarDays, HiOutlineClock } from "react-icons/hi2";
import Input from "../../../ui/Input";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";

export default function ScheduleInterview() {
  const navigate = useNavigate();
  const [scheduleType, setScheduleType] = useState("manual");
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [credentials, setCredentials] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [manualForm, setManualForm] = useState({
    candidateName: "",
    candidateEmail: "",
    position: "",
    schedulingType: "specific",
    specificDate: "",
    specificTime: "",
    daysTimer: "",
    interviewType: "technical",
    duration: "30",
    notes: ""
  });
  const [resumeForm, setResumeForm] = useState({
    position: "",
    schedulingType: "specific",
    specificDate: "",
    specificTime: "",
    daysTimer: "",
    interviewType: "technical",
    duration: "30",
    notes: ""
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = getToken();
      const res = await fetch("${backendURL}/organization/candidates-list", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleCandidateSelect = (e) => {
    const selectedEmail = e.target.value;
    if (selectedEmail) {
      const candidate = candidates.find(c => c.email === selectedEmail);
      if (candidate) {
        setManualForm({
          ...manualForm,
          candidateName: candidate.name,
          candidateEmail: candidate.email
        });
      }
    } else {
      setManualForm({
        ...manualForm,
        candidateName: "",
        candidateEmail: ""
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getToken();
      const payload = {
        candidateName: manualForm.candidateName,
        candidateEmail: manualForm.candidateEmail,
        position: manualForm.position,
        schedulingType: manualForm.schedulingType,
        specificDate: manualForm.schedulingType === "specific" ? manualForm.specificDate : null,
        specificTime: manualForm.schedulingType === "specific" ? manualForm.specificTime : null,
        daysTimer: manualForm.schedulingType === "timer" ? parseInt(manualForm.daysTimer) : null,
        interviewType: manualForm.interviewType,
        duration: parseInt(manualForm.duration),
        notes: manualForm.notes
      };

      const res = await fetch("${backendURL}/organization/schedule-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Interview scheduled successfully!" });
        setCredentials(data.credentials);
        setShowCredentials(true);
        setManualForm({
          candidateName: "",
          candidateEmail: "",
          position: "",
          schedulingType: "specific",
          specificDate: "",
          specificTime: "",
          daysTimer: "",
          interviewType: "technical",
          duration: "30",
          notes: ""
        });
        fetchCandidates();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to schedule interview" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!resumeFile) {
      setMessage({ type: "error", text: "Please upload a resume" });
      setLoading(false);
      return;
    }

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("position", resumeForm.position);
      formData.append("schedulingType", resumeForm.schedulingType);
      formData.append("specificDate", resumeForm.schedulingType === "specific" ? resumeForm.specificDate : "");
      formData.append("specificTime", resumeForm.schedulingType === "specific" ? resumeForm.specificTime : "");
      formData.append("daysTimer", resumeForm.schedulingType === "timer" ? resumeForm.daysTimer : "");
      formData.append("interviewType", resumeForm.interviewType);
      formData.append("duration", resumeForm.duration);
      formData.append("notes", resumeForm.notes);

      const res = await fetch("${backendURL}/organization/schedule-interview-resume", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Interview scheduled successfully with resume!" });
        setCredentials(data.credentials);
        setShowCredentials(true);
        setResumeForm({
          position: "",
          schedulingType: "specific",
          specificDate: "",
          specificTime: "",
          daysTimer: "",
          interviewType: "technical",
          duration: "30",
          notes: ""
        });
        setResumeFile(null);
        fetchCandidates();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to schedule interview" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-interview-container fade-in">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title mb-1">Schedule New Session</h2>
          <p className="text-muted small">Invite candidates to an AI-powered evaluation</p>
        </div>
        {candidates.length === 0 && !loadingCandidates && (
          <Button variant="secondary" onClick={() => navigate("/organization/dashboard/candidates")}>
            <HiOutlineUserPlus className="me-2" /> Add Candidate First
          </Button>
        )}
      </div>

      {/* Modern Tabs */}
      <div className="tabs-wrapper mb-4">
        <button
          className={`tab-item ${scheduleType === "manual" ? "active" : ""}`}
          onClick={() => setScheduleType("manual")}
        >
          <HiOutlinePencilSquare /> Manual Entry
        </button>
        <button
          className={`tab-item ${scheduleType === "resume" ? "active" : ""}`}
          onClick={() => setScheduleType("resume")}
        >
          <HiOutlineCloudArrowUp /> Upload Resume
        </button>
      </div>

      {message.text && (
        <div className={`alert-ui mb-4 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* Success Credentials Modal */}
      {showCredentials && credentials && (
        <div className="modal-overlay">
          <Card className="modal-content shadow-lg border-0 p-0 overflow-hidden">
            <div className="modal-header-accent bg-black text-white p-4 text-center">
              <HiOutlineSparkles className="display-4 mb-2" />
              <h3 className="fw-bold">Interview Scheduled!</h3>
            </div>
            <div className="p-4 modal-body bg-black">
              <p className="text-white  text-center mb-4">
                Share these secure credentials with the candidate to allow them access to the session.
              </p>

              <div className="credentials-list">
                {[
                  { label: "Username", val: credentials.username },
                  { label: "Password", val: credentials.password },
                  { label: "Email", val: credentials.email }
                ].map((item, i) => (
                  <div className="credential-row-item mb-2" key={i}>
                    <label className="small fw-bold text-white">{item.label}</label>
                    <div className="credential-copy-field">
                      <code>{item.val}</code>
                      <button onClick={() => copyToClipboard(item.val)} className="copy-btn">
                        <HiOutlineClipboard />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 mt-4">
                <Button className="w-100" onClick={() => {
                  const text = `Interview Login:\nUser: ${credentials.username}\nPass: ${credentials.password}`;
                  copyToClipboard(text);
                }}>
                  Copy All
                </Button>
                <Button variant="secondary" onClick={() => setShowCredentials(false)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <form onSubmit={scheduleType === "manual" ? handleManualSubmit : handleResumeSubmit}>
          {scheduleType === "resume" && (
            <div className="mb-5">
              <h4 className="fw-bold mb-3">Upload Candidate Resume</h4>
              <div
                className={`file-upload-area ${dragActive ? "drag-over" : ""} ${resumeFile ? "has-file" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("resume-upload").click()}
              >
                <HiOutlineDocumentText className="upload-icon-large" />
                {resumeFile ? (
                  <div className="text-center">
                    <p className="mb-0 fw-bold">{resumeFile.name}</p>
                    <span className="small text-muted">{(resumeFile.size / 1024).toFixed(2)} KB</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="mb-0 fw-bold">Click or drag resume here</p>
                    <span className="small text-muted">PDF, DOC, DOCX up to 5MB</span>
                  </div>
                )}
                <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} hidden />
              </div>
            </div>
          )}

          <h4 className="fw-bold mb-4 mt-2">Interview Configuration</h4>

          {scheduleType === "manual" && (
                <div className="candidate-details-section mb-5">
                  <div className="d-flex align-items-center gap-2 mb-4">
                    <div className="section-dot"></div>
                    <h4 className="fw-bold mb-0">1. Candidate Details</h4>
                  </div>

                  <div className="row g-3">
                    {/* Existing Candidate Dropdown */}
                    {candidates.length > 0 && (
                      <div className="col-12 mb-2">
                        <div className="input-group-ui">
                          <label className="label-ui">Quick Select (Existing Candidate)</label>
                          <select className="input-ui select-special" onChange={handleCandidateSelect} defaultValue="">
                            <option value="">-- Or type new details below --</option>
                            {candidates.map((c) => (
                              <option key={c._id} value={c.email}>{c.name} ({c.email})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* THE RESTORED INPUTS */}
                    <div className="col-md-6">
                      <Input
                        label="Candidate Full Name *"
                        placeholder="e.g. Jane Cooper"
                        value={manualForm.candidateName}
                        onChange={(e) => setManualForm({ ...manualForm, candidateName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <Input
                        label="Candidate Email Address *"
                        type="email"
                        placeholder="jane.c@example.com"
                        value={manualForm.candidateEmail}
                        onChange={(e) => setManualForm({ ...manualForm, candidateEmail: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

          <div className="row g-3">
            {/* Position and Interview Type row */}
            <div className="col-md-6">
              {/* Candidate name and Email inputs ( Manual Entry) or selection from existing candidates*/}
              {/* TAB 1: MANUAL ENTRY - CANDIDATE DETAILS */}
              

              <Input
                label="Target Position *"
                value={scheduleType === "manual" ? manualForm.position : resumeForm.position}
                onChange={(e) => {
                  const val = e.target.value;
                  scheduleType === "manual"
                    ? setManualForm({ ...manualForm, position: val })
                    : setResumeForm({ ...resumeForm, position: val })
                }}
                placeholder="e.g. Senior React Developer"
                required
              />
            </div>

            <div className="col-md-6">
              <div className="input-group-ui">
                <label className="label-ui">Interview Type *</label>
                <select
                  className="input-ui"
                  value={scheduleType === "manual" ? manualForm.interviewType : resumeForm.interviewType}
                  onChange={(e) => {
                    const val = e.target.value;
                    scheduleType === "manual"
                      ? setManualForm({ ...manualForm, interviewType: val })
                      : setResumeForm({ ...resumeForm, interviewType: val })
                  }}
                  required
                >
                  <option value="technical">Technical Assessment</option>
                  <option value="behavioral">Behavioral Round</option>
                  <option value="hr">Culture Fit / HR</option>
                </select>
              </div>
            </div>

            {/* THE CRITICAL SCHEDULING LOGIC SECTION */}
            <div className="col-12 mt-4">
              <label className="label-ui mb-3">When should this interview happen? *</label>
              <div className="scheduling-type-toggle">
                <label className={`toggle-option ${(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "specific" ? "selected" : ""
                  }`}>
                  <input
                    type="radio"
                    value="specific"
                    checked={(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "specific"}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, schedulingType: val })
                        : setResumeForm({ ...resumeForm, schedulingType: val })
                    }}
                    hidden
                  />
                  <HiOutlineCalendarDays className="me-2" /> Specific Date & Time
                </label>

                <label className={`toggle-option ${(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "timer" ? "selected" : ""
                  }`}>
                  <input
                    type="radio"
                    value="timer"
                    checked={(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "timer"}
                    onChange={(e) => {
                      const val = e.target.value;
                      scheduleType === "manual"
                        ? setManualForm({ ...manualForm, schedulingType: val })
                        : setResumeForm({ ...resumeForm, schedulingType: val })
                    }}
                    hidden
                  />
                  <HiOutlineClock className="me-2" /> Dynamic Timer (Deadline)
                </label>
              </div>
            </div>

            {/* CONDITIONAL INPUTS: DATE/TIME vs. TIMER */}
            {(scheduleType === "manual" ? manualForm.schedulingType : resumeForm.schedulingType) === "specific" ? (
              <div className="col-12 fade-in">
                <div className="row g-3">
                  <div className="col-md-6">
                    <Input
                      label="Session Date *"
                      type="date"
                      value={scheduleType === "manual" ? manualForm.specificDate : resumeForm.specificDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleType === "manual"
                          ? setManualForm({ ...manualForm, specificDate: val })
                          : setResumeForm({ ...resumeForm, specificDate: val })
                      }}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <Input
                      label="Start Time *"
                      type="time"
                      value={scheduleType === "manual" ? manualForm.specificTime : resumeForm.specificTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        scheduleType === "manual"
                          ? setManualForm({ ...manualForm, specificTime: val })
                          : setResumeForm({ ...resumeForm, specificTime: val })
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="col-12 fade-in">
                <Input
                  label="Deadline (Number of Days) *"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="e.g. 3"
                  value={scheduleType === "manual" ? manualForm.daysTimer : resumeForm.daysTimer}
                  onChange={(e) => {
                    const val = e.target.value;
                    scheduleType === "manual"
                      ? setManualForm({ ...manualForm, daysTimer: val })
                      : setResumeForm({ ...resumeForm, daysTimer: val })
                  }}
                  required
                />
                <small className="text-muted mt-n2 d-block">The candidate must complete the session within this window after receiving the invite.</small>
              </div>
            )}

            {/* Final Row: Duration and Notes */}
            <div className="col-md-6 mt-3">
              <div className="input-group-ui">
                <label className="label-ui">Total Duration *</label>
                <select
                  className="input-ui"
                  value={scheduleType === "manual" ? manualForm.duration : resumeForm.duration}
                  onChange={(e) => {
                    const val = e.target.value;
                    scheduleType === "manual"
                      ? setManualForm({ ...manualForm, duration: val })
                      : setResumeForm({ ...resumeForm, duration: val })
                  }}
                  required
                > 
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>
            </div>

            <div className="col-12 mt-3">
              <div className="input-group-ui">
                <label className="label-ui">Additional Instructions (Optional)</label>
                <textarea
                  className="input-ui"
                  rows="3"
                  value={scheduleType === "manual" ? manualForm.notes : resumeForm.notes}
                  onChange={(e) => {
                    const val = e.target.value;
                    scheduleType === "manual"
                      ? setManualForm({ ...manualForm, notes: val })
                      : setResumeForm({ ...resumeForm, notes: val })
                  }}
                  placeholder="Mention any specific skills or topics to focus on..."
                />
              </div>
            </div>
          </div>

          <div className="mt-5 border-top pt-4 text-end">
            <Button type="submit" disabled={loading} className="px-5 py-3 shadow-sm">
              {loading ? "Scheduling Session..." : "Confirm & Send Invitation"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
