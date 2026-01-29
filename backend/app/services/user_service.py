import time
import uuid
from typing import List, Optional
from app.models import User, UserRole

# 模拟数据库
MOCK_USERS_DB = [
    User(username="admin", role=UserRole.admin, token="admin-token"),
    User(username="operator", role=UserRole.operator, token="op-token"),
    User(username="observer", role=UserRole.observer, token="obs-token"),
]

class UserService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(UserService, cls).__new__(cls)
            cls._instance.users = MOCK_USERS_DB
            # 确保默认admin存在
            if not any(u.username == "admin" for u in cls._instance.users):
                 cls._instance.users.append(User(username="admin", role=UserRole.admin, token="admin-token"))
        return cls._instance

    def get_all_users(self) -> List[User]:
        return self.users

    def get_user_by_username(self, username: str) -> Optional[User]:
        return next((u for u in self.users if u.username == username), None)

    def create_user(self, user: User) -> User:
        if self.get_user_by_username(user.username):
            raise ValueError(f"User {user.username} already exists")
        
        # 简单处理：如果没提供token，生成一个
        if not user.token:
            user.token = str(uuid.uuid4())
            
        self.users.append(user)
        return user

    def update_user(self, username: str, user_update: User) -> Optional[User]:
        user = self.get_user_by_username(username)
        if not user:
            return None
        
        # 更新字段
        user.role = user_update.role
        # user.token = user_update.token #通常不更新token除非重置
        
        return user

    def delete_user(self, username: str) -> bool:
        user = self.get_user_by_username(username)
        if not user:
            return False
        if user.username == "admin":
             raise ValueError("Cannot delete default admin")
             
        self.users.remove(user)
        return True

    def authenticate(self, username: str, password: str) -> Optional[User]:
        """
        验证用户登录
        演示模式：密码只需要和用户名相同，或者固定 '123456'
        """
        user = self.get_user_by_username(username)
        if not user:
            return None
            
        # 简单验证逻辑
        if password == user.username or password == "123456":
            # 生成新 session token
            user.token = str(uuid.uuid4())
            return user
        return None

    def login(self, username: str, password: str) -> Optional[User]:
        """保留 login 方法作为别名或向下兼容"""
        return self.authenticate(username, password)
