import { LightningElement, api, track } from 'lwc';

export default class TriggerActionModal extends LightningElement {
    @api isOpen = false;
    @api action = {};
    @api mode = 'view'; // 'view' or 'edit'
    @api isUpdating = false;
    
    @track actionData = {};
    @track originalData = {};
    @track modalError = null;
    @track _currentActionId = null;

    connectedCallback() {
        this.initializeData();
    }

    renderedCallback() {
        // Only initialize data when modal opens and data is not already initialized
        if (this.isOpen && (!this.actionData || Object.keys(this.actionData).length === 0)) {
            this.initializeData();
        }
    }

    initializeData() {
        if (this.action && Object.keys(this.action).length > 0) {
            // Create a deep copy of the action data
            this.actionData = JSON.parse(JSON.stringify(this.action));
            this.originalData = JSON.parse(JSON.stringify(this.action));
        } else {
            // Clear data if no action
            this.actionData = {};
            this.originalData = {};
        }
    }

    // Watch for changes to the action property
    get action() {
        return this._action;
    }

    set action(value) {
        // Only update if the action ID actually changed
        const newActionId = value?.Id || null;
        if (this._currentActionId !== newActionId) {
            this._action = value;
            this._currentActionId = newActionId;
            // Re-initialize data when action changes
            this.initializeData();
        }
    }

    get modalTitle() {
        if (this.mode === 'edit') {
            return 'Edit Trigger Action';
        }
        return 'View Trigger Action Details';
    }

    get isReadOnly() {
        return this.mode === 'view';
    }

    get isFlow() {
        return this.actionData?.Flow_Name__c;
    }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        
        this.actionData = {
            ...this.actionData,
            [field]: value
        };
    }

    handleEdit() {
        this.mode = 'edit';
        this.dispatchEvent(new CustomEvent('modechange', {
            detail: { mode: 'edit' }
        }));
    }

    handleUpdate() {
        // Clear any previous errors
        this.modalError = null;
        
        // Dispatch update event with the modified data
        this.dispatchEvent(new CustomEvent('update', {
            detail: { 
                actionId: this.action.Id,
                actionData: this.actionData 
            }
        }));
        
        // Note: Modal will be closed by the parent component after successful update
    }

    handleClose() {
        // Clear any errors when closing
        this.modalError = null;
        // Reset mode to view
        this.mode = 'view';
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleCancel() {
        // Clear any errors when canceling
        this.modalError = null;
        // Restore original data
        this.actionData = JSON.parse(JSON.stringify(this.originalData));
        this.mode = 'view';
        this.dispatchEvent(new CustomEvent('modechange', {
            detail: { mode: 'view' }
        }));
    }
}
