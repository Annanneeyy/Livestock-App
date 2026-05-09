-- RPC to allow admins to update user roles
-- This function runs as SECURITY DEFINER (superuser) to bypass RLS
-- but includes its own check to ensure ONLY admins can call it.

CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
BEGIN
  -- 1. Security Check: Ensure the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can change user roles.';
  END IF;

  -- 2. Validate the new role
  IF new_role NOT IN ('farmer', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- 3. Perform the update
  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;

  -- 4. Verify update
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
