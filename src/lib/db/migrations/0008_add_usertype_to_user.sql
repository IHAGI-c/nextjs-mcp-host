-- Add userType column to User table
ALTER TABLE "User" ADD COLUMN "userType" varchar DEFAULT 'regular';

-- Add constraint to ensure userType is either 'regular' or 'guest'
ALTER TABLE "User" ADD CONSTRAINT "user_usertype_check" CHECK ("userType" IN ('regular', 'guest'));

-- Create index for userType for better query performance
CREATE INDEX "user_usertype_idx" ON "User"("userType"); 