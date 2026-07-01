-- Migration to add 3D Badge customization fields to business_cards table

ALTER TABLE public.business_cards
ADD COLUMN badge_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN lanyard_color VARCHAR(7) DEFAULT '#000000';
