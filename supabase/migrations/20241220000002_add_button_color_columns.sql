-- Add button color columns to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS button_text_border_color VARCHAR(7) DEFAULT '#6B7280',
ADD COLUMN IF NOT EXISTS button_circle_color VARCHAR(7) DEFAULT '#374151';

-- Add comments for documentation
COMMENT ON COLUMN books.button_text_border_color IS 'Color for button text and borders (hex format)';
COMMENT ON COLUMN books.button_circle_color IS 'Color for button circle backgrounds (hex format)';

-- Update existing books with default colors if they don't have them
UPDATE books 
SET 
  button_text_border_color = COALESCE(button_text_border_color, '#6B7280'),
  button_circle_color = COALESCE(button_circle_color, '#374151')
WHERE button_text_border_color IS NULL OR button_circle_color IS NULL;

-- Add check constraints to ensure valid hex colors
ALTER TABLE books 
ADD CONSTRAINT check_button_text_border_color_hex 
CHECK (button_text_border_color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE books 
ADD CONSTRAINT check_button_circle_color_hex 
CHECK (button_circle_color ~ '^#[0-9A-Fa-f]{6}$');
