# Gemini Code Assistant

This document provides instructions and context for working with the Gemini Code Assistant in this project.

## Project Overview

This is a Nuxt.js 2 project that appears to be a starter kit for a sports betting application. It includes a real-time betslip feature powered by Server-Sent Events (SSE). The project is structured as a multi-workspace monorepo using Yarn workspaces, with custom modules located in the `sportnco_modules` directory.

The core functionality includes:

*   **Real-time Betslip:** A betslip that updates in real-time across all connected clients using SSE.
*   **Betslip API:** A server middleware that provides an API for adding, removing, updating, and submitting bets.
*   **Custom Modules:** The project uses local modules for a web service (`uf-webservice`) and a betslip UI component (`ui-betslip`).

## Building and Running

To get started with this project, follow these steps:

1.  **Install Dependencies:**
    ```bash
    yarn install
    ```

2.  **Run in Development Mode:**
    ```bash
    yarn dev
    ```
    This will start the Nuxt development server with hot reloading at `http://localhost:3000`.

3.  **Build for Production:**
    ```bash
    yarn build
    ```

4.  **Start in Production Mode:**
    ```bash
    yarn start
    ```

5.  **Generate Static Project:**
    ```bash
    yarn generate
    ```

## Development Conventions

*   **Workspaces:** The project uses Yarn workspaces to manage the local modules in `sportnco_modules`.
*   **Server-Sent Events (SSE):** The real-time betslip functionality is implemented using SSE. The server-side implementation can be found in `server-middleware/betslip-events.js`.
*   **Custom Elements:** The betslip UI component (`ui-betslip`) is a custom element, as indicated by the `.ce.vue` file extension.
*   **Nuxt Modules:** The project utilizes custom Nuxt modules for specific functionalities. The `uf-webservice` module is an example of this.
