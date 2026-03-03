-- Add hero_image_url column to brands table
-- All other tables (brand_philosophies, social_links, founders) were already created
-- in migration 20260224064305_updae_brand_docs

ALTER TABLE "brands" ADD COLUMN "hero_image_url" TEXT;
