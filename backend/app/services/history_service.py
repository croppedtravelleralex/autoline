"""
历史数据服务 - 基于 SQLite 数据库
"""

import sqlite3
import time
import os
import threading
from typing import Dict, List, Tuple, Literal, Optional

class HistoryService:
    """
    历史数据服务 (SQLite版)
    
    使用 SQLite 存储历史数据，解决内存占用和 JSON 加载慢的问题。
    """
    
    # 数据库文件路径 (backend/mes_data/history.db)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DB_PATH = os.path.join(BASE_DIR, "mes_data", "history.db")
    
    # 数据保留时长（24小时）
    RETENTION_PERIOD = 24 * 3600
    
    def __init__(self):
        # 确保目录存在
        os.makedirs(os.path.dirname(self.DB_PATH), exist_ok=True)
        
        # 初始化数据库
        self._init_db()
        
        # 线程锁仅用于保护不可重入的操作（SQLite本身对多线程支持尚可，但建议每个线程使用独立连接或串行访问）
        # 这里我们使用简单的模式：每次操作打开新连接，利用SQLite的锁机制
        self._lock = threading.RLock()
        
        # 启动清理线程
        self._cleanup_running = False
        self._cleanup_thread: Optional[threading.Thread] = None
        self.start_cleanup_thread()

    def _get_conn(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.DB_PATH,  check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """初始化数据库表结构"""
        with self._get_conn() as conn:
            # 创建主表
            conn.execute("""
                CREATE TABLE IF NOT EXISTS history_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_id TEXT NOT NULL,
                    metric TEXT NOT NULL,
                    timestamp REAL NOT NULL,
                    value REAL NOT NULL
                )
            """)
            
            # 创建快照表
            conn.execute("""
                CREATE TABLE IF NOT EXISTS snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    snapshot_data TEXT NOT NULL
                )
            """)
            
            # 创建索引加速查询
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_entity_metric_time 
                ON history_data (entity_id, metric, timestamp)
            """)
            
            # 创建时间戳索引用于清理
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp 
                ON history_data (timestamp)
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_snap_timestamp ON snapshots (timestamp)")
            
            # 创建事件表 (Event Markers)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS system_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    level TEXT NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_event_timestamp ON system_events (timestamp)")
            
            conn.commit()

    def start_cleanup_thread(self):
        """启动自动清理线程和快照线程"""
        if self._cleanup_running:
            return
        
        self._cleanup_running = True
        
        # 清理线程
        self._cleanup_thread = threading.Thread(
            target=self._cleanup_loop,
            daemon=True
        )
        self._cleanup_thread.start()
        
        # 快照线程
        self._snapshot_thread = threading.Thread(
            target=self._snapshot_loop,
            daemon=True
        )
        self._snapshot_thread.start()

    def _snapshot_loop(self):
        """每10秒记录一次全系统快照"""
        # 注意避免循环导入
        from app.services.state_service import StateService
        state_service = StateService()
        
        while self._cleanup_running:
            try:
                state = state_service.get_state()
                # 序列化状态
                import json
                # 处理 Pydantic 兼容性
                if hasattr(state, "model_dump_json"):
                    snapshot_json = state.model_dump_json()
                else:
                    # 备选方案
                    snapshot_json = json.dumps(state, default=lambda x: str(x))
                
                self.record_snapshot(snapshot_json, state.timestamp / 1000.0)
            except Exception as e:
                print(f"Error taking snapshot: {e}")
            
            time.sleep(10)

    def record_snapshot(self, snapshot_data: str, timestamp: float):
        """记录系统快照"""
        try:
            with self._get_conn() as conn:
                conn.execute(
                    "INSERT INTO snapshots (timestamp, snapshot_data) VALUES (?, ?)",
                    (timestamp, snapshot_data)
                )
                conn.commit()
        except Exception as e:
            print(f"Error recording snapshot: {e}")

    def get_snapshot_range(self) -> Tuple[Optional[float], Optional[float]]:
        """获取快照的时间范围"""
        try:
            with self._get_conn() as conn:
                cursor = conn.execute("SELECT MIN(timestamp), MAX(timestamp) FROM snapshots")
                row = cursor.fetchone()
                return row[0], row[1]
        except Exception as e:
            print(f"Error getting snapshot range: {e}")
            return None, None

    def get_snapshot(self, target_timestamp: float) -> Optional[str]:
        """获取最接近指定时间的快照"""
        try:
            with self._get_conn() as conn:
                # 寻找最接近的一条（绝对值差异最小）
                cursor = conn.execute(
                    """
                    SELECT snapshot_data 
                    FROM snapshots 
                    ORDER BY ABS(timestamp - ?) ASC 
                    LIMIT 1
                    """,
                    (target_timestamp,)
                )
                row = cursor.fetchone()
                return row['snapshot_data'] if row else None
        except Exception as e:
            print(f"Error getting snapshot: {e}")
            return None

    def record_event(self, type: str, content: str, level: str, timestamp: Optional[float] = None):
        """记录一个系统事件（用于时间轴标记）"""
        if timestamp is None:
            timestamp = time.time()
        try:
            with self._get_conn() as conn:
                conn.execute(
                    "INSERT INTO system_events (timestamp, type, content, level) VALUES (?, ?, ?, ?)",
                    (timestamp, type, content, level)
                )
                conn.commit()
        except Exception as e:
            print(f"Error recording event: {e}")

    def query_events(self, start_time: float, end_time: float) -> List[Dict]:
        """查询指定时间段内的事件记录"""
        try:
            with self._get_conn() as conn:
                cursor = conn.execute(
                    "SELECT timestamp, type, content, level FROM system_events WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC",
                    (start_time, end_time)
                )
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error querying events: {e}")
            return []

    def _cleanup_loop(self):
        """每小时清理一次过期数据"""
        while self._cleanup_running:
            time.sleep(3600)
            self.cleanup_old_data()

    def cleanup_old_data(self):
        """清理超过保留期的数据"""
        cutoff_time = time.time() - self.RETENTION_PERIOD
        try:
            with self._get_conn() as conn:
                conn.execute("DELETE FROM history_data WHERE timestamp < ?", (cutoff_time,))
                conn.commit()
                # VACUUM 可能会锁库较久，视情况执行
                # conn.execute("VACUUM") 
        except Exception as e:
            print(f"Error cleaning up old data: {e}")

    def record_data(
        self,
        entity_id: str,
        temperature: Optional[float] = None,
        vacuum: Optional[float] = None,
        timestamp: Optional[float] = None
    ):
        """记录一条或多条数据"""
        if timestamp is None:
            timestamp = time.time()
            
        try:
            with self._get_conn() as conn:
                if temperature is not None:
                    conn.execute(
                        "INSERT INTO history_data (entity_id, metric, timestamp, value) VALUES (?, ?, ?, ?)",
                        (entity_id, 'temperature', timestamp, temperature)
                    )
                if vacuum is not None:
                    conn.execute(
                        "INSERT INTO history_data (entity_id, metric, timestamp, value) VALUES (?, ?, ?, ?)",
                        (entity_id, 'vacuum', timestamp, vacuum)
                    )
                conn.commit()
        except Exception as e:
            print(f"Error recording data: {e}")

    def record_data_batch(self, data_list: List[Dict]):
        """
        批量记录数据以提高性能
        data_list item format: {
            'entity_id': str,
            'timestamp': float,
            'temperature': float (optional),
            'vacuum': float (optional)
        }
        """
        if not data_list:
            return
            
        try:
            with self._get_conn() as conn:
                for item in data_list:
                    entity_id = item['entity_id']
                    timestamp = item['timestamp']
                    if 'temperature' in item and item['temperature'] is not None:
                        conn.execute(
                            "INSERT INTO history_data (entity_id, metric, timestamp, value) VALUES (?, ?, ?, ?)",
                            (entity_id, 'temperature', timestamp, item['temperature'])
                        )
                    if 'vacuum' in item and item['vacuum'] is not None:
                        conn.execute(
                            "INSERT INTO history_data (entity_id, metric, timestamp, value) VALUES (?, ?, ?, ?)",
                            (entity_id, 'vacuum', timestamp, item['vacuum'])
                        )
                conn.commit()
        except Exception as e:
            print(f"Error recording data batch: {e}")

    def query_data(
        self,
        entity_id: str,
        metric: Literal['temperature', 'vacuum'],
        start_time: float,
        end_time: float
    ) -> List[Dict]:
        """查询指定时间范围的数据"""
        try:
            with self._get_conn() as conn:
                cursor = conn.execute(
                    """
                    SELECT timestamp, value 
                    FROM history_data 
                    WHERE entity_id = ? AND metric = ? AND timestamp BETWEEN ? AND ?
                    ORDER BY timestamp ASC
                    """,
                    (entity_id, metric, start_time, end_time)
                )
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error querying data: {e}")
            return []

    def get_latest_data(
        self,
        entity_id: str,
        metric: Literal['temperature', 'vacuum'],
        count: int = 100
    ) -> List[Dict]:
        """获取最新的N条数据"""
        try:
            with self._get_conn() as conn:
                cursor = conn.execute(
                    """
                    SELECT timestamp, value 
                    FROM history_data 
                    WHERE entity_id = ? AND metric = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                    """,
                    (entity_id, metric, count)
                )
                rows = cursor.fetchall()
                # 结果按时间正序返回给前端
                results = [dict(row) for row in rows]
                results.reverse()
                return results
        except Exception as e:
            print(f"Error getting latest data: {e}")
            return []

    def get_data_count(self, entity_id: str, metric: Literal['temperature', 'vacuum']) -> int:
        """获取指定实体和指标的数据点数量"""
        try:
            with self._get_conn() as conn:
                cursor = conn.execute(
                    "SELECT COUNT(*) FROM history_data WHERE entity_id = ? AND metric = ?",
                    (entity_id, metric)
                )
                return cursor.fetchone()[0]
        except Exception as e:
            print(f"Error getting data count: {e}")
            return 0

    # 为了兼容旧代码，保留但设为空操作
    def save_to_file(self, filepath: str = None):
        pass

    def load_from_file(self, filepath: str = None):
        pass


# 全局单例
_history_service_instance: Optional[HistoryService] = None

def get_history_service() -> HistoryService:
    global _history_service_instance
    if _history_service_instance is None:
        _history_service_instance = HistoryService()
    return _history_service_instance
