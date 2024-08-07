console.log('Content script loaded');

// Variables
let activeElement = null; // Currently active element (input, textarea, etc.)
let tooltip = null; // Tooltip element to display suggestions

let suggestion = "it's working!"; // Default suggestion
let auto_mode = false; // Flag to indicate if auto mode is enabled
let base = true; // Flag to indicate if base mode is enabled

const API_KEY = ''; // OpenAI API key

// Function to generate text using OpenAI API
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
                model: 'gpt-3.5-turbo-instruct',
                prompt: prompt,
                max_tokens: 50,
                n: 1,
                stop: null,
                temperature: 0.7
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

// Debounce function to limit the frequency of function calls
const debounce = (func, delay) => {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
};

// Function to handle input events
const handleInput = debounce(async (event) => {
    const text = event.target.innerText || event.target.value;
    if (text.length > 0) {
        const suggestion = await generateText(text);
        showSuggestion(suggestion, event.target);
    }
}, 600);

// Function to show the suggestion tooltip
const showSuggestion = (suggestion, target) => {
    if (!tooltip) {
        tooltip = document.createElement('div');
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
        document.body.appendChild(tooltip);
    }
    tooltip.innerText = suggestion;
    const rect = target.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
};

// Event listener for focusin event
document.addEventListener('focusin', (event) => {
    console.log('Focusin event:', event.target);
    if (
        (event.target.tagName === 'INPUT' && (event.target.type === 'text' || event.target.type === 'search')) ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable || //is document like google docs
        event.target.tagName === 'DIV' ||
        (event.target.tagName === 'IFRAME') || // check if the cursor is in a Google Doc iframe
        (event.target.tagName === 'DIV' && event.target.getAttribute('role') === 'textbox') // check if the cursor is in a Word Online document
        || // word doc P
        (event.target.tagName === 'P')
    ) {
        activeElement = event.target;
        tooltip = document.getElementById('cursorTooltip');

        if (!tooltip) {
            tooltip = document.createElement('div');
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
            tooltip.textContent = "Hi, I am your universal copilot! 🚀";
            document.body.appendChild(tooltip);
        }

        const updateTooltipPosition = () => {
            const rect = event.target.getBoundingClientRect();
            tooltip.style.left = `${rect.left}px`;
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
        };

        updateTooltipPosition();
        window.addEventListener('resize', updateTooltipPosition);

        event.target.addEventListener('blur', () => {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
            window.removeEventListener('resize', updateTooltipPosition);
            activeElement = null;
        }, { once: true });

        document.addEventListener('keydown', (event) => {
            if (event.metaKey && event.key === 'u') {
                tooltip.textContent = 'Tell pilot to generate text...🚀';
            }
        });

        event.target.addEventListener('keydown', async (event) => {
            if (event.metaKey && event.key === 'u') {
                event.preventDefault();
                tooltip.textContent = 'Tell pilot to generate text...🚀';
                auto_mode = true;
                base = false;
            } else if (event.metaKey && event.key === 'h') {
                event.preventDefault();
                tooltip.textContent = '';
                auto_mode = false;
                base = false;
            } else if (event.key === 'Enter' && auto_mode === true) {
                let prompt = tooltip.textContent;
                console.log('Prompt:', prompt);
                tooltip.textContent = "Generating...🚀";
                suggestion = await generateText(prompt);
                console.log('Generated text:', suggestion);
                if (activeElement) {
                    if (activeElement.tagName === 'DIV' && activeElement.isContentEditable) {
                        activeElement.innerText += suggestion;
                    } else {
                        activeElement.value += suggestion;
                    }
                }
                auto_mode = false;
                base = true;
                tooltip.textContent = '';
            } else if (event.key === 'Backspace' && auto_mode === true) {
                event.preventDefault();
                tooltip.textContent = tooltip.textContent.slice(0, -1);
            } else if (event.key.length === 1 && auto_mode === true) {
                event.preventDefault();
                if (tooltip.textContent === 'Tell pilot to generate text...🚀') {
                    tooltip.textContent = event.key;
                } else if (tooltip.textContent === '') {
                    tooltip.textContent = "Tell pilot to generate text...🚀";
                } else {
                    tooltip.textContent += event.key;
                }
            } else if (event.key === 'Shift' && auto_mode === true) {
                return;
            } else if (event.key === 'Tab' && base === true) {
                event.preventDefault();
                activeElement.value += suggestion;
                auto_mode = false;
                base = true;
            } else {
                base = true;
                auto_mode = false;
                if (event.key.length === 1 && !auto_mode) {
                    tooltip.textContent = 'Press Tab to accept suggestion';
                }
            }
        });

        event.target.addEventListener('input', handleInput);
    }
});
