-- CreateEnum
CREATE TYPE "public"."ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."DataSourceOrigem" AS ENUM ('RH', 'IDM', 'SISTEMA');

-- CreateEnum
CREATE TYPE "public"."DataSourceType" AS ENUM ('CSV', 'API', 'DATABASE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profile_image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileId" INTEGER NOT NULL,
    "packageId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profiles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_resets" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."credentials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."platforms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "icon" TEXT,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."packages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DataSource" (
    "id" SERIAL NOT NULL,
    "name_datasource" TEXT NOT NULL,
    "origem_datasource" "public"."DataSourceOrigem" NOT NULL,
    "type_datasource" "public"."DataSourceType" NOT NULL,
    "description_datasource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_logs" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "public"."ImportStatus" NOT NULL DEFAULT 'PENDING',
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,
    "dataSourceId" INTEGER,

    CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HRConfig" (
    "id" SERIAL NOT NULL,
    "dataSourceId" INTEGER NOT NULL,

    CONSTRAINT "HRConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IdentitiesHR" (
    "id" SERIAL NOT NULL,
    "identity_id_hr" TEXT NOT NULL,
    "name_hr" TEXT,
    "email_hr" TEXT,
    "status_hr" TEXT,
    "user_type_hr" TEXT,
    "cpf_hr" TEXT,
    "extra_data_hr" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentitiesHR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IDMConfig" (
    "id" SERIAL NOT NULL,
    "dataSourceId" INTEGER NOT NULL,
    "api_url" TEXT NOT NULL,
    "api_user" TEXT,

    CONSTRAINT "IDMConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IdentitiesIDM" (
    "id" SERIAL NOT NULL,
    "identity_id_idm" TEXT NOT NULL,
    "name_idm" TEXT,
    "email_idm" TEXT,
    "status_idm" TEXT,
    "extra_data_idm" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentitiesIDM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RolesIDM" (
    "id" SERIAL NOT NULL,
    "name_role_idm" TEXT NOT NULL,
    "description_role_idm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolesIDM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Endpoint_IDM" (
    "id" SERIAL NOT NULL,
    "name_endpoint_idm" TEXT NOT NULL,
    "description_endpoint_idm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endpoint_IDM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceIDM" (
    "id" SERIAL NOT NULL,
    "name_resource_idm" TEXT NOT NULL,
    "description_resource_idm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceIDM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Identities_RolesIDM" (
    "identityId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Identities_RolesIDM_pkey" PRIMARY KEY ("identityId","roleId")
);

-- CreateTable
CREATE TABLE "public"."RolesIDM_Endpoint" (
    "roleId" INTEGER NOT NULL,
    "endpointId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolesIDM_Endpoint_pkey" PRIMARY KEY ("roleId","endpointId")
);

-- CreateTable
CREATE TABLE "public"."Endpoint_Source" (
    "endpointId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Endpoint_Source_pkey" PRIMARY KEY ("endpointId","resourceId")
);

-- CreateTable
CREATE TABLE "public"."System" (
    "id" SERIAL NOT NULL,
    "dataSourceId" INTEGER NOT NULL,
    "connection_details_system" JSONB,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Accounts" (
    "id" SERIAL NOT NULL,
    "id_in_system_account" TEXT NOT NULL,
    "name_account" TEXT,
    "email_account" TEXT,
    "status_account" TEXT,
    "user_type_account" TEXT,
    "extra_data_account" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resource" (
    "id" SERIAL NOT NULL,
    "name_resource" TEXT NOT NULL,
    "description_resource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."System_Account" (
    "systemId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "System_Account_pkey" PRIMARY KEY ("systemId","accountId")
);

-- CreateTable
CREATE TABLE "public"."Account_Resource" (
    "accountId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_Resource_pkey" PRIMARY KEY ("accountId","resourceId")
);

-- CreateTable
CREATE TABLE "public"."System_Resource" (
    "systemId" INTEGER NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "System_Resource_pkey" PRIMARY KEY ("systemId","resourceId")
);

-- CreateTable
CREATE TABLE "public"."_GroupToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_GroupToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_PackageToPlatform" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PackageToPlatform_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_name_key" ON "public"."profiles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "public"."password_resets"("token");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_path_key" ON "public"."credentials"("path");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_key" ON "public"."groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_name_key" ON "public"."platforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_key_key" ON "public"."platforms"("key");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_route_key" ON "public"."platforms"("route");

-- CreateIndex
CREATE UNIQUE INDEX "packages_name_key" ON "public"."packages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_name_datasource_key" ON "public"."DataSource"("name_datasource");

-- CreateIndex
CREATE UNIQUE INDEX "HRConfig_dataSourceId_key" ON "public"."HRConfig"("dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentitiesHR_identity_id_hr_key" ON "public"."IdentitiesHR"("identity_id_hr");

-- CreateIndex
CREATE UNIQUE INDEX "IdentitiesHR_email_hr_key" ON "public"."IdentitiesHR"("email_hr");

-- CreateIndex
CREATE UNIQUE INDEX "IdentitiesHR_cpf_hr_key" ON "public"."IdentitiesHR"("cpf_hr");

-- CreateIndex
CREATE UNIQUE INDEX "IDMConfig_dataSourceId_key" ON "public"."IDMConfig"("dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentitiesIDM_identity_id_idm_key" ON "public"."IdentitiesIDM"("identity_id_idm");

-- CreateIndex
CREATE UNIQUE INDEX "IdentitiesIDM_email_idm_key" ON "public"."IdentitiesIDM"("email_idm");

-- CreateIndex
CREATE UNIQUE INDEX "RolesIDM_name_role_idm_key" ON "public"."RolesIDM"("name_role_idm");

-- CreateIndex
CREATE UNIQUE INDEX "Endpoint_IDM_name_endpoint_idm_key" ON "public"."Endpoint_IDM"("name_endpoint_idm");

-- CreateIndex
CREATE UNIQUE INDEX "System_dataSourceId_key" ON "public"."System"("dataSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_id_in_system_account_key" ON "public"."Accounts"("id_in_system_account");

-- CreateIndex
CREATE INDEX "_GroupToUser_B_index" ON "public"."_GroupToUser"("B");

-- CreateIndex
CREATE INDEX "_PackageToPlatform_B_index" ON "public"."_PackageToPlatform"("B");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DataSource" ADD CONSTRAINT "DataSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."import_logs" ADD CONSTRAINT "import_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."import_logs" ADD CONSTRAINT "import_logs_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HRConfig" ADD CONSTRAINT "HRConfig_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IDMConfig" ADD CONSTRAINT "IDMConfig_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Identities_RolesIDM" ADD CONSTRAINT "Identities_RolesIDM_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."IdentitiesIDM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Identities_RolesIDM" ADD CONSTRAINT "Identities_RolesIDM_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."RolesIDM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolesIDM_Endpoint" ADD CONSTRAINT "RolesIDM_Endpoint_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."RolesIDM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolesIDM_Endpoint" ADD CONSTRAINT "RolesIDM_Endpoint_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "public"."Endpoint_IDM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Endpoint_Source" ADD CONSTRAINT "Endpoint_Source_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "public"."Endpoint_IDM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Endpoint_Source" ADD CONSTRAINT "Endpoint_Source_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."ResourceIDM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."System" ADD CONSTRAINT "System_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "public"."DataSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."System_Account" ADD CONSTRAINT "System_Account_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."System"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."System_Account" ADD CONSTRAINT "System_Account_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account_Resource" ADD CONSTRAINT "Account_Resource_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account_Resource" ADD CONSTRAINT "Account_Resource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."System_Resource" ADD CONSTRAINT "System_Resource_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."System"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."System_Resource" ADD CONSTRAINT "System_Resource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GroupToUser" ADD CONSTRAINT "_GroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_GroupToUser" ADD CONSTRAINT "_GroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PackageToPlatform" ADD CONSTRAINT "_PackageToPlatform_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PackageToPlatform" ADD CONSTRAINT "_PackageToPlatform_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
