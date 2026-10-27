from fastapi import Header, HTTPException, status
from app.core.config import settings

def verify_internal_service_key(x_internal_service_key: str = Header(..., alias="X-Internal-Service-Key")):
    """
    Validates that incoming internal requests supply the authorized shared secret key.
    """
    if x_internal_service_key != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid internal service key",
        )
    return True
