import { TopBar } from "../Components/top-bar";
import ImageGenerator from "../Views/ImageGenerator";
import styles from "../page.module.css";
import { auth } from "@/auth";
import { isAuthConfigured } from "@/lib/auth-config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GeneratorPage() {
  if (!isAuthConfigured()) {
    redirect("/");
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className={styles.page}>
      <TopBar isAuthConfigured user={session.user} />
      <main className={styles.main}>
        <ImageGenerator user={session.user} />
      </main>
    </div>
  );
}
