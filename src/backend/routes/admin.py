from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from config import organizations_collection, candidate_credentials_collection, scheduled_interviews_collection
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime

admin_bp = Blueprint("admin", __name__)

ADMIN_COLLECTION_NAME = "admin_users"

def get_admin_collection():
    from config import db
    return db[ADMIN_COLLECTION_NAME]

@admin_bp.route("/signup", methods=["POST"])
def admin_signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        return jsonify({"error": "Name, email and password are required"}), 400
    
    admin_collection = get_admin_collection()
    existing_admin = admin_collection.find_one({"email": email})
    
    if existing_admin:
        return jsonify({"error": "Admin email already registered"}), 409
    
    hashed_password = generate_password_hash(password)
    
    admin_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    
    result = admin_collection.insert_one(admin_user)
    
    return jsonify({"message": "Admin account created successfully"}), 201

@admin_bp.route("/login", methods=["POST"])
def admin_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"email": email})
    
    if not admin or not check_password_hash(admin["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = create_access_token(identity=str(admin["_id"]))
    
    admin_data = {
        "id": str(admin["_id"]),
        "name": admin.get("name"),
        "email": admin["email"],
        "role": "admin"
    }
    
    return jsonify({"token": token, "user": admin_data}), 200

@admin_bp.route("/me", methods=["GET"])
@jwt_required()
def get_admin_me():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    
    admin_data = {
        "id": str(admin["_id"]),
        "name": admin.get("name"),
        "email": admin["email"],
        "role": "admin"
    }
    
    return jsonify(admin_data), 200

@admin_bp.route("/organizations", methods=["GET"])
@jwt_required()
def get_all_organizations():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    organizations = list(organizations_collection.find({"role": "organization"}))
    
    org_list = []
    for org in organizations:
        created_at = org.get("created_at")
        created_at_str = None
        if created_at:
            if hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = str(created_at)
        
        org_data = {
            "id": str(org["_id"]),
            "organizationName": org.get("organizationName"),
            "contactPersonName": org.get("contactPersonName"),
            "email": org.get("email"),
            "phone": org.get("phone"),
            "industry": org.get("industry"),
            "companySize": org.get("companySize"),
            "website": org.get("website"),
            "created_at": created_at_str
        }
        
        candidate_count = candidate_credentials_collection.count_documents({
            "organizationId": str(org["_id"])
        })
        org_data["candidateCount"] = candidate_count
        
        interview_count = scheduled_interviews_collection.count_documents({
            "organizationId": str(org["_id"])
        })
        org_data["interviewCount"] = interview_count
        
        org_list.append(org_data)
    
    return jsonify({"organizations": org_list}), 200

@admin_bp.route("/candidates", methods=["GET"])
@jwt_required()
def get_all_candidates():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    candidates = list(candidate_credentials_collection.find({}))
    
    candidate_list = []
    for candidate in candidates:
        org_id = candidate.get("organizationId")
        org_name = "Unknown"
        
        if org_id:
            org = organizations_collection.find_one({"_id": ObjectId(org_id)})
            if org:
                org_name = org.get("organizationName", "Unknown")
        
        created_at = candidate.get("createdAt")
        created_at_str = None
        if created_at:
            if hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = str(created_at)
        
        candidate_data = {
            "id": str(candidate["_id"]),
            "name": candidate.get("name"),
            "email": candidate.get("email"),
            "username": candidate.get("username"),
            "organizationId": str(org_id) if org_id else None,
            "organizationName": org_name,
            "createdAt": created_at_str
        }
        
        interview_count = scheduled_interviews_collection.count_documents({
            "credentialId": str(candidate["_id"])
        })
        candidate_data["interviewCount"] = interview_count
        
        candidate_list.append(candidate_data)
    
    return jsonify({"candidates": candidate_list}), 200

@admin_bp.route("/interviews", methods=["GET"])
@jwt_required()
def get_all_interviews():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    interviews = list(scheduled_interviews_collection.find({}))
    
    interview_list = []
    for interview in interviews:
        created_at = interview.get("createdAt")
        created_at_str = None
        if created_at:
            if hasattr(created_at, 'isoformat'):
                created_at_str = created_at.isoformat()
            else:
                created_at_str = str(created_at)
        
        deadline = interview.get("deadline")
        deadline_str = None
        if deadline:
            if hasattr(deadline, 'isoformat'):
                deadline_str = deadline.isoformat()
            else:
                deadline_str = str(deadline)
        
        interview_data = {
            "id": str(interview["_id"]),
            "organizationId": interview.get("organizationId"),
            "organizationName": interview.get("organizationName"),
            "candidateName": interview.get("candidateName"),
            "candidateEmail": interview.get("candidateEmail"),
            "position": interview.get("position"),
            "schedulingType": interview.get("schedulingType"),
            "interviewType": interview.get("interviewType"),
            "duration": interview.get("duration"),
            "status": interview.get("status"),
            "completed": interview.get("completed"),
            "createdAt": created_at_str,
            "deadline": deadline_str,
            "tokens": interview.get("tokens")
        }
        interview_list.append(interview_data)
    
    return jsonify({"interviews": interview_list}), 200

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_admin_stats():
    admin_id = get_jwt_identity()
    admin_collection = get_admin_collection()
    admin = admin_collection.find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        return jsonify({"error": "Unauthorized"}), 403
    
    total_organizations = organizations_collection.count_documents({"role": "organization"})
    total_candidates = candidate_credentials_collection.count_documents({})
    total_interviews = scheduled_interviews_collection.count_documents({})
    completed_interviews = scheduled_interviews_collection.count_documents({"completed": True})
    scheduled_interviews = scheduled_interviews_collection.count_documents({"status": "scheduled"})
    
    stats = {
        "totalOrganizations": total_organizations,
        "totalCandidates": total_candidates,
        "totalInterviews": total_interviews,
        "completedInterviews": completed_interviews,
        "scheduledInterviews": scheduled_interviews
    }
    
    return jsonify(stats), 200
