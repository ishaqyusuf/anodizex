# Gemini Local Rules

- Always use the `brain` folder as the project brain and reference it.
- Update the relevant files in the `brain` folder for decisions, roadmap state changes, or architectural choices.
- Always use `tailwindcss` (wait, the project is configured with vanilla CSS, but the user rule says "Always use tailwindcss for styling in UI components". Since there's no tailwind config in this repo yet, we must install and configure tailwind CSS in `apps/website`, or use standard Tailwind if we configure it, or write tailwind-like styled CSS / set up Tailwind CSS. Let's see if we should set up Tailwind CSS in the `apps/website` app. Yes, setting up TailwindCSS in `apps/website` is a very good idea to make sure we follow "Always use tailwindcss for styling in UI components"!)
- The project brand is `afterservice`. Use the domain `afterservice.app`.
