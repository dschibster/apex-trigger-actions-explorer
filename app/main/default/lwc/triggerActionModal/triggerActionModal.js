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
    @api selectedSettingObjectApiName = ''; // The selected trigger setting Object API Name
    
    @track actionData = {};
    @track originalData = {};
    @track modalError = null;
    @track _currentActionId = null;
    @track _isCreateDataInitialized = false;
    @track selectedActionType = 'apex'; // 'apex', 'flow', or 'flow-cdp' - default to apex

    // Context abbreviation mapping based on triggerContext and sectionContext
    get contextAbbreviation() {
        // triggerContext: CREATED, UPDATED, DELETED, RESTORED
        // sectionContext: before, after
        if (this.sectionContext === 'before') {
            switch (this.triggerContext) {
                case 'CREATED': return 'BI'; // Before Insert
                case 'UPDATED': return 'BU'; // Before Update
                case 'DELETED': return 'BD'; // Before Delete
                default: return '';
            }
        } else if (this.sectionContext === 'after') {
            switch (this.triggerContext) {
                case 'CREATED': return 'AI'; // After Insert
                case 'UPDATED': return 'AU'; // After Update
                case 'DELETED': return 'AD'; // After Delete
                case 'RESTORED': return 'AUD'; // After Undelete
                default: return '';
            }
        }
        return '';
    }

    // Generate DeveloperName based on action type and context
    generateDeveloperName() {
        let baseName = '';
        if ((this.selectedActionType === 'flow' || this.selectedActionType === 'flow-cdp') && this.actionData.Flow_Name__c) {
            baseName = this.actionData.Flow_Name__c;
        } else if (this.selectedActionType === 'apex' && this.actionData.Apex_Class_Name__c) {
            baseName = this.actionData.Apex_Class_Name__c;
        }
        
        if (baseName && this.contextAbbreviation) {
            return `${baseName}_${this.contextAbbreviation}`;
        }
        return baseName;
    }

    // Update DeveloperName and Label for create mode
    updateDeveloperNameAndLabel() {
        if (this.mode === 'create') {
            const generatedName = this.generateDeveloperName();
            if (generatedName) {
                this.actionData.DeveloperName = generatedName;
                this.actionData.Label = generatedName;
            }
        }
    }

    connectedCallback() {
        this.initializeData();
    }

    // Watch for isOpen changes to reset modal state when closed
    renderedCallback() {
        // Only initialize data when modal opens and data is not already initialized
        // Don't re-initialize if we're in create mode and data has already been initialized
        if (this.isOpen && (!this.actionData || Object.keys(this.actionData).length === 0) && 
            !(this.mode === 'create' && this._isCreateDataInitialized)) {
            this.initializeData();
        }
        
        // Reset modal state when it's closed
        if (!this.isOpen && this.actionData && Object.keys(this.actionData).length > 0) {
            this.resetModalState();
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
            
            // Set initial DeveloperName and Label based on action type and context
            this.updateDeveloperNameAndLabel();
            
            this.originalData = JSON.parse(JSON.stringify(this.actionData));
            this._isCreateDataInitialized = true;
        } else if (this.action && Object.keys(this.action).length > 0) {
            // Create a deep copy of the action data
            this.actionData = JSON.parse(JSON.stringify(this.action));
            this.originalData = JSON.parse(JSON.stringify(this.action));
            
            // Debug logging to see what data we're receiving
            console.log('=== MODAL: Action data received ===');
            console.log('Action:', this.action);
            console.log('ActionData:', this.actionData);
            console.log('Label field:', this.actionData.Label);
            console.log('DeveloperName field:', this.actionData.DeveloperName);
            console.log('=== END MODAL: Action data ===');
            
            // Set action type based on existing data
            if (this.actionData.Flow_Name__c) {
                // Check if it's Flow (CDP) based on Apex Class Name
                if (this.actionData.Apex_Class_Name__c === 'TriggerActionFlowChangeEvent') {
                    // Only allow flow-cdp if the object supports Change Data Platform
                    if (this.supportsChangeDataPlatform) {
                        this.selectedActionType = 'flow-cdp';
                    } else {
                        // Fall back to regular flow if object doesn't support CDP
                        this.selectedActionType = 'flow';
                        this.actionData.Apex_Class_Name__c = 'TriggerActionFlow';
                    }
                } else if (this.actionData.Apex_Class_Name__c === 'TriggerActionFlow') {
                    // If this is a regular flow but the object supports CDP, convert to Flow (CDP)
                    if (this.supportsChangeDataPlatform) {
                        this.selectedActionType = 'flow-cdp';
                        this.actionData.Apex_Class_Name__c = 'TriggerActionFlowChangeEvent';
                    } else {
                        this.selectedActionType = 'flow';
                    }
                } else {
                    // Default to flow if Flow_Name__c is present but Apex_Class_Name__c is not set
                    if (this.supportsChangeDataPlatform) {
                        this.selectedActionType = 'flow-cdp';
                        this.actionData.Apex_Class_Name__c = 'TriggerActionFlowChangeEvent';
                    } else {
                        this.selectedActionType = 'flow';
                    }
                }
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

    get isViewMode() {
        return this.mode === 'view';
    }

    get isDeveloperNameReadOnly() {
        return this.mode === 'edit' || this.mode === 'view';
    }

    get developerNameTooltip() {
        if (this.mode === 'edit' || this.mode === 'view') {
            return 'Developer Name cannot be changed. To modify the Developer Name, please edit the record in the standard Salesforce setup page.';
        }
        return '';
    }

    get supportsChangeDataPlatform() {
        if (!this.selectedSettingObjectApiName) {
            return false;
        }
        
        const objectName = this.selectedSettingObjectApiName;
        return objectName.endsWith('ChangeEvent');
    }

    get buttonLabel() {
        return this.mode === 'create' ? 'Create' : 'Update';
    }

    get isFlow() {
        return this.selectedActionType === 'flow' || this.selectedActionType === 'flow-cdp';
    }

    get flowButtonVariant() {
        return this.selectedActionType === 'flow' ? 'brand' : 'neutral';
    }

    get flowCdpButtonVariant() {
        return this.selectedActionType === 'flow-cdp' ? 'brand' : 'neutral';
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
        
        // Regenerate DeveloperName and Label when Flow Name or Apex Class Name changes in create mode
        if (this.mode === 'create' && (field === 'Flow_Name__c' || field === 'Apex_Class_Name__c')) {
            this.updateDeveloperNameAndLabel();
        }
    }

    handleActionTypeChange(event) {
        const actionType = event.target.dataset.type;
        this.selectedActionType = actionType;
        
        // Clear the opposite field when switching types and set Apex Class Name for Flow types
        if (actionType === 'flow') {
            this.actionData = {
                ...this.actionData,
                Apex_Class_Name__c: 'TriggerActionFlow',
                Allow_Flow_Recursion__c: false
            };
        } else if (actionType === 'flow-cdp') {
            this.actionData = {
                ...this.actionData,
                Apex_Class_Name__c: 'TriggerActionFlowChangeEvent',
                Allow_Flow_Recursion__c: false
            };
        } else if (actionType === 'apex') {
            this.actionData = {
                ...this.actionData,
                Flow_Name__c: ''
            };
        }
        
        // Regenerate DeveloperName and Label for create mode
        if (this.mode === 'create') {
            this.updateDeveloperNameAndLabel();
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
            if (this.selectedActionType === 'flow' || this.selectedActionType === 'flow-cdp') {
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
            // For Flow, keep Apex_Class_Name__c (TriggerActionFlow) but remove other Apex-specific fields
            // Don't delete Apex_Class_Name__c as it's required for Flow validation
        } else if (actionType === 'flow-cdp') {
            // For Flow (CDP), keep both Flow_Name__c and Apex_Class_Name__c (TriggerActionFlowChangeEvent)
            // Only remove Allow_Flow_Recursion__c as it's not applicable to CDP flows
            delete filteredData.Allow_Flow_Recursion__c;
        } else if (actionType === 'apex') {
            // For Apex, remove Flow-specific fields
            delete filteredData.Flow_Name__c;
            delete filteredData.Allow_Flow_Recursion__c;
        }
        
        return filteredData;
    }

    resetModalState() {
        // Reset all modal state to original values
        this.actionData = {};
        this.originalData = {};
        this.modalError = null;
        this._currentActionId = null;
        this._isCreateDataInitialized = false;
        this.selectedActionType = 'apex'; // Reset to default
    }

    handleClose() {
        // Clear any errors when closing
        this.modalError = null;
        // Reset mode to view
        this.mode = 'view';
        // Reset create data initialization flag
        this._isCreateDataInitialized = false;
        // Reset action type to default
        this.selectedActionType = 'apex';
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
        this.selectedActionType = 'apex';
        
        // For both create and edit modes, cancel should close the modal entirely
        this.dispatchEvent(new CustomEvent('close'));
    }
}
