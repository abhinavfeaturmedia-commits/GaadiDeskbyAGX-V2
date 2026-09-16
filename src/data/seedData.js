// ============================================================================
// GaadiDesk Starter Data & Rate Cards (Zero Mock Data - Pure Production State)
// ============================================================================

export const initialBusiness = {
  id: "",
  name: "",
  ownerName: "",
  phone: "",
  email: "",
  whatsapp: "",
  city: "",
  state: "Maharashtra",
  address: "",
  gstin: "",
  upiId: "",
  membershipPlan: "starter",
  membershipStatus: "Active",
  membershipExpires: "",
  vehicleLimit: 5,
  staffLimit: 1,
  language: "en"
};

// All fleet, driver, booking, customer, expense and ledger entities start 100% clean (Zero Mock Data)
export const initialVehicles = [];
export const initialDrivers = [];
export const initialCustomers = [];
export const initialBookings = [];
export const initialExpenses = [];
export const initialTransactions = [];

// Standard India Fleet Rate Card Starter Templates (Pre-configured industry rates)
export const initialRateCards = [
  {
    id: "rc-01",
    name: "Sedan Local (8hr / 80km)",
    category: "Sedan",
    tripType: "Local",
    baseHours: 8,
    baseKm: 80,
    basePrice: 1800,
    extraKmRate: 14,
    extraHourRate: 150,
    perKmRate: 14,
    driverBata: 300,
    nightHalt: 300,
    securityDeposit: 0,
    fuelPolicy: "Company Fuel",
    defaultGstPercent: 5
  },
  {
    id: "rc-02",
    name: "Sedan Outstation (Min 250km/day)",
    category: "Sedan",
    tripType: "Outstation",
    baseHours: 24,
    baseKm: 250,
    basePrice: 3500,
    extraKmRate: 14,
    extraHourRate: 0,
    perKmRate: 14,
    driverBata: 400,
    nightHalt: 400,
    securityDeposit: 0,
    fuelPolicy: "Company Fuel",
    defaultGstPercent: 5
  },
  {
    id: "rc-03",
    name: "MUV / Ertiga Outstation (Min 250km/day)",
    category: "MUV",
    tripType: "Outstation",
    baseHours: 24,
    baseKm: 250,
    basePrice: 4250,
    extraKmRate: 17,
    extraHourRate: 0,
    perKmRate: 17,
    driverBata: 500,
    nightHalt: 400,
    securityDeposit: 0,
    fuelPolicy: "Company Fuel",
    defaultGstPercent: 5
  },
  {
    id: "rc-04",
    name: "Innova Crysta Outstation",
    category: "SUV",
    tripType: "Outstation",
    baseHours: 24,
    baseKm: 300,
    basePrice: 6300,
    extraKmRate: 21,
    extraHourRate: 0,
    perKmRate: 21,
    driverBata: 600,
    nightHalt: 500,
    securityDeposit: 0,
    fuelPolicy: "Company Fuel",
    defaultGstPercent: 5
  },
  {
    id: "rc-05",
    name: "Airport Transfer (Pune/Mumbai)",
    category: "Sedan",
    tripType: "Airport",
    baseHours: 4,
    baseKm: 50,
    basePrice: 1200,
    extraKmRate: 15,
    extraHourRate: 150,
    perKmRate: 15,
    driverBata: 200,
    nightHalt: 0,
    securityDeposit: 0,
    fuelPolicy: "Company Fuel",
    defaultGstPercent: 5
  },
  {
    id: "rc-06",
    name: "Self-Drive Rental Daily",
    category: "Hatchback",
    tripType: "Rental",
    baseHours: 24,
    baseKm: 150,
    basePrice: 1600,
    extraKmRate: 10,
    extraHourRate: 100,
    perKmRate: 10,
    driverBata: 0,
    nightHalt: 0,
    securityDeposit: 5000,
    fuelPolicy: "Same to Same",
    defaultGstPercent: 12
  }
];
