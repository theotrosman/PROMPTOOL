# 🧠 PROMPTOOL

> Adiviná el prompt. Dominá la IA.

PROMPTOOL es un juego diario inspirado en Wordle donde el objetivo es recrear el prompt original de una imagen generada por IA.

Cada día se presenta una imagen y el usuario debe escribir el prompt que cree que la generó. Luego, una IA evalúa qué tan cerca estuvo y devuelve un puntaje junto con feedback detallado.

---

## 🚀 Demo

*(próximamente online)*

---

## 🎯 ¿Cómo funciona?

1. Se muestra una imagen generada por IA  
2. El usuario escribe su prompt  
3. Se compara con el prompt original  
4. Se devuelve:
   - 🧮 Score (0–100)
   - 🧠 Explicación
   - 🛠️ Sugerencias de mejora  

---

## 🧩 Features

- 🎮 Gameplay tipo Wordle (1 desafío por día)
- 🖼️ Imágenes precargadas desde JSON
- 🤖 Evaluación automática con IA (Gemini)
- 📊 Feedback detallado en lenguaje natural
- ⚡ Frontend rápido con Vite + React

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite  
- **Styling:** TailwindCSS  
- **IA:** Google Gemini API  
- **Gestión de estado:** React Hooks  
- **Data:** JSON local (expandible a DB)

---

## ⚙️ Configuración

### Variables de Entorno

Para mayor seguridad, las credenciales de Supabase se configuran mediante variables de entorno:

1. Copia el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```

2. Completa las variables en `.env` con tus credenciales reales:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
   ```

### Importante sobre Seguridad

- **Nunca** commits el archivo `.env` al repositorio
- El archivo `.env` ya está incluido en `.gitignore`
- Las variables deben comenzar con `VITE_` para ser accesibles en el frontend

### Seguridad de Base de Datos

Para proteger tu base de datos Supabase:

1. **Habilita Row Level Security (RLS)** en todas las tablas
2. **Configura políticas de acceso** apropiadas para cada tabla
3. **Usa Service Role Key** solo en el backend (nunca en frontend)
4. **Limita los permisos** de la Anon Key al mínimo necesario

Ejemplo de política RLS para la tabla `intentos`:
```sql
-- Solo permitir inserts desde usuarios autenticados o anon
CREATE POLICY "Permitir inserts de intentos" ON intentos
FOR INSERT WITH CHECK (true);

-- Solo permitir lecturas propias (si aplica)
CREATE POLICY "Permitir lecturas propias" ON intentos
FOR SELECT USING (auth.uid() = user_id);
```
