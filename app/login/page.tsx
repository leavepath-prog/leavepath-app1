import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in · LeavePath" };

export default function LoginPage() {
  return (
    <main className="wizard" style={{ paddingTop: 48 }}>
      <span className="brand">LeavePath</span>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
