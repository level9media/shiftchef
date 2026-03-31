import { SEOHead } from "@/components/SEOHead";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { ChevronDown, Building2, ChefHat, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface FAQItem {
  q: string;
  a: string;
}

const EMPLOYER_FAQS_EN: FAQItem[] = [
  {
    q: "How fast can I get staff for a shift?",
    a: "Most employers receive their first applicants within 15–30 minutes of posting. For same-day shifts, we recommend posting at least 2–3 hours in advance. For weekend events, posting 24–48 hours ahead gives you the best selection of qualified workers.",
  },
  {
    q: "What does it cost to post a shift?",
    a: "A single shift post is $35. A 3-post bundle is $75 (save $30). Unlimited monthly posting is $99/month. There are no hidden fees — you pay for the post, then fund the worker's escrow when you hire. ShiftChef takes a 10% platform fee from the escrow, not from you.",
  },
  {
    q: "How do I pay the worker?",
    a: "When you hire a worker, you fund a Stripe escrow equal to the shift's total pay. After the shift ends and you confirm completion, funds are released to the worker's account automatically. You never handle cash or Venmo — it's all secure and documented.",
  },
  {
    q: "Are workers employees or contractors?",
    a: "All ShiftChef workers are independent 1099 contractors. They sign a contractor agreement before their first shift. You are not responsible for payroll taxes, benefits, or workers' comp. Always consult your own legal or tax advisor for your specific situation.",
  },
  {
    q: "What if a worker doesn't show up?",
    a: "If a hired worker no-shows, you can mark them as a no-show in the app. Their reliability score drops significantly, making them less competitive for future shifts. Your escrow is not released — you can re-post the shift at no additional credit cost.",
  },
  {
    q: "Can I see a worker's ratings and experience before hiring?",
    a: "Yes. Every worker profile shows their star rating, total shifts completed, reliability score, skills, and any reviews from previous employers. You can review all applicants before making a hire decision.",
  },
  {
    q: "What roles can I post for?",
    a: "ShiftChef supports all hospitality and food service roles: servers, bartenders, barbacks, line cooks, prep cooks, dishwashers, hosts/hostesses, event staff, catering staff, and more. If it's a hospitality role, you can post it.",
  },
  {
    q: "Do I need a subscription to use ShiftChef?",
    a: "No. You can start with a single $35 post and only upgrade if you need more volume. The $99/month unlimited plan is best for restaurants and venues that staff multiple shifts per week.",
  },
];

const EMPLOYER_FAQS_ES: FAQItem[] = [
  { q: "¿Qué tan rápido puedo conseguir personal para un turno?", a: "La mayoría de los empleadores reciben sus primeras solicitudes en 15–30 minutos de publicar. Para turnos del mismo día, recomendamos publicar con al menos 2–3 horas de anticipación. Para eventos de fin de semana, publicar 24–48 horas antes te da la mejor selección de trabajadores calificados." },
  { q: "¿Cuánto cuesta publicar un turno?", a: "Una publicación de turno individual cuesta $35. Un paquete de 3 publicaciones es $75 (ahorra $30). Publicación ilimitada mensual es $99/mes. No hay cargos ocultos: pagas por la publicación y luego fondeas el depósito del trabajador cuando lo contratas. ShiftChef toma una tarifa de plataforma del 10% del depósito, no de ti." },
  { q: "¿Cómo le pago al trabajador?", a: "Cuando contratas a un trabajador, fondeas un depósito Stripe igual al pago total del turno. Después de que termina el turno y confirmas la finalización, los fondos se liberan automáticamente a la cuenta del trabajador. Nunca manejas efectivo ni Venmo." },
  { q: "¿Los trabajadores son empleados o contratistas?", a: "Todos los trabajadores de ShiftChef son contratistas independientes 1099. Firman un acuerdo de contratista antes de su primer turno. No eres responsable de impuestos de nómina, beneficios ni compensación laboral." },
  { q: "¿Qué pasa si un trabajador no se presenta?", a: "Si un trabajador contratado no se presenta, puedes marcarlo como ausente en la app. Su puntaje de confiabilidad baja significativamente. Tu depósito no se libera: puedes volver a publicar el turno sin costo adicional de crédito." },
  { q: "¿Puedo ver las calificaciones y experiencia de un trabajador antes de contratar?", a: "Sí. Cada perfil de trabajador muestra su calificación de estrellas, turnos completados, puntaje de confiabilidad, habilidades y reseñas de empleadores anteriores." },
  { q: "¿Qué roles puedo publicar?", a: "ShiftChef admite todos los roles de hostelería y servicio de alimentos: meseros, bartenders, cocineros de línea, cocineros de preparación, lavaplatos, anfitriones, personal de eventos, personal de catering y más." },
  { q: "¿Necesito una suscripción para usar ShiftChef?", a: "No. Puedes comenzar con una publicación individual de $35 y solo actualizar si necesitas más volumen. El plan ilimitado de $99/mes es mejor para restaurantes y locales que contratan múltiples turnos por semana." },
];

const WORKER_FAQS_EN: FAQItem[] = [
  {
    q: "Is it free to apply for shifts?",
    a: "Yes, 100% free. There are no fees to create a profile, apply for shifts, or receive payment. ShiftChef takes a 10% platform fee from the employer-funded escrow — you keep 90% of every shift's pay.",
  },
  {
    q: "How does same-day pay work?",
    a: "When your shift ends and the employer confirms completion, the escrow releases to your ShiftChef account. From there, you can transfer to your linked bank account or Apple Pay. Most transfers complete within a few hours — same day.",
  },
  {
    q: "Do I need to verify my identity?",
    a: "Yes. ID verification is required before applying to shifts. This protects employers and ensures you're treated as a trusted professional. Verification takes about 2 minutes — upload a government-issued ID and you're done.",
  },
  {
    q: "Am I an employee or a contractor?",
    a: "You are an independent 1099 contractor. You choose which shifts to apply for, set your own schedule, and work for multiple employers. You are responsible for your own taxes. ShiftChef provides a contractor agreement you sign before your first shift.",
  },
  {
    q: "What cities are available?",
    a: "ShiftChef is currently live in Austin TX, Phoenix AZ, and Mesa AZ. We are expanding to additional cities — sign up and you'll be notified when your city goes live.",
  },
  {
    q: "What if I get hired but can't make the shift?",
    a: "If you need to cancel, do so as early as possible through the app. Frequent cancellations after being hired will lower your reliability score, making it harder to get hired in the future. Employers depend on you showing up — professionalism is everything.",
  },
  {
    q: "What should I bring and how should I arrive?",
    a: "Arrive at least 10 minutes early. Dress appropriately for the role (ask the employer if unsure). Bring any required equipment or certifications. Be professional, courteous, and ready to work. Your rating depends on it.",
  },
  {
    q: "How do ratings work?",
    a: "After every completed shift, both you and the employer rate each other 1–5 stars. Your average rating and reliability score are visible to all employers. High ratings mean more job offers and higher-paying shifts. Low ratings reduce your visibility.",
  },
];

const WORKER_FAQS_ES: FAQItem[] = [
  { q: "¿Es gratis solicitar turnos?", a: "Sí, 100% gratis. No hay tarifas para crear un perfil, solicitar turnos o recibir pago. ShiftChef toma una tarifa de plataforma del 10% del depósito pagado por el empleador: tú te quedas el 90% del pago de cada turno." },
  { q: "¿Cómo funciona el pago el mismo día?", a: "Cuando termina tu turno y el empleador confirma la finalización, el depósito se libera a tu cuenta de ShiftChef. Desde allí, puedes transferir a tu cuenta bancaria vinculada o Apple Pay. La mayoría de las transferencias se completan en pocas horas." },
  { q: "¿Necesito verificar mi identidad?", a: "Sí. La verificación de identidad es obligatoria antes de solicitar turnos. Esto protege a los empleadores y garantiza que seas tratado como un profesional de confianza. La verificación toma unos 2 minutos." },
  { q: "¿Soy empleado o contratista?", a: "Eres un contratista independiente 1099. Tú eliges qué turnos solicitar, estableces tu propio horario y trabajas para múltiples empleadores. Eres responsable de tus propios impuestos." },
  { q: "¿Qué ciudades están disponibles?", a: "ShiftChef está actualmente activo en Austin TX, Phoenix AZ y Mesa AZ. Nos estamos expandiendo a ciudades adicionales: regístrate y te notificaremos cuando tu ciudad esté disponible." },
  { q: "¿Qué pasa si me contratan pero no puedo asistir al turno?", a: "Si necesitas cancelar, házlo lo antes posible a través de la app. Las cancelaciones frecuentes después de ser contratado reducirán tu puntaje de confiabilidad, dificultando ser contratado en el futuro." },
  { q: "¿Qué debo traer y cómo debo llegar?", a: "Llega al menos 10 minutos antes. Vístete apropiadamente para el rol. Trae cualquier equipo o certificación requerida. Sé profesional, cortés y listo para trabajar." },
  { q: "¿Cómo funcionan las calificaciones?", a: "Después de cada turno completado, tú y el empleador se califican mutuamente del 1 al 5 estrellas. Tu calificación promedio y puntaje de confiabilidad son visibles para todos los empleadores." },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <button
            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-sm font-semibold text-foreground leading-snug">{item.q}</span>
            <ChevronDown
              size={16}
              className={cn(
                "flex-shrink-0 text-muted-foreground transition-transform duration-200",
                open === i && "rotate-180"
              )}
            />
          </button>
          {open === i && (
            <div className="px-4 pb-4">
              <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FAQ() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"employer" | "worker">("employer");
  const { isSpanish } = useLanguage();
  const EMPLOYER_FAQS = isSpanish ? EMPLOYER_FAQS_ES : EMPLOYER_FAQS_EN;
  const WORKER_FAQS = isSpanish ? WORKER_FAQS_ES : WORKER_FAQS_EN;

  return (
    <AppShell>
      <SEOHead
        title="FAQ — ShiftChef | Hospitality Staffing Questions Answered"
        description="Answers to the most common questions about ShiftChef — for employers hiring hospitality staff and workers looking for on-demand shifts in Austin, Phoenix, and Mesa."
        canonicalPath="/faq"
      />

      <div className="max-w-lg mx-auto px-4 pb-32 pt-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">FAQ</span>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            {isSpanish ? "Preguntas respondidas." : "Questions answered."}
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {isSpanish ? "Todo lo que necesitas saber antes de tu primer turno, ya sea que estés contratando o trabajando." : "Everything you need to know before your first shift — whether you're hiring or working."}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6 bg-secondary rounded-xl p-1">
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-bold transition-all",
              tab === "employer"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
            onClick={() => setTab("employer")}
          >
            <Building2 size={14} />
            {isSpanish ? "Empleadores" : "Employers"}
          </button>
          <button
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-bold transition-all",
              tab === "worker"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
            onClick={() => setTab("worker")}
          >
            <ChefHat size={14} />
            {isSpanish ? "Trabajadores" : "Workers"}
          </button>
        </div>

        {/* FAQ accordion */}
        {tab === "employer" ? (
          <FAQAccordion items={EMPLOYER_FAQS} />
        ) : (
          <FAQAccordion items={WORKER_FAQS} />
        )}

        {/* Bottom CTA */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-center">
          <p className="font-bold text-foreground text-sm mb-1">{isSpanish ? "¿Todavía tienes una pregunta?" : "Still have a question?"}</p>
          <p className="text-xs text-muted-foreground mb-4">
            {isSpanish ? "Contáctanos en" : "Reach out at"}{" "}
            <a href="mailto:support@shiftchef.co" className="text-primary hover:underline">
              support@shiftchef.co
            </a>{" "}
            {isSpanish ? "y te responderemos en pocas horas." : "and we'll get back to you within a few hours."}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-10 text-sm font-bold rounded-xl"
              onClick={() => navigate("/pricing")}
            >
              {isSpanish ? "Ver Precios" : "See Pricing"}
            </Button>
            <Button
              className="flex-1 h-10 text-sm font-bold rounded-xl btn-glow"
              onClick={() => navigate("/how-it-works")}
            >
              {isSpanish ? "Cómo Funciona" : "How It Works"}
              <ArrowRight size={13} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
