-- CreateTable
CREATE TABLE "Cooperative" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "location" TEXT,
    "contact_person" TEXT,
    "phone_number" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Cooperative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "password" TEXT,
    "address" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "UserMeter" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3),

    CONSTRAINT "UserMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meter" (
    "id" TEXT NOT NULL,
    "dev_eui" TEXT NOT NULL,
    "device_name" TEXT,
    "application_id" TEXT,
    "application_name" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "status" TEXT,
    "operational_status" TEXT,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Meter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3),
    "fCnt" INTEGER,
    "fPort" INTEGER,
    "adr" BOOLEAN,
    "status" TEXT,
    "cumulative_flow" TEXT,
    "cumulative_daily_flow" TEXT,
    "reverse_flow" TEXT,
    "instantaneous_flow" TEXT,
    "real_time_temperature" TEXT,
    "alarm_status" TEXT,
    "error_code" TEXT,
    "spare" TEXT,
    "check_code" TEXT,
    "ending_code" TEXT,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Status" (
    "id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "status_type_id" TEXT NOT NULL,
    "status_value_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3),

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "StatusType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusValue" (
    "id" TEXT NOT NULL,
    "status_type_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "StatusValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RxInfo" (
    "id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "gateway_id" TEXT NOT NULL,
    "lora_snr" DOUBLE PRECISION,
    "rssi" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "time" TIMESTAMP(3),
    "status" TEXT,
    "error_detail" TEXT,

    CONSTRAINT "RxInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gateway" (
    "id" TEXT NOT NULL,
    "gateway_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Gateway_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_name_key" ON "Role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "Meter_dev_eui_key" ON "Meter"("dev_eui");

-- CreateIndex
CREATE UNIQUE INDEX "StatusType_name_key" ON "StatusType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StatusValue_value_key" ON "StatusValue"("value");

-- CreateIndex
CREATE UNIQUE INDEX "Gateway_gateway_code_key" ON "Gateway"("gateway_code");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMeter" ADD CONSTRAINT "UserMeter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMeter" ADD CONSTRAINT "UserMeter_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "Meter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "Meter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "Reading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_status_type_id_fkey" FOREIGN KEY ("status_type_id") REFERENCES "StatusType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_status_value_id_fkey" FOREIGN KEY ("status_value_id") REFERENCES "StatusValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusValue" ADD CONSTRAINT "StatusValue_status_type_id_fkey" FOREIGN KEY ("status_type_id") REFERENCES "StatusType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxInfo" ADD CONSTRAINT "RxInfo_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "Reading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RxInfo" ADD CONSTRAINT "RxInfo_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "Gateway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
