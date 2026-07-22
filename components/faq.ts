// FAQ compartido — fuente única para la landing (sección "preguntas") y la página /ayuda.
// FAQS = las de marketing (landing). FAQS_SUPPORT = extra de soporte/facturación/datos (solo /ayuda).

export const FAQS: [string, string][] = [
  ["¿Jurovia da asesoría legal?", "No. Jurovia es una empresa de software (SaaS); no es un bufete de abogados y su uso no crea una relación abogado-cliente. Sus resultados son borradores que un profesional del derecho con tarjeta profesional vigente revisa, decide y firma bajo su responsabilidad."],
  ["¿En qué se diferencia de ChatGPT o Claude?", "Jurovia contrasta las citas contra las fuentes oficiales y te da el enlace; además te avisa de cambios y entrega en Word. La IA genérica redacta, pero no contrasta las fuentes de forma verificable."],
  ["¿De dónde saca la información?", "De portales oficiales de leyes y jurisprudencia. Cada cita incluye su enlace para que tú la valides."],
  ["¿Reemplaza al abogado?", "No. Es una herramienta de apoyo: tú decides y firmas. Jurovia te ahorra la parte de buscar, contrastar y redactar."],
  ["¿Entrega en Word?", "Sí, en .docx (y PDF), como borrador editable para que el abogado lo revise."],
  ["¿Mis datos están seguros?", "Cada cuenta y caso está aislado por organización."],
  ["¿Necesito tarjeta para la prueba?", "No. El plan Free no requiere tarjeta."],
  ["¿Funciona para mi área?", "Es software enfocado en derecho colombiano y mejora con cada caso; útil para litigio, laboral y trámites con fundamentación verificable."],
  ["¿Qué pasa cuando se acaban mis créditos del plan Free?", "El asistente y las alertas automáticas se pausan; el resto de la app sigue disponible."],
];

export const FAQS_SUPPORT: [string, string][] = [
  ["¿Cómo cancelo mi suscripción?", "Desde Ajustes → Gestionar suscripción entras a tu portal para cancelar, ver tus facturas o actualizar el método de pago cuando quieras. Sin permanencia."],
  ["¿Dónde veo mis facturas?", "En el mismo portal (Ajustes → Gestionar suscripción). Las facturas las emite Paddle, nuestro procesador de pagos."],
  ["¿Usan mis datos para entrenar modelos de IA?", "No. Tus conversaciones y documentos no se usan para entrenar modelos."],
  ["¿Cómo ejerzo mis derechos sobre mis datos personales?", "Puedes conocer, actualizar, rectificar, suprimir o revocar tu autorización escribiéndonos a soporte@juroviapp.com. Conforme a la Ley 1581 de 2012."],
  ["¿En cuánto tiempo responden soporte?", "Entre 24 y 72 horas hábiles."],
];
