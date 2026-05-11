-- Auto-update streak + XP on study_sessions insert
CREATE OR REPLACE FUNCTION public.update_streak_and_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_at timestamptz;
  cur_streak int;
  diff int;
BEGIN
  SELECT last_study_at, streak INTO last_at, cur_streak
  FROM public.profiles WHERE id = NEW.user_id;

  IF last_at IS NULL THEN
    cur_streak := 1;
  ELSE
    diff := EXTRACT(DAY FROM (date_trunc('day', NEW.created_at) - date_trunc('day', last_at)));
    IF diff = 0 THEN
      -- same day, keep streak
      cur_streak := COALESCE(cur_streak, 1);
    ELSIF diff = 1 THEN
      cur_streak := COALESCE(cur_streak, 0) + 1;
    ELSE
      cur_streak := 1;
    END IF;
  END IF;

  UPDATE public.profiles
  SET xp = COALESCE(xp, 0) + COALESCE(NEW.xp_earned, 0),
      streak = cur_streak,
      last_study_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_streak_xp ON public.study_sessions;
CREATE TRIGGER trg_update_streak_xp
AFTER INSERT ON public.study_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_streak_and_xp();

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();