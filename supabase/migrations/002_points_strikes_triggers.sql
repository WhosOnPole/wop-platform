-- ============================================
-- Who's on Pole? Platform - Points & Strikes Triggers
-- ============================================
-- This migration creates all database functions and triggers for the
-- automated Points & Strikes system

-- ============================================
-- 1. HELPER FUNCTION: award_points
-- ============================================
-- This function updates a user's points by a delta amount
-- Must be SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION public.award_points(
  target_user_id UUID,
  delta_points INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + delta_points
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. FUNCTION: handle_new_vote
-- ============================================
-- Fires: AFTER INSERT on votes
-- Logic: Awards 1 point to the content owner

CREATE OR REPLACE FUNCTION public.handle_new_vote()
RETURNS TRIGGER AS $$
DECLARE
  owner_user_id UUID;
BEGIN
  -- Determine the owner based on target_type
  IF NEW.target_type = 'post' THEN
    SELECT user_id INTO owner_user_id
    FROM public.posts
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    SELECT user_id INTO owner_user_id
    FROM public.comments
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'grid' THEN
    SELECT user_id INTO owner_user_id
    FROM public.grids
    WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'profile' THEN
    -- For profile votes, the target_id IS the user_id
    owner_user_id := NEW.target_id;
  END IF;

  -- Award points if owner found and not self-vote
  IF owner_user_id IS NOT NULL AND owner_user_id != NEW.user_id THEN
    PERFORM public.award_points(owner_user_id, 1);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new votes
CREATE TRIGGER on_vote_created
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_vote();

-- ============================================
-- 3. FUNCTION: handle_vote_removal
-- ============================================
-- Fires: AFTER DELETE on votes
-- Logic: Removes 1 point from the content owner

CREATE OR REPLACE FUNCTION public.handle_vote_removal()
RETURNS TRIGGER AS $$
DECLARE
  owner_user_id UUID;
BEGIN
  -- Determine the owner based on target_type
  IF OLD.target_type = 'post' THEN
    SELECT user_id INTO owner_user_id
    FROM public.posts
    WHERE id = OLD.target_id;
  ELSIF OLD.target_type = 'comment' THEN
    SELECT user_id INTO owner_user_id
    FROM public.comments
    WHERE id = OLD.target_id;
  ELSIF OLD.target_type = 'grid' THEN
    SELECT user_id INTO owner_user_id
    FROM public.grids
    WHERE id = OLD.target_id;
  ELSIF OLD.target_type = 'profile' THEN
    -- For profile votes, the target_id IS the user_id
    owner_user_id := OLD.target_id;
  END IF;

  -- Remove points if owner found
  IF owner_user_id IS NOT NULL AND owner_user_id != OLD.user_id THEN
    PERFORM public.award_points(owner_user_id, -1);
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for vote removal
CREATE TRIGGER on_vote_deleted
  AFTER DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_vote_removal();

-- ============================================
-- 4. FUNCTION: handle_new_comment
-- ============================================
-- Fires: AFTER INSERT on comments
-- Logic: Awards 1 point to the comment author

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.award_points(NEW.user_id, 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new comments
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

-- ============================================
-- 5. FUNCTION: handle_tip_approval
-- ============================================
-- Fires: AFTER UPDATE on track_tips
-- Condition: When status changes from 'pending' to 'approved'
-- Logic: Awards 2 points to the tip author

CREATE OR REPLACE FUNCTION public.handle_tip_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
    PERFORM public.award_points(NEW.user_id, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for tip approval
CREATE TRIGGER on_tip_approved
  AFTER UPDATE ON public.track_tips
  FOR EACH ROW EXECUTE FUNCTION public.handle_tip_approval();

-- ============================================
-- 6. FUNCTION: handle_report_resolution
-- ============================================
-- Fires: AFTER UPDATE on reports
-- Condition: When status changes from 'pending' to 'resolved_removed'
-- Logic: Deducts 5 points and adds 1 strike to the offending user

CREATE OR REPLACE FUNCTION public.handle_report_resolution()
RETURNS TRIGGER AS $$
DECLARE
  offender_user_id UUID;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'resolved_removed' THEN
    -- Determine the offender based on target_type
    IF NEW.target_type = 'post' THEN
      SELECT user_id INTO offender_user_id
      FROM public.posts
      WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      SELECT user_id INTO offender_user_id
      FROM public.comments
      WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'grid' THEN
      SELECT user_id INTO offender_user_id
      FROM public.grids
      WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'profile' THEN
      -- For profile reports, the target_id IS the user_id
      offender_user_id := NEW.target_id;
    END IF;

    -- Apply penalty if offender found
    IF offender_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET points = points - 5,
          strikes = strikes + 1
      WHERE id = offender_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for report resolution
CREATE TRIGGER on_report_resolved
  AFTER UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_report_resolution();

-- ============================================
-- 7. FUNCTION: check_for_ban
-- ============================================
-- Fires: AFTER UPDATE on profiles
-- Condition: When strikes increase and reach >= 3
-- Logic: Bans the user by setting banned_until in auth.users

CREATE OR REPLACE FUNCTION public.check_for_ban()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if strikes increased and reached threshold
  IF NEW.strikes > OLD.strikes AND NEW.strikes >= 3 THEN
    -- Update auth.users to ban the user (100 years = effectively permanent)
    UPDATE auth.users
    SET banned_until = now() + interval '100 years'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for ban check
CREATE TRIGGER on_strikes_increased
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_for_ban();

-- ============================================
-- NOTES
-- ============================================
-- All trigger functions that update profiles (award_points, handle_report_resolution, check_for_ban)
-- are created as SECURITY DEFINER to bypass RLS and allow updates to rows owned by other users.
-- This is necessary for the automated points and strikes system to function correctly.

