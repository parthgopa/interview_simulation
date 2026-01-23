import werkzeug
from datetime import datetime

def create_user(db, data):
    hashed = werkzeug.security.generate_password_hash(data["password"])
    
    role = data.get("role", "candidate")
    
    if role == "organization":
        user = {
            "organizationName": data.get("organizationName"),
            "contactPersonName": data.get("contactPersonName"),
            "email": data["email"].lower(),
            "password": hashed,
            "phone": data.get("phone"),
            "industry": data.get("industry"),
            "companySize": data.get("companySize"),
            "website": data.get("website", ""),
            "role": "organization",
            "created_at": datetime.now()
        }
    else:
        user = {
            "name": data.get("name"),
            "email": data["email"].lower(),
            "password": hashed,
            "phone": data.get("phone", ""),
            "role": "candidate",
            "created_at": datetime.now()
        }

    return db.insert_one(user)

def find_user_by_email(db, email):
    return db.find_one({"email": email.lower()})

def find_user_by_email_and_role(db, email, role):
    return db.find_one({"email": email.lower(), "role": role})

def verify_password(password, hashed):
    return werkzeug.security.check_password_hash(hashed, password)
