console.log('Content script loaded');

let activeElement = null;
let tooltip = null;

document.addEventListener('focusin', (event) => {
    console.log('Focusin event:', event.target);
    if (
        (event.target.tagName === 'INPUT' && (event.target.type === 'text' || event.target.type === 'search')) ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
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
            tooltip.style.zIndex = '1000'; // Ensure the tooltip appears above other elements
            tooltip.style.whiteSpace = 'nowrap'; // Prevent text from wrapping
            tooltip.style.color = 'white';
            tooltip.style.fontFamily = 'Roboto, sans-serif';
            tooltip.style.fontSize = '11px'; // Adjust as needed
            tooltip.textContent = "Hello, I'm your universal copilot! 🚀";
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

        // Add event listener for command+u key combination
        document.addEventListener('keydown', (event) => {
            if (event.metaKey && event.key === 'u') {
                tooltip.textContent = 'Tell pilot to generate text...🚀';
            }
        });
        let suggestion = "it's working!";
        let auto_mode = false;
        let base = true;
        // Add event listener for user input
        event.target.addEventListener('keydown', (event) => {
            if (event.metaKey && event.key === 'u') {
                event.preventDefault(); // Prevent the default behavior of the command+u key combination
                tooltip.textContent = 'Tell pilot to generate text...🚀';
                auto_mode = true;
                base = false;
            } else if (event.key === 'Enter' && auto_mode === true) {
                //tooltip.textContent = "Hello, I'm your universal copilot! 🚀";
                activeElement.value += tooltip.textContent; // Paste the text into the target area
                tooltip.textContent = ''; // Clear the tooltip text
                auto_mode = false;
                base = true;
            } else if (event.key === 'Backspace' && auto_mode === true) {
                event.preventDefault(); // Prevent the default behavior of the Backspace key
                tooltip.textContent = tooltip.textContent.slice(0, -1); // Remove the last character from the tooltip text
            } else if (event.key.length === 1 && auto_mode === true) {
                event.preventDefault(); // Prevent the default behavior of typing a character
                //if this is the first character, clear the tooltip text and add the character
                if (tooltip.textContent === 'Tell pilot to generate text...🚀') {
                    tooltip.textContent = event.key;
                }
                else if (tooltip.textContent === '') {
                    tooltip.textContent = "Tell pilot to generate text...🚀";
                }
                else {
                    //if this is not the first character, add the character to the tooltip text
                    tooltip.textContent += event.key;
                }
            }
            else if (event.key === 'Shift' && auto_mode === true) {
                // Allow shift key to work normally when typing with auto_mode
                return;
            }
            //if tab is pressed and base true then paste the suggestion
            else if (event.key === 'Tab' && base === true) {
                event.preventDefault(); // Prevent the default behavior of the Tab key
                activeElement.value += suggestion; // Paste the text into the target area
                tooltip.textContent = ''; // Clear the tooltip text
                auto_mode = false;
                base = true;
            }
            else {
                auto_mode = false;
                if (event.key.length === 1 && !auto_mode){
                    tooltip.textContent = 'Press Tab to accept suggestion';
                }
            }
        });

    }
});
