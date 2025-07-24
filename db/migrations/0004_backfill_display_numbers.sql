-- Migration: Backfill display_number for existing invoices and quotations
-- This migration sets display_number = id for all records where display_number is NULL
-- This preserves the original numbering for all existing documents

UPDATE invoices 
SET display_number = id 
WHERE display_number IS NULL; 