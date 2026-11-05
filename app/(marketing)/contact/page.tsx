import type { Metadata } from "next"
import Link from "next/link"
import { AccountabilityPage } from "@/components/accountability/AccountabilityPage"
import Contact from "@/components/sections/Contact"
import { Text } from "@/components/ui/text"
import { CONTACT_MONITORED_EMAIL, CONTACT_REPLY_PROMISE } from "@/lib/accountability"

export const metadata: Metadata = {
  title: "Contact",
  description: "Send feedback or a question to a person at WorkGraph.",
}

export default function ContactPage() {
  return (
    <>
      <AccountabilityPage
        title="Contact"
        lede="Feedback and questions go to a person. This is not a chatbot and not a ticket farm."
      >
        <section className="space-y-2 rounded-card border border-hairline bg-surface-raised p-4">
          <Text as="h2" role="subheading">
            Monitored email
          </Text>
          <a
            href={`mailto:${CONTACT_MONITORED_EMAIL}`}
            className="inline-flex min-h-11 items-center text-role-body text-accent"
          >
            {CONTACT_MONITORED_EMAIL}
          </a>
          <Text role="body-small" className="text-ink-muted">
            {CONTACT_REPLY_PROMISE}
          </Text>
          <Text role="caption" className="text-ink-subtle">
            Privacy requests:{" "}
            <Link href="/legal/privacy" className="text-accent underline-offset-2 hover:underline">
              see the privacy policy
            </Link>
            .
          </Text>
        </section>
      </AccountabilityPage>
      <Contact />
    </>
  )
}
