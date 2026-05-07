-- Delete notifications whose target content has been removed, then add
-- triggers to keep them in sync going forward. We don't add real foreign
-- keys because related_id refers to multiple tables depending on
-- related_type.

-- One-time cleanup
DELETE FROM public.notifications n
WHERE n.related_id IS NOT NULL
  AND (
    (n.related_type = 'announcement' AND NOT EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = n.related_id))
    OR (n.related_type = 'guideline' AND NOT EXISTS (SELECT 1 FROM public.health_guidelines h WHERE h.id = n.related_id))
    OR (n.related_type = 'feeding' AND NOT EXISTS (SELECT 1 FROM public.feeding_info f WHERE f.id = n.related_id))
    OR (n.related_type = 'livestock' AND NOT EXISTS (SELECT 1 FROM public.livestock l WHERE l.id = n.related_id))
    OR (n.related_type = 'chat' AND NOT EXISTS (SELECT 1 FROM public.chats c WHERE c.id = n.related_id))
  );

-- Trigger functions to clean up notifications when their target is deleted

CREATE OR REPLACE FUNCTION public.cleanup_announcement_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications WHERE related_type = 'announcement' AND related_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_guideline_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications WHERE related_type = 'guideline' AND related_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_feeding_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications WHERE related_type = 'feeding' AND related_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_livestock_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications WHERE related_type = 'livestock' AND related_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_chat_notifications()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notifications WHERE related_type = 'chat' AND related_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_announcement_deleted_cleanup_notifications ON public.announcements;
CREATE TRIGGER on_announcement_deleted_cleanup_notifications
  AFTER DELETE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_announcement_notifications();

DROP TRIGGER IF EXISTS on_guideline_deleted_cleanup_notifications ON public.health_guidelines;
CREATE TRIGGER on_guideline_deleted_cleanup_notifications
  AFTER DELETE ON public.health_guidelines
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_guideline_notifications();

DROP TRIGGER IF EXISTS on_feeding_deleted_cleanup_notifications ON public.feeding_info;
CREATE TRIGGER on_feeding_deleted_cleanup_notifications
  AFTER DELETE ON public.feeding_info
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_feeding_notifications();

DROP TRIGGER IF EXISTS on_livestock_deleted_cleanup_notifications ON public.livestock;
CREATE TRIGGER on_livestock_deleted_cleanup_notifications
  AFTER DELETE ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_livestock_notifications();

DROP TRIGGER IF EXISTS on_chat_deleted_cleanup_notifications ON public.chats;
CREATE TRIGGER on_chat_deleted_cleanup_notifications
  AFTER DELETE ON public.chats
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_chat_notifications();
