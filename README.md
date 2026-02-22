# Toddler 🎈

A simple, interactive web application designed specifically for toddlers.

## 📝 The Story
My intention in creating this project was to build something simple and fun for my daughter to enjoy while using her iPad. I wanted to give her an engaging, interactive alternative to mindlessly watching random videos online.

## 🚀 Live Demo
**[Check out the live app here!](https://surfshad0w.github.io/Toddler)**

## 🛠️ Tech Stack
This project is built for speed and portability:
* **Framework:** [React](https://react.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Plugin:** `vite-plugin-singlefile` (Compiles everything into one portable HTML file)

## 💻 Local Development

If you want to run this project locally, follow these steps:

1. **Clone the repo**
   ```bash
   git clone https://github.com/surfshad0w/Toddler.git
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```

## 🏗️ Deployment
This project is configured with **GitHub Actions**. Any push to the `main` branch automatically triggers a build and deploys the updated version to GitHub Pages.

To build the project manually:
```bash
npm run build
```
The output will be a single `index.html` file in the `dist` folder.
