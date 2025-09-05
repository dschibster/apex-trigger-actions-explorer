import { LightningElement, api, track } from 'lwc';

export default class TriggerActionModal extends LightningElement {
    @api isOpen = false;
    @api action = {};
    @api mode = 'view'; // 'view', 'edit', or 'create'
    @api isUpdating = false;
    @api sectionContext = ''; // 'before' or 'after'
    @api triggerContext = ''; // 'CREATED', 'UPDATED', 'DELETED', 'RESTORED'
    @api selectedSettingId = ''; // The selected trigger setting ID
    @api selectedSettingDeveloperName = ''; // The selected trigger setting DeveloperName
    
    @track actionData = {};
    @track originalData = {};
    @track modalError = null;
    @track _currentActionId = null;
    @track _isCreateDataInitialized = false;

    connectedCallback() {
        this.initializeData();
    }

    renderedCallback() {
        // Only initialize data when modal opens and data is not already initialized
        // Don't re-initialize if we're in create mode and data has already been initialized
        if (this.isOpen && (!this.actionData || Object.keys(this.actionData).length === 0) && 
            !(this.mode === 'create' && this._isCreateDataInitialized)) {
            this.initializeData();
        }
    }

    initializeData() {
        if (this.mode === 'create') {
            // Initialize with empty data for creation
            this.actionData = {
                DeveloperName: '',
                Label: '',
                Description__c: '',
                Order__c: 1,
                Apex_Class_Name__c: '',
                Flow_Name__c: '',
                Entry_Criteria__c: '',
                Required_Permission__c: '',
                Bypass_Permission__c: '',
                Bypass_Execution__c: false,
                Allow_Flow_Recursion__c: false
            };
            
            // Set the appropriate trigger context field based on section and trigger context
            this.setTriggerContextField();
            
            this.originalData = JSON.parse(JSON.stringify(this.actionData));
            this._isCreateDataInitialized = true;
        } else if (this.action && Object.keys(this.action).length > 0) {
            // Create a deep copy of the action data
            this.actionData = JSON.parse(JSON.stringify(this.action));
            this.originalData = JSON.parse(JSON.stringify(this.action));
            this._isCreateDataInitialized = false;
        } else {
            // Clear data if no action
            this.actionData = {};
            this.originalData = {};
            this._isCreateDataInitialized = false;
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

    setTriggerContextField() {
        // Clear all trigger context fields first
        this.actionData.Before_Insert__c = '';
        this.actionData.After_Insert__c = '';
        this.actionData.Before_Update__c = '';
        this.actionData.After_Update__c = '';
        this.actionData.Before_Delete__c = '';
        this.actionData.After_Delete__c = '';
        this.actionData.After_Undelete__c = '';
        
        // Set the appropriate field based on section and trigger context
        // Note: We need to pass the DeveloperName, not the Id, for MetadataRelationship fields
        if (this.sectionContext === 'before') {
            switch (this.triggerContext) {
                case 'CREATED':
                    this.actionData.Before_Insert__c = this.selectedSettingDeveloperName;
                    break;
                case 'UPDATED':
                    this.actionData.Before_Update__c = this.selectedSettingDeveloperName;
                    break;
                case 'DELETED':
                    this.actionData.Before_Delete__c = this.selectedSettingDeveloperName;
                    break;
            }
        } else if (this.sectionContext === 'after') {
            switch (this.triggerContext) {
                case 'CREATED':
                    this.actionData.After_Insert__c = this.selectedSettingDeveloperName;
                    break;
                case 'UPDATED':
                    this.actionData.After_Update__c = this.selectedSettingDeveloperName;
                    break;
                case 'DELETED':
                    this.actionData.After_Delete__c = this.selectedSettingDeveloperName;
                    break;
                case 'RESTORED':
                    this.actionData.After_Undelete__c = this.selectedSettingDeveloperName;
                    break;
            }
        }
    }

    get modalTitle() {
        if (this.mode === 'create') {
            return 'Create New Trigger Action';
        } else if (this.mode === 'edit') {
            return 'Edit Trigger Action';
        }
        return 'View Trigger Action Details';
    }

    get isReadOnly() {
        return this.mode === 'view';
    }

    get isCreateMode() {
        return this.mode === 'create';
    }

    get buttonLabel() {
        return this.mode === 'create' ? 'Create' : 'Update';
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
        
        // Validate required fields for creation
        if (this.mode === 'create') {
            if (!this.actionData.DeveloperName || !this.actionData.Label) {
                this.modalError = 'Developer Name and Label are required fields.';
                return;
            }
            
            if (!this.actionData.Apex_Class_Name__c && !this.actionData.Flow_Name__c) {
                this.modalError = 'Either Apex Class Name or Flow Name must be provided.';
                return;
            }
        }
        
        // Dispatch update event with the modified data
        this.dispatchEvent(new CustomEvent('update', {
            detail: { 
                actionId: this.mode === 'create' ? null : this.action.Id,
                actionData: this.actionData,
                mode: this.mode
            }
        }));
        
        // Note: Modal will be closed by the parent component after successful update
    }

    handleClose() {
        // Clear any errors when closing
        this.modalError = null;
        // Reset mode to view
        this.mode = 'view';
        // Reset create data initialization flag
        this._isCreateDataInitialized = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleCancel() {
        // Clear any errors when canceling
        this.modalError = null;
        // Restore original data
        this.actionData = JSON.parse(JSON.stringify(this.originalData));
        // Reset create data initialization flag
        this._isCreateDataInitialized = false;
        
        if (this.mode === 'create') {
            // For creation mode, cancel should close the modal entirely
            this.mode = 'view';
            this.dispatchEvent(new CustomEvent('close'));
        } else {
            // For edit mode, cancel should return to view mode
            this.mode = 'view';
            this.dispatchEvent(new CustomEvent('modechange', {
                detail: { mode: 'view' }
            }));
        }
    }
}
