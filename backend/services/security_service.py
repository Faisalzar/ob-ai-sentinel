from sqlalchemy.orm import Session
from backend.models.models import AuditLog
import uuid

def log_admin_action(
    db: Session,
    user_id: uuid.UUID,
    action: str,
    resource: str = None,
    status: str = "success",
    meta: dict = None,
    ip_address: str = None
):
    """
    Log an admin action to the audit_logs table.
    """
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            status=status,
            meta=meta,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"Failed to write audit log: {e}")
        # Don't raise, as logging failure shouldn't block the action
