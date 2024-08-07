console.log('Content script loaded for Google Docs and Word Online');

const API_KEY = 'your_openai_api_key_here'; // Replace with your actual OpenAI API key

const generateText = async (prompt) => {
    try {
        console.log('Generating text for prompt:', prompt);
        const response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'text-davinci-003',
                prompt: prompt,
                max_tokens: 50,
                temperature: 0.7,
                n: 1,
                stop: null
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        return data.choices[0].text.trim();
    } catch (error) {
        console.error('Error generating text:', error);
        return 'Error generating text.';
    }
};

// Function to inject tooltip in Google Docs and Word Online
const injectTooltip = () => {
    const tooltip = document.createElement('div');
    tooltip.id = 'cursorTooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(128, 128, 128, 0.4)';
    tooltip.style.border = '1px solid black';
    tooltip.style.padding = '5px 15px';
    tooltip.style.borderRadius = '15px';
    tooltip.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    tooltip.style.zIndex = '1000';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.color = 'white';
    tooltip.style.fontFamily = 'Roboto, sans-serif';
    tooltip.style.fontSize = '11px';
    tooltip.textContent = "Tell pilot to generate text...🚀";
    document.body.appendChild(tooltip);

    return tooltip;
};

let tooltip = null;
let auto_mode = false;
let activeElement = null;

document.addEventListener('keydown', async (event) => {
    if (event.metaKey && event.key === 'u') {
        event.preventDefault();
        if (!tooltip) {
            tooltip = injectTooltip();
        }
        tooltip.innerHTML = ''; // Clear existing content
        tooltip.textContent = "Enter your prompt and press Enter...🚀";
        auto_mode = true;

        const inputBox = document.createElement('input');
        inputBox.type = 'text';
        inputBox.style.width = '100%';
        tooltip.appendChild(inputBox);
        inputBox.focus();

        inputBox.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const prompt = inputBox.value;
                tooltip.textContent = 'Generating text...';
                const generatedText = await generateText(prompt);
                console.log('Generated text:', generatedText);

                // Insert generated text at cursor position in Google Docs or Word Online
                insertTextAtCursor(generatedText);
                tooltip.remove();
                tooltip = null;
                auto_mode = false;
            }
        });

        inputBox.addEventListener('blur', () => {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
            auto_mode = false;
        });
    }
});

const insertTextAtCursor = (text) => {
    const activeEl = document.activeElement;
    if (activeEl.tagName === 'IFRAME') {
        const iframeDocument = activeEl.contentDocument || activeEl.contentWindow.document;
        const selection = iframeDocument.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(iframeDocument.createTextNode(text));
    } else {
        const selection = document.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
    }
};

document.addEventListener('focusin', (event) => {
    console.log('Focusin event:', event.target);
    if (event.target.isContentEditable || event.target.tagName === 'IFRAME') {
        activeElement = event.target;
    }
});

// Update tooltip position based on cursor
document.addEventListener('mousemove', (event) => {
    if (tooltip) {
        tooltip.style.left = `${event.pageX}px`;
        tooltip.style.top = `${event.pageY - tooltip.offsetHeight - 5}px`;
    }
});
