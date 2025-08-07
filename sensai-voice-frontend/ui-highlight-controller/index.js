// UI Highlight Controller

export class UIHighlightController {
  constructor() {
    this.highlightedElements = new Set();
    this.highlightClass = 'voice-highlight';
    this.setupStyles();
  }

  setupStyles() {
    // Add CSS styles if not already present
    if (!document.getElementById('voice-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'voice-highlight-styles';
      style.textContent = `
        .voice-highlight {
          background-color: #ffeb3b !important;
          box-shadow: 0 0 10px rgba(255, 235, 59, 0.5) !important;
          transition: all 0.3s ease !important;
        }
        .voice-highlight-focus {
          background-color: #4caf50 !important;
          box-shadow: 0 0 15px rgba(76, 175, 80, 0.6) !important;
        }
        .voice-highlight-warning {
          background-color: #ff9800 !important;
          box-shadow: 0 0 15px rgba(255, 152, 0, 0.6) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  highlight(selector, type = 'default', scrollIntoView = true) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      // Remove existing highlights
      element.classList.remove(this.highlightClass, 'voice-highlight-focus', 'voice-highlight-warning');
      
      // Add new highlight
      element.classList.add(this.highlightClass);
      
      if (type === 'focus') {
        element.classList.add('voice-highlight-focus');
      } else if (type === 'warning') {
        element.classList.add('voice-highlight-warning');
      }
      
      this.highlightedElements.add(element);
      
      // Scroll into view if requested
      if (scrollIntoView) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center'
        });
      }
    });
  }

  unhighlight(selector) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      element.classList.remove(this.highlightClass, 'voice-highlight-focus', 'voice-highlight-warning');
      this.highlightedElements.delete(element);
    });
  }

  unhighlightAll() {
    this.highlightedElements.forEach(element => {
      element.classList.remove(this.highlightClass, 'voice-highlight-focus', 'voice-highlight-warning');
    });
    this.highlightedElements.clear();
  }

  focusElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      this.highlight(selector, 'focus');
    }
  }

  clickElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      this.highlight(selector, 'focus');
      setTimeout(() => {
        element.click();
        this.unhighlight(selector);
      }, 500);
    }
  }
}
