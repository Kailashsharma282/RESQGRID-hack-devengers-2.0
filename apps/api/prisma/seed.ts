import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ResQGrid Seed Process...');

  // Clear existing records cleanly
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.dispatch.deleteMany({});
  await prisma.incidentReport.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.resource.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. SEED 20 USERS (Admin, Operators, Responders, Citizens)
  console.log('👤 Seeding 20 Users...');
  const usersData = [
    // Administrators
    { name: 'Dr. Marcus Vance', email: 'admin@resqgrid.io', role: 'ADMIN', phone: '+1 (555) 100-0001' },
    { name: 'Director Elena Rostova', email: 'director@resqgrid.io', role: 'ADMIN', phone: '+1 (555) 100-0002' },
    // Command Center Operators
    { name: 'Commander Sarah Jenkins', email: 'operator@resqgrid.io', role: 'OPERATOR', phone: '+1 (555) 200-0001' },
    { name: 'Operator David Chen', email: 'david.chen@resqgrid.io', role: 'OPERATOR', phone: '+1 (555) 200-0002' },
    { name: 'Operator Priya Sharma', email: 'priya.sharma@resqgrid.io', role: 'OPERATOR', phone: '+1 (555) 200-0003' },
    { name: 'Operator Alex Rivera', email: 'alex.rivera@resqgrid.io', role: 'OPERATOR', phone: '+1 (555) 200-0004' },
    // Emergency Responders
    { name: 'Capt. James Miller (Engine 02)', email: 'responder@resqgrid.io', role: 'RESPONDER', phone: '+1 (555) 300-0001' },
    { name: 'Lt. Maya Lin (Medic 04)', email: 'maya.lin@resqgrid.io', role: 'RESPONDER', phone: '+1 (555) 300-0002' },
    { name: 'Sgt. Robert Kowalski (Police 01)', email: 'robert.k@resqgrid.io', role: 'RESPONDER', phone: '+1 (555) 300-0003' },
    { name: 'Paramedic Chloe Bennett', email: 'chloe.b@resqgrid.io', role: 'RESPONDER', phone: '+1 (555) 300-0004' },
    { name: 'Officer Daniel Hayes', email: 'daniel.h@resqgrid.io', role: 'RESPONDER', phone: '+1 (555) 300-0005' },
    { name: 'Rescue Spec. Tariq Al-Mansoor', email: 'tariq.m@resqgrid.io', role: 'RESPONDER', phone: '+1 (555) 300-0006' },
    { name: 'Hazmat Spec. Frank Castiglione', email: 'frank.c@resqgrid.io', role: 'RESPONDER', phone: '+1 (555) 300-0007' },
    // Citizens / Field Reporters
    { name: 'Lucas Scott', email: 'citizen@resqgrid.io', role: 'CITIZEN', phone: '+1 (555) 400-0001' },
    { name: 'Hannah Abbott', email: 'hannah.a@resqgrid.io', role: 'CITIZEN', phone: '+1 (555) 400-0002' },
    { name: 'Trevor Belmont', email: 'trevor.b@resqgrid.io', role: 'CITIZEN', phone: '+1 (555) 400-0003' },
    { name: 'Samantha Wu', email: 'samantha.w@resqgrid.io', role: 'CITIZEN', phone: '+1 (555) 400-0004' },
    { name: 'Carlos Mendez', email: 'carlos.m@resqgrid.io', role: 'CITIZEN', phone: '+1 (555) 400-0005' },
    { name: 'Aaliyah Khan', email: 'aaliyah.k@resqgrid.io', role: 'CITIZEN', phone: '+1 (555) 400-0006' },
    { name: 'Zack Taylor', email: 'zack.t@resqgrid.io', role: 'CITIZEN', phone: '+1 (555) 400-0007' },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: defaultPassword,
        role: u.role,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`,
      },
    });
    createdUsers.push(user);
  }

  // 2. SEED 20 RESOURCES (Units stationed across campus & city district)
  console.log('🚒 Seeding 20 Emergency Resources...');
  const baseLat = 37.7749;
  const baseLon = -122.4194;

  const resourcesData = [
    { name: 'Fire Team #02 (Engine 02)', type: 'FIRE_TEAM', capacity: 6, lat: baseLat + 0.008, lon: baseLon - 0.007, org: 'Campus Station 04', contact: '+1 555-FIRE-02', caps: ['HAZMAT', 'EXTRICATION', 'RAPID_ENTRY'], status: 'AVAILABLE' },
    { name: 'Ambulance #04 (Medic 04)', type: 'AMBULANCE', capacity: 2, lat: baseLat - 0.006, lon: baseLon + 0.008, org: 'Metro University Hospital', contact: '+1 555-MED-04', caps: ['ADVANCED_LIFE_SUPPORT', 'PEDIATRIC_CARE'], status: 'AVAILABLE' },
    { name: 'Medical Team #07 (Trauma Rapid)', type: 'MEDICAL_TEAM', capacity: 4, lat: baseLat - 0.005, lon: baseLon - 0.004, org: 'City General Trauma', contact: '+1 555-MED-07', caps: ['TRIAGE', 'SURGICAL_STABILIZATION'], status: 'AVAILABLE' },
    { name: 'Fire Truck Ladder #01', type: 'FIRE_TRUCK', capacity: 4, lat: baseLat + 0.012, lon: baseLon + 0.002, org: 'Downtown Fire HQ', contact: '+1 555-FIRE-01', caps: ['AERIAL_LADDER', 'HIGH_ANGLE_RESCUE'], status: 'AVAILABLE' },
    { name: 'Rescue Boat Unit #01', type: 'RESCUE_BOAT', capacity: 6, lat: baseLat + 0.018, lon: baseLon - 0.015, org: 'Harbor Rescue Service', contact: '+1 555-BOAT-01', caps: ['WATER_EXTRACTION', 'DIVE_TEAM'], status: 'AVAILABLE' },
    { name: 'Police Patrol Unit #03', type: 'POLICE_TEAM', capacity: 2, lat: baseLat + 0.003, lon: baseLon + 0.005, org: 'Campus Police Dept', contact: '+1 555-COPS-03', caps: ['CROWD_CONTROL', 'PERIMETER_SECURITY'], status: 'AVAILABLE' },
    { name: 'Police Tactical #09', type: 'POLICE_TEAM', capacity: 8, lat: baseLat - 0.009, lon: baseLon - 0.008, org: 'Metro Special Operations', contact: '+1 555-COPS-09', caps: ['TACTICAL_BREACH', 'ACTIVE_THREAT'], status: 'AVAILABLE' },
    { name: 'Volunteer Relief Squad Alpha', type: 'VOLUNTEER_TEAM', capacity: 12, lat: baseLat + 0.005, lon: baseLon - 0.011, org: 'Red Cross Campus Chapter', contact: '+1 555-VOL-01', caps: ['FIRST_AID', 'SHELTER_SETUP', 'LOGISTICS'], status: 'AVAILABLE' },
    { name: 'Ambulance #11 (Critical Transport)', type: 'AMBULANCE', capacity: 2, lat: baseLat + 0.015, lon: baseLon + 0.010, org: 'North District EMS', contact: '+1 555-MED-11', caps: ['ADVANCED_LIFE_SUPPORT', 'ICU_TRANSPORT'], status: 'AVAILABLE' },
    { name: 'Heavy Generator #03 (150kW)', type: 'GENERATOR', capacity: 1, lat: baseLat - 0.003, lon: baseLon + 0.014, org: 'Municipal Works', contact: '+1 555-PWR-03', caps: ['EMERGENCY_POWER', 'HOSPITAL_BACKUP'], status: 'AVAILABLE' },
    { name: 'Emergency Shelter Unit North', type: 'SHELTER', capacity: 150, lat: baseLat + 0.014, lon: baseLon - 0.005, org: 'Community Center', contact: '+1 555-SHELT-01', caps: ['TEMPORARY_HOUSING', 'MEAL_STATION'], status: 'AVAILABLE' },
    { name: 'Hazmat Decon Unit #01', type: 'FIRE_TEAM', capacity: 5, lat: baseLat - 0.012, lon: baseLon + 0.004, org: 'County Hazmat Bureau', contact: '+1 555-HAZ-01', caps: ['CHEMICAL_NEUTRALIZATION', 'BIOHAZARD'], status: 'AVAILABLE' },
    { name: 'First Aid Mobile Station #05', type: 'FIRST_AID', capacity: 20, lat: baseLat + 0.002, lon: baseLon - 0.002, org: 'Student Medical Reserve', contact: '+1 555-AID-05', caps: ['WOUND_CARE', 'HYPOTHERMIA_TREATMENT'], status: 'AVAILABLE' },
    { name: 'Emergency Water Tanker (5000 Gal)', type: 'WATER', capacity: 5000, lat: baseLat - 0.010, lon: baseLon - 0.003, org: 'Water Authority Emergency', contact: '+1 555-H2O-01', caps: ['POTABLE_WATER_DISTRIBUTION'], status: 'AVAILABLE' },
    { name: 'Fire Engine 08', type: 'FIRE_TRUCK', capacity: 5, lat: baseLat + 0.007, lon: baseLon + 0.012, org: 'Station 08 East', contact: '+1 555-FIRE-08', caps: ['PUMPER', 'FOAM_SUPPRESSION'], status: 'AVAILABLE' },
    { name: 'Ambulance #09', type: 'AMBULANCE', capacity: 2, lat: baseLat - 0.008, lon: baseLon - 0.010, org: 'Metro EMS', contact: '+1 555-MED-09', caps: ['BASIC_LIFE_SUPPORT'], status: 'AVAILABLE' },
    { name: 'Search & Rescue K9 Unit #02', type: 'VOLUNTEER_TEAM', capacity: 3, lat: baseLat + 0.011, lon: baseLon - 0.012, org: 'Canine Search League', contact: '+1 555-K9-02', caps: ['SCENT_TRACKING', 'STRUCTURAL_COLLAPSE_SEARCH'], status: 'AVAILABLE' },
    { name: 'Food Supply Logistics Van #04', type: 'FOOD', capacity: 500, lat: baseLat - 0.004, lon: baseLon + 0.006, org: 'Civic Relief Kitchen', contact: '+1 555-EAT-04', caps: ['READY_MEALS', 'MRE_DISTRIBUTION'], status: 'AVAILABLE' },
    { name: 'Electrical Grid Repair Crew #01', type: 'OTHER', capacity: 4, lat: baseLat + 0.006, lon: baseLon - 0.003, org: 'City Power Utility', contact: '+1 555-PWR-01', caps: ['HIGH_VOLTAGE_REPAIR', 'LINE_ISOLATION'], status: 'AVAILABLE' },
    { name: 'Rapid Evacuation Shuttle #02', type: 'OTHER', capacity: 35, lat: baseLat - 0.002, lon: baseLon - 0.009, org: 'Transit Authority', contact: '+1 555-BUS-02', caps: ['MASS_EVACUATION', 'WHEELCHAIR_ACCESSIBLE'], status: 'AVAILABLE' },
  ];

  const createdResources = [];
  for (const r of resourcesData) {
    const res = await prisma.resource.create({
      data: {
        name: r.name,
        type: r.type,
        capacity: r.capacity,
        latitude: r.lat,
        longitude: r.lon,
        organization: r.org,
        contact: r.contact,
        capabilities: JSON.stringify(r.caps),
        status: r.status,
      },
    });
    createdResources.push(res);
  }

  // 3. SEED 15 INCIDENTS ACROSS CATEGORIES & SEVERITIES
  console.log('🚨 Seeding 15 Geographically Coherent Incidents...');
  const incidentsData = [
    {
      code: 'RQ-2026-0001',
      title: 'Lab 4 Solvents Flash Fire',
      desc: 'Solvent cabinet ignited during organic synthesis class. Laboratory sprinkler activated.',
      cat: 'FIRE',
      sev: 'HIGH',
      status: 'RESPONDING',
      lat: baseLat + 0.004,
      lon: baseLon - 0.003,
      addr: 'Science Complex, 4th Floor, Campus West',
      affected: 6,
      vuln: 1,
      confidence: 0.95,
      priority: 78.0,
      summary: 'Flash fire contained to fume hood in Chem Lab 4. Six students evaluated for smoke exposure.',
      reasoning: 'HIGH severity due to flammable solvents and active smoke.',
    },
    {
      code: 'RQ-2026-0002',
      title: 'Basement Flooding at Dormitory Block B',
      desc: 'Ruptured main pipe caused 3 feet of water in residential laundry and elevator shafts.',
      cat: 'FLOOD',
      sev: 'MEDIUM',
      status: 'VERIFIED',
      lat: baseLat - 0.005,
      lon: baseLon + 0.004,
      addr: 'Oak Ridge Student Residences, Block B',
      affected: 18,
      vuln: 0,
      confidence: 0.91,
      priority: 54.0,
      summary: 'Water pipe failure inundating basement and electrical switchboards. Utility isolation required.',
      reasoning: 'MEDIUM severity due to property damage without life threat.',
    },
    {
      code: 'RQ-2026-0003',
      title: 'Cardiac Arrest in University Gym',
      desc: '52-year-old faculty member collapsed on running track, AED applied by bystander.',
      cat: 'MEDICAL',
      sev: 'CRITICAL',
      status: 'DISPATCHING',
      lat: baseLat + 0.002,
      lon: baseLon + 0.006,
      addr: 'Student Recreation Center, Fieldhouse Track',
      affected: 1,
      vuln: 1,
      confidence: 0.98,
      priority: 92.0,
      summary: 'Immediate life-threatening cardiac event. CPR underway.',
      reasoning: 'CRITICAL severity due to cardiac arrest and immediate threat to life.',
    },
    {
      code: 'RQ-2026-0004',
      title: 'Transit Bus vs Delivery Van Collision',
      desc: 'City shuttle bus collided with freight van at campus intersection. 4 passengers injured.',
      cat: 'ACCIDENT',
      sev: 'HIGH',
      status: 'RESPONDING',
      lat: baseLat - 0.008,
      lon: baseLon - 0.005,
      addr: 'Intersection of University Ave & 5th St',
      affected: 7,
      vuln: 2,
      confidence: 0.93,
      priority: 72.0,
      summary: 'Multi-vehicle collision blocking eastbound lanes. Moderate injuries requiring transport.',
      reasoning: 'HIGH severity due to multi-casualty transport requirement and traffic blockage.',
    },
    {
      code: 'RQ-2026-0005',
      title: 'Pedestrian Walkway Ceiling Collapse',
      desc: 'Section of plaster and concrete facade fell onto covered walkway during heavy rain.',
      cat: 'STRUCTURAL',
      sev: 'MEDIUM',
      status: 'VERIFIED',
      lat: baseLat + 0.006,
      lon: baseLon + 0.001,
      addr: 'Arts Center Covered Concourse',
      affected: 2,
      vuln: 0,
      confidence: 0.88,
      priority: 56.0,
      summary: 'Structural facade failure. Area cordoned off; engineering inspection required.',
      reasoning: 'MEDIUM severity as pedestrian path has alternative routes.',
    },
    {
      code: 'RQ-2026-0006',
      title: 'Substation Transformer Arcing & Sparking',
      desc: 'Loud buzzing and visible fire arcing reported at campus secondary substation.',
      cat: 'ELECTRICAL',
      sev: 'HIGH',
      status: 'REPORTED',
      lat: baseLat - 0.002,
      lon: baseLon - 0.010,
      addr: 'Substation 4B, Facilities Yard',
      affected: 0,
      vuln: 0,
      confidence: 0.89,
      priority: 68.0,
      summary: 'Electrical explosion hazard with potential blackout risk for campus hospital wing.',
      reasoning: 'HIGH severity due to high-voltage equipment fire danger.',
    },
    {
      code: 'RQ-2026-0007',
      title: 'Suspected Gas Odor in Dining Hall',
      desc: 'Strong sulfur odor detected near commercial kitchen ranges. Kitchen staff evacuated.',
      cat: 'HAZMAT',
      sev: 'HIGH',
      status: 'VERIFYING',
      lat: baseLat + 0.001,
      lon: baseLon - 0.006,
      addr: 'Commons Dining Hall Kitchen, Ground Floor',
      affected: 24,
      vuln: 0,
      confidence: 0.92,
      priority: 74.0,
      summary: 'Potential natural gas line compromise in main dining facility.',
      reasoning: 'HIGH severity due to explosion hazard and high occupancy building.',
    },
    {
      code: 'RQ-2026-0008',
      title: 'Missing Vulnerable Student near Arboretum',
      desc: 'Non-verbal autistic student separated from tour group near densely wooded trail.',
      cat: 'MISSING_PERSON',
      sev: 'CRITICAL',
      status: 'RESPONDING',
      lat: baseLat + 0.012,
      lon: baseLon - 0.008,
      addr: 'Botanical Gardens, North Trailhead',
      affected: 1,
      vuln: 1,
      confidence: 0.96,
      priority: 88.0,
      summary: 'Urgent search underway for vulnerable missing individual before nightfall.',
      reasoning: 'CRITICAL severity because subject is vulnerable with sensory limitations in wilderness.',
    },
    {
      code: 'RQ-2026-0009',
      title: 'Unauthorized Intruder with Threat in Admin Tower',
      desc: 'Aggressive individual refusing to leave registrar office, shouting threats.',
      cat: 'SECURITY',
      sev: 'HIGH',
      status: 'VERIFIED',
      lat: baseLat - 0.004,
      lon: baseLon + 0.002,
      addr: 'Administration Tower, Suite 210',
      affected: 8,
      vuln: 0,
      confidence: 0.94,
      priority: 76.0,
      summary: 'Disturbance and verbal threat in administrative offices. Lockdown protocol active.',
      reasoning: 'HIGH severity for personnel safety in confined administrative suites.',
    },
    {
      code: 'RQ-2026-0010',
      title: 'Dumpster Fire behind Engineering Annex',
      desc: 'Cardboard and wood pallets in industrial recycling dumpster burning vigorously.',
      cat: 'FIRE',
      sev: 'LOW',
      status: 'RESOLVED',
      lat: baseLat + 0.009,
      lon: baseLon + 0.008,
      addr: 'Engineering Yard Alleyway',
      affected: 0,
      vuln: 0,
      confidence: 0.99,
      priority: 32.0,
      summary: 'Isolated outdoor dumpster fire safely extinguished by Engine 08.',
      reasoning: 'LOW severity as fire was outdoor, contained, with zero exposures.',
    },
    {
      code: 'RQ-2026-0011',
      title: 'Heatstroke Incident at Outdoor Commencement',
      desc: 'Elderly attendee collapsed in direct sun, exhibiting confusion and high pulse.',
      cat: 'MEDICAL',
      sev: 'MEDIUM',
      status: 'RESOLVED',
      lat: baseLat - 0.007,
      lon: baseLon - 0.001,
      addr: 'Memorial Stadium Plaza',
      affected: 1,
      vuln: 1,
      confidence: 0.93,
      priority: 58.0,
      summary: 'Patient cooled with ice packs, rehydrated, and transported in stable condition.',
      reasoning: 'MEDIUM severity due to quick stabilization.',
    },
    {
      code: 'RQ-2026-0012',
      title: 'Minor Bicycle vs Skateboarder Accident',
      desc: 'Two students collided on shared pedestrian pathway. Minor scrapes and sprained wrist.',
      cat: 'ACCIDENT',
      sev: 'LOW',
      status: 'RESOLVED',
      lat: baseLat + 0.003,
      lon: baseLon - 0.001,
      addr: 'Central Quad Promenade',
      affected: 2,
      vuln: 0,
      confidence: 0.90,
      priority: 28.0,
      summary: 'First aid bandage applied on site. No emergency transport required.',
      reasoning: 'LOW severity non-emergent incident.',
    },
    {
      code: 'RQ-2026-0013',
      title: 'Elevator Entrapment with 4 Occupants',
      desc: 'Car stalled between 3rd and 4th floors in Humanities building. Passengers calm.',
      cat: 'STRUCTURAL',
      sev: 'MEDIUM',
      status: 'ON_SCENE',
      lat: baseLat - 0.001,
      lon: baseLon + 0.009,
      addr: 'Humanities Tower, Elevator #2',
      affected: 4,
      vuln: 0,
      confidence: 0.95,
      priority: 52.0,
      summary: 'Elevator mechanics and campus technicians lowering car to 3rd floor landing.',
      reasoning: 'MEDIUM severity with ventilation intact and occupants stable.',
    },
    {
      code: 'RQ-2026-0014',
      title: 'Chlorine Odor near Aquatic Center Filter Room',
      desc: 'Maintenance technician noticed pungent chlorine bleach smell near chlorinator pump.',
      cat: 'HAZMAT',
      sev: 'HIGH',
      status: 'VERIFIED',
      lat: baseLat + 0.010,
      lon: baseLon - 0.004,
      addr: 'Natatorium Utility Basement',
      affected: 3,
      vuln: 0,
      confidence: 0.91,
      priority: 70.0,
      summary: 'Chlorine supply valve isolated. Air scrubbing system active.',
      reasoning: 'HIGH severity due to respiratory inhalation hazard in enclosed basement.',
    },
    {
      code: 'RQ-2026-0015',
      title: 'Campus Perimeter Gate Security Malfunction',
      desc: 'Vehicle crash barrier jammed in upright position, blocking emergency egress.',
      cat: 'SECURITY',
      sev: 'LOW',
      status: 'REPORTED',
      lat: baseLat - 0.011,
      lon: baseLon - 0.006,
      addr: 'South Security Gate 2',
      affected: 0,
      vuln: 0,
      confidence: 0.85,
      priority: 35.0,
      summary: 'Hydraulic line depressurized; technicians en route to manual override gate.',
      reasoning: 'LOW severity with alternative gate accessible 200m away.',
    },
  ];

  const createdIncidents = [];
  for (const inc of incidentsData) {
    const created = await prisma.incident.create({
      data: {
        incidentCode: inc.code,
        title: inc.title,
        description: inc.desc,
        category: inc.cat,
        severity: inc.sev,
        status: inc.status,
        latitude: inc.lat,
        longitude: inc.lon,
        address: inc.addr,
        affectedPeople: inc.affected,
        vulnerablePeople: inc.vuln,
        confidenceScore: inc.confidence,
        priorityScore: inc.priority,
        source: 'CITIZEN_REPORT',
        aiSummary: inc.summary,
        aiReasoning: inc.reasoning,
        createdBy: createdUsers[Math.floor(Math.random() * 5) + 13].id,
      },
    });
    createdIncidents.push(created);
  }

  // 4. SEED 30 INCIDENT REPORTS (with duplicate clusters)
  console.log('📝 Seeding 30 Incident Reports (with duplicate signal clusters)...');
  const reportsData = [
    // Reports for Incident #1 (Fire)
    { incIdx: 0, text: 'Solvents caught fire in Chem Lab 4! Sprinklers on!', source: 'MOBILE_APP' },
    { incIdx: 0, text: 'Heavy smoke coming from 4th floor chemistry wing, smell of burning ether.', source: 'VOICE_TRANSCRIPT' },
    { incIdx: 0, text: 'Fire alarm sounding in Science complex, people coughing on stairs.', source: 'WEB_APP' },
    // Reports for Incident #2 (Flood)
    { incIdx: 1, text: 'Water pouring under Dorm B basement doors! Laundry machines underwater!', source: 'WEB_APP' },
    { incIdx: 1, text: 'Pipe broke in Block B, water rising fast near elevator shaft.', source: 'MOBILE_APP' },
    // Reports for Incident #3 (Medical)
    { incIdx: 2, text: 'Person collapsed on indoor track! CPR needed immediately at gym!', source: 'VOICE_TRANSCRIPT' },
    { incIdx: 2, text: 'Medical emergency student gym, AED is beeping, send ambulance now!', source: 'MOBILE_APP' },
    // Reports for Incident #4 (Accident)
    { incIdx: 3, text: 'Campus bus smashed into delivery truck at 5th St! Passengers thrown around!', source: 'WEB_APP' },
    { incIdx: 3, text: 'Bad crash at University and 5th, bus windshield shattered, people bleeding.', source: 'MOBILE_APP' },
    { incIdx: 3, text: 'Traffic blocked at 5th St intersection due to bus crash.', source: 'SMS' },
    // Reports for Incident #5 (Structural)
    { incIdx: 4, text: 'Ceiling chunks fell down on covered walkway near Arts center!', source: 'WEB_APP' },
    // Reports for Incident #6 (Electrical)
    { incIdx: 5, text: 'Huge electrical sparks and popping sound at substation 4B yard.', source: 'MOBILE_APP' },
    { incIdx: 5, text: 'Transformer smoking and buzzing loudly near facilities.', source: 'WEB_APP' },
    // Reports for Incident #7 (Hazmat)
    { incIdx: 6, text: 'Strong rotten egg sulfur gas smell in dining hall, kitchen evacuated.', source: 'MOBILE_APP' },
    { incIdx: 6, text: 'Gas leak suspected in dining hall kitchen, everyone cleared outside.', source: 'VOICE_TRANSCRIPT' },
    // Reports for Incident #8 (Missing Person)
    { incIdx: 7, text: 'Missing student from group tour at botanical garden, non-verbal with autism.', source: 'WEB_APP' },
    { incIdx: 7, text: 'Cannot find student last seen near north trailhead 20 mins ago.', source: 'MOBILE_APP' },
    // Reports for Incident #9 (Security)
    { incIdx: 8, text: 'Disturbance in admin building room 210, man shouting threats at staff.', source: 'WEB_APP' },
    // Reports for Incident #10 (Dumpster Fire)
    { incIdx: 9, text: 'Dumpster on fire behind engineering annex, pallets burning.', source: 'MOBILE_APP' },
    // Reports for Incident #11 (Heatstroke)
    { incIdx: 10, text: 'Elderly gentleman fainted in the sun during ceremony at stadium.', source: 'WEB_APP' },
    // Reports for Incident #12 (Bicycle)
    { incIdx: 11, text: 'Bike collided with skateboard on quad, scraped elbow and wrist.', source: 'MOBILE_APP' },
    // Reports for Incident #13 (Elevator)
    { incIdx: 12, text: 'Elevator stopped between 3 and 4 in Humanities, 4 people inside ringing alarm.', source: 'WEB_APP' },
    { incIdx: 12, text: 'People stuck in elevator humanities tower, emergency call button pressed.', source: 'SMS' },
    // Reports for Incident #14 (Chlorine)
    { incIdx: 13, text: 'Pungent chlorine gas odor in pool basement near pumps.', source: 'WEB_APP' },
    // Reports for Incident #15 (Gate)
    { incIdx: 14, text: 'South gate security barrier won’t lower, car waiting.', source: 'MOBILE_APP' },
    // Additional crowd duplicate reports
    { incIdx: 0, text: 'Multiple sirens approaching science building chemistry fire.', source: 'MOBILE_APP' },
    { incIdx: 3, text: 'Bus accident intersection 5th still completely jammed.', source: 'MOBILE_APP' },
    { incIdx: 6, text: 'Dining hall smelling stronger of gas, please check immediately.', source: 'SMS' },
    { incIdx: 7, text: 'Search party gathering at gardens north entrance for missing student.', source: 'MOBILE_APP' },
    { incIdx: 1, text: 'Water level in dorm basement now reached elevator equipment.', source: 'WEB_APP' },
  ];

  for (let i = 0; i < reportsData.length; i++) {
    const rep = reportsData[i];
    const parentIncident = createdIncidents[rep.incIdx];
    await prisma.incidentReport.create({
      data: {
        incidentId: parentIncident.id,
        reporterId: createdUsers[13 + (i % 7)].id,
        text: rep.text,
        source: rep.source,
        latitude: parentIncident.latitude + (Math.random() - 0.5) * 0.001,
        longitude: parentIncident.longitude + (Math.random() - 0.5) * 0.001,
        confidenceScore: 0.92,
      },
    });
  }

  // 5. SEED 10 ACTIVE & RECENT DISPATCHES
  console.log('⚡ Seeding 10 Dispatches...');
  const dispatchesData = [
    { incIdx: 0, resIdx: 0, status: 'EN_ROUTE', eta: 3, dist: 1.1, notes: 'Engine 02 responding with foam pack' },
    { incIdx: 0, resIdx: 1, status: 'EN_ROUTE', eta: 4, dist: 1.5, notes: 'Medic 04 responding for smoke inhalation evaluation' },
    { incIdx: 2, resIdx: 2, status: 'EN_ROUTE', eta: 2, dist: 0.8, notes: 'Trauma Rapid dispatched Code 3 for cardiac CPR' },
    { incIdx: 3, resIdx: 5, status: 'ON_SCENE', eta: 0, dist: 0.4, notes: 'Police patrol 03 diverting traffic at 5th St' },
    { incIdx: 3, resIdx: 8, status: 'EN_ROUTE', eta: 5, dist: 2.1, notes: 'Ambulance 11 transport for two passengers' },
    { incIdx: 7, resIdx: 16, status: 'ON_SCENE', eta: 0, dist: 0.9, notes: 'K9 search unit deployed on north botanical trail' },
    { incIdx: 12, resIdx: 3, status: 'ON_SCENE', eta: 0, dist: 1.3, notes: 'Ladder 01 providing extrication gear for elevator shaft' },
    { incIdx: 9, resIdx: 14, status: 'COMPLETED', eta: 0, dist: 1.0, notes: 'Engine 08 extinguished dumpster fire' },
    { incIdx: 10, resIdx: 15, status: 'COMPLETED', eta: 0, dist: 0.8, notes: 'Ambulance 09 treated heat exhaustion' },
    { incIdx: 11, resIdx: 12, status: 'COMPLETED', eta: 0, dist: 0.2, notes: 'Mobile First Aid treated abrasion' },
  ];

  for (const d of dispatchesData) {
    const parentIncident = createdIncidents[d.incIdx];
    const parentResource = createdResources[d.resIdx];

    await prisma.dispatch.create({
      data: {
        incidentId: parentIncident.id,
        resourceId: parentResource.id,
        assignedBy: createdUsers[2].id, // Commander Sarah Jenkins
        status: d.status,
        etaMinutes: d.eta,
        distanceKm: d.dist,
        notes: d.notes,
        assignedAt: new Date(Date.now() - 25 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 23 * 60 * 1000),
        arrivedAt: d.status === 'ON_SCENE' || d.status === 'COMPLETED' ? new Date(Date.now() - 10 * 60 * 1000) : null,
        completedAt: d.status === 'COMPLETED' ? new Date(Date.now() - 5 * 60 * 1000) : null,
      },
    });

    // Update resource status to match
    let resStatus = 'AVAILABLE';
    if (d.status === 'EN_ROUTE') resStatus = 'EN_ROUTE';
    else if (d.status === 'ON_SCENE') resStatus = 'ON_SCENE';
    else if (d.status === 'ASSIGNED') resStatus = 'ASSIGNED';

    await prisma.resource.update({
      where: { id: parentResource.id },
      data: { status: resStatus },
    });
  }

  // 6. SEED 20 NOTIFICATIONS
  console.log('🔔 Seeding 20 Real-Time Notifications...');
  const notificationsData = [
    { title: 'Critical Alert: Chemistry Building Fire', msg: 'CRITICAL Fire: RQ-2026-0001 reported with potential solvent hazard.', type: 'INCIDENT_ALERT' },
    { title: 'Units Dispatched to RQ-2026-0001', msg: 'Engine 02 and Medic 04 assigned by Command.', type: 'DISPATCH_ASSIGNED' },
    { title: 'Cardiac Emergency: Rec Center Track', msg: 'CRITICAL Medical: RQ-2026-0003 faculty member collapsed, AED active.', type: 'INCIDENT_ALERT' },
    { title: 'Trauma Rapid En Route', msg: 'Medical Team #07 accepted dispatch to Rec Center Track. ETA 2 min.', type: 'STATUS_UPDATE' },
    { title: 'Multi-Vehicle Collision at 5th St', msg: 'RQ-2026-0004 City bus and van collision with 7 passengers affected.', type: 'INCIDENT_ALERT' },
    { title: 'Police Perimeter Established', msg: 'Police Patrol Unit #03 arrived on scene at University & 5th.', type: 'STATUS_UPDATE' },
    { title: 'K9 Search Team Deployed', msg: 'Canine Unit #02 deployed for vulnerable missing student at Arboretum.', type: 'DISPATCH_ASSIGNED' },
    { title: 'Duplicate Report Fused: 94% Match', msg: 'Incoming citizen report merged into active flood incident RQ-2026-0002.', type: 'DUPLICATE_REPORT' },
    { title: 'Gas Odor Warning: Commons Kitchen', msg: 'RQ-2026-0007 Gas leak reported. Kitchen evacuated as precaution.', type: 'INCIDENT_ALERT' },
    { title: 'High Voltage Alert: Substation 4B', msg: 'RQ-2026-0006 Arcing detected. Facilities notified.', type: 'INCIDENT_ALERT' },
    { title: 'Dumpster Fire Controlled', msg: 'Engine 08 successfully extinguished debris fire behind engineering annex.', type: 'INCIDENT_RESOLVED' },
    { title: 'Heatstroke Patient Discharged', msg: 'Elderly patient stabilized and resting in medical tent.', type: 'INCIDENT_RESOLVED' },
    { title: 'Elevator Extrication Underway', msg: 'Ladder 01 on scene at Humanities Tower. Stalled car secured.', type: 'STATUS_UPDATE' },
    { title: 'Dorm Water Isolation Complete', msg: 'Plumbing valves closed at Block B basement. Pumping commencing.', type: 'STATUS_UPDATE' },
    { title: 'Chlorine Neutralization Active', msg: 'Hazmat scrubbers running in Natatorium pump basement.', type: 'STATUS_UPDATE' },
    { title: 'Weather Advisory: Heavy Rain Front', msg: 'Campus meteorological sensor warns of flash flooding risk.', type: 'SYSTEM' },
    { title: 'Resource Status Change', msg: 'Volunteer Relief Squad Alpha reported on standby for storm assistance.', type: 'RESOURCE_UPDATE' },
    { title: 'Shift Handover Complete', msg: 'Command Center Operator shift transitioned to Sarah Jenkins.', type: 'SYSTEM' },
    { title: 'Quad Promenade Minor Collision Resolved', msg: 'RQ-2026-0012 resolved after first aid treatment.', type: 'INCIDENT_RESOLVED' },
    { title: 'System Diagnostics OK', msg: 'AI signal processing engine and WebSocket broker operational at 100% health.', type: 'SYSTEM' },
  ];

  for (let i = 0; i < notificationsData.length; i++) {
    const notif = notificationsData[i];
    await prisma.notification.create({
      data: {
        userId: createdUsers[2].id,
        incidentId: createdIncidents[i % createdIncidents.length].id,
        type: notif.type,
        title: notif.title,
        message: notif.msg,
        isRead: i > 5,
        createdAt: new Date(Date.now() - i * 12 * 60 * 1000),
      },
    });
  }

  // 7. SEED 50 AUDIT LOGS
  console.log('📜 Seeding 50 Audit Logs...');
  const auditActions = [
    'incident_created',
    'incident_verified',
    'dispatch_created',
    'responder_accepted',
    'responder_arrived',
    'incident_merged',
    'resource_assigned',
    'incident_resolved',
  ];

  for (let i = 0; i < 50; i++) {
    const action = auditActions[i % auditActions.length];
    const inc = createdIncidents[i % createdIncidents.length];
    const user = createdUsers[i % 5 + 2];

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action,
        entityType: 'INCIDENT',
        entityId: inc.id,
        metadata: JSON.stringify({
          incidentCode: inc.incidentCode,
          actionSummary: `Action ${action} executed by ${user.name}`,
          timestamp: new Date(Date.now() - i * 35 * 60 * 1000).toISOString(),
        }),
        createdAt: new Date(Date.now() - i * 35 * 60 * 1000),
      },
    });
  }

  console.log('✅ ResQGrid Database successfully seeded!');
  console.log(`📊 Total: 20 Users, 20 Resources, 15 Incidents, 30 Reports, 10 Dispatches, 20 Notifications, 50 Audit Logs.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
