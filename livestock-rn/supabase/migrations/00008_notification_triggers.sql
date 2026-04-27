-- ============================================
-- NOTIFICATION TRIGGER FUNCTIONS
-- ============================================

-- 1. Notify all farmers about new livestock posts
CREATE OR REPLACE FUNCTION public.handle_new_livestock_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  SELECT 
    p.id, 
    'new_post', 
    'New Livestock Available', 
    NEW.name || ' is now available for ₱' || NEW.price, 
    NEW.id, 
    'livestock'
  FROM public.profiles p
  WHERE p.id != NEW.seller_id; -- Don't notify the seller
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Notify all users about new announcements
CREATE OR REPLACE FUNCTION public.handle_new_announcement_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  SELECT 
    p.id, 
    'announcement', 
    'New Announcement: ' || NEW.title, 
    NEW.description, 
    NEW.id, 
    'announcement'
  FROM public.profiles p;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Notify all users about new health guidelines
CREATE OR REPLACE FUNCTION public.handle_new_guideline_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  SELECT 
    p.id, 
    'health_guideline', 
    'New Health Guideline: ' || NEW.disease, 
    'Learn how to treat and prevent ' || NEW.disease, 
    NEW.id, 
    'guideline'
  FROM public.profiles p;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Notify all users about new feeding info
CREATE OR REPLACE FUNCTION public.handle_new_feeding_notification()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  SELECT 
    p.id, 
    'feeding_info', 
    'New Feeding Guide: ' || NEW.name, 
    'Check out the latest feeding best practices for ' || NEW.category, 
    NEW.id, 
    'feeding'
  FROM public.profiles p;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Notify recipient about new chat message
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS trigger AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get the other participant in the chat
  SELECT 
    CASE 
      WHEN c.participant_1 = NEW.sender_id THEN c.participant_2 
      ELSE c.participant_1 
    END INTO recipient_id
  FROM public.chats c
  WHERE c.id = NEW.chat_id;

  -- Get sender name
  SELECT first_name || ' ' || last_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  VALUES (
    recipient_id, 
    'chat', 
    'New Message from ' || sender_name, 
    CASE 
      WHEN NEW.text = '' OR NEW.text IS NULL THEN 'Sent a photo'
      ELSE NEW.text 
    END, 
    NEW.chat_id, 
    'chat'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for livestock
DROP TRIGGER IF EXISTS on_livestock_created ON public.livestock;
CREATE TRIGGER on_livestock_created
  AFTER INSERT ON public.livestock
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_livestock_notification();

-- Trigger for announcements
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_announcement_notification();

-- Trigger for health guidelines
DROP TRIGGER IF EXISTS on_guideline_created ON public.health_guidelines;
CREATE TRIGGER on_guideline_created
  AFTER INSERT ON public.health_guidelines
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_guideline_notification();

-- Trigger for feeding info
DROP TRIGGER IF EXISTS on_feeding_created ON public.feeding_info;
CREATE TRIGGER on_feeding_created
  AFTER INSERT ON public.feeding_info
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_feeding_notification();

-- Trigger for messages
DROP TRIGGER IF EXISTS on_message_created_notification ON public.messages;
CREATE TRIGGER on_message_created_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_message_notification();
