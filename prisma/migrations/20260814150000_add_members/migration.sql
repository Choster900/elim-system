-- CreateEnum
CREATE TYPE "public"."member_community_role" AS ENUM ('member', 'pastor', 'leader', 'host', 'supervisor', 'deacon', 'volunteer', 'teacher', 'worship', 'youth_leader', 'children_leader');

-- CreateEnum
CREATE TYPE "public"."member_gender" AS ENUM ('female', 'male', 'other', 'unspecified');

-- CreateEnum
CREATE TYPE "public"."member_marital_status" AS ENUM ('single', 'married', 'divorced', 'widowed', 'union', 'unspecified');

-- CreateEnum
CREATE TYPE "public"."member_status" AS ENUM ('active', 'inactive', 'visitor', 'transferred', 'deceased');

-- CreateTable
CREATE TABLE "public"."member" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "second_last_name" TEXT,
    "preferred_name" TEXT,
    "document_number" TEXT,
    "birth_date" DATE,
    "gender" "public"."member_gender" NOT NULL DEFAULT 'unspecified',
    "marital_status" "public"."member_marital_status" NOT NULL DEFAULT 'unspecified',
    "phone" TEXT,
    "alternate_phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "municipality" TEXT,
    "department" TEXT,
    "occupation" TEXT,
    "status" "public"."member_status" NOT NULL DEFAULT 'active',
    "roles" "public"."member_community_role"[] DEFAULT ARRAY['member']::"public"."member_community_role"[],
    "ministries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "joined_at" DATE,
    "conversion_date" DATE,
    "baptism_date" DATE,
    "district" TEXT,
    "zone" TEXT,
    "sector" TEXT,
    "small_group" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_code_key" ON "public"."member"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "member_document_number_key" ON "public"."member"("document_number" ASC);

-- CreateIndex
CREATE INDEX "member_email_idx" ON "public"."member"("email" ASC);

-- CreateIndex
CREATE INDEX "member_last_name_first_name_idx" ON "public"."member"("last_name" ASC, "first_name" ASC);

-- CreateIndex
CREATE INDEX "member_status_idx" ON "public"."member"("status" ASC);
