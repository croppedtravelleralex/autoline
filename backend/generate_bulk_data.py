# generate_bulk_data.py
"""
批量生成 24 小时温度/真空度历史数据脚本 (SQLite版)

该脚本用于离线生成大量的温度和真空度数据，并直接写入后端的 SQLite 数据库。
使用事务进行批量提交，确保生成速度。

使用方式：
```bash
python generate_bulk_data.py --carts A001,C001 --start 1706000000 --end 1706086400
```
"""

import argparse
import time
import random
import sqlite3
import os
from datetime import datetime

# 直接操作数据库，不依赖 HistoryService 的逐条插入接口，以提高性能
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "mes_data", "history.db")

start_ts = 0

def simulate_anode_cart(cart_id: str, timestamp: float) -> tuple[float, float]:
    """模拟阳极小车的温度和真空度趋势"""
    elapsed = timestamp - start_ts
    if elapsed < 10 * 3600:
        temp = 25 + (390 - 25) * (elapsed / (10 * 3600))
    elif elapsed < 12 * 3600:
        temp = 390
    elif elapsed < 17 * 3600:
        down_elapsed = elapsed - 12 * 3600
        if down_elapsed < 2 * 3600:
            temp = 390 - (390 - 70) * (down_elapsed / (2 * 3600))
        else:
            temp = 70 - (70 - 25) * ((down_elapsed - 2 * 3600) / (3 * 3600))
    else:
        temp = 25
    vacuum = 1e-5 * (1 + random.uniform(-0.1, 0.1))
    return temp, vacuum

def simulate_cathode_cart(cart_id: str, timestamp: float) -> tuple[float, float]:
    """模拟阴极小车的温度和真空度趋势"""
    elapsed = timestamp - start_ts
    if elapsed < 30 * 60:
        base_temp = 25
        drop = random.uniform(3, 5)
        temp = base_temp - drop
    elif elapsed < 10 * 3600 + 30 * 60:
        up_elapsed = elapsed - 30 * 60
        temp = (25 - random.uniform(3, 5)) + (425 - (25 - random.uniform(3, 5))) * (up_elapsed / (10 * 3600))
    elif elapsed < 12 * 3600 + 30 * 60:
        temp = 425
    elif elapsed < 17 * 3600 + 30 * 60:
        down_elapsed = elapsed - (12 * 3600 + 30 * 60)
        temp = 425 - (425 - 110) * (down_elapsed / (5 * 3600))
    else:
        temp = 110
    vacuum = 1e-6 + (1e-5 - 1e-6) * random.random()
    return temp, vacuum

def simulate_chamber(chamber_id: str, timestamp: float) -> tuple[float, float]:
    """模拟腔体温度和真空度"""
    elapsed = timestamp - start_ts
    
    # 阳极烘烤仓
    if 'a-hk' in chamber_id:
        if elapsed < 10 * 3600:
            temp = 25 + (390 - 25) * (elapsed / (10 * 3600))
        elif elapsed < 12 * 3600:
            temp = 390
        elif elapsed < 17 * 3600:
            down_elapsed = elapsed - 12 * 3600
            if down_elapsed < 2 * 3600:
                temp = 390 - (390 - 70) * (down_elapsed / (2 * 3600))
            else:
                temp = 70 - (70 - 25) * ((down_elapsed - 2 * 3600) / (3 * 3600))
        else:
            temp = 25
        vacuum = 1e-4
        
    # 阴极烘烤仓
    elif 'c-hk' in chamber_id:
        temp = 420 + random.uniform(-1, 1)
        vacuum = 1e-5
        
    # 进样仓(jl)/出样仓(cy) 
    elif 'jl' in chamber_id or 'cy' in chamber_id:
        temp = 25 + random.uniform(-0.5, 0.5)
        # 模拟抽真空/放气循环 (每30分钟一次)
        cycle = (timestamp % 1800) / 1800
        if cycle < 0.1: vacuum = 1.0e5 
        elif cycle < 0.2: vacuum = 100 * (1 - (cycle - 0.1) * 10)
        else: vacuum = 5.0e-4
            
    # 其他腔体 (a-qs, a-dj, a-yf, c-sz 等)
    else:
        # 对接仓特殊处理
        if 'a-dj' in chamber_id:
            temp = 100 + random.uniform(-2, 2)
            vacuum = 1e-4
        # 生长仓特殊处理
        elif 'c-sz' in chamber_id:
            temp = 200 + random.uniform(-5, 0) # 简化模拟
            vacuum = 1e-7
        # 清刷、铟封
        else:
            temp = 25 + random.uniform(-1, 1)
            vacuum = 1e-5
        
    return temp, vacuum

def main(carts: list[str], start: int, end: int, interval: int = 1):
    global start_ts
    start_ts = start
    
    # 确保目录存在
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    # 确保表存在
    conn.execute("""
        CREATE TABLE IF NOT EXISTS history_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_id TEXT NOT NULL,
            metric TEXT NOT NULL,
            timestamp REAL NOT NULL,
            value REAL NOT NULL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_entity_metric_time ON history_data (entity_id, metric, timestamp)")
    
    total_steps = (end - start) // interval
    
    # 必须与 backend/app/services/state_service.py 中的定义一致
    # 阳极: a-jl, a-hk, a-qs, a-dj, a-yf, a-cy
    # 阴极: c-jl, c-hk, c-sz, c-cy
    chambers = [
        'a-jl', 'a-hk', 'a-qs', 'a-dj', 'a-yf', 'a-cy',
        'c-jl', 'c-hk', 'c-sz', 'c-cy'
    ]
    
    print(f"开始生成数据(SQLite高速版)：{len(carts)} 台小车 + {len(chambers)} 个腔体")
    print(f"时间范围: {datetime.fromtimestamp(start)} ~ {datetime.fromtimestamp(end)}")
    print(f"数据库路径: {DB_PATH}")
    print(f"腔体列表: {chambers}")
    
    try:
        # 使用事务批量插入
        conn.execute("BEGIN TRANSACTION")
        
        count = 0
        BATCH_SIZE = 100000 
        
        for ts in range(start, end, interval):
            data_to_insert = []
            
            # 1. 小车数据
            for cart_id in carts:
                if cart_id.startswith('A'): temp, vac = simulate_anode_cart(cart_id, ts)
                elif cart_id.startswith('C'): temp, vac = simulate_cathode_cart(cart_id, ts)
                else: temp, vac = simulate_anode_cart(cart_id, ts)
                
                data_to_insert.append((cart_id, 'temperature', ts, temp))
                data_to_insert.append((cart_id, 'vacuum', ts, vac))
                
            # 2. 腔体数据
            for chamber_id in chambers:
                temp, vac = simulate_chamber(chamber_id, ts)
                data_to_insert.append((chamber_id, 'temperature', ts, temp))
                data_to_insert.append((chamber_id, 'vacuum', ts, vac))
            
            # 执行插入
            conn.executemany(
                "INSERT INTO history_data (entity_id, metric, timestamp, value) VALUES (?, ?, ?, ?)",
                data_to_insert
            )
            
            count += len(data_to_insert)
            
            # 进度提示
            if (ts - start) % 3600 == 0:
                print(f"已处理 {datetime.fromtimestamp(ts)} (已生成 {count} 条记录)")
                
        conn.execute("COMMIT")
        print(f"数据生成完成！共插入 {count} 条记录。")
        
    except Exception as e:
        conn.execute("ROLLBACK")
        print(f"生成失败，已回滚: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="批量生成 24h 温度/真空度历史数据 (SQLite)")
    parser.add_argument("--carts", type=str, required=True, help="A001,C001")
    parser.add_argument("--start", type=int, required=True, help="起始时间戳")
    parser.add_argument("--end", type=int, required=True, help="结束时间戳")
    parser.add_argument("--interval", type=int, default=1, help="间隔")
    args = parser.parse_args()
    cart_list = [c.strip() for c in args.carts.split(',') if c.strip()]
    main(carts=cart_list, start=args.start, end=args.end, interval=args.interval)
