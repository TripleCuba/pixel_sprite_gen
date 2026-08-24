import { Colors } from "./constants";
import ImageGenerator from "./Views/ImageGenerator";

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: Colors.canvas,
      }}
    >
      <ImageGenerator />
    </div>
  );
}
