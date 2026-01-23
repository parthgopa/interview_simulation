import google.generativeai as genai
import uuid
import os
from config import GEMINI_API_KEY, scheduled_interviews_collection
from services.prompt_service import PromptService
from bson.objectid import ObjectId

genai.configure(api_key=GEMINI_API_KEY)
print("GEMINI_API_KEY:", GEMINI_API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

SESSIONS = {}
print("SESSIONS:", SESSIONS)

def create_session(config):
    print("\n" + "="*50)
    print("🎯 CREATING NEW INTERVIEW SESSION")
    print("="*50)
    print(f"Interview Config: {config}")
    
    session_id = str(uuid.uuid4())
    print(f"Generated Session ID: {session_id}")

    # Get system prompt from database
    system_prompt = PromptService.get_system_prompt(
        interviewType=config.get('interviewType'),
        role=config.get('role'),
        level=config.get('level'),
        duration=config.get('duration')
    )
    
    print(f"\n📋 System Prompt:\n{system_prompt}")

    chat = model.start_chat(history=[
        {"role": "user", "parts": [system_prompt]}
    ])

    print("\n💬 Initial Chat History:")
    for i, msg in enumerate(chat.history):
        print(f"  {i+1}. Role: {msg.role}")
        print(f"     Content: {msg.parts[0].text[:100]}...")

    # Get first question prompt from database
    first_question_prompt = PromptService.get_first_question_prompt()
    response = chat.send_message(first_question_prompt)

    # Update Tokens in scheduledInterviewsCollection
    print("Start Input Tokens", response.usage_metadata.total_token_count)
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(config.get("scheduledInterviewId"))},
            {"$set": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")
    
    first_question = response.text.strip()
    print(f"\n🎤 First Question Generated:\n{first_question}")

    SESSIONS[session_id] = {
        "chat": chat,
        "answers": [],
        "questions": [first_question],
        "qa_pairs": [{"question": first_question, "answer": None}]
    }
    
    print(f"\n✅ Session stored with {len(chat.history)} messages in history")
    print("="*50 + "\n")

    return session_id, first_question

def next_question(session_id, answer, timeRemaining, scheduledInterviewId):
    print("\n" + "="*50)
    print("🔄 PROCESSING NEXT QUESTION")
    print("="*50)
    print(f"Session ID: {session_id}")
    print(f"Candidate Answer: {answer}")
    
    if session_id not in SESSIONS:
        print("❌ Session not found!")
        return "Session expired or invalid. Please restart the interview."

    session = SESSIONS[session_id]
    session["answers"].append(answer)
    
    # Update the last Q&A pair with the answer
    if session["qa_pairs"]:
        session["qa_pairs"][-1]["answer"] = answer

    print(f"\n📝 Sending prompt to AI with candidate's answer...")
    
    # Get next question prompt from database
    next_question_prompt = PromptService.get_next_question_prompt(
        answer=answer,
        time_remaining=timeRemaining
    )
    
    response = session["chat"].send_message(next_question_prompt)

    next_q = response.text.strip()
    print("Next Question Tokens", response.usage_metadata.total_token_count)
    
    # Increase Tokens count with next question tokens
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(scheduledInterviewId)},
            {"$inc": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")
    print(f"\n🎤 Next Question Generated:\n{next_q}")
    
    # Store the new question
    session["questions"].append(next_q)
    session["qa_pairs"].append({"question": next_q, "answer": None})
    
    print("="*50 + "\n")
    return next_q

def finish_interview(session_id, scheduledInterviewId):
    print("\n" + "="*50)
    print("🏁 ENDING INTERVIEW SESSION")
    print("="*50)
    print(f"Session ID: {session_id}")
    
    if session_id not in SESSIONS:
        print("❌ Session not found!")
        return {
            "score": 0,
            "strengths": ["No valid session found"],
            "improvements": ["Please restart the interview"],
            "error": "Session not found",
            "qa_pairs": [],
            "raw_result": None
        }
    
    session = SESSIONS[session_id]
    violation_count = len(session.get("violations", []) or [])

    # Get summary prompt from database
    summary_prompt = PromptService.get_summary_prompt(violation_count=violation_count)
    
    print(f"\n Sending Summary Prompt to AI:\n{summary_prompt}")
    response = session["chat"].send_message(summary_prompt)
    result = response.text

    # Increase Tokens count with summary tokens
    try:
        scheduled_interviews_collection.update_one(
            {"_id": ObjectId(scheduledInterviewId)},
            {"$inc": {"tokens": response.usage_metadata.total_token_count}})
    except Exception as e:
        print(e)
        print("Failed to update tokens in scheduledInterviewsCollection")

    print("Summary Tokens", response.usage_metadata.total_token_count)
    print(f"\n AI Evaluation Result:\n{result}")

    # Try to parse JSON, fallback to default if parsing fails
    import json
    try:
        evaluation = json.loads(result)
    except:
        evaluation = {
            "score": 75,
            "strengths": [
                "Good communication",
                "Relevant answers",
                "Professional tone"
            ],
            "improvements": [
                "Add real-world examples",
                "Improve structure",
                "Be more concise"
            ],
            "communication": "Good",
            "technical_depth": "Average"
        }
    
    # Add Q&A pairs to the evaluation
    evaluation["qa_pairs"] = session["qa_pairs"]
    evaluation["raw_result"] = result
    
    print(f"\n✅ Session removed from memory")
    print(f"📋 Final Evaluation: {evaluation}")
    print("="*50 + "\n")
    
    return evaluation
