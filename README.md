<div align="center">

# 🖐🏻 Gesture Live Whiteboard & AR Presenter

**Pizarra aumentada en tiempo real sobre la webcam controlada por gestos manuales para videollamadas, clases virtuales, Loom, OBS y grabaciones.**

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-orange?style=for-the-badge&logo=google)](https://developers.google.com/mediapipe)
[![Fabric.js](https://img.shields.io/badge/Fabric.js-Canvas-red?style=for-the-badge)](https://fabricjs.com/)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

</div>

## 🌟 Descripción General

**Gesture Live Whiteboard** es una herramienta de presentación aumentada diseñada específicamente para **Google Meet, Zoom, Microsoft Teams, OBS Studio, Loom y grabaciones de video**.

Permite al presentador dibujar, escribir, resaltar con puntero láser de neón y mover diagramas directamente **en el aire sobre su propia cámara web**, eliminando la necesidad de interactuar con el ratón o teclado durante su exposición.

---

## ✨ Características de Presentación

* 🖐🏻 **Control Gestual en Tiempo Real**: Seguimiento ultra-fluido de manos con visión artificial (MediaPipe Hands).
* 🔴 **Puntero Láser de Neón**: Trazos fosforescentes que se desvanecen automáticamente tras 1.8 segundos, ideales para señalar conceptos sin ensuciar la pantalla.
* ✏️ **Pincel Libre Vectorial**: Trazado suave con selector de paleta de colores y grosor dinámico.
* ✋ **Agarrar y Mover (Pinch & Move)**: Posiciona y reubica formas y anotaciones en el aire.
* 🧹 **Borrador Gestual Instantáneo**: Simplemente levanta dos dedos (✌️) para borrar cualquier trazo con solo tocarlo.
* 📏 **Formas Geométricas**: Círculos, rectángulos y líneas directas para enmarcar puntos clave.
* 👁️ **Modo Presentador Limpio (Tecla H)**: Oculta instantáneamente toda la barra de herramientas para que la audiencia solo vea al presentador y los gráficos flotantes.
* 📸 **Captura en Alta Resolución**: Descarga el fotograma con todas las anotaciones en formato PNG con un solo clic para compartirlo al finalizar la videollamada.
* ⏸️ **Pausa Segura con Feedback HUD**: Sostén la palma abierta 1 segundo para pausar o reanudar el reconocimiento, visualizando una barra de progreso animada.

---

## 🖐🏻 Guía de Gestos Manuales

| Gesto | Nombre | Acción en la Presentación |
| :---: | :--- | :--- |
| ☝🏻 | **Solo Índice** | **Dibujar / Láser**: Traza en vivo según la herramienta activa. Con la mano relajada, solo mueve el puntero. |
| 🤏🏻 | **Pinch (Pulgar + Índice)** | **Agarrar y Arrastrar**: Toca un objeto o gráfico para moverlo en el espacio. |
| ✌🏻 | **Peace (Dos Dedos)** | **Borrador Vectorial**: Pasa los dedos sobre los trazos para eliminarlos. |
| 🖐🏻 | **Palma Abierta (1s)** | **Pausar / Reanudar**: Muestra un aro de carga HUD y alterna la lectura de gestos. |
| ✌🏻✌🏻 | **Doble Peace (2 manos)** | Abre o cierra el panel rápido de ajustes. |

---

## ⌨️ Accesos Rápidos de Teclado

* **`H`**: Ocultar / Mostrar la barra de herramientas (Modo Limpio para llamadas).
* **`B`**: Pincel libre.
* **`L`**: Puntero Láser de desvanecimiento automático.
* **`V`** o **`M`**: Modo Agarrar / Mover.
* **`E`**: Borrador vectorial.
* **`Ctrl + Z`**: Deshacer.
* **`Ctrl + Y`**: Rehacer.
* **`Espacio`**: Pausar / Reanudar lectura de gestos.

---

## 🛠️ Tecnologías

* **Frontend**: React 18 & TypeScript + Vite
* **Visión Artificial**: Google MediaPipe Hands
* **Motor de Canvas**: Fabric.js Vector Engine
* **Estilos**: Tailwind CSS & Glassmorphism UI
* **Feedback de Audio**: Web Audio API Synth

