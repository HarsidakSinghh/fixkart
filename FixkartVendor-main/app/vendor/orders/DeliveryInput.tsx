"use client";

import { updateDeliveryDate } from "@/app/actions/vendor-delivery";
import { useState } from "react";

export default function DeliveryInput({ itemId, current }: { itemId: string, current: Date | null }) {
  
  const handleDateChange = async (dateVal: string) => {
    // Call server action immediately on change
    await updateDeliveryDate(itemId, dateVal);
  };

  return (
    <input
      type="date"
      className="h-8 w-[140px] text-xs border border-gray-300 rounded px-2 focus:outline-none focus:border-blue-500"
      defaultValue={current ? new Date(current).toISOString().split('T')[0] : ""}
      onChange={(e) => handleDateChange(e.target.value)}
    />
  );
}