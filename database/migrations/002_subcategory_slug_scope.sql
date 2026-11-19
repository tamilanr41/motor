-- Allow the same subcategory slug in different categories.
-- Run once against databases created from earlier schema versions.
ALTER TABLE subcategories
  DROP INDEX uq_subcategory_slug,
  ADD UNIQUE KEY uq_subcategory_slug (category_id, slug),
  ADD INDEX idx_subcategories_slug (slug);
