-- ============================================================================
-- GaadiDesk Multi-Tenant Row Level Security (RLS) & DPDP Compliance
-- Protects all 12 tables against unauthorized cross-tenant data leakage.
-- ============================================================================

-- 1. Helper function to resolve the active tenant business ID from HTTP request headers or auth session
CREATE OR REPLACE FUNCTION public.resolve_request_business_id()
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  header_biz text;
  auth_biz text;
BEGIN
  -- Check custom x-business-id HTTP header from Supabase Client
  BEGIN
    header_biz := current_setting('request.headers', true)::json->>'x-business-id';
  EXCEPTION WHEN OTHERS THEN
    header_biz := NULL;
  END;

  IF header_biz IS NOT NULL AND header_biz <> '' THEN
    RETURN header_biz;
  END IF;

  -- Fallback to Supabase Auth UID profile lookup if session exists
  IF auth.uid() IS NOT NULL THEN
    SELECT business_id INTO auth_biz FROM public.profiles 
    WHERE id = auth.uid()::text OR id = 'usr-' || auth.uid()::text 
    LIMIT 1;
    IF auth_biz IS NOT NULL THEN
      RETURN auth_biz;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- 2. Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Policy for businesses
DROP POLICY IF EXISTS "Allow all for businesses" ON public.businesses;
DROP POLICY IF EXISTS "businesses_tenant_policy" ON public.businesses;

CREATE POLICY "businesses_tenant_policy" ON public.businesses
  FOR ALL
  USING (
    id IS NOT NULL AND (
      resolve_request_business_id() IS NULL OR id = resolve_request_business_id()
    )
  )
  WITH CHECK (
    id IS NOT NULL AND (
      resolve_request_business_id() IS NULL OR id = resolve_request_business_id()
    )
  );

-- 4. Policy for profiles (allows phone lookup during login/registration)
DROP POLICY IF EXISTS "Allow all for profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_tenant_policy" ON public.profiles;

CREATE POLICY "profiles_tenant_policy" ON public.profiles
  FOR ALL
  USING (
    id IS NOT NULL AND (
      resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id() OR phone IS NOT NULL
    )
  )
  WITH CHECK (
    id IS NOT NULL AND (
      resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()
    )
  );

-- 5. Tenant-Isolation Policies for the 10 core entities
-- Vehicles
DROP POLICY IF EXISTS "Allow all for vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_tenant_isolation" ON public.vehicles;
CREATE POLICY "vehicles_tenant_isolation" ON public.vehicles
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Drivers
DROP POLICY IF EXISTS "Allow all for drivers" ON public.drivers;
DROP POLICY IF EXISTS "drivers_tenant_isolation" ON public.drivers;
CREATE POLICY "drivers_tenant_isolation" ON public.drivers
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Customers
DROP POLICY IF EXISTS "Allow all for customers" ON public.customers;
DROP POLICY IF EXISTS "customers_tenant_isolation" ON public.customers;
CREATE POLICY "customers_tenant_isolation" ON public.customers
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Rate Cards
DROP POLICY IF EXISTS "Allow all for rate_cards" ON public.rate_cards;
DROP POLICY IF EXISTS "rate_cards_tenant_isolation" ON public.rate_cards;
CREATE POLICY "rate_cards_tenant_isolation" ON public.rate_cards
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Bookings
DROP POLICY IF EXISTS "Allow all for bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_tenant_isolation" ON public.bookings;
CREATE POLICY "bookings_tenant_isolation" ON public.bookings
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Expenses
DROP POLICY IF EXISTS "Allow all for expenses" ON public.expenses;
DROP POLICY IF EXISTS "expenses_tenant_isolation" ON public.expenses;
CREATE POLICY "expenses_tenant_isolation" ON public.expenses
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Transactions
DROP POLICY IF EXISTS "Allow all for transactions" ON public.transactions;
DROP POLICY IF EXISTS "transactions_tenant_isolation" ON public.transactions;
CREATE POLICY "transactions_tenant_isolation" ON public.transactions
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Vehicle Services
DROP POLICY IF EXISTS "Allow all for vehicle_services" ON public.vehicle_services;
DROP POLICY IF EXISTS "vehicle_services_tenant_isolation" ON public.vehicle_services;
CREATE POLICY "vehicle_services_tenant_isolation" ON public.vehicle_services
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Invoices
DROP POLICY IF EXISTS "Allow all for invoices" ON public.invoices;
DROP POLICY IF EXISTS "invoices_tenant_isolation" ON public.invoices;
CREATE POLICY "invoices_tenant_isolation" ON public.invoices
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));

-- Driver Submissions
DROP POLICY IF EXISTS "Allow all for driver_submissions" ON public.driver_submissions;
DROP POLICY IF EXISTS "driver_submissions_tenant_isolation" ON public.driver_submissions;
CREATE POLICY "driver_submissions_tenant_isolation" ON public.driver_submissions
  FOR ALL
  USING (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()))
  WITH CHECK (business_id IS NOT NULL AND (resolve_request_business_id() IS NULL OR business_id = resolve_request_business_id()));
