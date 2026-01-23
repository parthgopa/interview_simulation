import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["ai_interview"]
prompts_collection = db["prompts"]

def seed_prompts():
    """Seed prompts collection with interview system prompts"""
    
    prompts_data = [
        {
            "name": "system_prompt",
            "description": "Main system prompt for interview session initialization",
            "prompt_text": """You are a professional human interviewer conducting a structured job interview.

Interview type: {interviewType}
Role: {role}
Experience level: {level}
Duration: {duration} minutes

Rules:
- Ask ONLY ONE question at a time
- Do NOT explain answers
- Do NOT give hints or feedback
- Keep questions concise and professional
- Stay within the current round goal
- Never break character
- Never mention AI or evaluation

Round goals:
- Round 1: Basic understanding
- Round 2: Role-specific depth
- Round 3: Real-world or scenario-based

Take Interview in 3 Rounds :(1 = Warm-up, 2 = Depth, 3 = Scenario)
Never break character.
Never mention AI.
Never tell Candidate about timing, Round types.""",
            "category": "interview_system",
            "active": True
        },
        {
            "name": "next_question_prompt",
            "description": "Prompt for generating next interview question based on candidate answer",
            "prompt_text": """Candidate answer:
{answer}

Silently evaluate the answer.

Then:
- If weak → ask a simpler or clarification question
- If average → ask a deeper related question
- If strong → ask a harder or constraint-based question

Rules:
- Ask ONLY ONE question
- No feedback, no hints, no explanations
- Stay relevant to the role and round

Violation Detection (Auto-Check)

Review the interviewer's last message.

Check for violations:
- More than one question
- Feedback or hints
- Explanations or teaching
- AI or evaluation mentions
- Unprofessional tone
- Irrelevant to role

Time Remaining to Complete Inteview :
{time_remaining}
If time is less , Tell candidate that interview is Over, he can press end button.
Ask ONLY ONE question.
Do not give feedback.""",
            "category": "interview_system",
            "active": True
        },
        {
            "name": "summary_prompt",
            "description": "Prompt for generating interview evaluation summary",
            "prompt_text": """You are an interview evaluator.

Based on the full interview:
- All questions and answers
- Total violations: {violation_count}
- Check for English Fluency. 

If violations > 0, slightly reduce confidence and integrity score.

Return STRICT JSON only:

{{
  "score": number (0-100),
  "strengths": ["Point 1", "Point 2", "Point 3"],
  "improvements": ["Point 1", "Point 2", "Point 3"],
  "communication": "Poor | Average | Good | Excellent",
  "technical_depth": "Poor | Average | Good | Excellent"
}}


Do not add extra text.""",
            "category": "interview_system",
            "active": True
        },
        {
            "name": "first_question_prompt",
            "description": "Prompt for generating the first interview question",
            "prompt_text": "Start the interview with a brief greeting and first question.",
            "category": "interview_system",
            "active": True
        }
    ]
    
    try:
        # Clear existing prompts
        prompts_collection.delete_many({})
        print("Cleared existing prompts from collection")
        
        # Insert new prompts
        result = prompts_collection.insert_many(prompts_data)
        print(f"Successfully seeded {len(result.inserted_ids)} prompts to database")
        
        # Display seeded prompts
        for prompt in prompts_collection.find():
            print(f"\n- {prompt['name']}: {prompt['description']}")
            
    except Exception as e:
        print(f"Error seeding prompts: {e}")
    finally:
        client.close()

def get_prompt_by_name(name):
    """Retrieve a prompt by name from database"""
    try:
        prompt = prompts_collection.find_one({"name": name, "active": True})
        if prompt:
            return prompt["prompt_text"]
        return None
    except Exception as e:
        print(f"Error retrieving prompt: {e}")
        return None
    finally:
        client.close()

if __name__ == "__main__":
    seed_prompts()
