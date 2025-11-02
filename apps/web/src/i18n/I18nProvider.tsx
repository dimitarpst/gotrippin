"use client";
import "./index"; // this will actually execute your i18n setup code

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // no need to wrap in a provider — just ensures initialization runs on the client
  return <>{children}</>;
}
