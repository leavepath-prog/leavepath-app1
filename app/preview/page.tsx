import { Suspense } from "react";
import { PreviewClient } from "./PreviewClient";

export const metadata = { title: "Your plan preview · LeavePath" };

export default function PreviewPage() {
  return (
    <Suspense fallback={null}>
      <PreviewClient />
    </Suspense>
  );
}
