import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "es";

const translations = {
  en: {
    // Nav
    home: "Home",
    howItWorks: "How It Works",
    pricing: "Pricing",
    faq: "FAQ",
    findShifts: "Find Shifts",
    postJob: "Post a Job",
    signIn: "Sign in",
    signOut: "Sign out",
    profile: "Profile",
    earnings: "Earnings",
    applications: "Applications",
    ratings: "Ratings",
    availability: "Availability",

    // Feed
    liveShifts: "Live Shifts",
    availableWorkers: "Available Workers",
    noShiftsFound: "No shifts found",
    noWorkersFound: "No workers found",
    applyNow: "Apply Now",
    hireNow: "Hire Now",
    perHour: "/hr",
    verified: "Verified",
    permanent: "Permanent Potential",
    viewDetails: "View Details",
    filterByCity: "Filter by city",
    filterByRole: "Filter by role",
    allRoles: "All Roles",

    // Job Detail
    jobDetails: "Job Details",
    shiftTime: "Shift Time",
    payRate: "Pay Rate",
    location: "Location",
    description: "Description",
    requirements: "Requirements",
    minRating: "Min Rating",
    applyForShift: "Apply for This Shift",
    coverNote: "Cover Note",
    coverNotePlaceholder: "Tell the employer why you're the right fit...",
    bankInfo: "Bank Account Info",
    routingNumber: "Routing Number",
    accountNumber: "Account Number",
    submitApplication: "Submit Application",
    applicationSubmitted: "Application Submitted!",

    // Post Job
    postAJob: "Post a Job",
    role: "Role",
    selectRole: "Select a role",
    hourlyRate: "Hourly Rate ($)",
    startTime: "Start Time",
    endTime: "End Time",
    jobDescription: "Job Description",
    descriptionPlaceholder: "Describe the shift, duties, dress code...",
    minimumRating: "Minimum Worker Rating",
    permanentOpportunity: "Permanent Opportunity",
    permanentDesc: "This shift may lead to a full-time position",
    postShift: "Post Shift",
    posting: "Posting...",

    // Profile
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    name: "Name",
    bio: "Bio",
    bioPlaceholder: "Tell employers about your experience...",
    skills: "Skills",
    experience: "Experience",
    experiencePlaceholder: "Years of experience, past restaurants...",
    profileImage: "Profile Image URL",
    workerType: "I am a",
    worker: "Worker",
    employer: "Employer",
    switchRole: "Switch Role",

    // Earnings
    myEarnings: "My Earnings",
    availableBalance: "Available Balance",
    pendingBalance: "Pending",
    totalEarned: "Total Earned",
    withdraw: "Withdraw",
    connectStripe: "Connect Bank Account",
    paymentHistory: "Payment History",
    noEarnings: "No earnings yet",
    platformFee: "Platform Fee (10%)",
    yourPayout: "Your Payout (90%)",

    // Onboarding
    welcome: "Welcome to ShiftChef",
    iAmA: "I am a...",
    lookingForWork: "Worker",
    lookingForWork_desc: "I want to find shifts and get paid fast",
    hiringStaff: "Employer",
    hiringStaff_desc: "I need to hire hospitality staff quickly",
    getStarted: "Get Started",
    continue: "Continue",
    back: "Back",

    // Common
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Try Again",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirm: "Confirm",
    close: "Close",
    search: "Search",
    filter: "Filter",
    noResults: "No results found",
    required: "Required",
    optional: "Optional",
    submit: "Submit",
    success: "Success!",
    comingSoon: "Coming soon",
  },

  es: {
    // Nav
    home: "Inicio",
    howItWorks: "Cómo Funciona",
    pricing: "Precios",
    faq: "Preguntas Frecuentes",
    findShifts: "Buscar Turnos",
    postJob: "Publicar Trabajo",
    signIn: "Iniciar Sesión",
    signOut: "Cerrar Sesión",
    profile: "Perfil",
    earnings: "Ganancias",
    applications: "Solicitudes",
    ratings: "Calificaciones",
    availability: "Disponibilidad",

    // Feed
    liveShifts: "Turnos Disponibles",
    availableWorkers: "Trabajadores Disponibles",
    noShiftsFound: "No se encontraron turnos",
    noWorkersFound: "No se encontraron trabajadores",
    applyNow: "Aplicar Ahora",
    hireNow: "Contratar Ahora",
    perHour: "/hr",
    verified: "Verificado",
    permanent: "Potencial Permanente",
    viewDetails: "Ver Detalles",
    filterByCity: "Filtrar por ciudad",
    filterByRole: "Filtrar por rol",
    allRoles: "Todos los Roles",

    // Job Detail
    jobDetails: "Detalles del Turno",
    shiftTime: "Horario del Turno",
    payRate: "Tarifa de Pago",
    location: "Ubicación",
    description: "Descripción",
    requirements: "Requisitos",
    minRating: "Calificación Mínima",
    applyForShift: "Aplicar a Este Turno",
    coverNote: "Nota de Presentación",
    coverNotePlaceholder: "Cuéntale al empleador por qué eres la persona indicada...",
    bankInfo: "Información Bancaria",
    routingNumber: "Número de Ruta",
    accountNumber: "Número de Cuenta",
    submitApplication: "Enviar Solicitud",
    applicationSubmitted: "¡Solicitud Enviada!",

    // Post Job
    postAJob: "Publicar un Trabajo",
    role: "Rol",
    selectRole: "Selecciona un rol",
    hourlyRate: "Tarifa por Hora ($)",
    startTime: "Hora de Inicio",
    endTime: "Hora de Fin",
    jobDescription: "Descripción del Trabajo",
    descriptionPlaceholder: "Describe el turno, tareas, código de vestimenta...",
    minimumRating: "Calificación Mínima del Trabajador",
    permanentOpportunity: "Oportunidad Permanente",
    permanentDesc: "Este turno puede convertirse en un puesto de tiempo completo",
    postShift: "Publicar Turno",
    posting: "Publicando...",

    // Profile
    myProfile: "Mi Perfil",
    editProfile: "Editar Perfil",
    saveChanges: "Guardar Cambios",
    name: "Nombre",
    bio: "Biografía",
    bioPlaceholder: "Cuéntale a los empleadores sobre tu experiencia...",
    skills: "Habilidades",
    experience: "Experiencia",
    experiencePlaceholder: "Años de experiencia, restaurantes anteriores...",
    profileImage: "URL de Foto de Perfil",
    workerType: "Soy",
    worker: "Trabajador",
    employer: "Empleador",
    switchRole: "Cambiar Rol",

    // Earnings
    myEarnings: "Mis Ganancias",
    availableBalance: "Saldo Disponible",
    pendingBalance: "Pendiente",
    totalEarned: "Total Ganado",
    withdraw: "Retirar",
    connectStripe: "Conectar Cuenta Bancaria",
    paymentHistory: "Historial de Pagos",
    noEarnings: "Sin ganancias aún",
    platformFee: "Comisión de Plataforma (10%)",
    yourPayout: "Tu Pago (90%)",

    // Onboarding
    welcome: "Bienvenido a ShiftChef",
    iAmA: "Soy...",
    lookingForWork: "Trabajador",
    lookingForWork_desc: "Quiero encontrar turnos y cobrar rápido",
    hiringStaff: "Empleador",
    hiringStaff_desc: "Necesito contratar personal de hospitalidad rápidamente",
    getStarted: "Comenzar",
    continue: "Continuar",
    back: "Atrás",

    // Common
    loading: "Cargando...",
    error: "Algo salió mal",
    retry: "Intentar de Nuevo",
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    confirm: "Confirmar",
    close: "Cerrar",
    search: "Buscar",
    filter: "Filtrar",
    noResults: "No se encontraron resultados",
    required: "Requerido",
    optional: "Opcional",
    submit: "Enviar",
    success: "¡Éxito!",
    comingSoon: "Próximamente",
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isSpanish: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem("shiftchef_lang") as Language) || "en";
    } catch {
      return "en";
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("shiftchef_lang", lang);
    } catch {}
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isSpanish: language === "es" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
