import { mailboxes } from "@/db/schema";
import { aiUtils } from "./ai";

const examples: [email: string, keywords: string][] = [
  [
    "Email: Delete my email from your files\n\nHi, Can you please delete my email address from your website and all newsletters. Thank you.",
    "delete email",
  ],
  [
    "Email: We have recently had people say checkout is adding a \"Tip\" but they can't remove it. We didn't add this as a feature we have had hundreds of people buy it without a tip, it just started showing up. Is there a reason this is happening!",
    "checkout tip feature",
  ],
  ["Email: Refund\n\nI need to get refund for this transaction, it was by mistake.", "refund transaction"],
  [
    "Email: Services not visible on Gumroad discover\n\nHello, I have added services and they are published. I cannot see my services in the marketplace. Thank you. Kind regards, Charlie",
    "Gumroad discover visibility",
  ],
  [
    "Email: RE: O365 Ebook\nAn additional $0.50 (fifty cents) charge? That wasn't from us - it must be a charge from your credit card provider for some reason. Perhaps the Gumroad support people can throw some light onto the topic. They're copied on this note and can track transactions (we can't). Cheers, David",
    "additional charge",
  ],
  [
    "Email: Re: New tender offer available\n\nyour site barely works. The tender page is just blank. Is there supposed to be something to click on?",
    "tender offer blank",
  ],
  [
    "Email: Re: Regarding your Gumroad account\n\nHi I'm replying to the suspension on the account. What's the reason? Regards Nathan\n-- Original message --\nHi, We apologize for the inconvenience, but we noticed certain behaviors in your account that indicate possible violations of our Terms of Service.",
    "Gumroad suspension",
  ],
];

export const emailKeywordsExtractor = async (params: {
  mailbox: typeof mailboxes.$inferSelect;
  subject: string;
  body: string;
}): Promise<string[]> => {
  // Combine subject and body for keyword extraction
  const combinedText = `${params.subject} ${params.body}`;

  // Use the AI utils to extract keywords
  const keywords = aiUtils.extractKeywords(combinedText, 3);

  // Additional simple keyword extraction based on examples
  const lowerText = combinedText.toLowerCase();
  const additionalKeywords: string[] = [];

  // Check for common patterns from examples
  if (lowerText.includes("delete") && lowerText.includes("email")) {
    additionalKeywords.push("delete", "email");
  }
  if (lowerText.includes("refund")) {
    additionalKeywords.push("refund");
  }
  if (lowerText.includes("tip") && lowerText.includes("checkout")) {
    additionalKeywords.push("checkout", "tip");
  }
  if (lowerText.includes("suspension") || lowerText.includes("suspended")) {
    additionalKeywords.push("suspension");
  }
  if (lowerText.includes("charge")) {
    additionalKeywords.push("charge");
  }
  if (lowerText.includes("blank") || lowerText.includes("not visible")) {
    additionalKeywords.push("visibility");
  }

  // Combine and deduplicate keywords
  const allKeywords = [...new Set([...keywords, ...additionalKeywords])];

  return allKeywords
    .filter(Boolean)
    .slice(0, 3) // Limit to 3 keywords
    .sort();
};
