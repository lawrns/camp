import ClientHomePage from "@/components/homepage/ClientHomePage";
import { WidgetProvider } from "@/components/widget";

export const metadata = {
  title: "Campfire - Customer support that feels completely human",
  description:
    "Scale exceptional support without hiring. AI agents so natural, your customers will never know the difference. Start free with Campfire.",
  keywords:
    "customer support, AI customer service, live chat, help desk, customer experience, RAG AI agents, support automation",
  openGraph: {
    title: "Campfire - Customer support that feels completely human",
    description:
      "Scale exceptional support without hiring. AI agents so natural, your customers will never know the difference.",
    images: ["/images/campfire-og.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campfire - Customer support that feels completely human",
    description:
      "Scale exceptional support without hiring. AI agents so natural, your customers will never know the difference.",
    images: ["/images/campfire-twitter.png"],
  },
};

export default function HomePage() {
  return (
    <WidgetProvider
      organizationId="b5e80170-004c-4e82-a88c-3e2166b169dd"
      conversationId="8ddf595b-b75d-42f2-98e5-9efd3513ea4b"
    >
      <div className="home-page min-h-screen">
        <ClientHomePage />
      </div>
    </WidgetProvider>
  );
}