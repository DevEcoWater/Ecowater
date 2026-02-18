-- Renombrar tabla
ALTER TABLE "Adress" RENAME TO "Address";

-- Renombrar columna en tabla Address
ALTER TABLE "Address" RENAME COLUMN "address" TO "data";

-- Renombrar columna en User
ALTER TABLE "User" RENAME COLUMN "adressId" TO "addressId";

-- Renombrar índice único en User
ALTER INDEX "User_adressId_key" RENAME TO "User_addressId_key";
