# 🥜 NutraNuts - E-Commerce Frutos Secos

Plataforma e-commerce para la venta de frutos secos y snacks saludables en la IV Región (La Serena / Coquimbo).

---

## 🚀 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu equipo:
* **[Node.js](https://nodejs.org/)** (Versión LTS recomendada).
* **Live Server** (Extensión para Visual Studio Code).

---

## 🛠️ Instrucciones para Levantar el Proyecto

### 1. Clonar / Abrir el Proyecto
Abre la carpeta del proyecto en Visual Studio Code.

### 2. Iniciar el Backend (Servidor de Pagos)

Abre la terminal en la raíz del proyecto y ejecuta los siguientes comandos:

```bash
# Ir a la carpeta del servidor
cd backend

# Instalar las dependencias (solo la primera vez)
npm install

# Iniciar el servidor backend
node index.js

Nota: Deberías ver en la terminal el mensaje:

🚀 Servidor backend corriendo en http://localhost:3000

3. Iniciar el Frontend (Interfaz Web)
Abre el archivo index.html en VS Code.

Haz clic derecho sobre el código y selecciona "Open with Live Server" (o presiona Alt + L, Alt + O).

Se abrirá la tienda en tu navegador (http://127.0.0.1:5500).

📂 Estructura de Archivos Principal
index.html: Estructura general de la tienda.

styles.css: Estilos personalizados y configuraciones auxiliares.

script.js: Lógica de la interfaz, catálogo y comportamiento del carrito de compras.

checkout.js: Módulo independiente de conexión con la pasarela de pagos.

backend/index.js: Servidor Node.js/Express para procesar las preferencias de pago con Mercado Pago.

💳 Probar Pagos (Modo Sandbox)
Para realizar compras de prueba sin cobros reales:

Agrega productos al carrito y presiona Finalizar Compra.

Al abrir la ventana de Mercado Pago, usa una ventana de Navegación Incógnita o la opción "Pagar como invitado".

Utiliza los números de tarjeta de prueba proporcionados por la documentación de Mercado Pago Sandbox.
