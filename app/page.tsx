import Scrapper from "./components/Scrapper";
import { ProgressProvider } from "@/hooks/loading-hook";
import Container from "./components/Container";

export default function Home() {
  return (
    <ProgressProvider>
      <Container>
        <Scrapper />
      </Container>
    </ProgressProvider>
  );
}
