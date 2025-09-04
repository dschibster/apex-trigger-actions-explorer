import { LightningElement, api, track } from 'lwc';

export default class TriggerActionModal extends LightningElement {
    @api isOpen = false;
    @api action = {};
    @api mode = 'view'; // 'view' or 'edit'
    
    @track actionData = {};
    @track originalData = {};

    connectedCallback() {
        this.initializeData();
    }

    renderedCallback() {
        // Only initialize data when modal opens, not on every render
        if (this.isOpen && (!this.actionData || Object.keys(this.actionData).length === 0)) {
            this.initializeData();
        }
    }

    initializeData() {
        if (this.action && Object.keys(this.action).length > 0) {
            // Create a deep copy of the action data
            this.actionData = JSON.parse(JSON.stringify(this.action));
            this.originalData = JSON.parse(JSON.stringify(this.action));
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

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleEdit() {
        this.mode = 'edit';
        this.dispatchEvent(new CustomEvent('modechange', {
            detail: { mode: 'edit' }
        }));
    }

    handleCancel() {
        // Restore original data
        this.actionData = JSON.parse(JSON.stringify(this.originalData));
        this.mode = 'view';
        this.dispatchEvent(new CustomEvent('modechange', {
            detail: { mode: 'view' }
        }));
    }

    handleUpdate() {
        // Dispatch update event with the modified data
        this.dispatchEvent(new CustomEvent('update', {
            detail: { 
                actionId: this.action.Id,
                actionData: this.actionData 
            }
        }));
        
        // Close the modal after update
        this.handleClose();
    }
}
