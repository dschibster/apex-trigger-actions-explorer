import { LightningElement, api } from 'lwc';

export default class TriggerActionsSection extends LightningElement {
    @api title;
    @api actions;
    @api isEditOrderMode = false;
    @api actionType; // 'before' or 'after'
    
    isExpanded = true;

    connectedCallback() {
        console.log('=== TriggerActionsSection connected ===');
        console.log('Title:', this.title);
        console.log('isEditOrderMode:', this.isEditOrderMode);
        console.log('actionType:', this.actionType);
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

    handleMoveUp = (event) => {
        console.log('=== SECTION: handleMoveUp called ===');
        console.log('Event detail:', event.detail);
        this.dispatchEvent(new CustomEvent('moveup', { 
            detail: event.detail 
        }));
        console.log('=== END SECTION: handleMoveUp ===');
    };

    handleMoveDown = (event) => {
        console.log('=== SECTION: handleMoveDown called ===');
        console.log('Event detail:', event.detail);
        this.dispatchEvent(new CustomEvent('movedown', { 
            detail: event.detail 
        }));
        console.log('=== END SECTION: handleMoveDown ===');
    };

    handleToggle = () => {
        this.isExpanded = !this.isExpanded;
    };

    // Edit order methods
    handleEditOrder = () => {
        this.dispatchEvent(new CustomEvent('editorder', { 
            detail: { 
                actionType: this.actionType 
            } 
        }));
    };

    handleSaveOrder = () => {
        this.dispatchEvent(new CustomEvent('saveorder', { 
            detail: { 
                actionType: this.actionType 
            } 
        }));
    };

    handleCancelEditOrder = () => {
        this.dispatchEvent(new CustomEvent('canceleditorder', { 
            detail: { 
                actionType: this.actionType 
            } 
        }));
    };

    get chevronIcon() {
        return this.isExpanded ? 'utility:chevrondown' : 'utility:chevronright';
    }

    get chevronClass() {
        return this.isExpanded ? 'slds-m-right_small' : 'slds-m-right_small';
    }
}