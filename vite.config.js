import { defineConfig } from "vite";
import prism from "vite-plugin-prismjs";

export default defineConfig({
    assetsInclude: ['**/*.md'],
    plugins: [
        prism({
            languages: ['javascript', 'css', 'html', 'json'],
            plugins: ['line-numbers'],
            theme: 'tomorrow',
            css: true,
        }),
    ],
});