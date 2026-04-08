import requests
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from core.config import KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI, KAKAO_CLIENT_SECRET
from core.jwt import create_access_token
from database import get_db
from model.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/kakao")
def kakao_callback(code: str, db: Session = Depends(get_db)):

    # 인가코드 -> 액세스 토큰
    token_res = requests.post(
        "https://kauth.kakao.com/oauth/token",
        headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
        data={
            "grant_type":    "authorization_code",
            "client_id":     KAKAO_REST_API_KEY,
            "redirect_uri":  KAKAO_REDIRECT_URI,
            "code":          code,
            "client_secret": KAKAO_CLIENT_SECRET,
        },
    )

    if token_res.status_code != 200:
        body = token_res.json()
        raise HTTPException(
            status_code=400,
            detail={"error": body.get("error"), "desc": body.get("error_description")},
        )


    # 액세스 토큰 -> 유저 정보
    user_res = requests.get(
        "https://kapi.kakao.com/v2/user/me",
        headers={"Authorization": f"Bearer {token_res.json()['access_token']}"},
    )

    if user_res.status_code != 200:
        raise HTTPException(status_code=400, detail="카카오 사용자 정보 요청 실패")

    kakao_user = user_res.json()
    provider_id = str(kakao_user["id"])
    email = kakao_user.get("kakao_account", {}).get("email")
    nickname = kakao_user.get("properties", {}).get("nickname")
    profile_image = kakao_user.get("properties", {}).get("profile_image")

    # DB 조회 & 신규 가입
    user = (
        db.query(User)
        .filter(User.provider == "kakao", User.provider_id == provider_id)
        .first()
    )

    if not user:
        user = User(
            provider="kakao",
            provider_id=provider_id,
            email=email,
            nickname=nickname,
            profile_image=profile_image,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # JWT 발급 후 반환
    return {
        "access_token": create_access_token(user.id),
        "token_type":   "bearer",
        "user": {
            "id": user.id,
            "nickname": user.nickname,
            "email": user.email,
            "profile_image": user.profile_image,
        },
    }