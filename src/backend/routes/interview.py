from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.ai_engine_db import (
    create_session,
    next_question,
    finish_interview
)
from config import scheduled_interviews_collection, interview_results_collection
from bson import ObjectId
from datetime import datetime

interview_bp = Blueprint("interview", __name__)

@interview_bp.route("/start-interview", methods=["POST"])
@jwt_required()
def start():
    data = request.json
    print("Data:", data)
    session_id, first_q = create_session(data)
    return jsonify({
        "session_id": session_id,
        "question": first_q
    })

@interview_bp.route("/next-question", methods=["POST"])
@jwt_required()
def next_questions():
    data = request.json

    session_id = data.get("session_id")
    answer = data.get("answer")
    timeRemaining = data.get("timeRemaining")
    scheduledInterviewId = data.get("scheduledInterviewId")

    if not session_id or not answer:
        return jsonify({"error": "Invalid request"}), 400

    q = next_question(session_id, answer, timeRemaining, scheduledInterviewId)
    return jsonify({"question": q})

# @interview_bp.route("/next-question", methods=["POST"])
# def next_q():
#     data = request.json

#     if not data.get("session_id"):
#         return jsonify({"question": "Invalid session. Restart interview."}), 400

#     q = next_question(data["session_id"], data["answer"])
#     return jsonify({ "question": q })
5

@interview_bp.route("/end-interview", methods=["POST"])
@jwt_required()
def end():
    data = request.json
    current_user = get_jwt_identity()
    
    if not data or not data.get("session_id"):
        return jsonify({"error": "Session ID required"}), 400

    scheduledInterviewId = data.get("scheduledInterviewId")
    credentialId = data.get("credentialId")
    
    feedback = finish_interview(data["session_id"], scheduledInterviewId)
    
    

    
    # Save interview results to database
    try:
        result_doc = {
            "candidateId": current_user,
            "credentialId": credentialId,
            "scheduledInterviewId": scheduledInterviewId,
            "score": feedback.get("score", 0),
            "strengths": feedback.get("strengths", []),
            "improvements": feedback.get("improvements", []),
            "communication": feedback.get("communication", "Average"),
            "technical_depth": feedback.get("technical_depth", "Average"),
            "qa_pairs": feedback.get("qa_pairs", []),
            "raw_result": feedback.get("raw_result", ""),
            "completed_at": datetime.utcnow(),
            "published": False
        }
        
        interview_results_collection.insert_one(result_doc)
        print(f"Interview results saved for candidate: {current_user}")
    except Exception as e:
        print(f"Error saving interview results: {e}")
    
    # Mark interview as completed
    if scheduledInterviewId:
        try:
            scheduled_interviews_collection.update_one(
                {"_id": ObjectId(scheduledInterviewId)},
                {"$set": {"completed": True, "completedAt": datetime.utcnow()}}
            )
        except Exception as e:
            print(f"Error marking interview as completed: {e}")
    
    return jsonify(feedback)
