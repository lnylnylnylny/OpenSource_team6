import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from core.jwt import get_current_user
from database import get_db
from model.user import User

router = APIRouter(prefix="/users", tags=["users"])
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

UPLOAD_DIR = Path("static/profiles")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB

@router.patch("/me")
async def update_profile(
    nickname: str | None = Form(None),
    profile_image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if nickname is not None:
        current_user.nickname = nickname

    if profile_image is not None:
        # 파일 타입 검증
        if profile_image.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="jpg, png, webp만 업로드 가능합니다.")

        # 파일 크기 검증
        contents = await profile_image.read()
        if len(contents) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="파일 크기는 5MB 이하여야 합니다.")

        ext = Path(profile_image.filename).suffix
        filename = f"{uuid.uuid4()}{ext}"
        save_path = UPLOAD_DIR / filename

        with save_path.open("wb") as f:
            f.write(contents)

        current_user.profile_image = f"{BASE_URL}/static/profiles/{filename}"

    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "nickname": current_user.nickname,
        "email": current_user.email,
        "profile_image": current_user.profile_image,
    }

@router.delete("/me", status_code=204)
def delete_account(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.delete(current_user)
    db.commit()