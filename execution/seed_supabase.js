import { createClient } from '@supabase/supabase-js';
import {
  initialBusiness,
  initialVehicles,
  initialDrivers,
  initialCustomers,
  initialRateCards,
  initialBookings,
  initialExpenses,
  initialTransactions
} from '../src/data/seedData.js';
import {
  mapBusinessToDb,
  mapVehicleToDb,
  mapDriverToDb,
  mapCustomerToDb,
  mapRateCardToDb,
  mapBookingToDb,
  mapExpenseToDb,
  mapTransactionToDb
} from '../src/services/supabaseApi.js';

const supabaseUrl = 'https://xbeivqsjwjjrmxshyobv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiZWl2cXNqd2pqcm14c2h5b2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNzk4NTEsImV4cCI6MjEwMzY1NTg1MX0.7kKsTFeloOzfiWVMV5IJXhxql0grOmN2ueo0sKhM4kw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSeed() {
  console.log('Connecting to Supabase at:', supabaseUrl);
  const businessId = 'biz-001';

  try {
    // 1. Business
    console.log('1. Seeding business...');
    const bizDb = mapBusinessToDb({ ...initialBusiness, id: businessId });
    const { error: bizErr } = await supabase.from('businesses').upsert(bizDb);
    if (bizErr) throw bizErr;

    // 2. Profiles (Owner + Drivers)
    console.log('2. Seeding default profiles...');
    const profiles = [
      {
        id: 'usr-owner-01',
        business_id: businessId,
        role: 'owner',
        name: initialBusiness.ownerName,
        phone: initialBusiness.phone
      },
      ...initialDrivers.map(d => ({
        id: `usr-${d.id}`,
        business_id: businessId,
        role: 'driver',
        name: d.name,
        phone: d.phone
      }))
    ];
    const { error: profErr } = await supabase.from('profiles').upsert(profiles);
    if (profErr) console.warn('Profiles upsert warning:', profErr.message);

    // 3. Vehicles
    console.log('3. Seeding vehicles...');
    const vehDb = initialVehicles.map(v => mapVehicleToDb(v, businessId));
    const { error: vehErr } = await supabase.from('vehicles').upsert(vehDb);
    if (vehErr) throw vehErr;

    // 4. Drivers
    console.log('4. Seeding drivers...');
    const drvDb = initialDrivers.map(d => mapDriverToDb(d, businessId));
    const { error: drvErr } = await supabase.from('drivers').upsert(drvDb);
    if (drvErr) throw drvErr;

    // 5. Customers
    console.log('5. Seeding customers...');
    const custDb = initialCustomers.map(c => mapCustomerToDb(c, businessId));
    const { error: custErr } = await supabase.from('customers').upsert(custDb);
    if (custErr) throw custErr;

    // 6. Rate Cards
    console.log('6. Seeding rate cards...');
    const rcDb = initialRateCards.map(rc => mapRateCardToDb(rc, businessId));
    const { error: rcErr } = await supabase.from('rate_cards').upsert(rcDb);
    if (rcErr) throw rcErr;

    // 7. Bookings
    console.log('7. Seeding bookings...');
    const bkDb = initialBookings.map(b => mapBookingToDb(b, businessId));
    const { error: bkErr } = await supabase.from('bookings').upsert(bkDb);
    if (bkErr) throw bkErr;

    // 8. Expenses
    console.log('8. Seeding expenses...');
    const expDb = initialExpenses.map(e => mapExpenseToDb(e, businessId));
    const { error: expErr } = await supabase.from('expenses').upsert(expDb);
    if (expErr) throw expErr;

    // 9. Transactions
    console.log('9. Seeding transactions...');
    const txDb = initialTransactions.map(tx => mapTransactionToDb(tx, businessId));
    const { error: txErr } = await supabase.from('transactions').upsert(txDb);
    if (txErr) throw txErr;

    console.log('🎉 SUCCESS: All Supabase tables seeded perfectly!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

runSeed();
