import mongoose from 'mongoose';
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;
const MONGO_URI = 'mongodb://127.0.0.1:27017/petverse';

interface TestResult {
  section: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(section: string, name: string, passed: boolean, details: string) {
  results.push({ section, name, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${section} — ${name}: ${details}`);
}

async function run() {
  console.log('=== PETVERSE P0 VERIFICATION GATE EXECUTION ===\n');

  // 1. Health & Readiness
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    record('Section 3: Readiness', '/health endpoint', health.status === 200 && health.data.data.status === 'ok', `status=${health.data.data.status}`);

    const ready = await axios.get(`${BASE_URL}/ready`);
    record('Section 3: Readiness', '/ready endpoint', ready.status === 200 && ready.data.data.status === 'ready' && ready.data.data.dependencies.mongodb.status === 'up', `status=${ready.data.data.status}, mongodb=${ready.data.data.dependencies.mongodb.status}`);
  } catch (err: any) {
    record('Section 3: Readiness', 'Health/Ready check', false, err.message);
  }

  // Connect to DB for internal verification
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db!;

  // Clean up any test reminders from previous runs
  await db.collection('reminders').deleteMany({ title: /Audit/i });

  // 2. Auth & Token Rotation
  const uniqueId = Date.now();
  const userAEmail = `audit_userA_${uniqueId}@test.com`;
  const userBEmail = `audit_userB_${uniqueId}@test.com`;
  const password = 'TestPassword123!';

  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let refreshCookie = '';

  try {
    // Register User A
    const regA = await axios.post(`${API_URL}/auth/register`, {
      email: userAEmail,
      password,
      firstName: 'Audit',
      lastName: 'UserA',
    });
    userAToken = regA.data.data.accessToken;
    userAId = (regA.data.data.user?.id || regA.data.data.user?._id)?.toString();
    record('Section 4: Auth', 'User A Registration', regA.status === 201 && !!userAToken, `userId=${userAId}`);

    // Capture set-cookie for refresh token
    const cookies = regA.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      refreshCookie = cookies[0];
      const cookieHeader = refreshCookie.split(';')[0];
      const hasHttpOnly = refreshCookie.toLowerCase().includes('httponly');
      const hasSameSite = refreshCookie.toLowerCase().includes('samesite');
      record('Section 11: Refresh Token', 'Cookie security attributes', hasHttpOnly && hasSameSite, `Cookie: ${cookieHeader} (HttpOnly=${hasHttpOnly}, SameSite=${hasSameSite})`);
    } else {
      record('Section 11: Refresh Token', 'Cookie security attributes', false, 'No set-cookie received');
    }

    // Register User B
    const regB = await axios.post(`${API_URL}/auth/register`, {
      email: userBEmail,
      password,
      firstName: 'Audit',
      lastName: 'UserB',
    });
    userBToken = regB.data.data.accessToken;
    userBId = (regB.data.data.user?.id || regB.data.data.user?._id)?.toString();
    record('Section 4: Auth', 'User B Registration', regB.status === 201 && !!userBToken, `userId=${userBId}`);

    // Test Refresh Token Rotation
    if (refreshCookie) {
      const oldCookieHeader = refreshCookie.split(';')[0];
      const refRes = await axios.post(`${API_URL}/auth/refresh`, {}, {
        headers: { Cookie: oldCookieHeader },
      });
      const newAccessToken = refRes.data.data.accessToken;
      const newSetCookie = refRes.headers['set-cookie'];
      const newCookieHeader = newSetCookie ? newSetCookie[0].split(';')[0] : '';

      // Test that the newly issued rotated refresh token works for subsequent refreshes
      let thirdCookieHeader = '';
      if (newCookieHeader) {
        try {
          const secondRef = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: { Cookie: newCookieHeader },
          });
          const thirdSetCookie = secondRef.headers['set-cookie'];
          thirdCookieHeader = thirdSetCookie ? thirdSetCookie[0].split(';')[0] : '';
          record('Section 11: Refresh Token', 'New Rotated Token Accepted', secondRef.status === 200 && !!secondRef.data.data.accessToken, 'New token works seamlessly');
          userAToken = secondRef.data.data.accessToken;
        } catch (secRefErr: any) {
          record('Section 11: Refresh Token', 'New Rotated Token Accepted', false, secRefErr.message);
        }
      } else {
        userAToken = newAccessToken;
      }

      // Test Reuse Detection: attempting to use the original old cookie now triggers reuse detection
      try {
        await axios.post(`${API_URL}/auth/refresh`, {}, {
          headers: { Cookie: oldCookieHeader },
        });
        record('Section 11: Refresh Token', 'Reuse Detection', false, 'Old token was accepted (expected rejection)');
      } catch (reuseErr: any) {
        record('Section 11: Refresh Token', 'Reuse Detection', reuseErr.response?.status === 401 || reuseErr.response?.status === 403, `Rejected with ${reuseErr.response?.status} ${JSON.stringify(reuseErr.response?.data?.error || reuseErr.response?.data)}`);
      }
    }
  } catch (err: any) {
    record('Section 4: Auth', 'Registration / Token Test', false, err.response?.data?.message || err.message);
  }

  // 3. Pet CRUD & Vaccination Security
  let petAId = '';
  try {
    // User A creates Pet A
    const petRes = await axios.post(`${API_URL}/pets`, {
      name: 'AuditLuna',
      species: 'dog',
      breed: 'Golden Retriever',
      gender: 'female',
      weight: 22.5,
      dateOfBirth: '2023-01-01',
    }, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    petAId = petRes.data.data?._id || petRes.data.data?.id;
    record('Section 5: Pet CRUD', 'Create Pet A', petRes.status === 201 && !!petAId, `petId=${petAId}`);

    // User A can read Pet A
    const getPet = await axios.get(`${API_URL}/pets/${petAId}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    record('Section 5: Pet CRUD', 'Read Pet A (User A)', getPet.status === 200 && getPet.data.data.name === 'AuditLuna', 'User A read successful');

    // User B tries to read Pet A -> 403 Forbidden
    try {
      await axios.get(`${API_URL}/pets/${petAId}`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      record('Section 6: Vaccination & Pet Security', 'User B read Pet A', false, 'User B read succeeded (expected 403)');
    } catch (secErr: any) {
      record('Section 6: Vaccination & Pet Security', 'User B read Pet A (Forbidden)', secErr.response?.status === 403, `Status: ${secErr.response?.status}`);
    }

    // User A creates a vaccination record
    const dummyVaccineId = new mongoose.Types.ObjectId().toString();
    const vacRes = await axios.post(`${API_URL}/vaccinations/${petAId}/records`, {
      vaccineId: dummyVaccineId,
      status: 'completed',
      currentDoseNumber: 1,
      notes: 'Initial Rabies',
    }, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const vacRecordId = vacRes.data.data?._id || vacRes.data.data?.id;
    record('Section 6: Vaccination & Pet Security', 'User A record vaccination', vacRes.status === 201 && !!vacRecordId, `recordId=${vacRecordId}`);

    // User B attempts to create vaccination for Pet A -> 403
    try {
      await axios.post(`${API_URL}/vaccinations/${petAId}/records`, {
        vaccineId: dummyVaccineId,
        status: 'completed',
        currentDoseNumber: 1,
      }, {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      record('Section 6: Vaccination & Pet Security', 'User B create vaccination on Pet A', false, 'Allowed (expected 403)');
    } catch (vacSecErr: any) {
      record('Section 6: Vaccination & Pet Security', 'User B create vaccination on Pet A (Forbidden)', vacSecErr.response?.status === 403, `Status: ${vacSecErr.response?.status}`);
    }

    // User B attempts to delete User A's vaccination record -> 403 or 404
    try {
      await axios.delete(`${API_URL}/vaccinations/${petAId}/records/${vacRecordId}`, {
        headers: { Authorization: `Bearer ${userBToken}` },
      });
      record('Section 6: Vaccination & Pet Security', 'User B delete vaccination on Pet A', false, 'Allowed (expected 403/404)');
    } catch (delSecErr: any) {
      record('Section 6: Vaccination & Pet Security', 'User B delete vaccination on Pet A (Forbidden)', delSecErr.response?.status === 403 || delSecErr.response?.status === 404, `Status: ${delSecErr.response?.status}`);
    }
  } catch (err: any) {
    record('Section 5/6: Pet & Vaccination', 'Execution error', false, err.response?.data?.message || err.message);
  }

  // 4. Appointment Domain Events (Section 7)
  let appointmentId = '';
  try {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const aptRes = await axios.post(`${API_URL}/appointments`, {
      petId: petAId,
      appointmentDate: tomorrow,
      startTime: '14:30',
      type: 'checkup',
      notes: 'General checkup',
    }, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    appointmentId = aptRes.data.data?._id || aptRes.data.data?.id;
    record('Section 7: Appointment Events', 'Book Appointment', aptRes.status === 201 && !!appointmentId, `aptId=${appointmentId}`);

    // Wait 300ms for event bus async dispatch
    await new Promise((r) => setTimeout(r, 400));

    // Verify AppointmentBooked domain event in MongoDB
    const bookedEvent = await db.collection('events').findOne({
      aggregateId: appointmentId,
      eventType: 'APPOINTMENT_BOOKED',
    });
    record('Section 7: Appointment Events', 'AppointmentBooked Domain Event in MongoDB', !!bookedEvent, bookedEvent ? `Found eventId=${bookedEvent._id} eventType=${bookedEvent.eventType}` : 'Not found');

    // Cancel appointment via POST /appointments/:id/cancel
    const cancelRes = await axios.post(`${API_URL}/appointments/${appointmentId}/cancel`, {
      reason: 'Scheduling conflict',
    }, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    record('Section 7: Appointment Events', 'Cancel Appointment', cancelRes.status === 200, 'Cancelled via API');

    await new Promise((r) => setTimeout(r, 400));

    const cancelEvent = await db.collection('events').findOne({
      aggregateId: appointmentId,
      eventType: 'APPOINTMENT_CANCELLED',
    });
    record('Section 7: Appointment Events', 'AppointmentCancelled Domain Event in MongoDB', !!cancelEvent, cancelEvent ? `Found eventId=${cancelEvent._id} eventType=${cancelEvent.eventType}` : 'Not found');
  } catch (err: any) {
    record('Section 7: Appointment Events', 'Appointment execution error', false, err.response?.data?.message || err.message);
  }

  // 5. Reminder Idempotency (Section 8)
  try {
    const idempotencyKey = `evt-audit-${Date.now()}::medication::${petAId}`;
    const reminderData = {
      ownerId: userAId,
      petId: petAId,
      type: 'medication',
      title: 'Audit Idempotent Reminder',
      frequency: 'daily',
      timezone: 'UTC',
      nextTrigger: new Date(Date.now() + 86400000).toISOString(),
      isActive: true,
      missedCount: 0,
      completedCount: 0,
      notificationChannels: ['in-app'],
      priority: 'medium',
      idempotencyKey,
    };

    // First insertion
    await db.collection('reminders').insertOne({ ...reminderData });

    // Replay same event / same idempotencyKey 3 times
    let caughtDuplicates = 0;
    for (let i = 0; i < 3; i++) {
      try {
        await db.collection('reminders').insertOne({ ...reminderData, _id: new mongoose.Types.ObjectId() });
      } catch (dupErr: any) {
        if (dupErr.code === 11000) caughtDuplicates++;
      }
    }

    const totalWithKey = await db.collection('reminders').countDocuments({ idempotencyKey });
    record('Section 8: Reminder Idempotency', 'Unique sparse index prevents duplicates', totalWithKey === 1 && caughtDuplicates === 3, `Count=${totalWithKey}, Blocked duplicate attempts=${caughtDuplicates}/3`);
  } catch (err: any) {
    record('Section 8: Reminder Idempotency', 'Test error', false, err.message);
  }

  // 6. Validation (Section 12) - Malformed mutation payloads
  try {
    // Missing required fields
    try {
      await axios.post(`${API_URL}/pets`, { name: '' }, { headers: { Authorization: `Bearer ${userAToken}` } });
      record('Section 12: Validation', 'Empty payload rejected', false, 'Allowed (expected 422)');
    } catch (vErr: any) {
      record('Section 12: Validation', 'Missing required fields -> 422', vErr.response?.status === 422, `Status: ${vErr.response?.status}, Error: ${JSON.stringify(vErr.response?.data?.error?.code || vErr.response?.data)}`);
    }

    // Invalid enum
    try {
      await axios.post(`${API_URL}/pets`, { name: 'Fluffy', species: 'dragon' }, { headers: { Authorization: `Bearer ${userAToken}` } });
      record('Section 12: Validation', 'Invalid enum rejected', false, 'Allowed (expected 422)');
    } catch (vErr: any) {
      record('Section 12: Validation', 'Invalid enum -> 422', vErr.response?.status === 422, `Status: ${vErr.response?.status}`);
    }
  } catch (err: any) {
    record('Section 12: Validation', 'Validation test error', false, err.message);
  }

  // 7. Pet Cascade Deletion & Database Orphan Audit (Section 9 & 17)
  try {
    // Populate operational records for Pet A
    await db.collection('medicalrecords').insertOne({
      petId: new mongoose.Types.ObjectId(petAId),
      ownerId: new mongoose.Types.ObjectId(userAId),
      type: 'examination',
      date: new Date(),
      isDeleted: false,
    });

    await db.collection('medicationprescriptions').insertOne({
      petId: petAId,
      ownerId: userAId,
      status: 'active',
      issuedAt: new Date(),
      createdBy: userAId,
      isDeleted: false,
    });

    // Delete Pet A via API
    const delPetRes = await axios.delete(`${API_URL}/pets/${petAId}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    record('Section 9: Pet Cascade', 'Delete Pet A via API', delPetRes.status === 200 || delPetRes.status === 204, `Pet deleted successfully (status ${delPetRes.status})`);

    // Wait for cascade
    await new Promise((r) => setTimeout(r, 500));

    // Check cascade cleanup
    const petInDb = await db.collection('pets').findOne({ _id: new mongoose.Types.ObjectId(petAId) });
    const appointmentsLeft = await db.collection('appointments').countDocuments({ petId: petAId, status: { $ne: 'cancelled' } });
    const remindersLeft = await db.collection('reminders').countDocuments({ petId: new mongoose.Types.ObjectId(petAId), isActive: true });
    const activePrescriptions = await db.collection('medicationprescriptions').countDocuments({ petId: petAId, isDeleted: false });

    record('Section 9: Pet Cascade', 'Operational resources removed / deactivated', !petInDb && appointmentsLeft === 0 && remindersLeft === 0 && activePrescriptions === 0, `PetExists=${!!petInDb}, ActiveAppointments=${appointmentsLeft}, ActiveReminders=${remindersLeft}, ActiveRx=${activePrescriptions}`);

    // Section 17: Database Orphan Audit
    console.log('\n--- Running Section 17 Database Orphan Audit ---');
    const allPets = await db.collection('pets').find({}, { projection: { _id: 1 } }).toArray();
    const petIdSet = new Set(allPets.map((p) => p._id.toString()));

    const checkCollectionForOrphans = async (colName: string, petField: string, filter: any = {}) => {
      const docs = await db.collection(colName).find(filter).toArray();
      let orphanCount = 0;
      for (const doc of docs) {
        const pId = doc[petField]?.toString();
        if (pId && !petIdSet.has(pId)) {
          orphanCount++;
        }
      }
      return { total: docs.length, orphans: orphanCount };
    };

    const aptOrphans = await checkCollectionForOrphans('appointments', 'petId', { status: { $ne: 'cancelled' } });
    const remOrphans = await checkCollectionForOrphans('reminders', 'petId', { isActive: true });
    const rxOrphans = await checkCollectionForOrphans('medicationprescriptions', 'petId', { isDeleted: false });
    const vacOrphans = await checkCollectionForOrphans('vaccinationrecords', 'petId', { isDeleted: false });

    console.log(`Active Appointments orphans: ${aptOrphans.orphans}/${aptOrphans.total}`);
    console.log(`Active Reminders orphans: ${remOrphans.orphans}/${remOrphans.total}`);
    console.log(`Active Prescriptions orphans: ${rxOrphans.orphans}/${rxOrphans.total}`);
    console.log(`Active Vaccination records orphans: ${vacOrphans.orphans}/${vacOrphans.total}`);

    const totalActiveOrphans = aptOrphans.orphans + remOrphans.orphans + rxOrphans.orphans + vacOrphans.orphans;
    record('Section 17: Database Orphan Audit', 'Zero operational orphan records', totalActiveOrphans === 0, `Total active orphans = ${totalActiveOrphans}`);
  } catch (err: any) {
    record('Section 9/17: Cascade & Orphans', 'Error in cascade/orphan test', false, err.response?.data?.message || err.message);
  }

  await mongoose.disconnect();

  console.log('\n=== SUMMARY OF P0 VERIFICATION RESULTS ===');
  const allPassed = results.every((r) => r.passed);
  console.log(`Total Checks: ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.passed).length}`);
  console.log(`Failed: ${results.filter((r) => !r.passed).length}`);
  console.log(`Overall Status: ${allPassed ? 'ALL PASS' : 'FAILURES DETECTED'}`);
}

run().catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
