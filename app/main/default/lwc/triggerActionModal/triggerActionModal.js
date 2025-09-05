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
    @track selectedActionType = 'flow'; // 'flow' or 'apex' - default to flow

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
            
            // Set action type based on existing data
            if (this.actionData.Flow_Name__c) {
                this.selectedActionType = 'flow';
            } else if (this.actionData.Apex_Class_Name__c) {
                this.selectedActionType = 'apex';
            }
            
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
        return this.selectedActionType === 'flow';
    }

    get flowButtonVariant() {
        return this.selectedActionType === 'flow' ? 'brand' : 'neutral';
    }

    get apexButtonVariant() {
        return this.selectedActionType === 'apex' ? 'brand' : 'neutral';
    }

    get isDescriptionRequired() {
        return this.mode === 'create' || this.mode === 'edit';
    }

    handleFieldChange(event) {
        const field = event.target.dataset.field;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        
        this.actionData = {
            ...this.actionData,
            [field]: value
        };
    }

    handleActionTypeChange(event) {
        const actionType = event.target.dataset.type;
        this.selectedActionType = actionType;
        
        // Clear the opposite field when switching types
        if (actionType === 'flow') {
            this.actionData = {
                ...this.actionData,
                Apex_Class_Name__c: '',
                Allow_Flow_Recursion__c: false
            };
        } else {
            this.actionData = {
                ...this.actionData,
                Flow_Name__c: ''
            };
        }
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
        
        // Validate required fields for creation and updates
        if (this.mode === 'create') {
            if (!this.actionData.DeveloperName?.trim() || !this.actionData.Label?.trim() || !this.actionData.Description__c?.trim()) {
                this.modalError = 'Developer Name, Label, and Description are required fields.';
                return;
            }
        } else if (this.mode === 'edit') {
            // For updates, only validate Description as required
            if (!this.actionData.Description__c?.trim()) {
                this.modalError = 'Description is required.';
                return;
            }
        }
        
        // Validate based on selected action type (for both create and edit modes)
        if (this.mode === 'create' || this.mode === 'edit') {
            if (this.selectedActionType === 'flow') {
                if (!this.actionData.Flow_Name__c?.trim()) {
                    this.modalError = 'Flow Name is required when Flow is selected.';
                    return;
                }
            } else if (this.selectedActionType === 'apex') {
                if (!this.actionData.Apex_Class_Name__c?.trim()) {
                    this.modalError = 'Apex Class Name is required when Apex is selected.';
                    return;
                }
            }
        }
        
        // Filter the data to only include fields relevant to the selected action type
        const filteredActionData = this.filterActionDataByType(this.actionData, this.selectedActionType);
        
        // Dispatch update event with the filtered data
        this.dispatchEvent(new CustomEvent('update', {
            detail: { 
                actionId: this.mode === 'create' ? null : this.action.Id,
                actionData: filteredActionData,
                mode: this.mode
            }
        }));
        
        // Note: Modal will be closed by the parent component after successful update
    }

    filterActionDataByType(actionData, actionType) {
        // Create a copy of the action data
        const filteredData = { ...actionData };
        
        if (actionType === 'flow') {
            // For Flow, remove Apex-specific fields
            delete filteredData.Apex_Class_Name__c;
        } else if (actionType === 'apex') {
            // For Apex, remove Flow-specific fields
            delete filteredData.Flow_Name__c;
            delete filteredData.Allow_Flow_Recursion__c;
        }
        
        return filteredData;
    }

    handleClose() {
        // Clear any errors when closing
        this.modalError = null;
        // Reset mode to view
        this.mode = 'view';
        // Reset create data initialization flag
        this._isCreateDataInitialized = false;
        // Reset action type to default
        this.selectedActionType = 'flow';
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleCancel() {
        // Clear any errors when canceling
        this.modalError = null;
        // Restore original data
        this.actionData = JSON.parse(JSON.stringify(this.originalData));
        // Reset create data initialization flag
        this._isCreateDataInitialized = false;
        // Reset action type to default
        this.selectedActionType = 'flow';
        
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
