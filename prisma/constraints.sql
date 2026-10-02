-- Extra safety net at database level: sold can never exceed received, nothing negative.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_sold_within_received') THEN
    ALTER TABLE "Inventory" ADD CONSTRAINT inventory_sold_within_received CHECK ("sold" >= 0 AND "received" >= 0 AND "sold" <= "received");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_positive_values') THEN
    ALTER TABLE "Sale" ADD CONSTRAINT sale_positive_values CHECK ("quantity" > 0 AND "amount" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'allocation_positive_qty') THEN
    ALTER TABLE "Allocation" ADD CONSTRAINT allocation_positive_qty CHECK ("quantity" > 0);
  END IF;
END $$;
