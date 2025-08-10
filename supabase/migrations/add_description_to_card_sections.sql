-- Add description column to card_sections table
ALTER TABLE public.card_sections 
ADD COLUMN description text DEFAULT ''::text;
