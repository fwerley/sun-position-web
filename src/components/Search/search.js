
const mdFiles = import.meta.glob('/public/markdown/**/*.md', { as: 'raw', eager: true });

const searchIndex = Object.entries(mdFiles).map(([path, content]) => ({
    path: path.replace('./public/markdown', ''),
    content: content.toLowerCase(),
    rawContent: content
}));

/**
 * Searches through the markdown files to find the ones that match all the terms
 * given in the query.
 *
 * @param {string} query The search query.
 * @returns {object[]} The matching markdown files, with their 'path' (relative to
 *                     /public/markdown) and full 'content' (lowercase).
 */
export function search(query) {
    const terms = query.toLowerCase().split(' ').filter(t => t);

    return searchIndex.filter(file => {
        return terms.every(term => file.content.includes(term));
    });
}

export function extractSnippets(content, query, snippetLength = 100) {
    const terms = query.toLowerCase().split(' ').filter(t => t);
    const contentLower = content.toLowerCase();
    const snippets = new Set(); // Usamos Set para evitar duplicatas

    terms.forEach(term => {
        let index = contentLower.indexOf(term);
        while (index !== -1) {
            // Extrair um trecho ao redor da palavra-chave
            const start = Math.max(0, index - snippetLength / 2);
            const end = Math.min(content.length, index + term.length + snippetLength / 2);
            const snippet = content.substring(start, end);

            // Adicionar reticências se o trecho não começar no início do conteúdo
            const prefix = start > 0 ? '...' : '';
            const suffix = end < content.length ? '...' : '';
            snippets.add(`${prefix}${snippet}${suffix}`);

            // Procurar pela próxima ocorrência do termo
            index = contentLower.indexOf(term, index + 1);
        }
    });

    return Array.from(snippets); // Converter Set para array
}

/**
 * Highlights all occurrences of all the terms given in the query in the text.
 *
 * @param {string} text The text to highlight.
 * @param {string} query The search query.
 * @returns {string} The text with all occurrences of all the terms highlighted.
 */
export function highlightText(text, query) {
    const terms = query.split(' ').filter(t => t);
    let highlightedText = text;

    terms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
    });

    return highlightedText;
}

export function clearMarkdown(content) {
    return content.replace(/[#*\-_`~\[\]()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}