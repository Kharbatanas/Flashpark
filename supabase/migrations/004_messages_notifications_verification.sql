-- =============================================
-- Messages, Notifications, Verification, Booking Lifecycle
-- =============================================

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_booking_id_idx ON messages(booking_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can read messages" ON messages FOR SELECT
  USING (
    sender_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())
    OR booking_id IN (
      SELECT b.id FROM bookings b
      JOIN spots s ON s.id = b.spot_id
      JOIN users u ON (u.id = b.driver_id OR u.id = s.host_id)
      WHERE u.supabase_id = auth.uid()
    )
  );
CREATE POLICY "Booking participants can send messages" ON messages FOR INSERT
  WITH CHECK (sender_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));

-- Verification documents
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_type AS ENUM ('id_card', 'passport', 'drivers_license', 'proof_of_address', 'property_proof'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS verification_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            document_type NOT NULL,
  file_url        TEXT NOT NULL,
  status          verification_status NOT NULL DEFAULT 'pending',
  admin_notes     TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS verification_docs_user_id_idx ON verification_documents(user_id);
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own documents" ON verification_documents FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users can upload documents" ON verification_documents FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(user_id, read_at);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));

-- Booking lifecycle auto-transition function
CREATE OR REPLACE FUNCTION public.update_booking_statuses()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bookings SET status = 'active', updated_at = NOW()
  WHERE status = 'confirmed' AND start_time <= NOW();

  UPDATE public.bookings SET status = 'completed', updated_at = NOW()
  WHERE status = 'active' AND end_time <= NOW();

  UPDATE public.bookings SET status = 'cancelled', updated_at = NOW(), cancelled_at = NOW()
  WHERE status = 'pending' AND start_time <= NOW();
END;
$$;

-- QR code generation trigger
CREATE OR REPLACE FUNCTION public.generate_booking_qr()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    NEW.qr_code := 'FP-' || UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8)) || '-' || TO_CHAR(NOW(), 'YYMMDD');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_status_change ON bookings;
CREATE TRIGGER on_booking_status_change
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION generate_booking_qr();

DROP TRIGGER IF EXISTS on_booking_created_qr ON bookings;
CREATE TRIGGER on_booking_created_qr
  BEFORE INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION generate_booking_qr();

-- Notification triggers
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_spot_title TEXT; v_host_id UUID; v_driver_id UUID;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  SELECT title, host_id INTO v_spot_title, v_host_id FROM public.spots WHERE id = NEW.spot_id;
  v_driver_id := NEW.driver_id;

  CASE NEW.status
    WHEN 'confirmed' THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (v_driver_id, 'booking_confirmed', 'Reservation confirmee',
              'Votre reservation pour "' || v_spot_title || '" a ete confirmee.',
              jsonb_build_object('bookingId', NEW.id));
    WHEN 'cancelled' THEN
      IF NEW.cancelled_by = v_driver_id THEN
        INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES (v_host_id, 'booking_cancelled', 'Reservation annulee',
                'Une reservation pour "' || v_spot_title || '" a ete annulee.',
                jsonb_build_object('bookingId', NEW.id));
      ELSE
        INSERT INTO public.notifications (user_id, type, title, body, data)
        VALUES (v_driver_id, 'booking_cancelled', 'Reservation annulee',
                'Votre reservation pour "' || v_spot_title || '" a ete annulee.',
                jsonb_build_object('bookingId', NEW.id));
      END IF;
    WHEN 'active' THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (v_driver_id, 'booking_active', 'Session demarree',
              'Votre reservation pour "' || v_spot_title || '" est active.',
              jsonb_build_object('bookingId', NEW.id));
    WHEN 'completed' THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (v_driver_id, 'booking_completed', 'Session terminee',
              'Votre reservation pour "' || v_spot_title || '" est terminee.',
              jsonb_build_object('bookingId', NEW.id));
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (v_host_id, 'booking_completed', 'Reservation terminee',
              'La reservation pour "' || v_spot_title || '" est terminee.',
              jsonb_build_object('bookingId', NEW.id));
    ELSE NULL;
  END CASE;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_status_notify ON bookings;
CREATE TRIGGER on_booking_status_notify
  AFTER UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION notify_booking_status_change();

CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_spot_title TEXT; v_host_id UUID;
BEGIN
  SELECT title, host_id INTO v_spot_title, v_host_id FROM public.spots WHERE id = NEW.spot_id;
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (v_host_id, 'new_booking', 'Nouvelle reservation',
          'Nouvelle demande pour "' || v_spot_title || '".',
          jsonb_build_object('bookingId', NEW.id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created_notify ON bookings;
CREATE TRIGGER on_booking_created_notify
  AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION notify_new_booking();
