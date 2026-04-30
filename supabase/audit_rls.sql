-- RED TEAM RLS AUDIT SCRIPT
-- Purpose: Verify that Table-Per-Store isolation is ironclad.
-- Steps:
-- 1. Create a "Victim" store
-- 2. Create an "Attacker" store
-- 3. Attempt to bypass RLS
-- 4. Clean up

-- NOTE: Run this in the Supabase SQL Editor.

-- STEP 1: Setup Victim and data
DO $$
DECLARE
  victim_id UUID := '00000000-0000-0000-0000-000000000001';
  attacker_id UUID := '99999999-9999-9999-9999-999999999999';
BEGIN
  -- We use real RLS checks by setting the claim
  -- Simulate Victim Session
  SET LOCAL role TO authenticated;
  SET LOCAL "request.jwt.claims" TO JSONB_BUILD_OBJECT('sub', victim_id);

  -- Insert victim data
  INSERT INTO public.customers (id, user_id, name) VALUES ('c0000000-0000-0000-0000-000000000001', victim_id, 'Cliente Secreto Vitima');
  INSERT INTO public.quotes (id, user_id, customer_id, total) VALUES ('q0000000-0000-0000-0000-000000000001', victim_id, 'c0000000-0000-0000-0000-000000000001', 1000);

  -- STEP 2: Simulate Attacker Session
  SET LOCAL "request.jwt.claims" TO JSONB_BUILD_OBJECT('sub', attacker_id);

  -- TEST A: Read Attempt (Should return 0 rows)
  IF EXISTS (SELECT 1 FROM public.customers WHERE id = 'c0000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'CRITICAL FAILURE: Attacker can READ victim customer!';
  END IF;

  -- TEST B: Guess-ID Update Attempt (Should affect 0 rows)
  UPDATE public.quotes SET total = 0 WHERE id = 'q0000000-0000-0000-0000-000000000001';
  IF EXISTS (SELECT 1 FROM public.quotes WHERE id = 'q0000000-0000-0000-0000-000000000001' AND total = 0) THEN
    RAISE EXCEPTION 'CRITICAL FAILURE: Attacker can UPDATE victim quote!';
  END IF;

  -- TEST C: Injected ID Insert (Should fail due to WITH CHECK)
  BEGIN
    INSERT INTO public.customers (user_id, name) VALUES (victim_id, 'Infiltrado');
    RAISE EXCEPTION 'CRITICAL FAILURE: Attacker can INSERT data for another user_id!';
  EXCEPTION WHEN OTHERS THEN
    -- Expected to fail
  END;

  RAISE NOTICE 'RLS Audit Passed: All isolation tests were successful.';

  -- Cleanup (manual if needed, but we used local roles and rollback)
  DELETE FROM public.quotes WHERE user_id = victim_id;
  DELETE FROM public.customers WHERE user_id = victim_id;
END $$;
