import { LightningElement, api } from 'lwc';

export default class OrderConfirmationModal extends LightningElement {
    @api isOpen = false;
    @api isManualMode = false;

    connectedCallback() {
        // Add document-level keydown event listener for Esc key
        document.addEventListener('keydown', this.handleKeyDown);
    }

    disconnectedCallback() {
        // Remove document-level keydown event listener
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown = (event) => {
        if (event.key === 'Escape' && this.isOpen) {
            event.preventDefault();
            this.handleCancel();
        }
    };

    handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel'));
    }

    handleConfirm() {
        this.dispatchEvent(new CustomEvent('confirm'));
    }
}

