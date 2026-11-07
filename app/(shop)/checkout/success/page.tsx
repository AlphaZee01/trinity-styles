import { SuccessClient } from "@/components/checkout/success-client";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  return <SuccessClient reference={params.reference ?? params.trxref ?? null} />;
}
