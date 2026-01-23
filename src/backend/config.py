import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# Environment Variables
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# MongoDB connection
client = MongoClient(MONGO_URI)
print(MONGO_URI)
print("MongoDB connection successful")
db = client["interview"]
# print(db)
users_collection = db["users"]
interviews_collection = db["interviews"]
candidate_interview = db["candidate_interview"]
candidate_credentials_collection = db["candidate_credentials"]
scheduled_interviews_collection = db["scheduled_interviews"]
interview_results_collection = db["interview_results"]
prompts_collection = db["prompts"]

# If any critical variable is not loaded, print an error message and exit
if not MONGO_URI or not JWT_SECRET_KEY or not GEMINI_API_KEY:
    print("Error: Critical environment variables not loaded.")
    exit(1)
else:
    print("All critical environment variables loaded successfully.")

