import { LoginScreen } from "./Components/login-screen";
import { TopBar } from "./Components/top-bar";
import styles from "./page.module.css";
import { auth } from "@/auth";
import { isAuthConfigured } from "@/lib/auth-config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const authConfigured = isAuthConfigured();
  const session = authConfigured ? await auth() : null;

  if (session?.user) {
    redirect("/generator");
  }

  return (
    <div className={styles.page}>
      <TopBar isAuthConfigured={authConfigured} user={null} />
      <main className={styles.loginMain}>
        <LoginScreen isAuthConfigured={authConfigured} />
      </main>
    </div>
  );
}
