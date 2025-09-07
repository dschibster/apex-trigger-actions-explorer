import { LightningElement, api, track } from 'lwc';

export default class TriggerActionsSection extends LightningElement {
    @api title;
    @api actions;
    
    @track isExpanded = true;
    @track isEditOrderMode = false;
    @track originalActions = []; // Store original order for cancel

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

    handleEditOrder() {
        // Store original order for cancel functionality
        this.originalActions = [...this.actions];
        this.isEditOrderMode = true;
        
        // Add isFirstItem and isLastItem properties to actions
        this.updateActionProperties();
        
        // Dispatch event to parent to notify other sections to exit edit mode
        this.dispatchEvent(new CustomEvent('entereditmode', {
            detail: { sectionTitle: this.title }
        }));
    }

    updateActionProperties() {
        if (this.actions && this.actions.length > 0) {
            this.actions = this.actions.map((action, index) => ({
                ...action,
                isFirstItem: index === 0,
                isLastItem: index === this.actions.length - 1
            }));
        }
    }

    handleSaveOrder() {
        // Calculate new order values based on current position
        const updatedActions = this.actions.map((action, index) => ({
            ...action,
            Order__c: (index + 1) * 0.0001 // Use small increments for ordering
        }));

        // Dispatch event to parent with updated actions
        this.dispatchEvent(new CustomEvent('saveorder', {
            detail: { 
                sectionTitle: this.title,
                updatedActions: updatedActions
            }
        }));

        this.isEditOrderMode = false;
        this.originalActions = [];
    }

    handleCancelOrder() {
        // Restore original order
        this.actions = [...this.originalActions];
        this.isEditOrderMode = false;
        this.originalActions = [];
    }

    // Method to handle move up/down from child cards
    handleMoveAction(event) {
        const { actionId, direction } = event.detail;
        const currentIndex = this.actions.findIndex(action => action.Id === actionId);
        
        if (currentIndex === -1) return;

        let newIndex;
        if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < this.actions.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            return; // Can't move further
        }

        // Swap the actions
        const newActions = [...this.actions];
        [newActions[currentIndex], newActions[newIndex]] = [newActions[newIndex], newActions[currentIndex]];
        
        this.actions = newActions;
        
        // Update the isFirstItem and isLastItem properties
        this.updateActionProperties();
    }

    // Method to exit edit mode when another section enters edit mode
    exitEditMode() {
        if (this.isEditOrderMode) {
            this.handleCancelOrder();
        }
    }
}