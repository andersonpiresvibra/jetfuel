import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './db/index.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes

// Aircraft
app.get('/api/aircraft', (req, res) => {
  const stmt = db.prepare('SELECT * FROM aircraft');
  const aircraft = stmt.all();
  res.json(aircraft);
});

app.post('/api/aircraft', (req, res) => {
  const { manufacturer, model, prefix, airline } = req.body;
  const id = Date.now().toString();
  try {
    const stmt = db.prepare('INSERT INTO aircraft (id, manufacturer, model, prefix, airline) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, manufacturer, model, prefix, airline);
    res.json({ id, manufacturer, model, prefix, airline });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/aircraft/:id', (req, res) => {
  const { id } = req.params;
  const { manufacturer, model, prefix, airline } = req.body;
  try {
    const stmt = db.prepare('UPDATE aircraft SET manufacturer = ?, model = ?, prefix = ?, airline = ? WHERE id = ?');
    stmt.run(manufacturer, model, prefix, airline, id);
    res.json({ id, manufacturer, model, prefix, airline });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/aircraft/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM aircraft WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vehicles
app.get('/api/vehicles', (req, res) => {
  const stmt = db.prepare('SELECT * FROM vehicles');
  const vehicles = stmt.all();
  // Parse boolean and JSON fields
  const parsedVehicles = vehicles.map((v: any) => ({
    ...v,
    hasPlatform: Boolean(v.hasPlatform),
    maintenanceHistory: JSON.parse(v.maintenanceHistory || '[]')
  }));
  res.json(parsedVehicles);
});

app.post('/api/vehicles', (req, res) => {
  const vehicle = req.body;
  const id = Date.now().toString();
  try {
    const stmt = db.prepare(`
      INSERT INTO vehicles (
        id, manufacturer, model, type, plate, fleetNumber, atve, atveExpiry, 
        inspectionWeekly, inspectionMonthly, inspectionSemiannual, inspectionAnnual, 
        status, maxFlowRate, hasPlatform, counterInitial, counterFinal, 
        maintenanceHistory, nextMaintenance, mileage, engineHours, fuelLevel, 
        tirePressure, batteryLevel, observations
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?, ?, ?, 
        ?, ?, ?
      )
    `);
    
    stmt.run(
      id, vehicle.manufacturer, vehicle.model, vehicle.type, vehicle.plate, vehicle.fleetNumber, vehicle.atve, vehicle.atveExpiry,
      vehicle.inspectionWeekly, vehicle.inspectionMonthly, vehicle.inspectionSemiannual, vehicle.inspectionAnnual,
      vehicle.status, vehicle.maxFlowRate, vehicle.hasPlatform ? 1 : 0, vehicle.counterInitial, vehicle.counterFinal,
      JSON.stringify(vehicle.maintenanceHistory || []), vehicle.nextMaintenance, vehicle.mileage, vehicle.engineHours, vehicle.fuelLevel,
      vehicle.tirePressure, vehicle.batteryLevel, vehicle.observations
    );
    res.json({ ...vehicle, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  const vehicle = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE vehicles SET
        manufacturer = ?, model = ?, type = ?, plate = ?, fleetNumber = ?, atve = ?, atveExpiry = ?, 
        inspectionWeekly = ?, inspectionMonthly = ?, inspectionSemiannual = ?, inspectionAnnual = ?, 
        status = ?, maxFlowRate = ?, hasPlatform = ?, counterInitial = ?, counterFinal = ?, 
        maintenanceHistory = ?, nextMaintenance = ?, mileage = ?, engineHours = ?, fuelLevel = ?, 
        tirePressure = ?, batteryLevel = ?, observations = ?
      WHERE id = ?
    `);
    
    stmt.run(
      vehicle.manufacturer, vehicle.model, vehicle.type, vehicle.plate, vehicle.fleetNumber, vehicle.atve, vehicle.atveExpiry,
      vehicle.inspectionWeekly, vehicle.inspectionMonthly, vehicle.inspectionSemiannual, vehicle.inspectionAnnual,
      vehicle.status, vehicle.maxFlowRate, vehicle.hasPlatform ? 1 : 0, vehicle.counterInitial, vehicle.counterFinal,
      JSON.stringify(vehicle.maintenanceHistory || []), vehicle.nextMaintenance, vehicle.mileage, vehicle.engineHours, vehicle.fuelLevel,
      vehicle.tirePressure, vehicle.batteryLevel, vehicle.observations,
      id
    );
    res.json({ ...vehicle, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM vehicles WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Flights (Static)
app.get('/api/flights', (req, res) => {
  const stmt = db.prepare('SELECT * FROM flights');
  const flights = stmt.all();
  res.json(flights);
});

app.post('/api/flights', (req, res) => {
  const { airline, flightNumber, destination, city } = req.body;
  const id = Date.now().toString();
  try {
    const stmt = db.prepare('INSERT INTO flights (id, airline, flightNumber, destination, city) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, airline, flightNumber, destination, city);
    res.json({ id, airline, flightNumber, destination, city });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/flights/:id', (req, res) => {
  const { id } = req.params;
  const { airline, flightNumber, destination, city } = req.body;
  try {
    const stmt = db.prepare('UPDATE flights SET airline = ?, flightNumber = ?, destination = ?, city = ? WHERE id = ?');
    stmt.run(airline, flightNumber, destination, city, id);
    res.json({ id, airline, flightNumber, destination, city });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/flights/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM flights WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Operators
app.get('/api/operators', (req, res) => {
  const stmt = db.prepare('SELECT * FROM operators');
  const operators = stmt.all();
  const parsedOperators = operators.map((op: any) => ({
    ...op,
    allowedAirlines: JSON.parse(op.allowedAirlines || '[]')
  }));
  res.json(parsedOperators);
});

app.post('/api/operators', (req, res) => {
  const op = req.body;
  const id = Date.now().toString();
  try {
    const stmt = db.prepare(`
      INSERT INTO operators (
        id, fullName, warName, companyId, gruId, vestNumber, role, shift, 
        entryTime, exitTime, allowedAirlines, status, photoUrl, americanId
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);
    stmt.run(
      id, op.fullName, op.warName, op.companyId, op.gruId, op.vestNumber, op.role, op.shift,
      op.entryTime, op.exitTime, JSON.stringify(op.allowedAirlines || []), op.status, op.photoUrl, op.americanId
    );
    res.json({ ...op, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/operators/:id', (req, res) => {
  const { id } = req.params;
  const op = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE operators SET
        fullName = ?, warName = ?, companyId = ?, gruId = ?, vestNumber = ?, role = ?, shift = ?, 
        entryTime = ?, exitTime = ?, allowedAirlines = ?, status = ?, photoUrl = ?, americanId = ?
      WHERE id = ?
    `);
    stmt.run(
      op.fullName, op.warName, op.companyId, op.gruId, op.vestNumber, op.role, op.shift,
      op.entryTime, op.exitTime, JSON.stringify(op.allowedAirlines || []), op.status, op.photoUrl, op.americanId,
      id
    );
    res.json({ ...op, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/operators/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM operators WHERE id = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Vite Middleware
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Serve static files in production
  app.use(express.static('dist'));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
