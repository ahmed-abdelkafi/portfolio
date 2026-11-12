import { notFound } from "next/navigation";
import { isLocale } from "@/content";
import Hero from "@/components/Hero";
import About from "@/components/About";
import BuildStack from "@/components/BuildStack";
import Reel from "@/components/Reel";
import Work from "@/components/Work";
import WorkIndex from "@/components/WorkIndex";
import Credits from "@/components/Credits";
import Proof from "@/components/Proof";
import Contact from "@/components/Contact";
import SceneShift from "@/components/SceneShift";

/** Final Cut — eight scenes, lit in charcoal or bone. SC.03 proves the full stack. */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main">
      <Hero />
      <About />
      <BuildStack />
      <Reel />
      <Work />
      <WorkIndex />
      <Credits />
      <Proof />
      <Contact />
      <SceneShift initial="dark" />
    </main>
  );
}
