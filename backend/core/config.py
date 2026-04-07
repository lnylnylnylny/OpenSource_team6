from dotenv import load_dotenv
import os

load_dotenv()

KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")

DB_URL = os.getenv("DB_URL2")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24