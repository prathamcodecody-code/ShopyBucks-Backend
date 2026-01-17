-- Create enum if not exists
ALTER TABLE OrderItem
ADD COLUMN status ENUM(
  'PENDING',      
  'ACCEPTED',     
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
) NOT NULL DEFAULT 'PENDING';
