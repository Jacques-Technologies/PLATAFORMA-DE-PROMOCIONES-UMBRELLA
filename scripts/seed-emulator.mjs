// Seed inicial para los emuladores. Crea:
//  - Usuario admin (admin@que-pollo.local / admin123)
//  - Doc en /usuarios_admin/{uid}
//  - Algunas sucursales_participantes
//  - Configuración global con monto_minimo
//  - Algunos registros de ejemplo
//
// Uso: ejecutar con los emuladores corriendo (`npm run dev:emulators`)
//   node scripts/seed-emulator.mjs

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099";

const PROJECT_ID = "que-pollo";
const ADMIN_EMAIL = "admin@que-pollo.local";
const ADMIN_PASSWORD = "admin123";

initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

async function ensureAdminUser() {
  let user;
  try {
    user = await auth.getUserByEmail(ADMIN_EMAIL);
  } catch {
    user = await auth.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  }
  await db.collection("usuarios_admin").doc(user.uid).set({
    email: ADMIN_EMAIL,
    nombre: "Admin de prueba",
    created_at: FieldValue.serverTimestamp(),
  });
  console.log(`✓ Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD} (uid=${user.uid})`);
  return user.uid;
}

async function seedSucursales() {
  const sucursales = [
    { numero: "001", nombre: "Sucursal Centro", activa: true },
    { numero: "002", nombre: "Sucursal Norte", activa: true },
    { numero: "003", nombre: "Sucursal Polanco", activa: true },
    { numero: "004", nombre: "Sucursal Sur", activa: true },
  ];
  const batch = db.batch();
  for (const s of sucursales) {
    batch.set(db.collection("sucursales_participantes").doc(s.numero), s);
  }
  await batch.commit();
  console.log(`✓ ${sucursales.length} sucursales participantes`);
}

async function seedConfig() {
  await db.collection("configuracion").doc("global").set({
    monto_minimo: 150,
    updated_at: FieldValue.serverTimestamp(),
  });
  console.log("✓ Configuración global (monto_minimo=150)");
}

async function seedRegistros() {
  const now = Date.now();
  const sample = [
    {
      ID_registro: "J-0000001",
      Nombre_registro: "Mariana Torres Buendía",
      Whatsapp_registro: "+52 5512345678",
      Trivia_registro: "yes",
      Folio_ticket: "A0A0A0A0A1",
      Sucursal_ticket: "001 - Sucursal Centro",
      Monto_ticket: 320.5,
      Productos_ticket: ["Pollo entero", "Refresco"],
      Clasificacion_registro: "VALIDO",
      offsetMinutes: -10,
    },
    {
      ID_registro: "J-0000002",
      Nombre_registro: "Naomi Jardón",
      Whatsapp_registro: "+52 5598765432",
      Trivia_registro: "no",
      Folio_ticket: "B0B0B0B0B2",
      Sucursal_ticket: "002 - Sucursal Norte",
      Monto_ticket: 145.0,
      Productos_ticket: null,
      Clasificacion_registro: "INVALIDO",
      offsetMinutes: -90,
    },
    {
      ID_registro: "J-0000003",
      Nombre_registro: "Luis Pérez",
      Whatsapp_registro: "+52 5511112222",
      Trivia_registro: "yes",
      Folio_ticket: "C0C0C0C0C3",
      Sucursal_ticket: "003 - Sucursal Polanco",
      Monto_ticket: 480.75,
      Productos_ticket: ["Pollo rostizado", "Ensalada", "Refresco"],
      Clasificacion_registro: "VALIDO",
      offsetMinutes: -360,
    },
  ];

  const batch = db.batch();
  for (const reg of sample) {
    const fechaRegistro = new Date(now + reg.offsetMinutes * 60_000);
    const fechaTicket = new Date(fechaRegistro.getTime() - 30 * 60_000);
    const ref = db.collection("registros").doc(reg.ID_registro);
    batch.set(ref, {
      ID_registro: reg.ID_registro,
      Fecha_registro: fechaRegistro,
      Nombre_registro: reg.Nombre_registro,
      Whatsapp_registro: reg.Whatsapp_registro,
      Trivia_registro: reg.Trivia_registro,
      Fecha_ticket: fechaTicket,
      Folio_ticket: reg.Folio_ticket,
      Sucursal_ticket: reg.Sucursal_ticket,
      Monto_ticket: reg.Monto_ticket,
      Productos_ticket: reg.Productos_ticket,
      Archivo_ticket: `tickets/${reg.ID_registro}.jpg`,
      Clasificacion_registro: reg.Clasificacion_registro,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  console.log(`✓ ${sample.length} registros de ejemplo`);
}

async function main() {
  await ensureAdminUser();
  await seedSucursales();
  await seedConfig();
  await seedRegistros();
  console.log("\n¡Listo! Entra a http://localhost:5173 y loguéate con:");
  console.log(`  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
