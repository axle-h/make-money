import { Prisma } from "@prisma/client";
import { Stat } from "@chakra-ui/react";
import { currency } from "@/components/currency";
import React from "react";

export function CashFlow({ amount }: { amount: Prisma.Decimal | number }) {
  const [absAmount, isPos, isZero] =
    amount instanceof Prisma.Decimal
      ? [amount.abs(), amount.isPos(), amount.isZero()]
      : [Math.abs(amount), amount > 0, amount === 0];

  if (isZero) {
    return <></>;
  }

  return (
    <Stat.Root size="sm">
      <Stat.ValueText fontSize="sm" fontWeight={400}>
        {isPos ? <Stat.UpIndicator /> : <Stat.DownIndicator />}
        {currency(absAmount)}
      </Stat.ValueText>
    </Stat.Root>
  );
}
