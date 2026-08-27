import { TopBar } from "../Components/top-bar";
import AssetLibrary from "../Views/AssetLibrary";
import styles from "../page.module.css";
import { auth } from "@/auth";
import { isEmailAllowed } from "@/lib/allowed-emails";
import { isAuthConfigured } from "@/lib/auth-config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  if (!isAuthConfigured()) {
    redirect("/");
  }

  const session = await auth();

  if (!session?.user || !isEmailAllowed(session.user.email)) {
    redirect("/");
  }

  return (
    <div className={styles.page}>
      <TopBar isAuthConfigured user={session.user} />
      <main className={styles.main}>
        <AssetLibrary />
      </main>
    </div>
  );
}
