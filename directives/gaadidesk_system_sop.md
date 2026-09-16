# Directive: GaadiDesk Core Operations & Business Logic SOP

## 1. Goal
Provide standard operating procedures and deterministic execution workflows for running the GaadiDesk B2B Cab & Rental Operations system (India market context).

## 2. Core Business Domains & Inputs

### A. Booking Flow & Conflict Prevention
- **Booking Types**:
  - `Local`: Hourly + KM rate (e.g. 8hr/80km package)
  - `Airport`: Fixed transfer package + waiting charges + extra KM
  - `Outstation`: Per KM rate (min km/day) + driver bata + night allowance + tolls/permits
  - `Self-drive Rental`: Daily rate + security deposit + fuel policy
- **Input Data**: Customer Name, Phone, Pickup/Drop addresses, Start/End Timestamps, Selected Vehicle Type/ID, Assigned Driver ID.
- **Rule**: A vehicle and driver cannot be double-booked across overlapping active booking windows.

### B. Fleet & Document Expiry Tracking
- **Required Documents**: RC, Insurance, PUC, Fitness, State Permit.
- **Expiry Thresholds**:
  - `Critical Alert`: < 7 days remaining
  - `Warning Alert`: 8 to 30 days remaining
  - `Valid`: > 30 days remaining

### C. Driver Bata & Outstation Calculations
- **Formula**:
  `Total Estimate = (Max(Actual KM, Min KM per day * Days) * Per KM Rate) + (Driver Bata * Days) + (Night Halts * Night Rate) + Tolls/State Tax + GST (5% / 12%)`

### D. Customer WhatsApp Notification Generation
- Formats message strings cleanly for 1-tap WhatsApp sharing in Hinglish / Hindi / Marathi / English.

## 3. Execution Tools (`execution/`)
- `execution/env_helper.py`: Loads environment configurations.
- Custom deterministic scripts created as needed for batch validation, data exports, and integrations.

## 4. Deliverables vs Intermediates
- **Intermediates**: `.tmp/` scratch files, batch export previews, JSON caches.
- **Deliverables**: Live app state, GST invoice PDFs, customer WhatsApp dispatch messages.

## 5. Self-Annealing & Exceptions
- If GST rates or state permit requirements change by region, update this directive and adjust corresponding validation calculations.
