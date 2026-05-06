from fastapi import APIRouter

router = APIRouter(prefix="/stocks", tags=["stocks"])

@router.get('/')
def get_index():
    return {'status': 200, 'message': 'OK'}
