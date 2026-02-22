"use client"

import PageLoader from "@/components/ui/page-loader"
import { useTranslation } from "react-i18next"

export default function EditTripLoading() {
  const { t } = useTranslation()
  return <PageLoader message={t("trips.loading")} />
}
