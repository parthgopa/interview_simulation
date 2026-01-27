from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from config import organizations_collection, candidate_credentials_collection, scheduled_interviews_collection, interview_results_collection
from bson import ObjectId
from datetime import datetime, timedelta
import os
import secrets
import string
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
from config import interviews_collection

organization_bp = Blueprint("organization", __name__)

UPLOAD_FOLDER = "uploads/resumes"
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_password(length=10):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def generate_username(name, email):
    base = name.lower().replace(" ", "")[:8]
    random_suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
    return f"{base}{random_suffix}"

@organization_bp.route("/schedule-interview", methods=["POST"])
@jwt_required()
def schedule_interview():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    
    required_fields = ["candidateName", "candidateEmail", "position", "schedulingType", "interviewType", "duration"]
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    
    candidate_name = data["candidateName"]
    candidate_email = data["candidateEmail"]
    
    existing_credential = candidate_credentials_collection.find_one({"email": candidate_email})
    
    if existing_credential:
        username = existing_credential["username"]
        password = existing_credential["plainPassword"]
        credential_id = str(existing_credential["_id"])
    else:
        username = generate_username(candidate_name, candidate_email)
        password = generate_password()
        
        credential_doc = {
            "name": candidate_name,
            "email": candidate_email,
            "username": username,
            "password": generate_password_hash(password),
            "plainPassword": password,
            "createdAt": datetime.now(),
            "organizationId": user_id
        }
        credential_result = candidate_credentials_collection.insert_one(credential_doc)
        credential_id = str(credential_result.inserted_id)
    
    scheduled_interview = {
        "organizationId": user_id,
        "organizationName": user.get("organizationName"),
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "credentialId": credential_id,
        "position": data["position"],
        "schedulingType": data["schedulingType"],
        "interviewType": data["interviewType"],
        "duration": data["duration"],
        "notes": data.get("notes", ""),
        "status": "scheduled",
        "completed": False,
        "createdAt": datetime.now()
    }
    
    if data["schedulingType"] == "specific":
        if not data.get("specificDate") or not data.get("specificTime"):
            return jsonify({"error": "Specific date and time required"}), 400
        scheduled_interview["scheduledDate"] = f"{data['specificDate']} {data['specificTime']}"
    elif data["schedulingType"] == "timer":
        if not data.get("daysTimer"):
            return jsonify({"error": "Days timer required"}), 400
        scheduled_interview["daysTimer"] = data["daysTimer"]
        scheduled_interview["deadline"] = datetime.now() + timedelta(days=int(data["daysTimer"]))
    
    result = scheduled_interviews_collection.insert_one(scheduled_interview)
    
    interviews_collection.insert_one({
        "organizationId":   user_id,
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "position": data["position"],
        "interviewType": data["interviewType"],
        "status": "scheduled",
        "createdAt": datetime.now()
    })

    #Email the credentials to the candidate
    from services.email_config import send_general_email
    from services.email_templates import get_interview_credentials_template
    # 2. Generate the HTML using the template
    schedule_info = "Specific Date and Time" if data["schedulingType"] == "specific" else f"{data['daysTimer']} days from now"
    login_url = "https://yourportal.com/login" # Change to your real URL
    html_body = get_interview_credentials_template(
        candidate_name=candidate_name,
        position=data["position"],
        username=username,
        password=password,
        login_url=login_url,
        schedule_info=schedule_info
    )

    # 3. Send the Email
    subject = f"Interview Credentials for {data['position']}"
    plain_text = f"Hello {candidate_name}, your interview is scheduled. Username: {username}, Password: {password}"
    
    send_general_email(
        subject=subject,
        recipient_email=candidate_email,
        body=plain_text,
        html_content=html_body
    )
    
    return jsonify({
        "message": "Interview scheduled successfully",
        "interviewId": str(result.inserted_id),
        "credentials": {
            "username": username,
            "password": password,
            "email": candidate_email
        }
    }), 201

@organization_bp.route("/schedule-interview-resume", methods=["POST"])
@jwt_required()
def schedule_interview_resume():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    if "resume" not in request.files:
        return jsonify({"error": "No resume file uploaded"}), 400
    
    file = request.files["resume"]
    
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PDF, DOC, DOCX allowed"}), 400
    
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    data = request.form
    candidate_name = data.get("candidateName", "Resume Candidate")
    candidate_email = data.get("candidateEmail", "")
    
    if not candidate_email:
        return jsonify({"error": "Candidate email is required"}), 400
    
    existing_credential = candidate_credentials_collection.find_one({"email": candidate_email})
    
    if existing_credential:
        username = existing_credential["username"]
        password = existing_credential["plainPassword"]
        credential_id = str(existing_credential["_id"])
    else:
        username = generate_username(candidate_name, candidate_email)
        password = generate_password()
        
        credential_doc = {
            "name": candidate_name,
            "email": candidate_email,
            "username": username,
            "password": generate_password_hash(password),
            "plainPassword": password,
            "createdAt": datetime.now()
        }
        credential_result = candidate_credentials_collection.insert_one(credential_doc)
        credential_id = str(credential_result.inserted_id)
    
    scheduled_interview = {
        "organizationId": user_id,
        "organizationName": user.get("organizationName"),
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "credentialId": credential_id,
        "resumePath": filepath,
        "position": data.get("position"),
        "schedulingType": data.get("schedulingType"),
        "interviewType": data.get("interviewType"),
        "duration": int(data.get("duration", 30)),
        "notes": data.get("notes", ""),
        "status": "scheduled",
        "completed": False,
        "createdAt": datetime.now()
    }
    
    if data.get("schedulingType") == "specific":
        scheduled_interview["scheduledDate"] = f"{data.get('specificDate')} {data.get('specificTime')}"
    elif data.get("schedulingType") == "timer":
        scheduled_interview["daysTimer"] = int(data.get("daysTimer", 2))
        scheduled_interview["deadline"] = datetime.now() + timedelta(days=int(data.get("daysTimer", 2)))
    
    result = scheduled_interviews_collection.insert_one(scheduled_interview)
    
    interviews_collection.insert_one({
        "organizationId": user_id,
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "position": data.get("position"),
        "interviewType": data.get("interviewType"),
        "status": "scheduled",
        "createdAt": datetime.now()
    })
    
    return jsonify({
        "message": "Interview scheduled successfully with resume",
        "interviewId": str(result.inserted_id),
        "credentials": {
            "username": username,
            "password": password,
            "email": candidate_email
        }
    }), 201

@organization_bp.route("/interviews", methods=["GET"])
@jwt_required()
def get_interviews():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403

    scheduled_interviews = list(scheduled_interviews_collection.find({ "organizationId": user_id }))
    
    interviews_with_credentials = []
    for interview in scheduled_interviews:
        credential = candidate_credentials_collection.find_one({"_id": ObjectId(interview.get("credentialId"))})
        
        interview_data = {
            "_id": str(interview["_id"]),
            "candidateName": interview.get("candidateName"),
            "candidateEmail": interview.get("candidateEmail"),
            "position": interview.get("position"),
            "interviewType": interview.get("interviewType"),
            "duration": interview.get("duration"),
            "notes": interview.get("notes"),
            "status": "completed" if interview.get("completed") else "scheduled",
            "daysTimer": interview.get("daysTimer"),
            "scheduledDate": interview.get("scheduledDate"),
            "completed": interview.get("completed")
        }
        
        if credential:
            interview_data["username"] = credential.get("username")
            interview_data["password"] = credential.get("plainPassword")
        
        if "createdAt" in interview:
            interview_data["createdAt"] = interview["createdAt"].isoformat()
        if "deadline" in interview:
            interview_data["deadline"] = interview["deadline"].isoformat()
        
        interviews_with_credentials.append(interview_data)
    
    return jsonify({"interviews": interviews_with_credentials}), 200

@organization_bp.route("/interviews/<interview_id>", methods=["PUT"])
@jwt_required()
def update_interview(interview_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    
    try:
        # Build update document
        update_fields = {
            "candidateName": data.get("candidateName"),
            "candidateEmail": data.get("candidateEmail"),
            "position": data.get("position"),
            "interviewType": data.get("interviewType"),
            "duration": data.get("duration"),
            "notes": data.get("notes", ""),
            "schedulingType": data.get("schedulingType")
        }
        
        # Handle scheduling type specific fields
        if data.get("schedulingType") == "specific":
            if data.get("specificDate") and data.get("specificTime"):
                update_fields["scheduledDate"] = f"{data['specificDate']} {data['specificTime']}"
            update_fields["daysTimer"] = None
            if "deadline" in scheduled_interviews_collection.find_one({"_id": ObjectId(interview_id)}) or {}:
                update_fields["deadline"] = None
        elif data.get("schedulingType") == "timer":
            if data.get("daysTimer"):
                update_fields["daysTimer"] = int(data["daysTimer"])
                update_fields["deadline"] = datetime.now() + timedelta(days=int(data["daysTimer"]))
            update_fields["scheduledDate"] = None
        
        # Update the interview
        result = scheduled_interviews_collection.update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": update_fields}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            return jsonify({"message": "Interview updated successfully"}), 200
        else:
            return jsonify({"error": "Interview not found"}), 404
    except Exception as e:
        print(f"Error updating interview: {e}")
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/interviews/<interview_id>", methods=["DELETE"])
@jwt_required()
def delete_interview(interview_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        result = scheduled_interviews_collection.delete_one({"_id": ObjectId(interview_id)})
        
        if result.deleted_count > 0:
            interviews_collection.delete_many({"candidateEmail": {"$exists": True}})
            return jsonify({"message": "Interview deleted successfully"}), 200
        else:
            return jsonify({"error": "Interview not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/candidates", methods=["GET"])
@jwt_required()
def get_candidates():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    from config import db
    interviews_collection = db["interviews"]
    
    interviews = list(interviews_collection.find({"organizationId": user_id}))
    
    candidates_dict = {}
    for interview in interviews:
        email = interview.get("candidateEmail")
        if email:
            if email not in candidates_dict:
                candidates_dict[email] = {
                    "name": interview.get("candidateName"),
                    "email": email,
                    "position": interview.get("position"),
                    "interviewCount": 0,
                    "status": "active"
                }
            candidates_dict[email]["interviewCount"] += 1
    
    candidates = list(candidates_dict.values())
    
    return jsonify({"candidates": candidates}), 200

@organization_bp.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    
    update_fields = {}
    allowed_fields = ["organizationName", "contactPersonName", "phone", "industry", "companySize", "website"]
    
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]
    
    if update_fields:
        organizations_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_fields}
        )
    
    return jsonify({"message": "Profile updated successfully"}), 200

@organization_bp.route("/candidates-list", methods=["GET"])
@jwt_required()
def get_candidates_list():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    candidates = list(candidate_credentials_collection.find({"organizationId": user_id }))
    print(candidates)
    candidates_list = []
    for candidate in candidates:
        candidates_list.append({
            "_id": str(candidate["_id"]),
            "name": candidate.get("name"),
            "email": candidate.get("email")
        })
    
    return jsonify({"candidates": candidates_list}), 200

@organization_bp.route("/add-candidate", methods=["POST"])
@jwt_required()
def add_candidate():
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.json
    
    required_fields = ["name", "email"]
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    
    candidate_name = data["name"]
    candidate_email = data["email"]
    
    existing_credential = candidate_credentials_collection.find_one({"email": candidate_email})
    if existing_credential:
        return jsonify({"error": "Candidate with this email already exists"}), 409
    
    username = generate_username(candidate_name, candidate_email)
    password = generate_password()
    
    credential_doc = {
        "name": candidate_name,
        "email": candidate_email,
        "username": username,
        "password": generate_password_hash(password),
        "plainPassword": password,
        "createdAt": datetime.now()
    }
    
    result = candidate_credentials_collection.insert_one(credential_doc)
    
    return jsonify({
        "message": "Candidate added successfully",
        "candidate": {
            "_id": str(result.inserted_id),
            "name": candidate_name,
            "email": candidate_email
        }
    }), 201

@organization_bp.route("/interview-results/<interview_id>", methods=["GET"])
@jwt_required()
def get_interview_results(interview_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        # Find the interview result by scheduled interview ID
        result = interview_results_collection.find_one({"scheduledInterviewId": interview_id})
        
        if not result:
            return jsonify({"error": "Interview results not found"}), 404
        
        # Get candidate details
        scheduled_interview = scheduled_interviews_collection.find_one({"_id": ObjectId(interview_id)})
        
        result_data = {
            "_id": str(result["_id"]),
            "candidateName": scheduled_interview.get("candidateName") if scheduled_interview else "Unknown",
            "candidateEmail": scheduled_interview.get("candidateEmail") if scheduled_interview else "Unknown",
            "position": scheduled_interview.get("position") if scheduled_interview else "Unknown",
            "score": result.get("score", 0),
            "strengths": result.get("strengths", []),
            "improvements": result.get("improvements", []),
            "communication": result.get("communication", "Average"),
            "technical_depth": result.get("technical_depth", "Average"),
            "qa_pairs": result.get("qa_pairs", []),
            "completed_at": result.get("completed_at").isoformat() if result.get("completed_at") else None,
            "published": result.get("published", False)
        }
        
        return jsonify(result_data), 200
    except Exception as e:
        print(f"Error fetching interview results: {e}")
        return jsonify({"error": str(e)}), 500

@organization_bp.route("/interview-results/<interview_id>/publish", methods=["POST"])
@jwt_required()
def publish_interview_results(interview_id):
    user_id = get_jwt_identity()
    user = organizations_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user or user.get("role") != "organization":
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        # Update the published status
        result = interview_results_collection.update_one(
            {"scheduledInterviewId": interview_id},
            {"$set": {"published": True, "publishedAt": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            return jsonify({"message": "Results published successfully"}), 200
        else:
            return jsonify({"error": "Interview results not found or already published"}), 404
    except Exception as e:
        print(f"Error publishing interview results: {e}")
        return jsonify({"error": str(e)}), 500
