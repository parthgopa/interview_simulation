from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import os
import uuid

from config import screening_jobs_collection, screening_resumes_collection
from services.resume_orchestrator import run_analysis
from services.resume_ranker import generate_report

resume_screening_bp = Blueprint("resume_screening", __name__)

ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "uploads", "resumes")


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ===========================
# 1. POST /api/job/create
# ===========================
@resume_screening_bp.route("/job/create", methods=["POST"])
@jwt_required()
def create_job():
    """Create a new screening job with all HR-provided parameters."""
    user_id = get_jwt_identity()
    data = request.get_json()

    required_fields = [
        "jobTitle", "jobDescription", "requiredExperience",
        "mandatorySkills", "industry", "seniorityLevel",
        "scoringScale", "reportType"
    ]
    missing = [f for f in required_fields if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # Validate types
    if not isinstance(data["mandatorySkills"], list):
        return jsonify({"error": "mandatorySkills must be a list"}), 400
    if data["scoringScale"] not in ("10", "100"):
        return jsonify({"error": "scoringScale must be '10' or '100'"}), 400
    if data["reportType"] not in ("SUMMARY", "DETAILED"):
        return jsonify({"error": "reportType must be 'SUMMARY' or 'DETAILED'"}), 400

    job_doc = {
        "userId": user_id,
        "jobTitle": data["jobTitle"],
        "jobDescription": data["jobDescription"],
        "requiredExperience": data["requiredExperience"],
        "mandatorySkills": data["mandatorySkills"],
        "industry": data["industry"],
        "seniorityLevel": data["seniorityLevel"],
        "scoringScale": data["scoringScale"],
        "reportType": data["reportType"],
        "status": "created",
        "createdAt": datetime.utcnow().isoformat(),
    }

    result = screening_jobs_collection.insert_one(job_doc)
    return jsonify({
        "message": "Job created successfully",
        "jobId": str(result.inserted_id)
    }), 201


# ===========================
# 2. POST /api/resumes/upload
# ===========================
@resume_screening_bp.route("/resumes/upload", methods=["POST"])
@jwt_required()
def upload_resumes():
    """Accept one or more resume files for a given jobId."""
    user_id = get_jwt_identity()
    job_id = request.form.get("jobId")

    if not job_id:
        return jsonify({"error": "jobId is required"}), 400

    job = screening_jobs_collection.find_one({"_id": ObjectId(job_id), "userId": user_id})
    if not job:
        return jsonify({"error": "Job not found"}), 404

    files = request.files.getlist("resumes")
    if not files:
        return jsonify({"error": "No files provided"}), 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    uploaded = []
    errors = []

    for f in files:
        if not _allowed_file(f.filename):
            errors.append({"filename": f.filename, "error": "Unsupported file type. Only PDF, DOC, DOCX allowed."})
            continue

        unique_name = f"{uuid.uuid4().hex}_{f.filename}"
        save_path = os.path.join(UPLOAD_FOLDER, unique_name)
        f.save(save_path)

        resume_doc = {
            "jobId": job_id,
            "userId": user_id,
            "originalName": f.filename,
            "storedName": unique_name,
            "path": save_path,
            "status": "uploaded",
            "uploadedAt": datetime.utcnow().isoformat(),
        }
        result = screening_resumes_collection.insert_one(resume_doc)
        uploaded.append({
            "resumeId": str(result.inserted_id),
            "filename": f.filename,
            "status": "uploaded"
        })

    return jsonify({
        "uploaded": uploaded,
        "errors": errors
    }), 200


# ===========================
# 3. POST /api/resumes/analyze
# ===========================
@resume_screening_bp.route("/resumes/analyze", methods=["POST"])
@jwt_required()
def analyze_resumes():
    """
    Trigger the full AI analysis pipeline for all uploaded resumes of a job.
    Pipeline per resume: Parse → Normalize (Gemini) → Evaluate (Gemini)
    Orchestrated with per-resume error isolation and rate limiting.
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    job_id = data.get("jobId")

    if not job_id:
        return jsonify({"error": "jobId is required"}), 400

    try:
        result = run_analysis(job_id, user_id)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # Mark job as failed on unexpected errors
        try:
            screening_jobs_collection.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"status": "failed", "error": str(e)}}
            )
        except Exception:
            pass
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    return jsonify({
        "message": "Analysis complete",
        "total": result["total"],
        "completed": result["completed"],
        "failed": result["failed"],
        "results": result["results"]
    }), 200


# ===========================
# 4. GET /api/reports/<jobId>
# ===========================
@resume_screening_bp.route("/reports/<job_id>", methods=["GET"])
@jwt_required()
def get_report(job_id):
    """
    Return the screening report for a given job.
    Uses the Ranking & Reporting module (NO AI) to sort, rank,
    bucket, and build the appropriate report type.
    """
    user_id = get_jwt_identity()

    job = screening_jobs_collection.find_one({"_id": ObjectId(job_id), "userId": user_id})
    if not job:
        return jsonify({"error": "Job not found"}), 404

    resumes = list(screening_resumes_collection.find({"jobId": job_id, "userId": user_id}))

    # Build candidate list from stored analysis data
    candidates = []
    for r in resumes:
        analysis = r.get("analysis", {})
        candidates.append({
            "resumeId": str(r["_id"]),
            "filename": r.get("originalName", ""),
            "candidateName": analysis.get("candidateName", r.get("originalName", "Unknown")),
            "score": analysis.get("score", 0),
            "verdict": analysis.get("verdict", ""),
            "experienceMatch": analysis.get("experienceMatch", ""),
            "skillsMatchPercent": analysis.get("skillsMatchPercent", 0),
            "roleFit": analysis.get("roleFit", ""),
            "aiContentProbability": analysis.get("aiContentProbability", ""),
            "matchedSkills": analysis.get("matchedSkills", []),
            "missingSkills": analysis.get("missingSkills", []),
            "summary": analysis.get("summary", ""),
            "status": r.get("status", "uploaded"),
        })

    report = generate_report(job, candidates)
    return jsonify(report), 200


# ===========================
# 5. GET /api/history/jobs
# ===========================
@resume_screening_bp.route("/history/jobs", methods=["GET"])
@jwt_required()
def get_history_jobs():
    """
    Return all screening jobs for the current user that have been
    analyzed (completed, partial, or failed).
    Each job includes the count of resumes that were processed.
    """
    user_id = get_jwt_identity()

    jobs = list(screening_jobs_collection.find({
        "userId": user_id,
        "status": {"$in": ["completed", "partial", "failed"]}
    }).sort("createdAt", -1))

    result = []
    for job in jobs:
        job_id = str(job["_id"])
        resume_count = screening_resumes_collection.count_documents({
            "jobId": job_id,
            "userId": user_id
        })
        analyzed_count = screening_resumes_collection.count_documents({
            "jobId": job_id,
            "userId": user_id,
            "status": "analyzed"
        })

        result.append({
            "jobId": job_id,
            "jobTitle": job.get("jobTitle", ""),
            "reportType": job.get("reportType", "SUMMARY"),
            "scoringScale": job.get("scoringScale", "10"),
            "status": job.get("status", ""),
            "seniorityLevel": job.get("seniorityLevel", ""),
            "industry": job.get("industry", ""),
            "totalResumes": resume_count,
            "analyzedResumes": analyzed_count,
            "createdAt": job.get("createdAt", ""),
            "completedAt": job.get("completedAt", ""),
        })

    return jsonify({"jobs": result}), 200


# ===========================
# DELETE /api/resumes/<resumeId>
# ===========================
@resume_screening_bp.route("/resumes/<resume_id>", methods=["DELETE"])
@jwt_required()
def delete_resume(resume_id):
    """Delete a single uploaded resume and its file from disk."""
    user_id = get_jwt_identity()

    resume = screening_resumes_collection.find_one({"_id": ObjectId(resume_id), "userId": user_id})
    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    # Remove file from disk
    try:
        file_path = resume.get("path", "")
        if file_path and os.path.isfile(file_path):
            os.remove(file_path)
    except OSError:
        pass

    screening_resumes_collection.delete_one({"_id": ObjectId(resume_id)})
    return jsonify({"message": "Resume deleted"}), 200
