// Crea (o reutiliza) un usuario en Firebase Auth y registra el documento
// en /usuarios_admin/{uid} para darle acceso de admin a la plataforma.
//
// Uso:
//   node scripts/create-admin.mjs <email> <password> "<nombre>"
//
// Requisitos: ADC configurado (`gcloud auth application-default login`) con
// permiso sobre el proyecto que-pollo-jtech.

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "que-pollo-jtech";

const [, , email, password, nombre] = process.argv;
if (!email || !password || !nombre) {
  console.error('Uso: node scripts/create-admin.mjs <email> <password> "<nombre>"');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password, displayName: nombre });
  console.log(`↺ Usuario existente actualizado: ${email} (uid=${user.uid})`);
} catch (err) {
  if (err.code !== "auth/user-not-found") throw err;
  user = await auth.createUser({ email, password, displayName: nombre });
  console.log(`✓ Usuario creado: ${email} (uid=${user.uid})`);
}

await db.collection("usuarios_admin").doc(user.uid).set({
  email,
  nombre,
  created_at: FieldValue.serverTimestamp(),
}, { merge: true });
console.log(`✓ Doc /usuarios_admin/${user.uid} listo`);
