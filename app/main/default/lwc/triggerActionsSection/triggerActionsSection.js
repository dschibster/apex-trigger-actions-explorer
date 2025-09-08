import { LightningElement, api, track } from 'lwc';

export default class TriggerActionsSection extends LightningElement {
    @api title;
    @api actions;
    @api isUpdating = false;
    @api updatingSection = null;
    
    @track isExpanded = true;
    @track isEditOrderMode = false;
    @track isManualEditMode = false; // Toggle between arrow and manual edit modes
    @track originalActions = []; // Store original order for cancel

    get isThisSectionUpdating() {
        return this.isUpdating && this.updatingSection === this.title;
    }

    connectedCallback() {
        // Component connected
    }

    renderedCallback() {
        // Component rendered
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
        this.isManualEditMode = false; // Start with arrow mode
        
        // Add isFirstItem and isLastItem properties to actions
        this.updateActionProperties();
        
        // Dispatch event to parent to notify other sections to exit edit mode
        this.dispatchEvent(new CustomEvent('entereditmode', {
            detail: { sectionTitle: this.title }
        }));
    }

    handleToggleManualMode() {
        this.isManualEditMode = !this.isManualEditMode;
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
        let updatedActions;
        
        if (this.isManualEditMode) {
            // Use manual order numbers from input fields - preserve exact values
            updatedActions = this.actions.map((action) => ({
                ...action,
                Order__c: action.manualOrder ? parseFloat(action.manualOrder) : action.Order__c
            }));
        } else {
            // Calculate new order values based on current position
            updatedActions = this.actions.map((action, index) => ({
                ...action,
                Order__c: index + 1 // Use integers for repositioning mode
            }));
        }

        // Dispatch event to parent with updated actions
        this.dispatchEvent(new CustomEvent('saveorder', {
            detail: { 
                sectionTitle: this.title,
                updatedActions: updatedActions
            }
        }));

        this.isEditOrderMode = false;
        this.isManualEditMode = false;
        this.originalActions = [];
    }

    handleCancelOrder() {
        // Restore original order
        this.actions = [...this.originalActions];
        this.isEditOrderMode = false;
        this.isManualEditMode = false;
        this.originalActions = [];
    }

    handleManualOrderChange(event) {
        const { actionId, orderValue } = event.detail;
        const actionIndex = this.actions.findIndex(action => action.Id === actionId);
        
        if (actionIndex !== -1) {
            // Create a new array with the updated action to maintain reactivity
            this.actions = this.actions.map((action, index) => 
                index === actionIndex 
                    ? { ...action, manualOrder: orderValue }
                    : action
            );
        }
    }

    handleManualOrderBlur(event) {
        const { actionId, orderValue } = event.detail;
        const actionIndex = this.actions.findIndex(action => action.Id === actionId);
        
        if (actionIndex !== -1) {
            // Create a new array with the updated action to maintain reactivity
            this.actions = this.actions.map((action, index) => 
                index === actionIndex 
                    ? { ...action, manualOrder: orderValue }
                    : action
            );
            // Trigger real-time sorting when field loses focus
            this.sortActionsByManualOrder();
        }
    }

    sortActionsByManualOrder() {
        // Sort actions by their manual order values
        this.actions = [...this.actions].sort((a, b) => {
            const orderA = parseFloat(a.manualOrder) || parseFloat(a.Order__c) || 0;
            const orderB = parseFloat(b.manualOrder) || parseFloat(b.Order__c) || 0;
            return orderA - orderB;
        });
        
        // Update the isFirstItem and isLastItem properties after sorting
        this.updateActionProperties();
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