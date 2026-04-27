-- Automatically create a profile row when a new user signs up.
-- The user's metadata (first_name, last_name, etc.) is passed during signUp()
-- and stored in auth.users.raw_user_meta_data.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, gender, birth_date, purok, barangay, municipality, zip_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'farmer'),
    NEW.raw_user_meta_data->>'gender',
    CASE
      WHEN NEW.raw_user_meta_data->>'birth_date' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'birth_date')::date
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'purok',
    NEW.raw_user_meta_data->>'barangay',
    COALESCE(NEW.raw_user_meta_data->>'municipality', 'Quezon'),
    COALESCE(NEW.raw_user_meta_data->>'zip_code', '8715')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
