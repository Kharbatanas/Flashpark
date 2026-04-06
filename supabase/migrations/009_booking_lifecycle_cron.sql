-- Enable pg_cron extension (requires superuser; enabled in Supabase dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Auto-cancel pending bookings older than 24h (host never responded)
CREATE OR REPLACE FUNCTION public.update_booking_statuses()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- confirmed → active when start_time reached
  UPDATE public.bookings SET status = 'active', updated_at = NOW()
  WHERE status = 'confirmed' AND start_time <= NOW();

  -- active → completed when end_time reached
  UPDATE public.bookings SET status = 'completed', updated_at = NOW()
  WHERE status = 'active' AND end_time <= NOW();

  -- pending → cancelled when start_time passed (host never responded)
  UPDATE public.bookings
  SET status = 'cancelled', updated_at = NOW(), cancelled_at = NOW()
  WHERE status = 'pending' AND start_time <= NOW();

  -- pending → cancelled after 24h with no host response (before start_time)
  UPDATE public.bookings
  SET status = 'cancelled', updated_at = NOW(), cancelled_at = NOW()
  WHERE status = 'pending'
    AND created_at <= NOW() - INTERVAL '24 hours'
    AND start_time > NOW();
END;
$$;

-- Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'update-booking-statuses',
  '*/5 * * * *',
  $$SELECT public.update_booking_statuses()$$
);
