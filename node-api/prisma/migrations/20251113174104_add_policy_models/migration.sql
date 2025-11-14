-- CreateTable
CREATE TABLE "public"."sod_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaNegocio" TEXT,
    "processoNegocio" TEXT,
    "owner" TEXT,
    "ruleType" TEXT NOT NULL,
    "systemId" INTEGER,
    "valueAType" TEXT NOT NULL,
    "valueAId" TEXT NOT NULL,
    "valueAOperator" TEXT,
    "valueAValue" TEXT,
    "valueBType" TEXT NOT NULL,
    "valueBId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sod_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rbac_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaNegocio" TEXT,
    "processoNegocio" TEXT,
    "owner" TEXT,
    "systemId" INTEGER NOT NULL,
    "grantedResourceId" INTEGER NOT NULL,
    "conditionType" TEXT NOT NULL,
    "requiredResourceId" INTEGER,
    "attributeName" TEXT,
    "attributeOperator" TEXT,
    "attributeValue" TEXT,
    "logicalOperator" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rbac_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rbac_attribute_conditions" (
    "id" SERIAL NOT NULL,
    "rbacRuleId" INTEGER NOT NULL,
    "attributeName" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "attributeValue" TEXT NOT NULL,

    CONSTRAINT "rbac_attribute_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sod_rules_userId_systemId_valueAType_valueAId_valueAOperato_key" ON "public"."sod_rules"("userId", "systemId", "valueAType", "valueAId", "valueAOperator", "valueAValue", "valueBType", "valueBId");

-- CreateIndex
CREATE UNIQUE INDEX "rbac_rules_userId_systemId_grantedResourceId_conditionType__key" ON "public"."rbac_rules"("userId", "systemId", "grantedResourceId", "conditionType", "requiredResourceId", "attributeName", "attributeOperator", "attributeValue", "logicalOperator");

-- AddForeignKey
ALTER TABLE "public"."sod_rules" ADD CONSTRAINT "sod_rules_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."System"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sod_rules" ADD CONSTRAINT "sod_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_rules" ADD CONSTRAINT "rbac_rules_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "public"."System"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_rules" ADD CONSTRAINT "rbac_rules_grantedResourceId_fkey" FOREIGN KEY ("grantedResourceId") REFERENCES "public"."Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_rules" ADD CONSTRAINT "rbac_rules_requiredResourceId_fkey" FOREIGN KEY ("requiredResourceId") REFERENCES "public"."Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_rules" ADD CONSTRAINT "rbac_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_attribute_conditions" ADD CONSTRAINT "rbac_attribute_conditions_rbacRuleId_fkey" FOREIGN KEY ("rbacRuleId") REFERENCES "public"."rbac_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
