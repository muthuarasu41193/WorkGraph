"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { motion, useReducedMotion } from "framer-motion";
import {
  AtSign,
  CheckCircle2,
  Handshake,
  Loader2,
  Mail,
  MessageCircle,
} from "lucide-react";
import { SocialLinks } from "@/components/brand/SocialLinks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_INFO, CONTACT_SUBJECTS } from "@/lib/constants";

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  joinWaitlist: boolean;
};

function ContactInfoIcon({ type }: { type: (typeof CONTACT_INFO)[number]["icon"] }) {
  const className = "size-5 text-[#C41E3A]";
  if (type === "mail") return <Mail className={className} aria-hidden />;
  if (type === "message") return <MessageCircle className={className} aria-hidden />;
  if (type === "contact") return <AtSign className={className} aria-hidden />;
  return <Handshake className={className} aria-hidden />;
}

function RequiredMark() {
  return <span className="text-[#C41E3A]">*</span>;
}

function ContactForm() {
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      joinWaitlist: false,
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitState("loading");
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !result.ok) {
        setServerError(result.error ?? "Something went wrong. Please try again.");
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
      reset();
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setSubmitState("error");
    }
  };

  if (submitState === "success") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[20px] border border-[#E5E5E5] bg-white p-10 text-center shadow-lg">
        <CheckCircle2 className="size-14 text-[#16A34A]" aria-hidden />
        <p className="mt-4 font-heading text-xl font-bold text-[#0A0A0A]">
          Message sent! We&apos;ll reply within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => setSubmitState("idle")}
          className="mt-6 text-sm font-semibold text-[#C41E3A] transition-colors hover:text-[#A01830]"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-[20px] border border-[#E5E5E5] bg-white p-10 shadow-lg"
      noValidate
    >
      <div className="space-y-5">
        <div>
          <Label htmlFor="contact-name" className="mb-2 block text-[#0A0A0A]">
            Name <RequiredMark />
          </Label>
          <Input
            id="contact-name"
            type="text"
            placeholder="Your name"
            aria-invalid={Boolean(errors.name)}
            className="rounded-lg"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-[#C41E3A]" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="contact-email" className="mb-2 block text-[#0A0A0A]">
            Email <RequiredMark />
          </Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            className="rounded-lg"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-[#C41E3A]" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="contact-subject" className="mb-2 block text-[#0A0A0A]">
            Subject <RequiredMark />
          </Label>
          <Controller
            name="subject"
            control={control}
            rules={{ required: "Please select a subject" }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="contact-subject"
                  className="w-full rounded-lg"
                  aria-invalid={Boolean(errors.subject)}
                >
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_SUBJECTS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.subject && (
            <p className="mt-1.5 text-sm text-[#C41E3A]" role="alert">
              {errors.subject.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="contact-message" className="mb-2 block text-[#0A0A0A]">
            Message <RequiredMark />
          </Label>
          <Textarea
            id="contact-message"
            rows={5}
            placeholder="How can we help?"
            aria-invalid={Boolean(errors.message)}
            className="min-h-[120px] rounded-lg resize-y"
            {...register("message", {
              required: "Message is required",
              minLength: { value: 10, message: "Message must be at least 10 characters" },
            })}
          />
          {errors.message && (
            <p className="mt-1.5 text-sm text-[#C41E3A]" role="alert">
              {errors.message.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <Controller
            name="joinWaitlist"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="contact-waitlist"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label
            htmlFor="contact-waitlist"
            className="cursor-pointer text-sm font-normal leading-snug text-[#4A4A4A]"
          >
            I&apos;d also like to join the waitlist
          </Label>
        </div>
      </div>

      {submitState === "error" && serverError && (
        <p className="mt-4 text-sm text-[#C41E3A]" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitState === "loading"}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#C41E3A] py-3.5 text-base font-semibold text-white transition-all duration-200 hover:bg-[#A01830] hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitState === "loading" ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Sending...
          </>
        ) : (
          "Send Message →"
        )}
      </button>
    </form>
  );
}

export default function Contact() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="contact" aria-label="Contact" className="bg-[#F8F7F4] py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C41E3A]">
              GET IN TOUCH
            </p>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              Let&apos;s talk about your job search
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#4A4A4A]">
              Have questions about WorkGraph? Want to partner with us? Or just want to say hi? We
              respond within 24 hours.
            </p>

            <div className="mt-10 space-y-4">
              {CONTACT_INFO.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  className="group flex items-center gap-4 rounded-xl border border-[#E5E5E5] bg-white p-5 transition-all duration-200 hover:border-[#C41E3A]/30 hover:shadow-md"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#FFF5F5]">
                    <ContactInfoIcon type={card.icon} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0A0A0A]">{card.label}</p>
                    <p className="mt-0.5 text-sm text-[#4A4A4A] transition-colors group-hover:text-[#C41E3A]">
                      {card.value}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            <SocialLinks className="mt-8" />
          </motion.div>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
