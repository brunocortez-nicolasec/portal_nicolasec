-- CreateTable
CREATE TABLE "public"."rbac_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaNegocio" TEXT,
    "processoNegocio" TEXT,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "conditionType" TEXT NOT NULL,
    "grantedProfileId" INTEGER NOT NULL,
    "requiredProfileId" INTEGER,
    "requiredAttributeId" TEXT,
    "requiredAttributeValue" TEXT,

    CONSTRAINT "rbac_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rbac_attribute_conditions" (
    "id" SERIAL NOT NULL,
    "rbacRuleId" INTEGER NOT NULL,
    "attributeId" TEXT NOT NULL,
    "attributeValue" TEXT NOT NULL,

    CONSTRAINT "rbac_attribute_conditions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."rbac_rules" ADD CONSTRAINT "rbac_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_rules" ADD CONSTRAINT "rbac_rules_grantedProfileId_fkey" FOREIGN KEY ("grantedProfileId") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_rules" ADD CONSTRAINT "rbac_rules_requiredProfileId_fkey" FOREIGN KEY ("requiredProfileId") REFERENCES "public"."profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rbac_attribute_conditions" ADD CONSTRAINT "rbac_attribute_conditions_rbacRuleId_fkey" FOREIGN KEY ("rbacRuleId") REFERENCES "public"."rbac_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
