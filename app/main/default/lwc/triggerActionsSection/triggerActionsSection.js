import { LightningElement, api } from 'lwc';

export default class TriggerActionsSection extends LightningElement {
    @api title;
    @api actions;
    
    isExpanded = true;

    connectedCallback() {
        console.log('=== TriggerActionsSection connected ===');
        console.log('Title:', this.title);
        console.log('Actions:', this.actions);
        console.log('Actions length:', this.actions?.length);
        console.log('Actions type:', typeof this.actions);
        console.log('Actions keys:', this.actions ? Object.keys(this.actions) : 'No actions');
        if (this.actions && this.actions.length > 0) {
            console.log('First action:', this.actions[0]);
            console.log('First action keys:', Object.keys(this.actions[0]));
        }
        console.log('=== End connected ===');
    }

    renderedCallback() {
        console.log('=== TriggerActionsSection rendered ===');
        console.log('Title:', this.title);
        console.log('Actions:', this.actions);
        console.log('Actions length:', this.actions?.length);
        console.log('=== End rendered ===');
    }

    handleView = (event) => {
        this.dispatchEvent(new CustomEvent('view', { detail: event.detail }));
    };

    handleEdit = (event) => {
        this.dispatchEvent(new CustomEvent('edit', { detail: event.detail }));
    };

    handleDelete = (event) => {
        this.dispatchEvent(new CustomEvent('delete', { detail: event.detail }));
    };

    handleAddAction = () => {
        this.dispatchEvent(new CustomEvent('addaction', { 
            detail: { 
                sectionTitle: this.title 
            } 
        }));
    };

    handleToggle = () => {
        this.isExpanded = !this.isExpanded;
    };

    get chevronIcon() {
        return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get chevronClass() {
        return this.isExpanded ? 'slds-m-right_small' : 'slds-m-right_small';
    }
}