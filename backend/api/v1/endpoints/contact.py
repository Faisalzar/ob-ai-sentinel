from fastapi import APIRouter, HTTPException, status
from backend.schemas.contact import ContactCreate
from backend.services.email_service import email_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/contact", status_code=status.HTTP_200_OK)
async def submit_contact_form(contact_data: ContactCreate):
    """
    Submit a contact form message.
    The message will be emailed to the administrator.
    """
    try:
        success = await email_service.send_contact_email(
            name=contact_data.name,
            email=contact_data.email,
            subject=contact_data.subject,
            message=contact_data.message,
            organization=contact_data.organization
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to send message. Please try again later."
            )
            
        return {"message": "Message sent successfully"}
        
    except Exception as e:
        logger.error(f"Error submitting contact form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred"
        )
