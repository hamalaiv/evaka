ALTER TABLE voucher_value_decision ADD CONSTRAINT check$voucher_value_gte_co_payment CHECK ( voucher_value >= co_payment );