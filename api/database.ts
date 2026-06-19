import initSqlJs, { type Database } from 'sql.js'

let db: Database

const DDL = `
CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('staff', 'front_desk', 'housekeeping_supervisor', 'gm')),
    password TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT UNIQUE NOT NULL,
    floor INTEGER NOT NULL,
    room_type TEXT NOT NULL CHECK(room_type IN ('standard', 'deluxe', 'suite', 'presidential')),
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'cleaning', 'maintenance', 'reserved')),
    is_smoking BOOLEAN DEFAULT 0,
    has_firm_pillow BOOLEAN DEFAULT 0,
    ac_power BOOLEAN DEFAULT 0,
    ac_temperature INTEGER DEFAULT 24,
    ac_mode TEXT DEFAULT 'cool',
    light_power BOOLEAN DEFAULT 0,
    light_brightness INTEGER DEFAULT 80,
    curtain_open BOOLEAN DEFAULT 0,
    last_cleaned_at DATETIME,
    price_per_night REAL NOT NULL
);

CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'silver' CHECK(tier IN ('silver', 'gold', 'platinum', 'diamond')),
    points INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    stay_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE member_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id),
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL,
    UNIQUE(member_id, preference_key)
);

CREATE TABLE guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    id_number TEXT UNIQUE NOT NULL,
    member_id INTEGER REFERENCES members(id),
    face_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER NOT NULL REFERENCES guests(id),
    member_id INTEGER REFERENCES members(id),
    room_id INTEGER REFERENCES rooms(id),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    room_type TEXT NOT NULL,
    preferences TEXT DEFAULT '[]',
    total_amount REAL DEFAULT 0,
    key_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    assigned_to INTEGER REFERENCES employees(id),
    type TEXT NOT NULL CHECK(type IN ('water', 'towel', 'cleaning', 'maintenance', 'other')),
    description TEXT,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'in_progress', 'completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE TABLE minibar_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    name TEXT NOT NULL,
    price REAL NOT NULL,
    weight REAL NOT NULL,
    current_weight REAL NOT NULL,
    consumed BOOLEAN DEFAULT 0,
    consumed_at DATETIME
);

CREATE TABLE housekeeping_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    assigned_to INTEGER REFERENCES employees(id),
    type TEXT NOT NULL CHECK(type IN ('checkout_clean', 'daily_clean', 'deep_clean')),
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
    quality_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE TABLE bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER NOT NULL REFERENCES reservations(id),
    total REAL DEFAULT 0,
    invoice_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL REFERENCES bills(id),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL
);
`

const MOCK_DATA = `
INSERT INTO employees (name, employee_id, role, password, avatar) VALUES
('张小明', 'S001', 'staff', '123456', ''),
('李芳', 'S002', 'staff', '123456', ''),
('王建国', 'S003', 'staff', '123456', ''),
('赵丽', 'FD001', 'front_desk', '123456', ''),
('陈晨', 'FD002', 'front_desk', '123456', ''),
('刘伟', 'HS001', 'housekeeping_supervisor', '123456', ''),
('孙鹏', 'GM001', 'gm', '123456', '');

INSERT INTO rooms (room_number, floor, room_type, status, is_smoking, has_firm_pillow, price_per_night) VALUES
('801', 8, 'presidential', 'available', 0, 1, 6888),
('802', 8, 'suite', 'available', 0, 1, 3888),
('803', 8, 'suite', 'occupied', 0, 0, 3888),
('804', 8, 'deluxe', 'available', 0, 1, 1888),
('805', 8, 'deluxe', 'available', 1, 0, 1888),
('701', 7, 'suite', 'available', 0, 1, 3888),
('702', 7, 'deluxe', 'occupied', 0, 0, 1888),
('703', 7, 'deluxe', 'available', 0, 1, 1888),
('704', 7, 'standard', 'cleaning', 0, 0, 988),
('705', 7, 'standard', 'available', 1, 0, 988),
('601', 6, 'deluxe', 'available', 0, 1, 1888),
('602', 6, 'deluxe', 'available', 0, 0, 1888),
('603', 6, 'standard', 'occupied', 0, 1, 988),
('604', 6, 'standard', 'available', 0, 0, 988),
('605', 6, 'standard', 'available', 1, 0, 988),
('501', 5, 'deluxe', 'available', 0, 1, 1888),
('502', 5, 'standard', 'available', 0, 0, 988),
('503', 5, 'standard', 'occupied', 1, 0, 988),
('504', 5, 'standard', 'available', 0, 1, 988),
('505', 5, 'standard', 'available', 0, 0, 988),
('401', 4, 'standard', 'available', 0, 0, 988),
('402', 4, 'standard', 'available', 0, 1, 988),
('403', 4, 'standard', 'available', 1, 0, 988),
('404', 4, 'standard', 'maintenance', 0, 0, 988),
('405', 4, 'standard', 'available', 0, 0, 988),
('301', 3, 'standard', 'available', 0, 0, 988),
('302', 3, 'standard', 'occupied', 0, 1, 988),
('303', 3, 'standard', 'available', 0, 0, 988),
('304', 3, 'standard', 'available', 1, 0, 988),
('305', 3, 'standard', 'available', 0, 0, 988),
('201', 2, 'standard', 'available', 0, 0, 988),
('202', 2, 'standard', 'available', 0, 1, 988),
('203', 2, 'standard', 'available', 0, 0, 988),
('204', 2, 'standard', 'available', 1, 0, 988),
('205', 2, 'standard', 'available', 0, 0, 988),
('101', 1, 'standard', 'available', 0, 0, 988),
('102', 1, 'standard', 'available', 0, 0, 988),
('103', 1, 'standard', 'available', 0, 0, 988),
('104', 1, 'standard', 'available', 1, 0, 988),
('105', 1, 'standard', 'available', 0, 0, 988);

INSERT INTO members (name, phone, tier, points, total_spent, stay_count) VALUES
('陈伟杰', '13800001001', 'diamond', 58000, 128000, 42),
('林晓雨', '13800001002', 'platinum', 32000, 56000, 28),
('王思远', '13800001003', 'gold', 15000, 28000, 15),
('张丽华', '13800001004', 'gold', 12000, 22000, 12),
('刘德明', '13800001005', 'silver', 5000, 8000, 5),
('赵小燕', '13800001006', 'silver', 2000, 3500, 3),
('黄志强', '13800001007', 'platinum', 28000, 48000, 22),
('周美玲', '13800001008', 'diamond', 62000, 145000, 48),
('吴建国', '13800001009', 'gold', 18000, 32000, 16),
('孙丽芳', '13800001010', 'silver', 3000, 5000, 4);

INSERT INTO member_preferences (member_id, preference_key, preference_value) VALUES
(1, 'floor', 'high'), (1, 'smoking', 'non-smoking'), (1, 'pillow', 'firm'),
(2, 'floor', 'high'), (2, 'smoking', 'non-smoking'), (2, 'pillow', 'soft'),
(3, 'floor', 'low'), (3, 'smoking', 'non-smoking'), (3, 'pillow', 'firm'),
(7, 'floor', 'high'), (7, 'smoking', 'non-smoking'), (7, 'pillow', 'firm'),
(8, 'floor', 'high'), (8, 'smoking', 'non-smoking'), (8, 'pillow', 'soft');

INSERT INTO guests (name, phone, id_number, member_id) VALUES
('陈伟杰', '13800001001', '310101199001011234', 1),
('林晓雨', '13800001002', '310101199203045678', 2),
('王思远', '13800001003', '310101198505079012', 3),
('赵小燕', '13800001006', '310101199507083456', 6),
('黄志强', '13800001007', '310101198809101789', 7),
('孙丽芳', '13800001010', '310101199611122345', 10);

INSERT INTO reservations (guest_id, member_id, room_id, status, check_in, check_out, room_type, preferences, total_amount) VALUES
(1, 1, 3, 'checked_in', '2026-06-18', '2026-06-20', 'suite', '["high_floor","non_smoking","firm_pillow"]', 7776),
(5, 7, 7, 'checked_in', '2026-06-18', '2026-06-21', 'deluxe', '["high_floor","non_smoking","firm_pillow"]', 5664),
(3, 3, 13, 'checked_in', '2026-06-19', '2026-06-22', 'standard', '["low_floor","non_smoking","firm_pillow"]', 2964),
(2, 2, NULL, 'confirmed', '2026-06-20', '2026-06-23', 'deluxe', '["high_floor","non_smoking","soft_pillow"]', 5664),
(4, 6, 18, 'checked_in', '2026-06-17', '2026-06-19', 'standard', '["non_smoking"]', 1976);

INSERT INTO minibar_items (room_id, name, price, weight, current_weight) VALUES
(3, '依云矿泉水', 38, 500, 500),
(3, '巴黎水', 42, 330, 0),
(3, '费列罗巧克力', 58, 200, 200),
(3, '坚果礼包', 68, 150, 150),
(7, '依云矿泉水', 38, 500, 0),
(7, '巴黎水', 42, 330, 330),
(7, '费列罗巧克力', 58, 200, 0),
(13, '依云矿泉水', 38, 500, 500),
(13, '巴黎水', 42, 330, 330),
(18, '依云矿泉水', 38, 500, 0),
(18, '坚果礼包', 68, 150, 150);

INSERT INTO service_requests (room_id, assigned_to, type, description, priority, status, created_at) VALUES
(3, 1, 'water', '客人需要两瓶矿泉水', 'medium', 'in_progress', '2026-06-19T08:30:00'),
(7, NULL, 'towel', '客人需要额外浴巾', 'low', 'pending', '2026-06-19T09:15:00'),
(13, 2, 'other', '客人需要多一个衣架', 'low', 'completed', '2026-06-19T07:00:00');

INSERT INTO housekeeping_tasks (room_id, assigned_to, type, priority, status, created_at) VALUES
(9, 1, 'checkout_clean', 'high', 'in_progress', '2026-06-19T08:00:00'),
(18, 3, 'checkout_clean', 'high', 'pending', '2026-06-19T09:00:00');

INSERT INTO bills (reservation_id, total, invoice_url) VALUES
(1, 7776, '/invoices/INV20260618001.pdf'),
(2, 5664, NULL),
(3, 2964, NULL),
(5, 1976, '/invoices/INV20260617001.pdf');

INSERT INTO bill_items (bill_id, category, description, amount) VALUES
(1, 'room', '套房住宿2晚', 7776),
(2, 'room', '豪华客房住宿3晚', 5664),
(3, 'room', '标准客房住宿3晚', 2964),
(4, 'room', '标准客房住宿2晚', 1976);

UPDATE minibar_items SET consumed = 1, consumed_at = '2026-06-19T10:00:00' WHERE current_weight = 0 AND weight > 0;
UPDATE rooms SET ac_power = 1, light_power = 1 WHERE status = 'occupied';
UPDATE rooms SET last_cleaned_at = '2026-06-19T06:00:00' WHERE status IN ('available', 'occupied');
UPDATE guests SET face_verified = 1 WHERE id IN (1, 5, 3);`

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs()
  db = new SQL.Database()

  const statements = DDL.split(';').map(s => s.trim()).filter(s => s.length > 0)
  for (const stmt of statements) {
    db.run(stmt)
  }

  const mockStatements = MOCK_DATA.split(';').map(s => s.trim()).filter(s => s.length > 0)
  for (const stmt of mockStatements) {
    db.run(stmt)
  }

  console.log('Database initialized with mock data')
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function queryAll<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
  const database = getDb()
  if (params && params.length > 0) {
    const stmt = database.prepare(sql)
    stmt.bind(params as (string | number | boolean | null | Uint8Array)[])
    const results: T[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T)
    }
    stmt.free()
    return results
  }
  const execResult = database.exec(sql)
  if (!execResult.length) return []
  const { columns, values } = execResult[0]
  return values.map(row => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      obj[col] = row[i]
    })
    return obj as T
  })
}

export function queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | null {
  const results = queryAll<T>(sql, params)
  return results.length > 0 ? results[0] : null
}

export function run(sql: string, params?: unknown[]): void {
  const database = getDb()
  if (params && params.length > 0) {
    database.run(sql, params as (string | number | boolean | null | Uint8Array)[])
  } else {
    database.run(sql)
  }
}
