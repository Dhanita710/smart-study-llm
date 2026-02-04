from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import firebase_admin
from firebase_admin import auth as firebase_auth, firestore
import random

router = APIRouter(prefix="/api/study-buddy", tags=["study-buddy"])

# Initialize Firestore client
db = firestore.client()

# Pydantic Models
class BuddyRequest(BaseModel):
    buddyId: str
    message: Optional[str] = ""

class StudyPreferences(BaseModel):
    subject: str = "General"
    level: str = "Intermediate"
    availability: str = "Weekdays"
    studyStyle: str = "Collaborative"

class BuddyInfo(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    level: str
    availability: str
    studyStyle: str
    online: bool
    matchScore: int

class PendingRequest(BaseModel):
    id: str
    fromUserId: str
    fromUserName: str
    fromUserEmail: str
    message: str
    subject: str

class MyBuddy(BaseModel):
    id: str
    name: str
    email: str
    subject: str
    online: bool

# Dependency to verify Firebase token
async def verify_token(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = authorization.replace("Bearer ", "")
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# Get all available study buddies (excluding current user)
@router.get("/available")
async def get_available_buddies(current_user: dict = Depends(verify_token)):
    try:
        current_user_id = current_user['uid']
        current_user_email = current_user.get('email', '')
        
        # Get all users from Firestore
        users_ref = db.collection('users')
        users = users_ref.stream()
        
        available_buddies = []
        for user in users:
            user_data = user.to_dict()
            if user.id != current_user_id:  # Exclude current user
                study_prefs = user_data.get('studyPreferences', {})
                buddy_info = {
                    'id': user.id,
                    'name': user_data.get('name', user_data.get('email', '').split('@')[0]),
                    'email': user_data.get('email', ''),
                    'subject': study_prefs.get('subject', 'General'),
                    'level': study_prefs.get('level', 'Intermediate'),
                    'availability': study_prefs.get('availability', 'Weekdays'),
                    'studyStyle': study_prefs.get('studyStyle', 'Collaborative'),
                    'online': user_data.get('online', False),
                    'matchScore': random.randint(75, 98)  # Simulated match score
                }
                available_buddies.append(buddy_info)
        
        # Sort by match score
        available_buddies.sort(key=lambda x: x['matchScore'], reverse=True)
        
        return {"buddies": available_buddies}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Send study buddy request
@router.post("/request")
async def send_buddy_request(
    request_data: BuddyRequest,
    current_user: dict = Depends(verify_token)
):
    try:
        current_user_id = current_user['uid']
        current_user_email = current_user.get('email', '')
        
        buddy_id = request_data.buddyId
        message = request_data.message
        
        if not buddy_id:
            raise HTTPException(status_code=400, detail="Buddy ID required")
        
        # Create request in Firestore
        request_ref = db.collection('buddy_requests').document()
        request_data_dict = {
            'fromUserId': current_user_id,
            'fromUserEmail': current_user_email,
            'toUserId': buddy_id,
            'message': message,
            'status': 'pending',
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        request_ref.set(request_data_dict)
        
        return {
            'success': True,
            'message': 'Request sent successfully',
            'requestId': request_ref.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get pending requests for current user
@router.get("/requests")
async def get_buddy_requests(current_user: dict = Depends(verify_token)):
    try:
        current_user_id = current_user['uid']
        
        # Get incoming requests
        requests_ref = db.collection('buddy_requests').where('toUserId', '==', current_user_id).where('status', '==', 'pending')
        requests = requests_ref.stream()
        
        pending_requests = []
        for req in requests:
            req_data = req.to_dict()
            # Get sender info
            sender_ref = db.collection('users').document(req_data['fromUserId'])
            sender = sender_ref.get()
            sender_data = sender.to_dict() if sender.exists else {}
            
            study_prefs = sender_data.get('studyPreferences', {})
            pending_requests.append({
                'id': req.id,
                'fromUserId': req_data['fromUserId'],
                'fromUserName': sender_data.get('name', req_data.get('fromUserEmail', '').split('@')[0]),
                'fromUserEmail': req_data.get('fromUserEmail', ''),
                'message': req_data.get('message', ''),
                'createdAt': req_data.get('createdAt'),
                'subject': study_prefs.get('subject', 'General')
            })
        
        return {"requests": pending_requests}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Accept buddy request
@router.post("/accept/{request_id}")
async def accept_buddy_request(
    request_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        current_user_id = current_user['uid']
        
        # Get request document
        request_ref = db.collection('buddy_requests').document(request_id)
        request_doc = request_ref.get()
        
        if not request_doc.exists:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request_data = request_doc.to_dict()
        
        # Verify this request is for current user
        if request_data['toUserId'] != current_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Update request status
        request_ref.update({
            'status': 'accepted',
            'updatedAt': datetime.now()
        })
        
        # Create buddy connection in both users' collections
        connection_data = {
            'createdAt': datetime.now(),
            'lastInteraction': datetime.now()
        }
        
        # Add to current user's buddies
        db.collection('users').document(current_user_id).collection('buddies').document(request_data['fromUserId']).set(connection_data)
        
        # Add to sender's buddies
        db.collection('users').document(request_data['fromUserId']).collection('buddies').document(current_user_id).set(connection_data)
        
        return {'success': True, 'message': 'Request accepted'}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Decline buddy request
@router.post("/decline/{request_id}")
async def decline_buddy_request(
    request_id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        current_user_id = current_user['uid']
        
        # Get request document
        request_ref = db.collection('buddy_requests').document(request_id)
        request_doc = request_ref.get()
        
        if not request_doc.exists:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request_data = request_doc.to_dict()
        
        if request_data['toUserId'] != current_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        request_ref.update({
            'status': 'declined',
            'updatedAt': datetime.now()
        })
        
        return {'success': True, 'message': 'Request declined'}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get current user's buddies
@router.get("/my-buddies")
async def get_my_buddies(current_user: dict = Depends(verify_token)):
    try:
        current_user_id = current_user['uid']
        
        # Get user's buddies
        buddies_ref = db.collection('users').document(current_user_id).collection('buddies')
        buddies = buddies_ref.stream()
        
        my_buddies = []
        for buddy in buddies:
            buddy_id = buddy.id
            buddy_data = buddy.to_dict()
            
            # Get buddy's full info
            user_ref = db.collection('users').document(buddy_id)
            user = user_ref.get()
            user_data = user.to_dict() if user.exists else {}
            
            study_prefs = user_data.get('studyPreferences', {})
            my_buddies.append({
                'id': buddy_id,
                'name': user_data.get('name', user_data.get('email', '').split('@')[0]),
                'email': user_data.get('email', ''),
                'subject': study_prefs.get('subject', 'General'),
                'online': user_data.get('online', False),
                'lastInteraction': buddy_data.get('lastInteraction'),
                'connectedSince': buddy_data.get('createdAt')
            })
        
        return {"buddies": my_buddies}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update user study preferences
@router.post("/preferences")
async def update_preferences(
    preferences: StudyPreferences,
    current_user: dict = Depends(verify_token)
):
    try:
        current_user_id = current_user['uid']
        
        preferences_dict = {
            'subject': preferences.subject,
            'level': preferences.level,
            'availability': preferences.availability,
            'studyStyle': preferences.studyStyle
        }
        
        # Update user preferences
        user_ref = db.collection('users').document(current_user_id)
        user_ref.update({
            'studyPreferences': preferences_dict,
            'updatedAt': datetime.now()
        })
        
        return {'success': True, 'preferences': preferences_dict}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))