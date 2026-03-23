import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS aircraft (
    id TEXT PRIMARY KEY,
    manufacturer TEXT NOT NULL,
    model TEXT NOT NULL,
    prefix TEXT NOT NULL UNIQUE,
    airline TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    manufacturer TEXT,
    model TEXT,
    type TEXT,
    plate TEXT,
    fleetNumber TEXT UNIQUE,
    atve TEXT,
    atveExpiry TEXT,
    inspectionWeekly TEXT,
    inspectionMonthly TEXT,
    inspectionSemiannual TEXT,
    inspectionAnnual TEXT,
    status TEXT,
    maxFlowRate INTEGER,
    hasPlatform INTEGER, -- boolean stored as 0/1
    counterInitial INTEGER,
    counterFinal INTEGER,
    maintenanceHistory TEXT, -- JSON string
    nextMaintenance TEXT,
    mileage INTEGER,
    engineHours INTEGER,
    fuelLevel INTEGER,
    tirePressure INTEGER,
    batteryLevel INTEGER,
    observations TEXT
  );

  CREATE TABLE IF NOT EXISTS flights (
    id TEXT PRIMARY KEY,
    airline TEXT NOT NULL,
    flightNumber TEXT NOT NULL,
    destination TEXT,
    city TEXT
  );

  CREATE TABLE IF NOT EXISTS operators (
    id TEXT PRIMARY KEY,
    fullName TEXT,
    warName TEXT,
    companyId TEXT,
    gruId TEXT,
    vestNumber TEXT,
    role TEXT,
    shift TEXT,
    entryTime TEXT,
    exitTime TEXT,
    allowedAirlines TEXT, -- JSON string
    status TEXT,
    photoUrl TEXT,
    americanId TEXT
  );
`);

// Seed data if empty
const aircraftCount = db.prepare('SELECT count(*) as count FROM aircraft').get() as { count: number };
if (aircraftCount.count === 0) {
  const insert = db.prepare('INSERT INTO aircraft (id, manufacturer, model, prefix, airline) VALUES (@id, @manufacturer, @model, @prefix, @airline)');
  const mockAircraft = [
    { id: '1', manufacturer: 'BOEING', model: '737-800', prefix: 'PR-GGE', airline: 'GOL' },
    { id: '2', manufacturer: 'AIRBUS', model: 'A320neo', prefix: 'PR-YRA', airline: 'AZUL' },
    { id: '3', manufacturer: 'BOEING', model: '777-300ER', prefix: 'PT-MUA', airline: 'LATAM' },
  ];
  for (const a of mockAircraft) insert.run(a);
}

// Always re-seed vehicles to ensure we have the full fleet
db.prepare('DELETE FROM vehicles').run();

const insertVehicle = db.prepare(`
  INSERT INTO vehicles (
    id, manufacturer, model, type, plate, fleetNumber, atve, atveExpiry, 
    inspectionWeekly, inspectionMonthly, inspectionSemiannual, inspectionAnnual, 
    status, maxFlowRate, hasPlatform, counterInitial, counterFinal, 
    maintenanceHistory, nextMaintenance, mileage, engineHours, fuelLevel, 
    tirePressure, batteryLevel, observations
  ) VALUES (
    @id, @manufacturer, @model, @type, @plate, @fleetNumber, @atve, @atveExpiry,
    @inspectionWeekly, @inspectionMonthly, @inspectionSemiannual, @inspectionAnnual,
    @status, @maxFlowRate, @hasPlatform, @counterInitial, @counterFinal,
    @maintenanceHistory, @nextMaintenance, @mileage, @engineHours, @fuelLevel,
    @tirePressure, @batteryLevel, @observations
  )
`);

const mockVehicles = [
  // === SERVIDORES (Abastecimento via Hidrante) - 27 unidades ===
  // --- FORD ---
  { id: '2104', manufacturer: 'FORD', model: 'CARGO', type: 'SERVIDOR', plate: 'FRD-2104', fleetNumber: '2104', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-001', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2108', manufacturer: 'FORD', model: 'CARGO', type: 'SERVIDOR', plate: 'FRD-2108', fleetNumber: '2108', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-002', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2111', manufacturer: 'FORD', model: 'CARGO', type: 'SERVIDOR', plate: 'FRD-2111', fleetNumber: '2111', status: 'INATIVO', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-003', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: 'Manutenção' },
  { id: '2113', manufacturer: 'FORD', model: 'CARGO', type: 'SERVIDOR', plate: 'FRD-2113', fleetNumber: '2113', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-004', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },

  // --- MERCEDES-BENZ ---
  { id: '2122', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2122', fleetNumber: '2122', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-005', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2123', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2123', fleetNumber: '2123', status: 'OCUPADO', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-006', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: 'R. ALMEIDA' },
  { id: '2124', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2124', fleetNumber: '2124', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-007', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2125', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2125', fleetNumber: '2125', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-008', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2126', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2126', fleetNumber: '2126', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-009', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2127', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2127', fleetNumber: '2127', status: 'OCUPADO', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-010', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: 'C. MOURA' },
  { id: '2128', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2128', fleetNumber: '2128', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-011', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2129', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2129', fleetNumber: '2129', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-012', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2130', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2130', fleetNumber: '2130', status: 'INATIVO', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-013', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: 'Manutenção' },
  { id: '2131', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2131', fleetNumber: '2131', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-014', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2132', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2132', fleetNumber: '2132', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-015', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2133', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2133', fleetNumber: '2133', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-016', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2135', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2135', fleetNumber: '2135', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-017', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2136', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2136', fleetNumber: '2136', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-018', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2137', manufacturer: 'MERCEDES-BENZ', model: 'ATEGO', type: 'SERVIDOR', plate: 'MB-2137', fleetNumber: '2137', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-019', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },

  // --- VOLKSWAGEN ---
  { id: '2140', manufacturer: 'VOLKSWAGEN', model: 'CONSTELLATION', type: 'SERVIDOR', plate: 'VW-2140', fleetNumber: '2140', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-020', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2145', manufacturer: 'VOLKSWAGEN', model: 'CONSTELLATION', type: 'SERVIDOR', plate: 'VW-2145', fleetNumber: '2145', status: 'OCUPADO', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-021', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: 'F. SANTOS' },
  { id: '2160', manufacturer: 'VOLKSWAGEN', model: 'CONSTELLATION', type: 'SERVIDOR', plate: 'VW-2160', fleetNumber: '2160', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-022', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2161', manufacturer: 'VOLKSWAGEN', model: 'CONSTELLATION', type: 'SERVIDOR', plate: 'VW-2161', fleetNumber: '2161', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-023', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2164', manufacturer: 'VOLKSWAGEN', model: 'CONSTELLATION', type: 'SERVIDOR', plate: 'VW-2164', fleetNumber: '2164', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-024', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2165', manufacturer: 'VOLKSWAGEN', model: 'CONSTELLATION', type: 'SERVIDOR', plate: 'VW-2165', fleetNumber: '2165', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-025', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2174', manufacturer: 'VOLKSWAGEN', model: 'CONSTELLATION', type: 'SERVIDOR', plate: 'VW-2174', fleetNumber: '2174', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-026', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '2177', manufacturer: 'VOLKSWAGEN', model: 'CONSTELLATION', type: 'SERVIDOR', plate: 'VW-2177', fleetNumber: '2177', status: 'DISPONÍVEL', maxFlowRate: 1000, hasPlatform: 1, atve: 'ATVE-027', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },

  // === CTAs (Caminhões Tanque Abastecedores) - 9 unidades ===
  { id: '1405', manufacturer: 'VOLVO', model: 'VM', type: 'CTA', plate: 'VLV-1405', fleetNumber: '1405', status: 'DISPONÍVEL', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-028', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '1425', manufacturer: 'SCANIA', model: 'P310', type: 'CTA', plate: 'SCN-1425', fleetNumber: '1425', status: 'OCUPADO', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-029', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: 'L. PEREIRA' },
  { id: '1426', manufacturer: 'SCANIA', model: 'P310', type: 'CTA', plate: 'SCN-1426', fleetNumber: '1426', status: 'DISPONÍVEL', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-030', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '1428', manufacturer: 'SCANIA', model: 'P310', type: 'CTA', plate: 'SCN-1428', fleetNumber: '1428', status: 'ENCHIMENTO', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-031', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: 'G. OLIVEIRA' },
  { id: '1435', manufacturer: 'VOLVO', model: 'VM', type: 'CTA', plate: 'VLV-1435', fleetNumber: '1435', status: 'DISPONÍVEL', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-032', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '1437', manufacturer: 'IVECO', model: 'TECTOR', type: 'CTA', plate: 'IVC-1437', fleetNumber: '1437', status: 'DISPONÍVEL', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-033', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '1439', manufacturer: 'IVECO', model: 'TECTOR', type: 'CTA', plate: 'IVC-1439', fleetNumber: '1439', status: 'DISPONÍVEL', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-034', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '1499', manufacturer: 'SCANIA', model: 'P310', type: 'CTA', plate: 'SCN-1499', fleetNumber: '1499', status: 'INATIVO', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-035', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
  { id: '1517', manufacturer: 'VOLVO', model: 'VM', type: 'CTA', plate: 'VLV-1517', fleetNumber: '1517', status: 'DISPONÍVEL', maxFlowRate: 800, hasPlatform: 0, atve: 'ATVE-036', atveExpiry: '2025-01-01', inspectionWeekly: '2024-01-01', inspectionMonthly: '2024-01-01', inspectionSemiannual: '2024-01-01', inspectionAnnual: '2024-01-01', counterInitial: 0, counterFinal: 0, maintenanceHistory: '[]', nextMaintenance: '2024-06-01', mileage: 0, engineHours: 0, fuelLevel: 100, tirePressure: 100, batteryLevel: 100, observations: '' },
];
for (const v of mockVehicles) insertVehicle.run(v);

const flightCount = db.prepare('SELECT count(*) as count FROM flights').get() as { count: number };
if (flightCount.count === 0) {
  const insert = db.prepare('INSERT INTO flights (id, airline, flightNumber, destination, city) VALUES (@id, @airline, @flightNumber, @destination, @city)');
  const mockFlights = [
    { id: '1', airline: 'LATAM', flightNumber: 'LA-8039', destination: 'SPJC', city: 'LIMA' },
    { id: '2', airline: 'GOL', flightNumber: 'G3-1234', destination: 'SBGR', city: 'GUARULHOS' },
    { id: '3', airline: 'AZUL', flightNumber: 'AD-4567', destination: 'SBRJ', city: 'RIO DE JANEIRO' },
  ];
  for (const f of mockFlights) insert.run(f);
}

const operatorCount = db.prepare('SELECT count(*) as count FROM operators').get() as { count: number };
if (operatorCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO operators (
      id, fullName, warName, companyId, gruId, vestNumber, role, shift, 
      entryTime, exitTime, allowedAirlines, status, photoUrl, americanId
    ) VALUES (
      @id, @fullName, @warName, @companyId, @gruId, @vestNumber, @role, @shift,
      @entryTime, @exitTime, @allowedAirlines, @status, @photoUrl, @americanId
    )
  `);
  
  const mockOperators = [
    { 
      id: '1', 
      fullName: 'Anderson Horácio Pires', 
      warName: 'Horácio', 
      companyId: 'FUNC-1234', 
      gruId: 'GRU-9876', 
      vestNumber: '101', 
      role: 'LÍDER', 
      shift: 'MANHÃ', 
      entryTime: '06:00', 
      exitTime: '14:00', 
      allowedAirlines: JSON.stringify(['LATAM', 'GOL']), 
      status: 'ATIVO',
      photoUrl: '',
      americanId: ''
    }
  ];
  for (const op of mockOperators) insert.run(op);
}

export default db;
